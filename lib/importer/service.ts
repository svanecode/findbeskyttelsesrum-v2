import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { OfficialSourceAdapter } from "@/lib/importer/source-adapter";
import type { ImportedShelterRecord, ImporterRunSummary } from "@/lib/importer/types";

type MunicipalityUpsertResult = {
  id: string;
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
};

type ImportCounters = {
  inserted: number;
  updated: number;
  unchanged: number;
  restored: number;
  missing: number;
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

async function createImportRun(sourceName: string, sourceUrl: string | null) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("import_runs")
    .insert({
      source_name: sourceName,
      source_url: sourceUrl,
      status: "running",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Could not create import run.");
  }

  return data as ImportRunRow;
}

async function updateImportRun(
  importRunId: string,
  payload: {
    status: "succeeded" | "failed";
    recordsSeen: number;
    recordsUpserted: number;
    errorSummary?: string;
  },
) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("import_runs")
    .update({
      status: payload.status,
      records_seen: payload.recordsSeen,
      records_upserted: payload.recordsUpserted,
      finished_at: new Date().toISOString(),
      error_summary: payload.errorSummary ?? null,
    })
    .eq("id", importRunId);
}

async function insertAuditEvent(input: {
  actorIdentifier: string;
  entityType: string;
  entityId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();

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
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("municipalities")
    .upsert(
      {
        slug: record.municipality.slug,
        name: record.municipality.name,
        region_name: record.municipality.regionName,
      },
      {
        onConflict: "slug",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not upsert municipality "${record.municipality.slug}".`);
  }

  return data as MunicipalityUpsertResult;
}

async function findShelterByCanonicalIdentity(record: ImportedShelterRecord): Promise<ShelterRow | null> {
  const supabase = createSupabaseAdminClient();
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
  const supabase = createSupabaseAdminClient();
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
  const supabase = createSupabaseAdminClient();
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

async function markMissingShelters(input: {
  canonicalSourceName: string;
  seenReferences: Set<string>;
  importTimestamp: string;
  actorIdentifier: string;
}) {
  const supabase = createSupabaseAdminClient();
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
  snapshotName: string;
}): Promise<ImporterRunSummary> {
  const importRun = await createImportRun(input.adapter.sourceName, input.adapter.sourceUrl);
  const actorIdentifier = `importer:${input.adapter.sourceName}`;
  const importTimestamp = new Date().toISOString();

  try {
    const records = await input.adapter.fetchRecords({
      name: input.snapshotName,
    });

    assertUniqueCanonicalRecords(records);
    assertAdapterSourceConsistency(records, input.adapter);

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
    }

    counters.missing = await markMissingShelters({
      canonicalSourceName: input.adapter.sourceName,
      seenReferences,
      importTimestamp,
      actorIdentifier,
    });

    const recordsUpserted = counters.inserted + counters.updated + counters.restored;

    await updateImportRun(importRun.id, {
      status: "succeeded",
      recordsSeen: records.length,
      recordsUpserted,
    });

    if (recordsUpserted > 0 || counters.missing > 0) {
      await insertAuditEvent({
        actorIdentifier,
        entityType: "import_run",
        entityId: importRun.id,
        eventType: "import_run_applied",
        payload: {
          source_name: input.adapter.sourceName,
          snapshot_name: input.snapshotName,
          records_seen: records.length,
          inserted: counters.inserted,
          updated: counters.updated,
          unchanged: counters.unchanged,
          restored: counters.restored,
          missing: counters.missing,
        },
      });
    }

    return {
      sourceName: input.adapter.sourceName,
      snapshotName: input.snapshotName,
      recordsSeen: records.length,
      inserted: counters.inserted,
      updated: counters.updated,
      unchanged: counters.unchanged,
      restored: counters.restored,
      missing: counters.missing,
      recordsUpserted,
      importRunId: importRun.id,
    };
  } catch (error) {
    const errorSummary = error instanceof Error ? error.message : "Unknown importer error.";

    await updateImportRun(importRun.id, {
      status: "failed",
      recordsSeen: 0,
      recordsUpserted: 0,
      errorSummary,
    });

    await insertAuditEvent({
      actorIdentifier,
      entityType: "import_run",
      entityId: importRun.id,
      eventType: "import_run_failed",
      payload: {
        source_name: input.adapter.sourceName,
        snapshot_name: input.snapshotName,
        error_summary: errorSummary,
      },
    });

    throw error;
  }
}
