import { createAppV2AdminClient } from "@/lib/supabase/app-v2";
import { getMunicipalitySlugCandidates } from "@/lib/municipalities/metadata";

import type { OfficialSourceAdapter, ImporterSnapshot } from "@/lib/importer/source-adapter";
import type { ImportedShelterRecord, ImporterRunSummary } from "@/lib/importer/types";

type MunicipalityUpsertResult = {
  id: string;
};

type MunicipalityRow = {
  id: string;
  code: string | null;
  slug: string;
  name: string;
  region_name: string | null;
};

type ShelterRow = {
  id: string;
  slug: string;
  municipality_id: string;
  name: string;
  address_line1: string;
  postal_code: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  status: "active" | "temporarily_closed" | "under_review";
  accessibility_notes: string | null;
  summary: string;
  source_summary: string;
  import_state: "active" | "missing_from_source" | "suppressed";
  canonical_source_name: string | null;
  canonical_source_reference: string | null;
};

type ImportRunRow = {
  id: string;
  pages_fetched: number;
  last_successful_page: number | null;
  last_successful_cursor: string | null;
};

type ImportCounters = {
  inserted: number;
  updated: number;
  unchanged: number;
  restored: number;
  missing: number;
};

type MissingTransitionDecision = {
  shouldApply: boolean;
  reason: string | null;
};

type ImportRunProgressState = {
  recordsSeen: number;
  recordsUpserted: number;
  pagesFetched: number;
  lastSuccessfulPage: number;
  lastSuccessfulCursor: string | null;
};

const missingTransitionCoverageThreshold = 0.8;
const missingTransitionMinimumSeenFloor = 25;
const importRunWriteRetryAttempts = 4;
const importRunWriteRetryBaseDelayMs = 500;
const importRunProgressFlushInterval = 250;

type ImportRunWriteOperation = "insert" | "update" | "checkpoint" | "progress";

type ImportRunWriteErrorInput = {
  operation: ImportRunWriteOperation;
  importRunId?: string;
  payload: Record<string, unknown>;
  error: unknown;
  status?: number;
  statusText?: string;
};

function buildCompatibilitySourceSummary(record: ImportedShelterRecord) {
  return `Imported from ${record.source.sourceName} and shown with official source references.`;
}

function isSameValue(left: unknown, right: unknown) {
  if (left === right) {
    return true;
  }

  if (left === null && right === undefined) {
    return true;
  }

  if (left === undefined && right === null) {
    return true;
  }

  return false;
}

function hasShelterBaselineChange(current: ShelterRow, next: Omit<ShelterRow, "id" | "source_summary">) {
  return (
    !isSameValue(current.slug, next.slug) ||
    !isSameValue(current.municipality_id, next.municipality_id) ||
    !isSameValue(current.name, next.name) ||
    !isSameValue(current.address_line1, next.address_line1) ||
    !isSameValue(current.postal_code, next.postal_code) ||
    !isSameValue(current.city, next.city) ||
    !isSameValue(current.latitude, next.latitude) ||
    !isSameValue(current.longitude, next.longitude) ||
    !isSameValue(current.capacity, next.capacity) ||
    !isSameValue(current.status, next.status) ||
    !isSameValue(current.accessibility_notes, next.accessibility_notes) ||
    !isSameValue(current.summary, next.summary) ||
    !isSameValue(current.import_state, next.import_state) ||
    !isSameValue(current.canonical_source_name, next.canonical_source_name) ||
    !isSameValue(current.canonical_source_reference, next.canonical_source_reference)
  );
}

function assertUniqueCanonicalRecords(records: ImportedShelterRecord[]) {
  const seen = new Set<string>();

  for (const record of records) {
    const key = `${record.source.canonicalSourceName}::${record.source.canonicalSourceReference}`;

    if (seen.has(key)) {
      throw new Error(`Duplicate canonical source identity in one import run: ${key}.`);
    }

    seen.add(key);
  }
}

function assertAdapterSourceConsistency(records: ImportedShelterRecord[], adapter: OfficialSourceAdapter) {
  for (const record of records) {
    if (record.source.canonicalSourceName !== adapter.sourceName) {
      throw new Error(
        `Adapter "${adapter.sourceName}" returned record "${record.source.canonicalSourceReference}" with canonical source "${record.source.canonicalSourceName}".`,
      );
    }
  }
}

function getWarningExamples(warnings: Array<{ code: string; message: string; reference?: string }>) {
  return warnings.slice(0, 5).map((warning) => {
    if (warning.reference) {
      return `${warning.code}: ${warning.message} (${warning.reference})`;
    }

    return `${warning.code}: ${warning.message}`;
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeImportRunPayload(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `${key}=string(len:${value.length})`;
      }

      if (value === null) {
        return `${key}=null`;
      }

      return `${key}=${typeof value}`;
    })
    .join(", ");
}

function isTransientImportRunWriteFailure(input: { status?: number; error: unknown }) {
  if (input.status && [408, 409, 425, 429, 500, 502, 503, 504].includes(input.status)) {
    return true;
  }

  const message =
    input.error instanceof Error
      ? input.error.message
      : typeof input.error === "object" && input.error && "message" in input.error
        ? String(input.error.message)
        : "";

  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("timed out") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("gateway") ||
    lowerMessage.includes("service unavailable") ||
    lowerMessage.includes("rate limit")
  );
}

function formatImportRunWriteFailure(input: ImportRunWriteErrorInput) {
  const operationLabel =
    input.operation === "insert"
      ? "create"
      : input.operation === "progress"
        ? "update progress for"
      : input.operation === "checkpoint"
        ? "checkpoint"
        : "update";

  const details =
    typeof input.error === "object" && input.error
      ? {
          code: "code" in input.error ? input.error.code : undefined,
          message: "message" in input.error ? input.error.message : undefined,
          details: "details" in input.error ? input.error.details : undefined,
          hint: "hint" in input.error ? input.error.hint : undefined,
        }
      : {
          message: input.error instanceof Error ? input.error.message : String(input.error),
        };

  const summary = [
    `Could not ${operationLabel} import run${input.importRunId ? ` "${input.importRunId}"` : ""}.`,
    `table=app_v2.import_runs`,
    `operation=${input.operation}`,
    input.status ? `status=${input.status}` : null,
    input.statusText ? `statusText=${input.statusText}` : null,
    `payload=${summarizeImportRunPayload(input.payload)}`,
    `error=${JSON.stringify(details)}`,
  ]
    .filter(Boolean)
    .join(" ");

  return summary;
}

async function retryImportRunWrite<T>(
  operation: ImportRunWriteOperation,
  execute: () => PromiseLike<T>,
  shouldRetry: (result: T) => boolean,
  getFailureDetails: (result: T) => { error: unknown; status?: number; statusText?: string },
) {
  let attempt = 0;

  while (attempt < importRunWriteRetryAttempts) {
    const result = await execute();

    if (!shouldRetry(result)) {
      return result;
    }

    attempt += 1;
    const failure = getFailureDetails(result);

    if (
      attempt >= importRunWriteRetryAttempts ||
      !isTransientImportRunWriteFailure({
        status: failure.status,
        error: failure.error,
      })
    ) {
      return result;
    }

    const delayMs = importRunWriteRetryBaseDelayMs * 2 ** (attempt - 1);
    console.warn(
      `[importer] retrying import run ${operation} after transient failure attempt=${attempt} status=${failure.status ?? "unknown"} statusText=${failure.statusText ?? "unknown"}`,
    );
    await sleep(delayMs);
  }

  return execute();
}

async function createImportRun(input: {
  sourceName: string;
  sourceUrl: string | null;
  resumedFromImportRunId?: string | null;
}) {
  const supabase = createAppV2AdminClient();
  const payload = {
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    status: "running",
    resumed_from_import_run_id: input.resumedFromImportRunId ?? null,
  } satisfies Record<string, unknown>;
  const result = await retryImportRunWrite(
    "insert",
    () =>
      supabase
        .from("import_runs")
        .insert(payload)
        .select("id, pages_fetched, last_successful_page, last_successful_cursor")
        .single(),
    (response) => Boolean(response.error || !response.data),
    (response) => ({
      error: response.error ?? new Error("Import run insert returned no row."),
      status: response.status,
      statusText: response.statusText,
    }),
  );

  if (result.error || !result.data) {
    throw new Error(
      formatImportRunWriteFailure({
        operation: "insert",
        payload,
        error: result.error ?? new Error("Import run insert returned no row."),
        status: result.status,
        statusText: result.statusText,
      }),
    );
  }

  return result.data as ImportRunRow;
}

async function updateImportRun(
  importRunId: string,
  payload: {
    status: "succeeded" | "failed";
    recordsSeen: number;
    recordsUpserted: number;
    errorSummary?: string;
    pagesFetched?: number;
    lastSuccessfulPage?: number | null;
    lastSuccessfulCursor?: string | null;
    missingTransitionsApplied?: boolean;
    missingTransitionsSkippedReason?: string | null;
  },
) {
  const supabase = createAppV2AdminClient();
  const updatePayload = {
    status: payload.status,
    records_seen: payload.recordsSeen,
    records_upserted: payload.recordsUpserted,
    finished_at: new Date().toISOString(),
    error_summary: payload.errorSummary ?? null,
    pages_fetched: payload.pagesFetched,
    last_successful_page: payload.lastSuccessfulPage,
    last_successful_cursor: payload.lastSuccessfulCursor,
    missing_transitions_applied: payload.missingTransitionsApplied,
    missing_transitions_skipped_reason: payload.missingTransitionsSkippedReason ?? null,
  };
  const normalizedPayload = Object.fromEntries(
    Object.entries(updatePayload).filter(([, value]) => value !== undefined),
  );

  const result = await retryImportRunWrite(
    "update",
    () =>
      supabase
        .from("import_runs")
        .update(normalizedPayload)
        .eq("id", importRunId)
        .select("id")
        .single(),
    (response) => Boolean(response.error || !response.data),
    (response) => ({
      error: response.error ?? new Error("Import run update matched no row."),
      status: response.status,
      statusText: response.statusText,
    }),
  );

  if (result.error || !result.data) {
    throw new Error(
      formatImportRunWriteFailure({
        operation: "update",
        importRunId,
        payload: normalizedPayload,
        error: result.error ?? new Error("Import run update matched no row."),
        status: result.status,
        statusText: result.statusText,
      }),
    );
  }
}

async function checkpointImportRun(
  importRunId: string,
  payload: {
    pagesFetched: number;
    lastSuccessfulPage: number;
    lastSuccessfulCursor: string | null;
  },
) {
  const supabase = createAppV2AdminClient();
  const checkpointPayload = {
    pages_fetched: payload.pagesFetched,
    last_successful_page: payload.lastSuccessfulPage,
    last_successful_cursor: payload.lastSuccessfulCursor,
  } satisfies Record<string, unknown>;

  const result = await retryImportRunWrite(
    "checkpoint",
    () =>
      supabase
        .from("import_runs")
        .update(checkpointPayload)
        .eq("id", importRunId)
        .select("id")
        .single(),
    (response) => Boolean(response.error || !response.data),
    (response) => ({
      error: response.error ?? new Error("Import run checkpoint matched no row."),
      status: response.status,
      statusText: response.statusText,
    }),
  );

  if (result.error || !result.data) {
    throw new Error(
      formatImportRunWriteFailure({
        operation: "checkpoint",
        importRunId,
        payload: checkpointPayload,
        error: result.error ?? new Error("Import run checkpoint matched no row."),
        status: result.status,
        statusText: result.statusText,
      }),
    );
  }
}

async function updateImportRunProgress(
  importRunId: string,
  payload: {
    recordsSeen: number;
    recordsUpserted: number;
    pagesFetched: number;
    lastSuccessfulPage: number;
    lastSuccessfulCursor: string | null;
  },
) {
  const supabase = createAppV2AdminClient();
  const progressPayload = {
    records_seen: payload.recordsSeen,
    records_upserted: payload.recordsUpserted,
    pages_fetched: payload.pagesFetched,
    last_successful_page: payload.lastSuccessfulPage,
    last_successful_cursor: payload.lastSuccessfulCursor,
  } satisfies Record<string, unknown>;

  const result = await retryImportRunWrite(
    "progress",
    () =>
      supabase
        .from("import_runs")
        .update(progressPayload)
        .eq("id", importRunId)
        .select("id")
        .single(),
    (response) => Boolean(response.error || !response.data),
    (response) => ({
      error: response.error ?? new Error("Import run progress update matched no row."),
      status: response.status,
      statusText: response.statusText,
    }),
  );

  if (result.error || !result.data) {
    throw new Error(
      formatImportRunWriteFailure({
        operation: "progress",
        importRunId,
        payload: progressPayload,
        error: result.error ?? new Error("Import run progress update matched no row."),
        status: result.status,
        statusText: result.statusText,
      }),
    );
  }
}

async function insertAuditEvent(input: {
  actorIdentifier: string;
  entityType: string;
  entityId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const supabase = createAppV2AdminClient();

  await supabase.from("audit_events").insert({
    actor_type: "system",
    actor_identifier: input.actorIdentifier,
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    payload: input.payload,
  });
}

async function upsertMunicipality(record: ImportedShelterRecord): Promise<MunicipalityUpsertResult> {
  const supabase = createAppV2AdminClient();
  const slugCandidates = getMunicipalitySlugCandidates(record.municipality.slug);
  const { data: candidates, error: candidateError } = await supabase
    .from("municipalities")
    .select("id, code, slug, name, region_name")
    .or(
      [`code.eq.${record.municipality.code}`, ...slugCandidates.map((slug) => `slug.eq.${slug}`)].join(","),
    );

  if (candidateError) {
    throw new Error(`Could not load municipality candidates for "${record.municipality.code}".`);
  }

  const rows = (candidates ?? []) as MunicipalityRow[];
  const canonicalSlug = record.municipality.slug;
  const fallbackSlug = `kommune-${record.municipality.code}`;
  const preferredRow =
    rows.find((row) => row.code === record.municipality.code && row.slug === canonicalSlug) ??
    rows.find((row) => row.slug === canonicalSlug) ??
    rows.find((row) => row.code === record.municipality.code) ??
    rows.find((row) => row.slug === fallbackSlug) ??
    rows[0];

  const canonicalPayload = {
    code: record.municipality.code,
    slug: canonicalSlug,
    name: record.municipality.name,
    region_name: record.municipality.regionName,
  };

  if (!preferredRow) {
    const { data, error } = await supabase.from("municipalities").insert(canonicalPayload).select("id").single();

    if (error || !data) {
      throw new Error(`Could not insert municipality "${record.municipality.code}".`);
    }

    return data as MunicipalityUpsertResult;
  }

  const { data: updated, error: updateError } = await supabase
    .from("municipalities")
    .update(canonicalPayload)
    .eq("id", preferredRow.id)
    .select("id")
    .single();

  if (updateError || !updated) {
    throw new Error(`Could not canonicalize municipality "${record.municipality.code}".`);
  }

  const duplicateIds = rows.filter((row) => row.id !== preferredRow.id).map((row) => row.id);

  if (duplicateIds.length > 0) {
    const shelterUpdate = await supabase
      .from("shelters")
      .update({ municipality_id: preferredRow.id })
      .in("municipality_id", duplicateIds);

    if (shelterUpdate.error) {
      throw new Error(`Could not reassign duplicate municipality shelters for "${record.municipality.code}".`);
    }

    const duplicateDelete = await supabase.from("municipalities").delete().in("id", duplicateIds);

    if (duplicateDelete.error) {
      throw new Error(`Could not delete duplicate municipality rows for "${record.municipality.code}".`);
    }
  }

  return updated as MunicipalityUpsertResult;
}

async function findShelterByCanonicalIdentity(record: ImportedShelterRecord): Promise<ShelterRow | null> {
  const supabase = createAppV2AdminClient();
  const canonicalResponse = await supabase
    .from("shelters")
    .select(
      "id, slug, municipality_id, name, address_line1, postal_code, city, latitude, longitude, capacity, status, accessibility_notes, summary, source_summary, import_state, canonical_source_name, canonical_source_reference",
    )
    .eq("canonical_source_name", record.source.canonicalSourceName)
    .eq("canonical_source_reference", record.source.canonicalSourceReference)
    .maybeSingle();

  if (canonicalResponse.data) {
    return canonicalResponse.data as ShelterRow;
  }

  const legacySourceResponse = await supabase
    .from("shelter_sources")
    .select("id, shelter_id, source_name, source_reference")
    .eq("source_name", record.source.sourceName)
    .eq("source_reference", record.source.sourceReference)
    .limit(1)
    .maybeSingle();

  if (!legacySourceResponse.data) {
    return null;
  }

  const shelterResponse = await supabase
    .from("shelters")
    .select(
      "id, slug, municipality_id, name, address_line1, postal_code, city, latitude, longitude, capacity, status, accessibility_notes, summary, source_summary, import_state, canonical_source_name, canonical_source_reference",
    )
    .eq("id", legacySourceResponse.data.shelter_id)
    .maybeSingle();

  return shelterResponse.data ? (shelterResponse.data as ShelterRow) : null;
}

async function upsertShelterSource(input: {
  shelterId: string;
  importRunId: string;
  record: ImportedShelterRecord;
}) {
  const supabase = createAppV2AdminClient();
  const existingResponse = await supabase
    .from("shelter_sources")
    .select("id, shelter_id, source_name, source_reference")
    .eq("shelter_id", input.shelterId)
    .eq("source_name", input.record.source.sourceName)
    .eq("source_reference", input.record.source.sourceReference)
    .limit(1)
    .maybeSingle();

  const payload = {
    shelter_id: input.shelterId,
    import_run_id: input.importRunId,
    source_name: input.record.source.sourceName,
    source_type: input.record.source.sourceType,
    source_url: input.record.source.sourceUrl,
    source_reference: input.record.source.sourceReference,
    last_verified_at: input.record.source.lastVerifiedAt,
    imported_at: new Date().toISOString(),
    notes: input.record.source.notes,
  };

  if (existingResponse.data) {
    await supabase.from("shelter_sources").update(payload).eq("id", existingResponse.data.id);
    return;
  }

  await supabase.from("shelter_sources").insert(payload);
}

async function upsertShelterBaseline(input: {
  record: ImportedShelterRecord;
  municipalityId: string;
  importTimestamp: string;
  actorIdentifier: string;
  counters: ImportCounters;
}) {
  const supabase = createAppV2AdminClient();
  const existing = await findShelterByCanonicalIdentity(input.record);
  const desiredBaseline = {
    slug: input.record.shelter.slug,
    municipality_id: input.municipalityId,
    name: input.record.shelter.name,
    address_line1: input.record.shelter.addressLine1,
    postal_code: input.record.shelter.postalCode,
    city: input.record.shelter.city,
    latitude: input.record.shelter.latitude,
    longitude: input.record.shelter.longitude,
    capacity: input.record.shelter.capacity,
    status: input.record.shelter.status,
    accessibility_notes: input.record.shelter.accessibilityNotes,
    summary: input.record.shelter.summary,
    import_state: input.record.lifecycle.importState,
    last_seen_at: input.importTimestamp,
    last_imported_at: input.importTimestamp,
    canonical_source_name: input.record.source.canonicalSourceName,
    canonical_source_reference: input.record.source.canonicalSourceReference,
  };

  if (!existing) {
    const insertResponse = await supabase
      .from("shelters")
      .insert({
        ...desiredBaseline,
        source_summary: buildCompatibilitySourceSummary(input.record),
      })
      .select(
        "id, slug, municipality_id, name, address_line1, postal_code, city, latitude, longitude, capacity, status, accessibility_notes, summary, source_summary, import_state, canonical_source_name, canonical_source_reference",
      )
      .single();

    if (insertResponse.error || !insertResponse.data) {
      throw new Error(`Could not insert shelter "${input.record.source.canonicalSourceReference}".`);
    }

    input.counters.inserted += 1;

    return insertResponse.data as ShelterRow;
  }

  const hasBaselineChange = hasShelterBaselineChange(existing, desiredBaseline);
  const wasMissing = existing.import_state === "missing_from_source";

  const updateResponse = await supabase
    .from("shelters")
    .update(desiredBaseline)
    .eq("id", existing.id)
    .select(
      "id, slug, municipality_id, name, address_line1, postal_code, city, latitude, longitude, capacity, status, accessibility_notes, summary, source_summary, import_state, canonical_source_name, canonical_source_reference",
    )
    .single();

  if (updateResponse.error || !updateResponse.data) {
    throw new Error(`Could not update shelter "${existing.slug}".`);
  }

  if (wasMissing) {
    input.counters.restored += 1;

    await insertAuditEvent({
      actorIdentifier: input.actorIdentifier,
      entityType: "shelter",
      entityId: existing.id,
      eventType: "import_restored",
      payload: {
        shelter_slug: existing.slug,
        canonical_source_name: input.record.source.canonicalSourceName,
        canonical_source_reference: input.record.source.canonicalSourceReference,
      },
    });
  } else if (hasBaselineChange) {
    input.counters.updated += 1;
  } else {
    input.counters.unchanged += 1;
  }

  return updateResponse.data as ShelterRow;
}

async function getLatestFailedImportRun(sourceName: string) {
  const supabase = createAppV2AdminClient();
  const { data, error } = await supabase
    .from("import_runs")
    .select("id, pages_fetched, last_successful_page, last_successful_cursor")
    .eq("source_name", sourceName)
    .eq("status", "failed")
    .not("last_successful_page", "is", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load the latest failed import run for resume.");
  }

  return data as ImportRunRow | null;
}

async function getCurrentActiveShelterCount(canonicalSourceName: string) {
  const supabase = createAppV2AdminClient();
  const { count, error } = await supabase
    .from("shelters")
    .select("id", { count: "exact", head: true })
    .eq("canonical_source_name", canonicalSourceName)
    .eq("import_state", "active");

  if (error) {
    throw new Error("Could not load the current active shelter count for missing-record guardrails.");
  }

  return count ?? 0;
}

function decideMissingTransitions(input: {
  resumedFromImportRunId: string | null;
  previousActiveCount: number;
  currentSeenCount: number;
}) {
  if (input.resumedFromImportRunId) {
    return {
      shouldApply: false,
      reason: `resume guard: skipped missing transitions because the run resumed from import run ${input.resumedFromImportRunId}.`,
    } satisfies MissingTransitionDecision;
  }

  if (input.previousActiveCount <= 0) {
    return {
      shouldApply: true,
      reason: null,
    } satisfies MissingTransitionDecision;
  }

  const requiredSeenCount = Math.max(
    missingTransitionMinimumSeenFloor,
    Math.ceil(input.previousActiveCount * missingTransitionCoverageThreshold),
  );

  if (input.currentSeenCount < requiredSeenCount) {
    return {
      shouldApply: false,
      reason: `coverage guard: saw ${input.currentSeenCount} records, below required threshold ${requiredSeenCount} from previous active count ${input.previousActiveCount}.`,
    } satisfies MissingTransitionDecision;
  }

  return {
    shouldApply: true,
    reason: null,
  } satisfies MissingTransitionDecision;
}

async function markMissingShelters(input: {
  canonicalSourceName: string;
  seenReferences: Set<string>;
  importTimestamp: string;
  actorIdentifier: string;
}) {
  const supabase = createAppV2AdminClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("id, slug, canonical_source_reference, import_state")
    .eq("canonical_source_name", input.canonicalSourceName);

  if (error || !data) {
    throw new Error("Could not load existing shelters for missing-record handling.");
  }

  const rows = data as Array<{
    id: string;
    slug: string;
    canonical_source_reference: string | null;
    import_state: "active" | "missing_from_source" | "suppressed";
  }>;

  const missingRows = rows.filter((row) => {
    if (!row.canonical_source_reference) {
      return false;
    }

    return !input.seenReferences.has(row.canonical_source_reference) && row.import_state !== "missing_from_source";
  });

  for (const row of missingRows) {
    await supabase
      .from("shelters")
      .update({
        import_state: "missing_from_source",
        last_imported_at: input.importTimestamp,
      })
      .eq("id", row.id);

    await insertAuditEvent({
      actorIdentifier: input.actorIdentifier,
      entityType: "shelter",
      entityId: row.id,
      eventType: "import_marked_missing",
      payload: {
        shelter_slug: row.slug,
        canonical_source_name: input.canonicalSourceName,
        canonical_source_reference: row.canonical_source_reference,
      },
    });
  }

  return missingRows.length;
}

export async function runOfficialImporter(input: {
  adapter: OfficialSourceAdapter;
  snapshot: ImporterSnapshot;
  dryRun?: boolean;
  resumeLatest?: boolean;
}): Promise<ImporterRunSummary> {
  const actorIdentifier = `importer:${input.adapter.sourceName}`;
  const resumableImportRun =
    input.resumeLatest ? await getLatestFailedImportRun(input.adapter.sourceName) : null;
  const effectiveSnapshot: ImporterSnapshot =
    input.resumeLatest && resumableImportRun
      ? {
          ...input.snapshot,
          resumeCursor: resumableImportRun.last_successful_cursor,
          resumePage: resumableImportRun.last_successful_page ?? 0,
        }
      : input.snapshot;

  if (input.dryRun) {
    let pagesFetched = effectiveSnapshot.resumePage ?? 0;
    let lastSuccessfulPage = effectiveSnapshot.resumePage ?? 0;
    let lastSuccessfulCursor = effectiveSnapshot.resumeCursor ?? null;
    const fetchResult = await input.adapter.fetchRecords({
      ...effectiveSnapshot,
      onPageFetched: async (progress) => {
        pagesFetched = progress.pagesFetched;
        lastSuccessfulPage = progress.pagesFetched;
        lastSuccessfulCursor = progress.cursor;
        await effectiveSnapshot.onPageFetched?.(progress);
      },
    });
    const records = fetchResult.records;

    assertUniqueCanonicalRecords(records);
    assertAdapterSourceConsistency(records, input.adapter);

    return {
      sourceName: input.adapter.sourceName,
      snapshotName: effectiveSnapshot.name,
      dryRun: true,
      resumedFromImportRunId: resumableImportRun?.id ?? null,
      recordsSeen: records.length,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      restored: 0,
      missing: 0,
      recordsUpserted: 0,
      importRunId: null,
      pagesFetched,
      lastSuccessfulPage,
      lastSuccessfulCursor,
      missingTransitionsApplied: false,
      missingTransitionsSkippedReason: "dry-run never applies missing transitions.",
      warningsCount: fetchResult.warnings.length,
      warningExamples: getWarningExamples(fetchResult.warnings),
      fetchStats: fetchResult.stats,
    };
  }

  const importRun = await createImportRun({
    sourceName: input.adapter.sourceName,
    sourceUrl: input.adapter.sourceUrl,
    resumedFromImportRunId: resumableImportRun?.id ?? null,
  });
  const importTimestamp = new Date().toISOString();
  const activeCountBeforeRun = await getCurrentActiveShelterCount(input.adapter.sourceName);
  let pagesFetched = effectiveSnapshot.resumePage ?? 0;
  let lastSuccessfulPage = effectiveSnapshot.resumePage ?? 0;
  let lastSuccessfulCursor = effectiveSnapshot.resumeCursor ?? null;
  let processedRecords = 0;
  let recordsSeen = 0;
  let isSettled = false;

  const progressState = (): ImportRunProgressState => ({
    recordsSeen,
    recordsUpserted: processedRecords,
    pagesFetched,
    lastSuccessfulPage,
    lastSuccessfulCursor,
  });

  const markInterruptedRun = async (reason: string) => {
    if (isSettled) {
      return;
    }

    isSettled = true;

    try {
      await updateImportRun(importRun.id, {
        status: "failed",
        recordsSeen: progressState().recordsSeen,
        recordsUpserted: progressState().recordsUpserted,
        errorSummary: reason,
        pagesFetched: progressState().pagesFetched,
        lastSuccessfulPage: progressState().lastSuccessfulPage,
        lastSuccessfulCursor: progressState().lastSuccessfulCursor,
        missingTransitionsApplied: false,
        missingTransitionsSkippedReason: "run interrupted before successful completion.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown import-run interruption error.";
      console.error(`[importer] failed to mark interrupted import run ${importRun.id}: ${message}`);
    }
  };

  const handleSigint = () => {
    void markInterruptedRun(`Importer interrupted by SIGINT for import run "${importRun.id}".`).finally(() => {
      process.exit(130);
    });
  };

  const handleSigterm = () => {
    void markInterruptedRun(`Importer interrupted by SIGTERM for import run "${importRun.id}".`).finally(() => {
      process.exit(143);
    });
  };

  process.once("SIGINT", handleSigint);
  process.once("SIGTERM", handleSigterm);

  try {
    const fetchResult = await input.adapter.fetchRecords({
      ...effectiveSnapshot,
      onPageFetched: async (progress) => {
        pagesFetched = progress.pagesFetched;
        lastSuccessfulPage = progress.pagesFetched;
        lastSuccessfulCursor = progress.cursor;
        await checkpointImportRun(importRun.id, {
          pagesFetched,
          lastSuccessfulPage,
          lastSuccessfulCursor,
        });
        await effectiveSnapshot.onPageFetched?.(progress);
      },
    });
    const records = fetchResult.records;
    recordsSeen = records.length;

    assertUniqueCanonicalRecords(records);
    assertAdapterSourceConsistency(records, input.adapter);

    await updateImportRunProgress(importRun.id, progressState());

    const counters: ImportCounters = {
      inserted: 0,
      updated: 0,
      unchanged: 0,
      restored: 0,
      missing: 0,
    };
    const seenReferences = new Set<string>();

    for (const record of records) {
      seenReferences.add(record.source.canonicalSourceReference);

      const municipality = await upsertMunicipality(record);
      const shelter = await upsertShelterBaseline({
        record,
        municipalityId: municipality.id,
        importTimestamp,
        actorIdentifier,
        counters,
      });

      await upsertShelterSource({
        shelterId: shelter.id,
        importRunId: importRun.id,
        record,
      });

      processedRecords += 1;

      if (processedRecords % importRunProgressFlushInterval === 0 || processedRecords === records.length) {
        await updateImportRunProgress(importRun.id, progressState());
      }
    }

    const missingTransitionDecision = decideMissingTransitions({
      resumedFromImportRunId: resumableImportRun?.id ?? null,
      previousActiveCount: activeCountBeforeRun,
      currentSeenCount: records.length,
    });

    if (missingTransitionDecision.shouldApply) {
      counters.missing = await markMissingShelters({
        canonicalSourceName: input.adapter.sourceName,
        seenReferences,
        importTimestamp,
        actorIdentifier,
      });
    }

    const recordsUpserted = counters.inserted + counters.updated + counters.restored;
    processedRecords = recordsUpserted;

    await updateImportRun(importRun.id, {
      status: "succeeded",
      recordsSeen: records.length,
      recordsUpserted,
      pagesFetched,
      lastSuccessfulPage,
      lastSuccessfulCursor,
      missingTransitionsApplied: missingTransitionDecision.shouldApply,
      missingTransitionsSkippedReason: missingTransitionDecision.reason,
    });
    isSettled = true;

    if (recordsUpserted > 0 || counters.missing > 0) {
      await insertAuditEvent({
        actorIdentifier,
        entityType: "import_run",
        entityId: importRun.id,
        eventType: "import_run_applied",
        payload: {
          source_name: input.adapter.sourceName,
          snapshot_name: effectiveSnapshot.name,
          records_seen: records.length,
          inserted: counters.inserted,
          updated: counters.updated,
          unchanged: counters.unchanged,
          restored: counters.restored,
          missing: counters.missing,
          pages_fetched: pagesFetched,
          resumed_from_import_run_id: resumableImportRun?.id ?? null,
          missing_transitions_applied: missingTransitionDecision.shouldApply,
          missing_transitions_skipped_reason: missingTransitionDecision.reason,
        },
      });
    }

    return {
      sourceName: input.adapter.sourceName,
      snapshotName: effectiveSnapshot.name,
      dryRun: false,
      resumedFromImportRunId: resumableImportRun?.id ?? null,
      recordsSeen: records.length,
      inserted: counters.inserted,
      updated: counters.updated,
      unchanged: counters.unchanged,
      restored: counters.restored,
      missing: counters.missing,
      recordsUpserted,
      importRunId: importRun.id,
      pagesFetched,
      lastSuccessfulPage,
      lastSuccessfulCursor,
      missingTransitionsApplied: missingTransitionDecision.shouldApply,
      missingTransitionsSkippedReason: missingTransitionDecision.reason,
      warningsCount: fetchResult.warnings.length,
      warningExamples: getWarningExamples(fetchResult.warnings),
      fetchStats: fetchResult.stats,
    };
  } catch (error) {
    const errorSummary = error instanceof Error ? error.message : "Unknown importer error.";
    if (!isSettled) {
      await updateImportRun(importRun.id, {
        status: "failed",
        recordsSeen,
        recordsUpserted: processedRecords,
        errorSummary,
        pagesFetched,
        lastSuccessfulPage,
        lastSuccessfulCursor,
        missingTransitionsApplied: false,
        missingTransitionsSkippedReason: "run failed before successful completion.",
      });
      isSettled = true;
    }

    await insertAuditEvent({
      actorIdentifier,
      entityType: "import_run",
      entityId: importRun.id,
      eventType: "import_run_failed",
      payload: {
        source_name: input.adapter.sourceName,
        snapshot_name: effectiveSnapshot.name,
        error_summary: errorSummary,
        pages_fetched: pagesFetched,
        last_successful_page: lastSuccessfulPage,
        resumed_from_import_run_id: resumableImportRun?.id ?? null,
      },
    });

    throw error;
  } finally {
    process.off("SIGINT", handleSigint);
    process.off("SIGTERM", handleSigterm);
  }
}
