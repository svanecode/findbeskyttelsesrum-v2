type DawaAddressResult = {
  adressebetegnelse: string;
  adgangsadresse?: {
    id?: string;
    adressebetegnelse?: string;
    adgangspunkt?: {
      koordinater?: [number, number];
    } | null;
  } | null;
};

export type GeocodeResult =
  | {
      status: "success";
      latitude: number;
      longitude: number;
      label: string;
    }
  | {
      status: "skipped" | "no_match" | "ambiguous" | "provider_error";
    };

const GEOCODE_TIMEOUT_MS = 5000;

function shouldAttemptGeocoding(query: string) {
  const normalized = query.trim();

  if (normalized.length < 4) {
    return false;
  }

  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;

  return /\d/.test(normalized) || normalized.includes(",") || tokenCount >= 2;
}

export async function geocodeAddressQuery(query: string): Promise<GeocodeResult> {
  if (!shouldAttemptGeocoding(query)) {
    return { status: "skipped" };
  }

  const url = new URL("https://api.dataforsyningen.dk/adresser");
  url.searchParams.set("q", query);
  url.searchParams.set("per_side", "5");

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { status: "provider_error" };
    }

    const data = (await response.json()) as DawaAddressResult[];

    if (!Array.isArray(data) || data.length === 0) {
      return { status: "no_match" };
    }

    const uniqueAccessAddresses = Array.from(
      new Map(
        data
          .filter((result) => {
            const coordinates = result.adgangsadresse?.adgangspunkt?.koordinater;

            return (
              result.adgangsadresse?.id &&
              Array.isArray(coordinates) &&
              coordinates.length === 2 &&
              Number.isFinite(coordinates[0]) &&
              Number.isFinite(coordinates[1])
            );
          })
          .map((result) => [result.adgangsadresse!.id!, result]),
      ).values(),
    );

    if (uniqueAccessAddresses.length === 0) {
      return { status: "no_match" };
    }

    if (uniqueAccessAddresses.length > 1) {
      return { status: "ambiguous" };
    }

    const match = uniqueAccessAddresses[0];
    const coordinates = match.adgangsadresse?.adgangspunkt?.koordinater;

    if (!coordinates) {
      return { status: "no_match" };
    }

    return {
      status: "success",
      longitude: coordinates[0],
      latitude: coordinates[1],
      label:
        match.adgangsadresse?.adressebetegnelse ??
        match.adressebetegnelse,
    };
  } catch {
    return { status: "provider_error" };
  }
}
