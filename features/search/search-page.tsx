import { redirect } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeAddressQuery, type GeocodeResult } from "@/lib/geocoding/dawa";
import {
  searchShelters,
  type SearchShelterResultSet,
} from "@/lib/supabase/queries";

import { SearchEmptyState } from "./components/search-empty-state";
import { SearchForm } from "./components/search-form";
import { SearchNoResults } from "./components/search-no-results";
import { SearchResultsExperience } from "./components/search-results-experience";
import { normalizeSearchParams, type SearchPageParams } from "./lib/search-params";
import { buildFindUrl } from "./lib/search-url";

type SearchPageProps = {
  searchParams: SearchPageParams;
};

function formatCoordinateLabel(value: number) {
  return value.toFixed(4);
}

function getSearchSummary(
  resultSet: SearchShelterResultSet,
  options: {
    displayQuery: string | null;
    resolvedAddressLabel: string | null;
  },
) {
  const parts = [];

  if (options.displayQuery) {
    parts.push(`Query: "${options.displayQuery}"`);
  }

  if (resultSet.municipalityName) {
    parts.push(`Municipality: ${resultSet.municipalityName}`);
  }

  if (options.resolvedAddressLabel) {
    parts.push(`Resolved to: ${options.resolvedAddressLabel}`);
  }

  if (resultSet.coordinates) {
    parts.push(
      `Location: ${formatCoordinateLabel(resultSet.coordinates.latitude)}, ${formatCoordinateLabel(resultSet.coordinates.longitude)}`,
    );
  }

  if (parts.length === 0) {
    return "Search by address, area, postcode, municipality, or current location.";
  }

  return parts.join(" • ");
}

function getSearchDescription(
  resultSet: SearchShelterResultSet,
  options: {
    hasInvalidCoordinates: boolean;
    geocodingResult: GeocodeResult | null;
    resolvedAddressLabel: string | null;
  },
) {
  if (options.resolvedAddressLabel) {
    return `The query resolved to ${options.resolvedAddressLabel}, so the results use nearby distance ordering as the primary search behavior.`;
  }

  if (resultSet.searchMode === "combined") {
    return "Text matches are narrowed first and then ordered by distance from the shared coordinates.";
  }

  if (resultSet.searchMode === "location") {
    return "Results are ordered by distance from the shared coordinates using the public shelter records with known latitude and longitude.";
  }

  if (options.geocodingResult?.status === "ambiguous") {
    return "This query matched multiple possible addresses, so the page fell back to the standard text search path.";
  }

  if (options.geocodingResult?.status === "no_match") {
    return "No address match was found for this query, so the page fell back to the standard text search path.";
  }

  if (options.geocodingResult?.status === "provider_error") {
    return "Address lookup is temporarily unavailable, so the page fell back to the standard text search path.";
  }

  if (options.hasInvalidCoordinates) {
    return "The location parameters in the URL could not be used, so the search fell back to the standard text search path.";
  }

  return "Search matches currently use a simple server-side text strategy across shelter name, address, city, postcode, and municipality, with optional municipality narrowing.";
}

export async function SearchPage({ searchParams }: SearchPageProps) {
  const normalized = normalizeSearchParams(searchParams);
  const hasFallbackSearch =
    Boolean(normalized.query || normalized.municipalitySlug || normalized.coordinates);
  let geocodingResult: GeocodeResult | null = null;

  if (!normalized.hasSearchIntent) {
    return (
      <PageShell className="py-12 sm:py-16">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Find"
            title="Find shelters by address or municipality."
            description="Search results are rendered on the server using the public shelter records in Supabase. This first version is intentionally simple, direct, and easy to trust."
          />
          <SearchForm defaultQuery={normalized.query} municipalitySlug={normalized.municipalitySlug} />
          <SearchEmptyState />
        </div>
      </PageShell>
    );
  }

  if (normalized.hasInvalidCoordinates && !hasFallbackSearch) {
    return (
      <PageShell className="py-12 sm:py-16">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Find"
            title="Location search could not be started"
            description="The location parameters in the URL are incomplete or invalid. Start a new search or share your location again from the homepage."
          />
          <SearchForm defaultQuery={normalized.query} municipalitySlug={normalized.municipalitySlug} />
          <SearchNoResults
            isMunicipalityFilterInvalid={false}
            municipalityName={null}
            query={null}
            hasInvalidCoordinates
          />
        </div>
      </PageShell>
    );
  }

  if (normalized.query && normalized.coordinates === null) {
    geocodingResult = await geocodeAddressQuery(normalized.query);

    if (geocodingResult.status === "success") {
      redirect(
        buildFindUrl({
          query: normalized.query,
          municipalitySlug: normalized.municipalitySlug,
          latitude: geocodingResult.latitude,
          longitude: geocodingResult.longitude,
          resolvedAddressLabel: geocodingResult.label,
        }),
      );
    }
  }

  const resolvedAddressLabel =
    normalized.coordinates !== null ? normalized.resolvedAddressLabel : null;
  const filterQuery = resolvedAddressLabel ? null : normalized.query;

  const resultSet = await searchShelters({
    query: filterQuery,
    municipalitySlug: normalized.municipalitySlug,
    latitude: normalized.coordinates?.latitude ?? null,
    longitude: normalized.coordinates?.longitude ?? null,
  });

  return (
    <PageShell className="py-12 sm:py-16">
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Find"
          title="Shelter search results"
          description="This result view keeps the hierarchy simple: search summary first, public shelter records second, and source clarity visible on every card."
        />

        <div className="space-y-4">
          <SearchForm
            defaultQuery={normalized.query}
            municipalitySlug={resultSet.municipalitySlug}
            latitude={resolvedAddressLabel ? null : resultSet.coordinates?.latitude ?? null}
            longitude={resolvedAddressLabel ? null : resultSet.coordinates?.longitude ?? null}
          />
          <Card className="border border-border/70 bg-card/90">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{resultSet.results.length} results</Badge>
                {resolvedAddressLabel ? (
                  <Badge variant="outline">Address resolved</Badge>
                ) : null}
                {resultSet.searchMode === "location" ? (
                  <Badge variant="outline">Distance sorted</Badge>
                ) : null}
                {resultSet.searchMode === "combined" ? (
                  <Badge variant="outline">Text + distance</Badge>
                ) : null}
                {resultSet.isMunicipalityFilterInvalid ? (
                  <Badge variant="outline">Unknown municipality filter</Badge>
                ) : null}
                {normalized.hasInvalidCoordinates ? (
                  <Badge variant="outline">Ignored invalid location params</Badge>
                ) : null}
                {resultSet.searchMode !== "text" && !resultSet.hasNearbyResults ? (
                  <Badge variant="outline">
                    No shelters within {resultSet.nearbyRadiusKm} km
                  </Badge>
                ) : null}
              </div>
              <CardTitle>Search summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>
                {getSearchSummary(resultSet, {
                  displayQuery: normalized.query,
                  resolvedAddressLabel,
                })}
              </p>
              <p>
                {getSearchDescription(resultSet, {
                  hasInvalidCoordinates: normalized.hasInvalidCoordinates,
                  geocodingResult,
                  resolvedAddressLabel,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {resultSet.results.length > 0 ? (
          <SearchResultsExperience resultSet={resultSet} />
        ) : (
          <SearchNoResults
            isMunicipalityFilterInvalid={resultSet.isMunicipalityFilterInvalid}
            municipalityName={resultSet.municipalityName}
            query={normalized.query}
            hasInvalidCoordinates={normalized.hasInvalidCoordinates}
            hasLocationSearch={resultSet.searchMode !== "text"}
            nearbyRadiusKm={resultSet.nearbyRadiusKm}
            geocodingStatus={geocodingResult?.status ?? null}
          />
        )}
      </div>
    </PageShell>
  );
}
