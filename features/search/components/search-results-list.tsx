"use client";

import type { SearchShelterResult } from "@/lib/supabase/queries";

import { SearchResultCard } from "./search-result-card";

type SearchResultsListProps = {
  results: SearchShelterResult[];
  selectedResultId?: string | null;
  onSelectResult?: (resultId: string) => void;
};

export function SearchResultsList({
  results,
  selectedResultId = null,
  onSelectResult,
}: SearchResultsListProps) {
  return (
    <div className="grid gap-2.5">
      {results.map((result) => (
        <SearchResultCard
          key={result.id}
          isSelected={result.id === selectedResultId}
          onSelect={onSelectResult}
          result={result}
        />
      ))}
    </div>
  );
}
