import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SearchShelterResult } from "@/lib/supabase/queries";

type SearchResultCardProps = {
  result: SearchShelterResult;
};

export function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{result.statusLabel}</Badge>
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
        <p className="text-sm text-muted-foreground">{result.capacity} people</p>
        <Button render={<Link href={`/beskyttelsesrum/${result.slug}`} />} variant="link">
          Open shelter
          <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
