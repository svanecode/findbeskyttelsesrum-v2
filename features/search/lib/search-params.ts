export type SearchPageParams = {
  q?: string;
  municipality?: string;
  lat?: string;
  lng?: string;
  resolved?: string;
};

export type SearchCoordinates = {
  latitude: number;
  longitude: number;
};

export type NormalizedSearchParams = {
  query: string | null;
  municipalitySlug: string | null;
  coordinates: SearchCoordinates | null;
  resolvedAddressLabel: string | null;
  hasSearchIntent: boolean;
  hasInvalidCoordinates: boolean;
};

function normalizeValue(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function parseCoordinate(value: string | null, min: number, max: number) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

export function normalizeSearchParams(searchParams: SearchPageParams): NormalizedSearchParams {
  const query = normalizeValue(searchParams.q);
  const municipalitySlug = normalizeValue(searchParams.municipality)?.toLowerCase() ?? null;
  const latitudeValue = normalizeValue(searchParams.lat);
  const longitudeValue = normalizeValue(searchParams.lng);
  const resolvedAddressLabel = normalizeValue(searchParams.resolved);
  const latitude = parseCoordinate(latitudeValue, -90, 90);
  const longitude = parseCoordinate(longitudeValue, -180, 180);
  const hasCoordinateParams = Boolean(latitudeValue || longitudeValue);
  const coordinates = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const hasInvalidCoordinates = hasCoordinateParams && coordinates === null;

  return {
    query,
    municipalitySlug,
    coordinates,
    resolvedAddressLabel,
    hasSearchIntent: Boolean(query || municipalitySlug || hasCoordinateParams),
    hasInvalidCoordinates,
  };
}
