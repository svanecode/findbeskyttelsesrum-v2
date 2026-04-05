"use client";

import type { SearchShelterResultSet } from "@/lib/supabase/queries";

import { SearchResultsList } from "./search-results-list";
import { SearchResultsMap } from "./search-results-map";

type SearchResultsExperienceProps = {
  resultSet: SearchShelterResultSet;
};

export function SearchResultsExperience({ resultSet }: SearchResultsExperienceProps) {
  const activeSelectedResultId = resultSet.results[0]?.id ?? null;

  return (
    <div className="space-y-4">
      <div className="block lg:hidden">
        <SearchResultsMap
          className="h-[260px] w-full"
          coordinates={resultSet.coordinates}
          onSelectResult={() => {}}
          results={resultSet.results}
          selectedResultId={activeSelectedResultId}
        />
      </div>

      <div className="block lg:hidden">
        <SearchResultsList
          results={resultSet.results}
          selectedResultId={activeSelectedResultId}
        />
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.74fr)] lg:items-start">
        <div>
          <SearchResultsList
            results={resultSet.results}
            selectedResultId={activeSelectedResultId}
          />
        </div>
        <div className="lg:sticky lg:top-24">
          <SearchResultsMap
            coordinates={resultSet.coordinates}
            onSelectResult={() => {}}
            results={resultSet.results}
            selectedResultId={activeSelectedResultId}
          />
        </div>
      </div>
    </div>
  );
}
