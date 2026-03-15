"use client";

import dynamic from "next/dynamic";

import type { SearchShelterResult } from "@/lib/supabase/queries";

const SearchResultsMapLeaflet = dynamic(
  () => import("./search-results-map-leaflet").then((module) => module.SearchResultsMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-border/70 bg-card/95 p-6 text-sm leading-6 text-muted-foreground">
        Loading map...
      </div>
    ),
  },
);

type SearchResultsMapProps = {
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  results: SearchShelterResult[];
  selectedResultId: string | null;
  onSelectResult: (resultId: string) => void;
};

export function SearchResultsMap(props: SearchResultsMapProps) {
  return <SearchResultsMapLeaflet {...props} />;
}
