import { cache } from "react";

import { calculateDistanceKm } from "@/lib/location/distance";
import {
  getMunicipalitySlugCandidates,
  normalizeMunicipalityDisplay,
} from "@/lib/municipalities/metadata";
import { createAppV2AdminClient, createAppV2ServerClient } from "@/lib/supabase/app-v2";
import { formatOverrideStatusLabel, type OverrideStatus, type ShelterOverrideValues } from "@/lib/shelter/overrides";

type ShelterStatus = "active" | "temporarily_closed" | "under_review";
type SourceType = "official" | "municipality" | "manual" | "other";
type ShelterReportStatus = "open" | "reviewing" | "resolved" | "rejected";

type MunicipalityRow = {
  id: string;
  slug: string;
  name: string;
};

type MunicipalityRelation = MunicipalityRow | MunicipalityRow[] | null;

type SourceRow = {
  id: string;
  source_name: string;
  source_type: SourceType;
  source_url: string | null;
  source_reference?: string | null;
  last_verified_at: string | null;
  imported_at?: string | null;
  notes?: string | null;
};

type ShelterRow = {
  id: string;
  slug: string;
  name: string;
  address_line1: string;
  postal_code: string;
  city: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  summary: string;
  source_summary: string;
  capacity: number;
  status: ShelterStatus;
  accessibility_notes: string | null;
  import_state?: "active" | "missing_from_source" | "suppressed";
  last_seen_at?: string | null;
  last_imported_at?: string | null;
  canonical_source_name?: string | null;
  canonical_source_reference?: string | null;
  byg021_bygningens_anvendelse?: number | string | null;
  byg021BygningensAnvendelse?: number | string | null;
  municipality_id?: string;
  municipalities?: MunicipalityRelation;
  shelter_sources?: SourceRow[] | null;
};

type ShelterOverrideRow = {
  id: string;
  shelter_id: string;
  name: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  capacity: number | null;
  status: OverrideStatus | null;
  accessibility_notes: string | null;
  summary: string | null;
  reason: string;
  is_active: boolean;
  created_by: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
};

type FeaturedShelterRow = Pick<
  ShelterRow,
  | "id"
  | "slug"
  | "name"
  | "address_line1"
  | "postal_code"
  | "city"
  | "summary"
  | "capacity"
  | "status"
  | "municipalities"
  | "shelter_sources"
>;

type ShelterDetailRow = Pick<
  ShelterRow,
  | "id"
  | "slug"
  | "name"
  | "address_line1"
  | "postal_code"
  | "city"
  | "latitude"
  | "longitude"
  | "summary"
  | "source_summary"
  | "capacity"
  | "status"
  | "accessibility_notes"
  | "municipalities"
> & {
  byg021_bygningens_anvendelse?: number | string | null;
  byg021BygningensAnvendelse?: number | string | null;
};

type MunicipalityShelterRow = Pick<
  ShelterRow,
  | "id"
  | "slug"
  | "name"
  | "address_line1"
  | "postal_code"
  | "city"
  | "summary"
  | "capacity"
  | "status"
>;

type SearchShelterRow = Pick<
  ShelterRow,
  | "id"
  | "slug"
  | "name"
  | "address_line1"
  | "postal_code"
  | "city"
  | "latitude"
  | "longitude"
  | "summary"
  | "capacity"
  | "status"
  | "municipalities"
  | "shelter_sources"
>;

export type FeaturedShelter = {
  id: string;
  slug: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  summary: string;
  capacity: number;
  status: ShelterStatus;
  statusLabel: string;
  primarySourceName: string | null;
  lastVerifiedLabel: string | null;
  municipality: MunicipalityRow;
};

export type ShelterDetail = {
  id: string;
  slug: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  bbrUsageCode: number | null;
  summary: string;
  sourceSummary: string;
  capacity: number;
  status: ShelterStatus;
  statusLabel: string;
  primarySourceName: string | null;
  primarySourceTypeLabel: string | null;
  primarySourceUrl: string | null;
  primarySourceReference: string | null;
  lastVerifiedLabel: string | null;
  lastImportedLabel: string | null;
  accessibilityNotes: string | null;
  dataQualityScore: number | null;
  qualityState: string;
  publicNotes: string | null;
  municipality: MunicipalityRow;
  sources: Array<{
    id: string;
    sourceName: string;
    sourceTypeLabel: string;
    sourceUrl: string | null;
    sourceReference: string | null;
    importedAtLabel: string | null;
    lastVerifiedLabel: string | null;
    notes: string | null;
  }>;
};

export type MunicipalityDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shelterCount: number;
  hasShelters: boolean;
  shelters: MunicipalityShelterListItem[];
};

export type MunicipalitySummary = {
  slug: string;
  name: string;
  shelterCount: number;
  totalCapacity: number;
};

export type MunicipalityShelterListItem = {
  id: string;
  slug: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  summary: string;
  capacity: number;
  status: ShelterStatus;
  statusLabel: string;
  primarySourceName: string | null;
  dataQualityScore: number | null;
  qualityState: string;
};

export type SearchShelterResult = {
  id: string;
  slug: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  summary: string;
  capacity: number;
  status: ShelterStatus;
  statusLabel: string;
  primarySourceName: string | null;
  dataQualityScore: number | null;
  distanceKm: number | null;
  municipality: MunicipalityRow;
};

const publicShelterImportState = "active";

type SearchMode = "text" | "location" | "combined";

export type SearchShelterResultSet = {
  query: string | null;
  municipalitySlug: string | null;
  municipalityName: string | null;
  isMunicipalityFilterInvalid: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  searchMode: SearchMode;
  hasNearbyResults: boolean;
  nearbyRadiusKm: number | null;
  results: SearchShelterResult[];
};

export type AdminShelterReport = {
  id: string;
  reportType: string;
  message: string;
  contactEmail: string | null;
  status: ShelterReportStatus;
  createdAtLabel: string;
  shelterName: string | null;
  shelterSlug: string | null;
  municipalityName: string | null;
};

export type AdminShelterOverrideContext = {
  id: string;
  slug: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  municipalityName: string;
  hasActiveOverride: boolean;
  activeOverrideReason: string | null;
  importedValues: {
    name: string;
    addressLine1: string;
    postalCode: string;
    city: string;
    capacity: string;
    status: string;
    accessibilityNotes: string;
    summary: string;
  };
  effectiveValues: {
    name: string;
    addressLine1: string;
    postalCode: string;
    city: string;
    capacity: string;
    status: string;
    accessibilityNotes: string;
    summary: string;
  };
  overrideValues: ShelterOverrideValues;
};

async function createAppV2ReadClient() {
  return (await createAppV2ServerClient()) ?? createAppV2AdminClient();
}

function formatStatus(status: ShelterStatus) {
  switch (status) {
    case "active":
      return "Aktiv";
    case "temporarily_closed":
      return "Midlertidigt lukket";
    case "under_review":
      return "BBR-registreret";
    default:
      return status;
  }
}

function formatSourceType(sourceType: SourceType) {
  switch (sourceType) {
    case "official":
      return "Official source";
    case "municipality":
      return "Municipality source";
    case "manual":
      return "Manual source";
    case "other":
      return "Other source";
    default:
      return sourceType;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function mapMunicipality(row: MunicipalityRelation | undefined): MunicipalityRow {
  const municipality = Array.isArray(row) ? row[0] : row;

  return normalizeMunicipalityDisplay({
    id: municipality?.id ?? "unknown",
    slug: municipality?.slug,
    name: municipality?.name,
  });
}

async function getMunicipalityByAnyKnownSlug(
  supabase: Awaited<ReturnType<typeof createAppV2ReadClient>>,
  slug: string,
) {
  const candidates = getMunicipalitySlugCandidates(slug);
  const { data, error } = await supabase
    .from("municipalities")
    .select("id, slug, name, description")
    .in("slug", candidates);

  if (error || !data || data.length === 0) {
    return null;
  }

  const exactMatch = data.find((row) => row.slug === slug);

  return (exactMatch ?? data[0]) as MunicipalityRow & {
    description: string | null;
  };
}

function parseCoordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function getQualityState(source: SourceRow | null) {
  if (!source) {
    return "Source context is still limited";
  }

  if (source.last_verified_at) {
    return "Has a public verification date";
  }

  if (source.imported_at) {
    return "Imported source available";
  }

  return "Source connected with limited freshness detail";
}

function getShelterSummary(
  value: string | null | undefined,
  municipality: MunicipalityRow,
) {
  const summary = normalizeText(value);

  if (summary) {
    return summary;
  }

  return `Public shelter record in ${municipality.name}. More official shelter details are still being confirmed.`;
}

function getSourceSummary(
  value: string | null | undefined,
  source: SourceRow | null,
) {
  const summary = normalizeText(value);

  if (summary) {
    return summary;
  }

  if (source?.source_name) {
    return `This public record currently relies on ${source.source_name} as its primary source connection. Freshness and field completeness can still improve over time.`;
  }

  return "This public record is available, but its primary source trail is still limited. Freshness and field completeness can still improve over time.";
}

function applyShelterOverride<T>(imported: T, overrideValue: T | null | undefined) {
  return overrideValue ?? imported;
}

function mapShelterOverride<
  T extends {
    name: string;
    address_line1: string;
    postal_code: string;
    city: string;
    summary: string;
    capacity: number;
    status: ShelterStatus;
  },
>(row: T, overrideRow: ShelterOverrideRow | null): T {
  return {
    ...row,
    name: applyShelterOverride(row.name, overrideRow?.name),
    address_line1: applyShelterOverride(row.address_line1, overrideRow?.address_line1),
    postal_code: applyShelterOverride(row.postal_code, overrideRow?.postal_code),
    city: applyShelterOverride(row.city, overrideRow?.city),
    summary: applyShelterOverride(row.summary, overrideRow?.summary),
    capacity: applyShelterOverride(row.capacity, overrideRow?.capacity),
    status: applyShelterOverride(row.status, overrideRow?.status),
  };
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getSearchTokens(query: string | null) {
  if (!query) {
    return [];
  }

  return normalizeSearchText(query)
    .split(" ")
    .filter(Boolean)
    .slice(0, 6);
}

function getPrimarySource(sources: SourceRow[] | null | undefined) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return [...sources].sort((left, right) => {
    const leftTime = left.last_verified_at ? new Date(left.last_verified_at).getTime() : 0;
    const rightTime = right.last_verified_at ? new Date(right.last_verified_at).getTime() : 0;

    return rightTime - leftTime;
  })[0];
}

function getSearchableText(row: {
  name: string;
  address_line1: string;
  postal_code: string;
  city: string;
  municipalities?: MunicipalityRelation;
}) {
  const municipality = mapMunicipality(row.municipalities);

  return normalizeSearchText(
    [row.name, row.address_line1, row.postal_code, row.city, municipality.name].join(" "),
  );
}

function scoreSearchMatch(
  row: {
    name: string;
    address_line1: string;
    postal_code: string;
    city: string;
    municipalities?: MunicipalityRelation;
  },
  query: string | null,
) {
  if (!query) {
    return 1;
  }

  const normalizedQuery = normalizeSearchText(query);
  const tokens = getSearchTokens(query);
  const searchableText = getSearchableText(row);
  const normalizedName = normalizeSearchText(row.name);
  const normalizedAddress = normalizeSearchText(row.address_line1);
  const normalizedCity = normalizeSearchText(row.city);

  const matchedTokens = tokens.filter((token) => searchableText.includes(token));

  if (matchedTokens.length === 0 && !searchableText.includes(normalizedQuery)) {
    return 0;
  }

  let score = matchedTokens.length * 10;

  if (searchableText.includes(normalizedQuery)) {
    score += 25;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    score += 20;
  }

  if (normalizedAddress.startsWith(normalizedQuery)) {
    score += 14;
  }

  if (normalizedCity === normalizedQuery) {
    score += 10;
  }

  return score;
}

async function getActiveShelterOverrides(
  shelterIds: string[],
): Promise<Map<string, ShelterOverrideRow>> {
  if (shelterIds.length === 0) {
    return new Map();
  }

  try {
    const supabase = createAppV2AdminClient();
    const { data, error } = await supabase
      .from("shelter_overrides")
      .select(
        "id, shelter_id, name, address_line1, postal_code, city, capacity, status, accessibility_notes, summary, reason, is_active, created_by, updated_by, created_at, updated_at",
      )
      .in("shelter_id", shelterIds)
      .eq("is_active", true);

    if (error || !data) {
      return new Map();
    }

    return new Map(
      (data as ShelterOverrideRow[]).map((overrideRow) => [overrideRow.shelter_id, overrideRow]),
    );
  } catch {
    return new Map();
  }
}

export async function getFeaturedShelters(limit = 3): Promise<FeaturedShelter[]> {
  const supabase = await createAppV2ReadClient();

  const { data, error } = await supabase
    .from("shelters")
    .select(
      "id, slug, name, address_line1, postal_code, city, summary, capacity, status, municipalities(id, slug, name), shelter_sources(id, source_name, source_type, source_url, last_verified_at)",
    )
    .eq("import_state", publicShelterImportState)
    .eq("is_featured", true)
    .order("featured_rank", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data as FeaturedShelterRow[];
  const overrides = await getActiveShelterOverrides(rows.map((row) => row.id));

  return rows.map((row) => {
    const effectiveRow = mapShelterOverride(row, overrides.get(row.id) ?? null);
    const primarySource = getPrimarySource(row.shelter_sources);
    const municipality = mapMunicipality(row.municipalities);

    return {
      id: effectiveRow.id,
      slug: effectiveRow.slug,
      name: effectiveRow.name,
      addressLine1: effectiveRow.address_line1,
      postalCode: effectiveRow.postal_code,
      city: effectiveRow.city,
      summary: getShelterSummary(effectiveRow.summary, municipality),
      capacity: effectiveRow.capacity,
      status: effectiveRow.status,
      statusLabel: formatStatus(effectiveRow.status),
      primarySourceName: primarySource?.source_name ?? null,
      lastVerifiedLabel: formatDate(primarySource?.last_verified_at ?? null),
      municipality,
    };
  });
}

export const getShelterBySlug = cache(async (slug: string): Promise<ShelterDetail | null> => {
  const publicSupabase = await createAppV2ReadClient();

  const shelterSelects = [
    "id, slug, name, address_line1, postal_code, city, latitude, longitude, byg021_bygningens_anvendelse, summary, source_summary, capacity, status, accessibility_notes, municipality_id, municipalities(id, slug, name)",
    "id, slug, name, address_line1, postal_code, city, latitude, longitude, byg021BygningensAnvendelse, summary, source_summary, capacity, status, accessibility_notes, municipality_id, municipalities(id, slug, name)",
    "id, slug, name, address_line1, postal_code, city, latitude, longitude, summary, source_summary, capacity, status, accessibility_notes, municipality_id, municipalities(id, slug, name)",
  ];

  let shelterResponse: { data: ShelterDetailRow | null; error: Error | null } | null = null;

  for (const selectClause of shelterSelects) {
    const response = await publicSupabase
      .from("shelters")
      .select(selectClause)
      .eq("import_state", publicShelterImportState)
      .eq("slug", slug)
      .maybeSingle();

    shelterResponse = {
      data: (response.data as ShelterDetailRow | null) ?? null,
      error: response.error,
    };

    if (!shelterResponse.error) {
      break;
    }
  }

  if (!shelterResponse || shelterResponse.error || !shelterResponse.data) {
    return null;
  }

  const shelter = shelterResponse.data;

  const sourcesResponse = await publicSupabase
    .from("shelter_sources")
    .select("id, source_name, source_type, source_url, source_reference, last_verified_at, imported_at, notes")
    .eq("shelter_id", shelter.id)
    .order("last_verified_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false, nullsFirst: false });

  const sources = (sourcesResponse.data as SourceRow[] | null)?.map((source) => ({
    id: source.id,
    sourceName: source.source_name,
    sourceTypeLabel: formatSourceType(source.source_type),
    sourceUrl: source.source_url,
    sourceReference: source.source_reference ?? null,
    importedAtLabel: formatDate(source.imported_at ?? null),
    lastVerifiedLabel: formatDate(source.last_verified_at),
    notes: source.notes ?? null,
  })) ?? [];

  const primarySource = getPrimarySource(sourcesResponse.data as SourceRow[] | null);
  const publicNotes =
    primarySource?.notes
      ?.split("\n")
      .map((note) => note.trim())
      .filter(
        (note) =>
          note.length > 0 &&
          !note.includes("Normalized from BBR") &&
          !note.includes("DAR address enrichment"),
      )
      .join("\n") || null;
  let activeOverride: ShelterOverrideRow | null = null;

  try {
    const adminSupabase = createAppV2AdminClient();
    const overrideResponse = await adminSupabase
      .from("shelter_overrides")
      .select(
        "id, shelter_id, name, address_line1, postal_code, city, capacity, status, accessibility_notes, summary, reason, is_active, created_by, updated_by, created_at, updated_at",
      )
      .eq("shelter_id", shelter.id)
      .eq("is_active", true)
      .maybeSingle();

    activeOverride = (overrideResponse.data as ShelterOverrideRow | null) ?? null;
  } catch {
    activeOverride = null;
  }

  const effectiveName = applyShelterOverride(shelter.name, activeOverride?.name);
  const effectiveAddressLine1 = applyShelterOverride(
    shelter.address_line1,
    activeOverride?.address_line1,
  );
  const effectivePostalCode = applyShelterOverride(shelter.postal_code, activeOverride?.postal_code);
  const effectiveCity = applyShelterOverride(shelter.city, activeOverride?.city);
  const effectiveCapacity = applyShelterOverride(shelter.capacity, activeOverride?.capacity);
  const effectiveStatus = applyShelterOverride(shelter.status, activeOverride?.status);
  const effectiveAccessibilityNotes = applyShelterOverride(
    shelter.accessibility_notes,
    activeOverride?.accessibility_notes,
  );
  const effectiveSummary = applyShelterOverride(shelter.summary, activeOverride?.summary);
  const municipality = mapMunicipality(shelter.municipalities);

  return {
    id: shelter.id,
    slug: shelter.slug,
    name: effectiveName,
    addressLine1: effectiveAddressLine1,
    postalCode: effectivePostalCode,
    city: effectiveCity,
    latitude: parseCoordinate(shelter.latitude),
    longitude: parseCoordinate(shelter.longitude),
    bbrUsageCode: parseInteger(
      shelter.byg021_bygningens_anvendelse ?? shelter.byg021BygningensAnvendelse ?? null,
    ),
    summary: getShelterSummary(effectiveSummary, municipality),
    sourceSummary: getSourceSummary(shelter.source_summary, primarySource ?? null),
    capacity: effectiveCapacity,
    status: effectiveStatus,
    statusLabel: formatStatus(effectiveStatus),
    primarySourceName: primarySource?.source_name ?? null,
    primarySourceTypeLabel: primarySource ? formatSourceType(primarySource.source_type) : null,
    primarySourceUrl: primarySource?.source_url ?? null,
    primarySourceReference: primarySource?.source_reference ?? null,
    lastVerifiedLabel: formatDate(primarySource?.last_verified_at ?? null),
    lastImportedLabel: formatDate(primarySource?.imported_at ?? null),
    accessibilityNotes: effectiveAccessibilityNotes,
    dataQualityScore: null,
    qualityState: getQualityState(primarySource ?? null),
    publicNotes,
    municipality,
    sources,
  };
});

export const getMunicipalityBySlug = cache(async (slug: string): Promise<MunicipalityDetail | null> => {
  const supabase = await createAppV2ReadClient();
  const municipality = await getMunicipalityByAnyKnownSlug(supabase, slug);

  if (!municipality) {
    return null;
  }
  const displayMunicipality = normalizeMunicipalityDisplay(municipality);

  const sheltersResponse = await supabase
    .from("shelters")
    .select(
      "id, slug, name, address_line1, postal_code, city, summary, capacity, status, shelter_sources(id, source_name, source_type, source_url, source_reference, last_verified_at, imported_at, notes)",
    )
    .eq("import_state", publicShelterImportState)
    .eq("municipality_id", municipality.id)
    .order("is_featured", { ascending: false })
    .order("featured_rank", { ascending: true });

  const shelterRows =
    (sheltersResponse.data as Array<MunicipalityShelterRow & { shelter_sources?: SourceRow[] | null }> | null) ??
    [];
  const overrides = await getActiveShelterOverrides(shelterRows.map((shelter) => shelter.id));
  const shelters = shelterRows.map((shelter) => {
    const effectiveShelter = mapShelterOverride(shelter, overrides.get(shelter.id) ?? null);
    const primarySource = getPrimarySource(shelter.shelter_sources);
    const municipalityRow = {
      id: municipality.id,
      slug: displayMunicipality.slug,
      name: displayMunicipality.name,
    };

    return {
      id: shelter.id,
      slug: shelter.slug,
      name: effectiveShelter.name,
      addressLine1: effectiveShelter.address_line1,
      postalCode: effectiveShelter.postal_code,
      city: effectiveShelter.city,
      summary: getShelterSummary(effectiveShelter.summary, municipalityRow),
      capacity: effectiveShelter.capacity,
      status: effectiveShelter.status,
      statusLabel: formatStatus(effectiveShelter.status),
      primarySourceName: primarySource?.source_name ?? null,
      dataQualityScore: null,
      qualityState: getQualityState(primarySource ?? null),
    };
  });

  return {
    id: municipality.id,
    slug: displayMunicipality.slug,
    name: displayMunicipality.name,
    description: municipality.description,
    shelterCount: shelters.length,
    hasShelters: shelters.length > 0,
    shelters,
  };
});

export const getMunicipalitySummaries = cache(async (): Promise<MunicipalitySummary[]> => {
  const supabase = await createAppV2ReadClient();
  const sheltersResponse = await supabase
    .from("shelters")
    .select("capacity, municipalities(id, slug, name)")
    .eq("import_state", publicShelterImportState);

  const shelterRows =
    (sheltersResponse.data as Array<Pick<ShelterRow, "capacity" | "municipalities">> | null) ?? [];

  const summaries = new Map<string, MunicipalitySummary>();

  for (const shelter of shelterRows) {
    const municipality = mapMunicipality(shelter.municipalities);
    const existing = summaries.get(municipality.slug);

    if (existing) {
      existing.shelterCount += 1;
      existing.totalCapacity += shelter.capacity;
      continue;
    }

    summaries.set(municipality.slug, {
      slug: municipality.slug,
      name: municipality.name,
      shelterCount: 1,
      totalCapacity: shelter.capacity,
    });
  }

  return Array.from(summaries.values()).sort((left, right) => left.name.localeCompare(right.name));
});

export async function searchShelters(input: {
  query: string | null;
  municipalitySlug: string | null;
  latitude: number | null;
  longitude: number | null;
}): Promise<SearchShelterResultSet> {
  const supabase = await createAppV2ReadClient();
  const hasLocationSearch = input.latitude !== null && input.longitude !== null;
  const searchMode: SearchMode = hasLocationSearch
    ? input.query
      ? "combined"
      : "location"
    : "text";
  const coordinates =
    hasLocationSearch && input.latitude !== null && input.longitude !== null
    ? {
        latitude: input.latitude,
        longitude: input.longitude,
      }
    : null;
  const nearbyRadiusKm = hasLocationSearch ? 25 : null;

  let municipalityId: string | null = null;
  let municipalityName: string | null = null;
  let isMunicipalityFilterInvalid = false;

  if (input.municipalitySlug) {
    const municipality = await getMunicipalityByAnyKnownSlug(supabase, input.municipalitySlug);

    if (municipality) {
      const displayMunicipality = normalizeMunicipalityDisplay(municipality);
      municipalityId = municipality.id;
      municipalityName = displayMunicipality.name;
    } else {
      isMunicipalityFilterInvalid = true;
    }
  }

  if (isMunicipalityFilterInvalid) {
    return {
      query: input.query,
      municipalitySlug: input.municipalitySlug,
      municipalityName: null,
      isMunicipalityFilterInvalid,
      coordinates,
      searchMode,
      hasNearbyResults: false,
      nearbyRadiusKm,
      results: [],
    };
  }

  const tokens = getSearchTokens(input.query);
  const primaryToken = tokens[0] ?? input.query;

  let queryBuilder = supabase
    .from("shelters")
    .select(
      "id, slug, name, address_line1, postal_code, city, latitude, longitude, summary, capacity, status, municipalities(id, slug, name), shelter_sources(id, source_name, source_type, source_url, last_verified_at)",
    )
    .eq("import_state", publicShelterImportState);

  if (municipalityId) {
    queryBuilder = queryBuilder.eq("municipality_id", municipalityId);
  }

  if (hasLocationSearch) {
    queryBuilder = queryBuilder.not("latitude", "is", null).not("longitude", "is", null);
  } else if (primaryToken) {
    const escaped = primaryToken.replace(/[%_,]/g, "");
    queryBuilder = queryBuilder.or(
      `name.ilike.%${escaped}%,address_line1.ilike.%${escaped}%,city.ilike.%${escaped}%,postal_code.ilike.%${escaped}%`,
    );
    queryBuilder = queryBuilder.limit(50);
  }

  const { data, error } = await queryBuilder;

  if (error || !data) {
    return {
      query: input.query,
      municipalitySlug: input.municipalitySlug,
      municipalityName,
      isMunicipalityFilterInvalid,
      coordinates,
      searchMode,
      hasNearbyResults: false,
      nearbyRadiusKm,
      results: [],
    };
  }

  const rows = data as SearchShelterRow[];
  const overrides = await getActiveShelterOverrides(rows.map((row) => row.id));
  const rankedResults = rows
    .map((row) => {
      const effectiveRow = mapShelterOverride(row, overrides.get(row.id) ?? null);
      const matchScore = scoreSearchMatch(effectiveRow, input.query);
      const distanceKm =
        hasLocationSearch && input.latitude !== null && input.longitude !== null
          ? calculateDistanceKm(
              input.latitude,
              input.longitude,
              Number(effectiveRow.latitude),
              Number(effectiveRow.longitude),
            )
          : null;

      return {
        row: effectiveRow,
        matchScore,
        distanceKm,
      };
    })
    .filter(({ matchScore }) => matchScore > 0 || !input.query)
    .sort((left, right) => {
      if (hasLocationSearch) {
        if ((left.distanceKm ?? Number.POSITIVE_INFINITY) !== (right.distanceKm ?? Number.POSITIVE_INFINITY)) {
          return (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY);
        }

        if (right.matchScore !== left.matchScore) {
          return right.matchScore - left.matchScore;
        }
      } else if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      const leftMunicipality = mapMunicipality(left.row.municipalities).name;
      const rightMunicipality = mapMunicipality(right.row.municipalities).name;

      return leftMunicipality.localeCompare(rightMunicipality);
    });

  const results = rankedResults.slice(0, 50).map(({ row, distanceKm }) => {
    const primarySource = getPrimarySource(row.shelter_sources);
    const municipality = mapMunicipality(row.municipalities);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      addressLine1: row.address_line1,
      postalCode: row.postal_code,
      city: row.city,
      latitude: parseCoordinate(row.latitude),
      longitude: parseCoordinate(row.longitude),
      summary: getShelterSummary(row.summary, municipality),
      capacity: row.capacity,
      status: row.status,
      statusLabel: formatStatus(row.status),
      primarySourceName: primarySource?.source_name ?? null,
      dataQualityScore: null,
      distanceKm,
      municipality,
    };
  });

  const hasNearbyResults = hasLocationSearch
    ? results.some(
        (result) => result.distanceKm !== null && nearbyRadiusKm !== null && result.distanceKm <= nearbyRadiusKm,
      )
    : false;

  return {
    query: input.query,
    municipalitySlug: input.municipalitySlug,
    municipalityName,
    isMunicipalityFilterInvalid,
    coordinates,
    searchMode,
    hasNearbyResults,
    nearbyRadiusKm,
    results,
  };
}

export async function getAdminShelterReports(): Promise<AdminShelterReport[]> {
  try {
    const supabase = createAppV2AdminClient();

    const { data, error } = await supabase
      .from("shelter_reports")
      .select(
        "id, report_type, message, contact_email, status, created_at, shelters(name, slug, municipalities(id, slug, name))",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    return data.map((report) => {
      const shelter = Array.isArray(report.shelters) ? report.shelters[0] : report.shelters;
      const municipality = shelter?.municipalities
        ? mapMunicipality(shelter.municipalities as MunicipalityRelation)
        : null;

      return {
        id: report.id,
        reportType: report.report_type,
        message: report.message,
        contactEmail: report.contact_email,
        status: report.status as ShelterReportStatus,
        createdAtLabel: formatDate(report.created_at) ?? "Unknown date",
        shelterName: shelter?.name ?? null,
        shelterSlug: shelter?.slug ?? null,
        municipalityName: municipality?.name ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function getAdminShelterOverrideContext(
  slug: string,
): Promise<AdminShelterOverrideContext | null> {
  try {
    const supabase = createAppV2AdminClient();

    const shelterResponse = await supabase
      .from("shelters")
      .select(
        "id, slug, name, address_line1, postal_code, city, summary, capacity, status, accessibility_notes, municipalities(id, slug, name)",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (shelterResponse.error || !shelterResponse.data) {
      return null;
    }

    const shelter = shelterResponse.data as ShelterRow;

    const overrideResponse = await supabase
      .from("shelter_overrides")
      .select(
        "id, shelter_id, name, address_line1, postal_code, city, capacity, status, accessibility_notes, summary, reason, is_active, created_by, updated_by, created_at, updated_at",
      )
      .eq("shelter_id", shelter.id)
      .eq("is_active", true)
      .maybeSingle();

    const municipality = mapMunicipality(shelter.municipalities);
    const activeOverride = (overrideResponse.data as ShelterOverrideRow | null) ?? null;
    const importedValues = {
      name: shelter.name,
      addressLine1: shelter.address_line1,
      postalCode: shelter.postal_code,
      city: shelter.city,
      capacity: `${shelter.capacity}`,
      status: formatStatus(shelter.status),
      accessibilityNotes: shelter.accessibility_notes ?? "No accessibility notes from import",
      summary: normalizeText(shelter.summary) ?? "No imported public summary yet",
    };
    const effectiveValues = {
      name: applyShelterOverride(importedValues.name, activeOverride?.name),
      addressLine1: applyShelterOverride(importedValues.addressLine1, activeOverride?.address_line1),
      postalCode: applyShelterOverride(importedValues.postalCode, activeOverride?.postal_code),
      city: applyShelterOverride(importedValues.city, activeOverride?.city),
      capacity: `${applyShelterOverride(shelter.capacity, activeOverride?.capacity)}`,
      status: activeOverride?.status
        ? formatOverrideStatusLabel(activeOverride.status)
        : importedValues.status,
      accessibilityNotes: applyShelterOverride(
        importedValues.accessibilityNotes,
        activeOverride?.accessibility_notes,
      ),
      summary: applyShelterOverride(importedValues.summary, activeOverride?.summary),
    };
    const overrideValues: ShelterOverrideValues = {
      name: activeOverride?.name ?? null,
      addressLine1: activeOverride?.address_line1 ?? null,
      postalCode: activeOverride?.postal_code ?? null,
      city: activeOverride?.city ?? null,
      capacity: activeOverride?.capacity ?? null,
      status: activeOverride?.status ?? null,
      accessibilityNotes: activeOverride?.accessibility_notes ?? null,
      summary: activeOverride?.summary ?? null,
    };

    return {
      id: shelter.id,
      slug: shelter.slug,
      name: shelter.name,
      addressLine1: shelter.address_line1,
      postalCode: shelter.postal_code,
      city: shelter.city,
      municipalityName: municipality.name,
      hasActiveOverride: Boolean(activeOverride),
      activeOverrideReason: activeOverride?.reason ?? null,
      importedValues,
      effectiveValues,
      overrideValues,
    };
  } catch {
    return null;
  }
}
