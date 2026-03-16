"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceLabel } from "@/lib/location/distance";
import type { SearchShelterResult } from "@/lib/supabase/queries";

type SearchResultCardProps = {
  result: SearchShelterResult;
  isSelected?: boolean;
  onSelect?: (resultId: string) => void;
};

export function SearchResultCard({
  result,
  isSelected = false,
  onSelect,
}: SearchResultCardProps) {
  const distanceLabel = formatDistanceLabel(result.distanceKm);

  return (
    <Card
      className={`border bg-card/95 transition-colors ${isSelected ? "border-primary/60 ring-1 ring-primary/20" : "border-border/70"}`}
    >
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{result.statusLabel}</Badge>
          {distanceLabel ? <Badge variant="outline">{distanceLabel}</Badge> : null}
          {result.dataQualityScore !== null ? (
            <Badge variant="secondary">Quality {result.dataQualityScore}/100</Badge>
          ) : (
            <Badge variant="secondary">Quality pending</Badge>
          )}
        </div>
        <div className="space-y-1">
          <CardTitle>{result.name || "Unnamed shelter record"}</CardTitle>
          <CardDescription>
            {result.addressLine1}, {result.postalCode} {result.city}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Municipality</p>
            <p>{result.municipality.name}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Primary source</p>
            <p>{result.primarySourceName ?? "Source still being connected"}</p>
          </div>
        </div>
        <p className="leading-6">{result.summary}</p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <button
          className="text-left text-sm text-muted-foreground"
          onClick={() => onSelect?.(result.id)}
          type="button"
        >
          {result.capacity} people
        </button>
        <div className="flex items-center gap-2">
          {onSelect ? (
            <Button onClick={() => onSelect(result.id)} type="button" variant="ghost">
              Show on map
            </Button>
          ) : null}
          <Link className={buttonVariants({ variant: "link" })} href={`/beskyttelsesrum/${result.slug}`}>
            Open shelter
            <ArrowRight />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
