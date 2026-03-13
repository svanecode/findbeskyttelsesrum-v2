import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  searchShelters,
  type SearchShelterResultSet,
} from "@/lib/supabase/queries";

import { SearchEmptyState } from "./components/search-empty-state";
import { SearchForm } from "./components/search-form";
import { SearchNoResults } from "./components/search-no-results";
import { SearchResultsList } from "./components/search-results-list";
import { normalizeSearchParams, type SearchPageParams } from "./lib/search-params";

type SearchPageProps = {
  searchParams: SearchPageParams;
};

function getSearchSummary(resultSet: SearchShelterResultSet) {
  const parts = [];

  if (resultSet.query) {
    parts.push(`Query: "${resultSet.query}"`);
  }

  if (resultSet.municipalityName) {
    parts.push(`Municipality: ${resultSet.municipalityName}`);
  }

  if (parts.length === 0) {
    return "Search by address, area, postcode, or municipality.";
  }

  return parts.join(" • ");
}

export async function SearchPage({ searchParams }: SearchPageProps) {
  const normalized = normalizeSearchParams(searchParams);

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
          <SearchEmptyState hasLocationPlaceholder={normalized.hasLocationPlaceholder} />
        </div>
      </PageShell>
    );
  }

  const resultSet = await searchShelters({
    query: normalized.query,
    municipalitySlug: normalized.municipalitySlug,
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
          <SearchForm defaultQuery={resultSet.query} municipalitySlug={resultSet.municipalitySlug} />
          <Card className="border border-border/70 bg-card/90">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{resultSet.results.length} results</Badge>
                {resultSet.isMunicipalityFilterInvalid ? (
                  <Badge variant="outline">Unknown municipality filter</Badge>
                ) : null}
              </div>
              <CardTitle>Search summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>{getSearchSummary(resultSet)}</p>
              <p>
                Search matches currently use a simple server-side text strategy across shelter name,
                address, city, postcode, and municipality, with optional municipality narrowing.
              </p>
            </CardContent>
          </Card>
        </div>

        {resultSet.results.length > 0 ? (
          <SearchResultsList results={resultSet.results} />
        ) : (
          <SearchNoResults
            isMunicipalityFilterInvalid={resultSet.isMunicipalityFilterInvalid}
            municipalityName={resultSet.municipalityName}
            query={resultSet.query}
          />
        )}
      </div>
    </PageShell>
  );
}
