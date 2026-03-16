"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceLabel } from "@/lib/location/distance";
import type { SearchShelterResult } from "@/lib/supabase/queries";

type SearchResultsMapLeafletProps = {
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  results: SearchShelterResult[];
  selectedResultId: string | null;
  onSelectResult: (resultId: string) => void;
};

function MapViewport({
  center,
  points,
}: {
  center: LatLngTuple;
  points: LatLngTuple[];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(center, 7);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }

    map.fitBounds(points, {
      padding: [32, 32],
    });
  }, [center, map, points]);

  return null;
}

export function SearchResultsMapLeaflet({
  coordinates,
  results,
  selectedResultId,
  onSelectResult,
}: SearchResultsMapLeafletProps) {
  const mappedResults = useMemo(
    () =>
      results.filter(
        (result): result is SearchShelterResult & { latitude: number; longitude: number } =>
          result.latitude !== null && result.longitude !== null,
      ),
    [results],
  );

  const mapCenter = useMemo<LatLngTuple>(() => {
    if (coordinates) {
      return [coordinates.latitude, coordinates.longitude];
    }

    if (mappedResults.length > 0) {
      return [mappedResults[0].latitude, mappedResults[0].longitude];
    }

    return [56.2639, 9.5018];
  }, [coordinates, mappedResults]);

  const mapPoints = useMemo<LatLngTuple[]>(
    () => mappedResults.map((result) => [result.latitude, result.longitude]),
    [mappedResults],
  );

  if (mappedResults.length === 0) {
    return (
      <Card className="border border-dashed border-border/80 bg-card/90">
        <CardHeader className="gap-3">
          <Badge variant="secondary">Map unavailable</Badge>
          <CardTitle>No result coordinates available.</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          The current result set can still be reviewed in the list, but none of these shelters have
          public coordinates yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border/70 bg-card/95">
      <CardHeader className="gap-3 border-b border-border/70">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{mappedResults.length} markers</Badge>
          {results.length !== mappedResults.length ? (
            <Badge variant="outline">{results.length - mappedResults.length} without coordinates</Badge>
          ) : null}
        </div>
        <CardTitle>Map view</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[360px] w-full sm:h-[440px] lg:h-[620px]">
          <MapContainer
            center={mapCenter as LatLngExpression}
            className="search-results-map h-full w-full"
            scrollWheelZoom
            zoom={12}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewport
              center={mapCenter}
              points={coordinates ? [mapCenter, ...mapPoints] : mapPoints}
            />
            {coordinates ? (
              <CircleMarker
                center={[coordinates.latitude, coordinates.longitude]}
                pathOptions={{
                  color: "#27566e",
                  fillColor: "#27566e",
                  fillOpacity: 0.2,
                  weight: 2,
                }}
                radius={10}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Search location</p>
                    <p>
                      {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ) : null}
            {mappedResults.map((result) => {
              const isSelected = result.id === selectedResultId;

              return (
                <CircleMarker
                  key={result.id}
                  center={[result.latitude, result.longitude]}
                  eventHandlers={{
                    click: () => onSelectResult(result.id),
                  }}
                  pathOptions={{
                    color: isSelected ? "#133746" : "#27566e",
                    fillColor: isSelected ? "#133746" : "#5f8ba1",
                    fillOpacity: isSelected ? 0.95 : 0.75,
                    weight: isSelected ? 3 : 2,
                  }}
                  radius={isSelected ? 9 : 7}
                >
                  <Popup>
                    <div className="space-y-3 text-sm">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {result.name || "Unnamed shelter record"}
                        </p>
                        <p className="text-muted-foreground">
                          {result.addressLine1}, {result.postalCode} {result.city}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{result.statusLabel}</Badge>
                        {result.distanceKm !== null ? (
                          <Badge variant="outline">{formatDistanceLabel(result.distanceKm)}</Badge>
                        ) : null}
                      </div>
                      <Link
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                        href={`/beskyttelsesrum/${result.slug}`}
                      >
                        Open shelter
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
