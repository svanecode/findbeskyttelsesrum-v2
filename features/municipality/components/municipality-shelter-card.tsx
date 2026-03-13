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
import type { MunicipalityShelterListItem } from "@/lib/supabase/queries";

type MunicipalityShelterCardProps = {
  shelter: MunicipalityShelterListItem;
};

export function MunicipalityShelterCard({ shelter }: MunicipalityShelterCardProps) {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{shelter.statusLabel}</Badge>
          <Badge variant="secondary">
            {shelter.dataQualityScore !== null
              ? `Quality ${shelter.dataQualityScore}/100`
              : shelter.qualityState}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle>{shelter.name || "Unnamed shelter record"}</CardTitle>
          <CardDescription>
            {shelter.addressLine1}, {shelter.postalCode} {shelter.city}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Primary source</p>
            <p>{shelter.primarySourceName ?? "Source still being connected"}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Capacity</p>
            <p>{shelter.capacity} people</p>
          </div>
        </div>
        <p className="leading-6">{shelter.summary}</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button render={<Link href={`/beskyttelsesrum/${shelter.slug}`} />} variant="link">
          Open shelter
          <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
