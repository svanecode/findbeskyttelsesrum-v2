type BuildFindUrlInput = {
  query?: string | null;
  municipalitySlug?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  resolvedAddressLabel?: string | null;
};

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export function buildFindUrl({
  query,
  municipalitySlug,
  latitude,
  longitude,
  resolvedAddressLabel,
}: BuildFindUrlInput) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (municipalitySlug) {
    params.set("municipality", municipalitySlug);
  }

  if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
    params.set("lat", formatCoordinate(latitude));
    params.set("lng", formatCoordinate(longitude));
  }

  if (resolvedAddressLabel) {
    params.set("resolved", resolvedAddressLabel);
  }

  const queryString = params.toString();

  return queryString ? `/find?${queryString}` : "/find";
}
