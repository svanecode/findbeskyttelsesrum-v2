import { redirect } from "next/navigation";

import {
  DataStrip,
  PublicPageIntro,
  PublicSurface,
} from "@/components/shared/public-primitives";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { geocodeAddressQuery, type GeocodeResult } from "@/lib/geocoding/dawa";
import { searchShelters, type SearchShelterResultSet } from "@/lib/supabase/queries";

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
    parts.push(`“${options.displayQuery}”`);
  }

  if (options.resolvedAddressLabel) {
    parts.push(options.resolvedAddressLabel);
  }

  if (resultSet.municipalityName) {
    parts.push(resultSet.municipalityName);
  }

  if (resultSet.coordinates) {
    parts.push(
      `${formatCoordinateLabel(resultSet.coordinates.latitude)}, ${formatCoordinateLabel(resultSet.coordinates.longitude)}`,
    );
  }

  return parts.join(" · ");
}

function getSearchModeLabel(
  resultSet: SearchShelterResultSet,
  options: {
    resolvedAddressLabel: string | null;
    hasInvalidCoordinates: boolean;
    geocodingResult: GeocodeResult | null;
  },
) {
  if (options.resolvedAddressLabel) {
    return "Address resolved";
  }

  if (resultSet.searchMode === "combined") {
    return "Text + distance";
  }

  if (resultSet.searchMode === "location") {
    return "Distance";
  }

  if (options.geocodingResult?.status === "ambiguous") {
    return "Text fallback";
  }

  if (options.geocodingResult?.status === "no_match") {
    return "Text fallback";
  }

  if (options.geocodingResult?.status === "provider_error") {
    return "Text fallback";
  }

  if (options.hasInvalidCoordinates) {
    return "Text fallback";
  }

  return "Text";
}

export async function SearchPage({ searchParams }: SearchPageProps) {
  const normalized = normalizeSearchParams(searchParams);
  const hasFallbackSearch =
    Boolean(normalized.query || normalized.municipalitySlug || normalized.coordinates);
  let geocodingResult: GeocodeResult | null = null;

  if (!normalized.hasSearchIntent) {
    return (
      <div className="bg-[#090b0f] text-[#f7efe6]">
        <PageShell className="space-y-10 py-10 sm:space-y-12 sm:py-14">
          <div className="mx-auto max-w-4xl space-y-8">
            <PublicPageIntro
              title="Search shelters."
              description="Address, area, postcode, or current location."
            />
            <PublicSurface className="border-white/10 bg-[#10141b] p-5 sm:p-7">
              <SearchForm defaultQuery={normalized.query} municipalitySlug={normalized.municipalitySlug} />
            </PublicSurface>
            <SearchEmptyState />
          </div>
        </PageShell>
      </div>
    );
  }

  if (normalized.hasInvalidCoordinates && !hasFallbackSearch) {
    return (
      <div className="bg-[#090b0f] text-[#f7efe6]">
        <PageShell className="space-y-10 py-10 sm:space-y-12 sm:py-14">
          <div className="mx-auto max-w-4xl space-y-8">
            <PublicPageIntro
              title="Location search could not be started."
              description="Start a new search."
            />
            <PublicSurface className="border-white/10 bg-[#10141b] p-5 sm:p-7">
              <SearchForm defaultQuery={normalized.query} municipalitySlug={normalized.municipalitySlug} />
            </PublicSurface>
            <SearchNoResults
              isMunicipalityFilterInvalid={false}
              municipalityName={null}
              query={null}
              hasInvalidCoordinates
            />
          </div>
        </PageShell>
      </div>
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

  const summary = getSearchSummary(resultSet, {
    displayQuery: normalized.query,
    resolvedAddressLabel,
  });

  return (
    <div className="bg-[#090b0f] text-[#f7efe6]">
      <PageShell className="space-y-8 py-10 sm:space-y-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="space-y-6">
            <PublicPageIntro
              title={`${resultSet.results.length} shelter${resultSet.results.length === 1 ? "" : "s"}`}
              description={summary || "Search by address, area, postcode, municipality, or current location."}
              meta={
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#b9a995]">
                  <Badge className="bg-[#ff7a1a] text-[#1a1009] hover:bg-[#ff8b36]" variant="secondary">
                    {getSearchModeLabel(resultSet, {
                      resolvedAddressLabel,
                      hasInvalidCoordinates: normalized.hasInvalidCoordinates,
                      geocodingResult,
                    })}
                  </Badge>
                  {resultSet.isMunicipalityFilterInvalid ? <span>Unknown municipality filter</span> : null}
                  {resultSet.searchMode !== "text" && !resultSet.hasNearbyResults ? (
                    <span>No shelters within {resultSet.nearbyRadiusKm} km</span>
                  ) : null}
                </div>
              }
            />
            <PublicSurface className="border-white/10 bg-[#10141b] p-4 sm:p-5">
              <SearchForm
                defaultQuery={normalized.query}
                municipalitySlug={resultSet.municipalitySlug}
                latitude={resolvedAddressLabel ? null : resultSet.coordinates?.latitude ?? null}
                longitude={resolvedAddressLabel ? null : resultSet.coordinates?.longitude ?? null}
              />
            </PublicSurface>
          </div>

          <DataStrip
            className="h-fit"
            items={[
              {
                label: "Mode",
                value: getSearchModeLabel(resultSet, {
                  resolvedAddressLabel,
                  hasInvalidCoordinates: normalized.hasInvalidCoordinates,
                  geocodingResult,
                }),
              },
              {
                label: "Mapped",
                value: `${resultSet.results.filter((result) => result.latitude !== null && result.longitude !== null).length} with coordinates`,
              },
              {
                label: "Municipality",
                value: resultSet.municipalityName ?? "All",
              },
            ]}
          />
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
      </PageShell>
    </div>
  );
}
