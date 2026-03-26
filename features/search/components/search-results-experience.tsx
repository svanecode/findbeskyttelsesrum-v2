"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const mappedCount = resultSet.results.filter(
    (result) => result.latitude !== null && result.longitude !== null,
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#ff7a1a] text-[#1a1009] hover:bg-[#ff8b36]" variant="secondary">
            {resultSet.results.length} results
          </Badge>
          {mappedCount > 0 ? <Badge className="border-white/10 text-[#b8a793]" variant="outline">{mappedCount} mapped</Badge> : null}
        </div>
        <div className="inline-flex rounded-2xl border border-white/10 bg-[#12151b] p-1">
          <Button
            className="rounded-xl text-[#d4c2ae] hover:bg-white/6 hover:text-[#fff5eb]"
            onClick={() => setViewMode("list")}
            size="sm"
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
          >
            List
          </Button>
          <Button
            className="rounded-xl text-[#d4c2ae] hover:bg-white/6 hover:text-[#fff5eb]"
            onClick={() => setViewMode("map")}
            size="sm"
            type="button"
            variant={viewMode === "map" ? "secondary" : "ghost"}
          >
            Map
          </Button>
        </div>
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
