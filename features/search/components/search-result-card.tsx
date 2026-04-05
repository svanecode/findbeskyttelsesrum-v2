"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";

import { formatDistanceLabel } from "@/lib/location/distance";
import { cn } from "@/lib/utils";
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
  const distanceClassName =
    result.distanceKm !== null && result.distanceKm < 0.5
      ? "text-primary"
      : result.distanceKm !== null && result.distanceKm < 2
        ? "text-foreground"
        : "text-muted-foreground";
  const displayTitle =
    result.name.startsWith("Shelter at ") || result.name.startsWith("Beskyttelsesrum ved ")
      ? result.addressLine1
      : result.name;

  return (
    <div
      className={cn(
        "relative border border-border bg-card text-foreground transition-colors",
        isSelected && "bg-muted",
      )}
      style={{ borderLeftColor: "var(--border)", borderLeftWidth: "3px" }}
    >
      {onSelect ? (
        <button
          aria-label={`Vis ${result.addressLine1} på kort`}
          className="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => onSelect(result.id)}
          type="button"
        >
          <MapPinned className="size-4" />
        </button>
      ) : null}
      <Link
        className="block px-4 py-4 pr-12 sm:px-5"
        href={`/beskyttelsesrum/${result.slug}`}
        onClick={() => onSelect?.(result.id)}
      >
        <div className="space-y-2 sm:space-y-0">
          <div className="flex items-start justify-between gap-4 sm:hidden">
            <div className="min-w-0">
              <p className="truncate text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground">
                {displayTitle}
              </p>
            </div>
            {distanceLabel ? (
              <p className={`shrink-0 font-mono text-base font-semibold ${distanceClassName}`}>
                {distanceLabel}
              </p>
            ) : null}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <p className="min-w-0 truncate text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground">
              {displayTitle}
            </p>
            {distanceLabel ? (
              <p className={`ml-auto shrink-0 font-mono text-base font-semibold ${distanceClassName}`}>
                {distanceLabel}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{result.city}</span>
            {result.capacity > 0 ? <span>· {result.capacity} pladser</span> : null}
          </div>
        </div>
      </Link>
    </div>
  );
}
