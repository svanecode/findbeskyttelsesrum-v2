import Link from "next/link";

import { Button } from "@/components/ui/button";
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
          <Button render={<Link href="/find" />} variant="outline">
            Back to search
          </Button>
          <Button render={<Link href="/om-data" />} variant="ghost">
            Read about the data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
