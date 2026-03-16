import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function SearchEmptyState() {
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
        <p>
          You can also share your current location from the homepage to sort nearby shelter records
          by distance.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants({ variant: "outline" })} href="/find?q=Copenhagen">
            Try Copenhagen
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/kommune/kobenhavn">
            Browse Copenhagen municipality
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
