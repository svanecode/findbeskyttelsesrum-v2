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
    <Card className="border border-dashed border-white/10 bg-[#12151b] py-0 text-[#f7efe6]">
      <CardHeader className="gap-3">
        <CardTitle className="text-[#fff7ef]">No shelters matched this search.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-[#b8a793]">
        {reasons ? <p>{reasons}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-white/10 bg-[#0d1015] text-[#f7efe6] hover:bg-[#171b23]",
            )}
            href="/find?q=2300"
          >
            Try postcode search
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "ghost" }), "px-0 text-[#ff9c52] hover:text-[#ffb06d]")}
            href="/find"
          >
            Clear search
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
