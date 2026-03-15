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
          <Badge variant="secondary">{resultSet.results.length} results</Badge>
          {mappedCount > 0 ? <Badge variant="outline">{mappedCount} on map</Badge> : null}
        </div>
        <div className="inline-flex rounded-full border border-border/70 bg-card p-1">
          <Button
            className="rounded-full"
            onClick={() => setViewMode("list")}
            size="sm"
            type="button"
            variant={viewMode === "list" ? "secondary" : "ghost"}
          >
            List
          </Button>
          <Button
            className="rounded-full"
            onClick={() => setViewMode("map")}
            size="sm"
            type="button"
            variant={viewMode === "map" ? "secondary" : "ghost"}
          >
            Map
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)] lg:items-start">
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
