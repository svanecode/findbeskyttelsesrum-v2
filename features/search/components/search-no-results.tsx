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
    isMunicipalityFilterInvalid ? "Ukendt kommunefilter." : null,
    hasInvalidCoordinates ? "Placeringsparametrene kunne ikke bruges." : null,
    geocodingStatus === "no_match" ? "Ingen adressematch blev fundet." : null,
    geocodingStatus === "ambiguous" ? "Adressen matchede mere end ét sted." : null,
    geocodingStatus === "provider_error" ? "Adresseopslag er midlertidigt utilgængeligt." : null,
    query ? `Ingen resultater matchede “${query}”.` : null,
    municipalityName ? `Kommune: ${municipalityName}.` : null,
    hasLocationSearch && nearbyRadiusKm
      ? `Ingen resultater inden for ${nearbyRadiusKm} km.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-5 bg-background py-10 sm:py-14">
      <h2 className="font-[family-name:var(--font-instrument-serif)] text-[1.8rem] leading-tight text-foreground">
        Ingen beskyttelsesrum matchede.
      </h2>
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        {reasons ? <p>{reasons}</p> : null}
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Link
            className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="/find?q=2300"
          >
            Prøv postnummersøgning
          </Link>
          <Link
            className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="/find"
          >
            Ryd søgning
          </Link>
        </div>
      </div>
    </div>
  );
}
