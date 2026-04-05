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
  className?: string;
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
  className,
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
      <Card className="border border-dashed border-border bg-card text-foreground">
        <CardHeader className="gap-3">
          <Badge className="bg-primary text-primary-foreground" variant="secondary">
            Kort utilgængeligt
          </Badge>
          <CardTitle className="text-foreground">Ingen koordinater er tilgængelige for resultaterne.</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Resultaterne kan stadig gennemgås i listen, men ingen af disse beskyttelsesrum har
          offentlige koordinater endnu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border bg-card text-foreground">
      <CardHeader className="gap-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-primary-foreground" variant="secondary">
            {mappedResults.length} markører
          </Badge>
          {results.length !== mappedResults.length ? (
            <Badge className="border-border text-muted-foreground" variant="outline">
              {results.length - mappedResults.length} uden koordinater
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-foreground">Kort</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={className ?? "h-[360px] w-full sm:h-[440px] lg:h-[620px]"}>
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
                  color: "#ff7a1a",
                  fillColor: "#ff7a1a",
                  fillOpacity: 0.16,
                  weight: 2,
                }}
                radius={10}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Søgeplacering</p>
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
                    color: isSelected ? "#ffb06d" : "#ff7a1a",
                    fillColor: isSelected ? "#ffb06d" : "#ff7a1a",
                    fillOpacity: isSelected ? 0.96 : 0.72,
                    weight: isSelected ? 3 : 2,
                  }}
                  radius={isSelected ? 9 : 7}
                >
                  <Popup>
                    <div className="space-y-3 text-sm">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {result.name || "Beskyttelsesrum uden navn"}
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
                      <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/beskyttelsesrum/${result.slug}`}>
                        Åbn beskyttelsesrum
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
