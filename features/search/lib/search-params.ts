export type SearchPageParams = {
  q?: string;
  municipality?: string;
  lat?: string;
  lng?: string;
};

export type NormalizedSearchParams = {
  query: string | null;
  municipalitySlug: string | null;
  latitude: string | null;
  longitude: string | null;
  hasSearchIntent: boolean;
  hasLocationPlaceholder: boolean;
};

function normalizeValue(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function normalizeSearchParams(searchParams: SearchPageParams): NormalizedSearchParams {
  const query = normalizeValue(searchParams.q);
  const municipalitySlug = normalizeValue(searchParams.municipality)?.toLowerCase() ?? null;
  const latitude = normalizeValue(searchParams.lat);
  const longitude = normalizeValue(searchParams.lng);

  return {
    query,
    municipalitySlug,
    latitude,
    longitude,
    hasSearchIntent: Boolean(query || municipalitySlug),
    hasLocationPlaceholder: Boolean(latitude && longitude),
  };
}
