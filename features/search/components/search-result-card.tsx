"use client";

import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const sourceLine = [
    result.primarySourceName,
    result.dataQualityScore !== null ? `Quality ${result.dataQualityScore}/100` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      className={cn(
        "border border-white/10 bg-[#12151b] py-0 text-[#f7efe6] shadow-none transition-colors",
        isSelected && "border-[#ff7a1a]/55 bg-[#151922]",
      )}
    >
      <CardHeader className="gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-[1.02rem] font-semibold tracking-[-0.03em] text-[#fff7ef]">
              {result.addressLine1}
            </CardTitle>
            <p className="text-sm leading-6 text-[#b8a793]">
              {result.postalCode} {result.city}
            </p>
          </div>
          {distanceLabel ? (
            <p className="shrink-0 text-sm font-medium text-[#ffad70]">{distanceLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[#b8a793]">
          <Badge className="bg-[#ff7a1a] text-[#1a1009] hover:bg-[#ff8b36]" variant="secondary">
            {result.statusLabel}
          </Badge>
          <span>{result.municipality.name}</span>
          {result.capacity > 0 ? <span>{result.capacity} people</span> : null}
        </div>

        {sourceLine ? <p className="text-sm leading-6 text-[#988773]">{sourceLine}</p> : null}
      </CardHeader>

      <CardFooter className="justify-between gap-3 border-t border-white/8 bg-transparent px-4 py-3 sm:px-5">
        {onSelect ? (
          <Button
            className="rounded-xl text-[#d4c2ae] hover:bg-white/6 hover:text-[#fff5eb]"
            onClick={() => onSelect(result.id)}
            type="button"
            variant="ghost"
          >
            <MapPinned />
            Map
          </Button>
        ) : (
          <span />
        )}
        <Link
          className={cn(buttonVariants({ variant: "link" }), "text-[#ff9c52] hover:text-[#ffb06d]")}
          href={`/beskyttelsesrum/${result.slug}`}
        >
          Open
          <ArrowRight />
        </Link>
      </CardFooter>
    </Card>
  );
}
