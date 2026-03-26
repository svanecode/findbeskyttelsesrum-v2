import Link from "next/link";

type SearchNoResultsProps = {
  query: string | null;
  municipalityName: string | null;
  isMunicipalityFilterInvalid?: boolean;
  hasLocationSearch?: boolean;
  hasInvalidCoordinates?: boolean;
  nearbyRadiusKm?: number | null;
  geocodingStatus?: "skipped" | "no_match" | "ambiguous" | "provider_error" | null;
};

export function SearchNoResults({
  query,
  municipalityName,
  isMunicipalityFilterInvalid = false,
  hasLocationSearch = false,
  hasInvalidCoordinates = false,
  nearbyRadiusKm = null,
  geocodingStatus = null,
}: SearchNoResultsProps) {
  const reasons = [
    isMunicipalityFilterInvalid ? "Unknown municipality filter." : null,
    hasInvalidCoordinates ? "Location parameters could not be used." : null,
    geocodingStatus === "no_match" ? "No address match was found." : null,
    geocodingStatus === "ambiguous" ? "The address matched more than one place." : null,
    geocodingStatus === "provider_error" ? "Address lookup is temporarily unavailable." : null,
    query ? `No records matched “${query}”.` : null,
    municipalityName ? `Municipality: ${municipalityName}.` : null,
    hasLocationSearch && nearbyRadiusKm
      ? `No results within ${nearbyRadiusKm} km.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-5 bg-background py-10 sm:py-14">
      <h2 className="font-[family-name:var(--font-instrument-serif)] text-[1.8rem] leading-tight text-foreground">
        No shelters matched.
      </h2>
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        {reasons ? <p>{reasons}</p> : null}
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Link
            className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="/find?q=2300"
          >
            Try postcode search
          </Link>
          <Link
            className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="/find"
          >
            Clear search
          </Link>
        </div>
      </div>
    </div>
  );
}
