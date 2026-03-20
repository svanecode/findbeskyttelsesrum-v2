import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  return (
    <Card className="border border-dashed border-border/80 bg-card py-0">
      <CardHeader className="gap-3">
        <CardTitle>No shelters matched this search.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          {isMunicipalityFilterInvalid
            ? "The municipality filter in the URL does not match a known municipality. "
            : null}
          {hasInvalidCoordinates
            ? "The location parameters in the URL could not be used. "
            : null}
          {geocodingStatus === "no_match"
            ? "No address match was found for this query, so the search fell back to text matching. "
            : null}
          {geocodingStatus === "ambiguous"
            ? "This query matched multiple possible addresses, so the search fell back to text matching. "
            : null}
          {geocodingStatus === "provider_error"
            ? "Address lookup is temporarily unavailable, so the search fell back to text matching. "
            : null}
          {query ? `No public shelter records matched "${query}". ` : null}
          {municipalityName ? `The municipality filter is set to ${municipalityName}.` : null}
          {hasLocationSearch && nearbyRadiusKm
            ? ` No public shelter records matched this location-aware search within the current ${nearbyRadiusKm} km nearby threshold.`
            : null}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants({ variant: "outline" })} href="/find?q=2300">
            Try postcode search
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "ghost" }), "px-0")}
            href="/find"
          >
            Clear search
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
