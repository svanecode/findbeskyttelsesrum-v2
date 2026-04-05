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
              <p className="shrink-0 text-sm font-medium text-muted-foreground">{distanceLabel}</p>
            ) : null}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <p className="min-w-0 truncate text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground">
              {displayTitle}
            </p>
            <p className="shrink-0 text-sm text-muted-foreground">{result.city}</p>
            {result.capacity > 0 ? (
              <p className="shrink-0 text-sm text-muted-foreground">· {result.capacity} pladser</p>
            ) : null}
            {distanceLabel ? (
              <p className="ml-auto shrink-0 text-sm font-medium text-muted-foreground">{distanceLabel}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:hidden">
            <span>{result.city}</span>
            {result.capacity > 0 ? <span>· {result.capacity} pladser</span> : null}
          </div>
        </div>
      </Link>
    </div>
  );
}
