import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="border border-dashed border-border/80 bg-card/90">
      <CardHeader className="gap-3">
        <Badge variant="secondary">
          {hasInvalidCoordinates ? "Invalid location" : "No matches"}
        </Badge>
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
        <p>
          {hasInvalidCoordinates
            ? "Check the shared location link or start a new search from the homepage location button."
            : "Try a shorter address fragment, a postcode, or remove the municipality filter from the URL to broaden the result set."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/find?q=2300" />} variant="outline">
            Try postcode search
          </Button>
          <Button render={<Link href="/find" />} variant="ghost">
            Clear search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
