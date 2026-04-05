"use client";

import { useState } from "react";

import type { SearchShelterResultSet } from "@/lib/supabase/queries";

import { SearchResultsList } from "./search-results-list";
import { SearchResultsMap } from "./search-results-map";

type SearchResultsExperienceProps = {
  resultSet: SearchShelterResultSet;
};

type ViewMode = "list" | "map";

export function SearchResultsExperience({ resultSet }: SearchResultsExperienceProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(
    resultSet.results[0]?.id ?? null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const activeSelectedResultId =
    resultSet.results.some((result) => result.id === selectedResultId)
      ? selectedResultId
      : resultSet.results[0]?.id ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-start gap-3 lg:hidden">
        <button
          className={viewMode === "list"
            ? "border-b border-foreground pb-2 text-sm text-foreground"
            : "border-b border-transparent pb-2 text-sm text-muted-foreground"}
          onClick={() => setViewMode("list")}
          type="button"
        >
          Liste
        </button>
        <span className="pb-2 text-sm text-muted-foreground">|</span>
        <button
          className={viewMode === "map"
            ? "border-b border-foreground pb-2 text-sm text-foreground"
            : "border-b border-transparent pb-2 text-sm text-muted-foreground"}
          onClick={() => setViewMode("map")}
          type="button"
        >
          Kort
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.74fr)] lg:items-start">
        <div className={viewMode === "map" ? "hidden lg:block" : "block"}>
          <SearchResultsList
            results={resultSet.results}
            selectedResultId={activeSelectedResultId}
            onSelectResult={setSelectedResultId}
          />
        </div>
        <div className={viewMode === "list" ? "hidden lg:block" : "block lg:sticky lg:top-24"}>
          <SearchResultsMap
            coordinates={resultSet.coordinates}
            onSelectResult={setSelectedResultId}
            results={resultSet.results}
            selectedResultId={activeSelectedResultId}
          />
        </div>
      </div>
    </div>
  );
}
