"use client";

import dynamic from "next/dynamic";

import type { SearchShelterResult } from "@/lib/supabase/queries";

const SearchResultsMapLeaflet = dynamic(
  () => import("./search-results-map-leaflet").then((module) => module.SearchResultsMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border bg-muted p-6 text-sm leading-6 text-muted-foreground">
        Indlæser kort…
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
