import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchEmptyStateProps = {
  hasLocationPlaceholder: boolean;
};

export function SearchEmptyState({ hasLocationPlaceholder }: SearchEmptyStateProps) {
  return (
    <Card className="border border-dashed border-border/80 bg-card/90">
      <CardHeader className="gap-3">
        <Badge variant="secondary">Start with a search</Badge>
        <CardTitle>Search for an address, area, or municipality.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Use the search field to find shelters by address, city, postcode, or a municipality page
          filter.
        </p>
        {hasLocationPlaceholder ? (
          <p>
            A location-based search request was received, but coordinate search is not wired yet in
            this first search slice. Try a text query instead.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/find?q=Copenhagen" />} variant="outline">
            Try Copenhagen
          </Button>
          <Button render={<Link href="/kommune/kobenhavn" />} variant="ghost">
            Browse Copenhagen municipality
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
