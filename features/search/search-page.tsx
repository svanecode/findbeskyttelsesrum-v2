import { redirect } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { geocodeAddressQuery, type GeocodeResult } from "@/lib/geocoding/dawa";
import { searchShelters } from "@/lib/supabase/queries";

import { SearchEmptyState } from "./components/search-empty-state";
import { SearchForm } from "./components/search-form";
import { SearchNoResults } from "./components/search-no-results";
import { SearchResultsExperience } from "./components/search-results-experience";
import { normalizeSearchParams, type SearchPageParams } from "./lib/search-params";
import { buildFindUrl } from "./lib/search-url";

type SearchPageProps = {
  searchParams: SearchPageParams;
};

function SearchPageHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <section className="space-y-5">
      <p className="font-mono text-[0.72rem] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-[2.4rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[3.2rem]">
          {title}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

export async function SearchPage({ searchParams }: SearchPageProps) {
  const normalized = normalizeSearchParams(searchParams);
  const hasFallbackSearch =
    Boolean(normalized.query || normalized.municipalitySlug || normalized.coordinates);
  let geocodingResult: GeocodeResult | null = null;

  if (!normalized.hasSearchIntent) {
    return (
      <div className="bg-background text-foreground">
        <PageShell className="space-y-10 py-10 sm:space-y-12 sm:py-14" variant="wide">
          <div className="mx-auto max-w-4xl space-y-8">
            <SearchPageHeader
              label="Find"
              title="Find beskyttelsesrum."
              description="Adresse, område, postnummer eller aktuel placering."
            />
            <div className="border border-border bg-card p-5 sm:p-7">
              <SearchForm defaultQuery={normalized.query} municipalitySlug={normalized.municipalitySlug} />
            </div>
            <SearchEmptyState />
          </div>
        </PageShell>
      </div>
    );
  }

  if (normalized.hasInvalidCoordinates && !hasFallbackSearch) {
    return (
      <div className="bg-background text-foreground">
        <PageShell className="space-y-10 py-10 sm:space-y-12 sm:py-14" variant="wide">
          <div className="mx-auto max-w-4xl space-y-8">
            <SearchPageHeader
              label="Find"
              title="Placeringssøgning kunne ikke startes."
              description="Start en ny søgning."
            />
            <div className="border border-border bg-card p-5 sm:p-7">
              <SearchForm defaultQuery={normalized.query} municipalitySlug={normalized.municipalitySlug} />
            </div>
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

  const filterQuery =
    normalized.coordinates !== null && normalized.resolvedAddressLabel ? null : normalized.query;

  const resultSet = await searchShelters({
    query: filterQuery,
    municipalitySlug: normalized.municipalitySlug,
    latitude: normalized.coordinates?.latitude ?? null,
    longitude: normalized.coordinates?.longitude ?? null,
  });

  const mappedCount = resultSet.results.filter(
    (result) => result.latitude !== null && result.longitude !== null,
  ).length;
  const headerItems = [`Kortlagt: ${mappedCount}`];

  if (
    resultSet.municipalityName &&
    resultSet.municipalityName !== "All" &&
    resultSet.municipalitySlug !== null &&
    resultSet.municipalitySlug !== "all"
  ) {
    headerItems.push(resultSet.municipalityName);
  }

  return (
    <div className="bg-background text-foreground">
      <PageShell className="space-y-8 py-10 sm:space-y-10 sm:py-14" variant="wide">
        <div className="space-y-4">
          <div className="space-y-3 border-b border-border pb-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="font-mono text-3xl tracking-[-0.03em] text-foreground sm:text-4xl">
                  {resultSet.results.length} beskyttelsesrum
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {headerItems.map((item, index) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      {index > 0 ? <span aria-hidden="true">·</span> : null}
                      <span className="rounded-[2px] border border-border bg-card px-2 py-1">{item}</span>
                    </span>
                  ))}
                </div>
              </div>
              {resultSet.isMunicipalityFilterInvalid ? (
                <p className="text-sm leading-6 text-muted-foreground">Ukendt kommunefilter.</p>
              ) : null}
              {resultSet.searchMode !== "text" && !resultSet.hasNearbyResults ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Ingen resultater inden for {resultSet.nearbyRadiusKm} km.
                </p>
              ) : null}
            </div>

            <div className="border border-border bg-card p-5 sm:p-7">
              <SearchForm
                compact
                defaultQuery={normalized.query}
                municipalitySlug={resultSet.municipalitySlug}
                latitude={
                  normalized.coordinates !== null && normalized.resolvedAddressLabel
                    ? null
                    : resultSet.coordinates?.latitude ?? null
                }
                longitude={
                  normalized.coordinates !== null && normalized.resolvedAddressLabel
                    ? null
                    : resultSet.coordinates?.longitude ?? null
                }
              />
            </div>
          </div>
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
