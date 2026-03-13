import type { SearchShelterResult } from "@/lib/supabase/queries";

import { SearchResultCard } from "./search-result-card";

type SearchResultsListProps = {
  results: SearchShelterResult[];
};

export function SearchResultsList({ results }: SearchResultsListProps) {
  return (
    <div className="grid gap-4">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}
