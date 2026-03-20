import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SearchEmptyState() {
  return (
    <Card className="border border-dashed border-border/80 bg-card py-0">
      <CardHeader className="gap-3">
        <CardTitle>Search for an address, area, or municipality.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants({ variant: "outline" })} href="/find?q=Copenhagen">
            Try Copenhagen
          </Link>
          <Link className={cn(buttonVariants({ variant: "ghost" }), "px-0")} href="/kommune/kobenhavn">
            Browse Copenhagen municipality
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
