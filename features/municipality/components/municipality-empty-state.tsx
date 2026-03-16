import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MunicipalityEmptyState() {
  return (
    <Card className="border border-dashed border-border/80 bg-card/90">
      <CardHeader>
        <CardTitle>No public shelters are listed yet.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          This municipality page exists so the area can still be discovered and linked, even when
          the public shelter list has not been connected yet.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants({ variant: "outline" })} href="/find">
            Back to search
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href="/om-data">
            Read about the data
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
