import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MunicipalityDetail } from "@/lib/supabase/queries";

import { MunicipalityEmptyState } from "./components/municipality-empty-state";
import { MunicipalityShelterCard } from "./components/municipality-shelter-card";

type MunicipalityPageProps = {
  municipality: MunicipalityDetail;
};

function getMunicipalityIntro(municipality: MunicipalityDetail) {
  if (municipality.description) {
    return municipality.description;
  }

  return `${municipality.name} municipality currently has ${municipality.shelterCount} public shelter record${municipality.shelterCount === 1 ? "" : "s"} in Findbeskyttelsesrum v2. This page is designed to make local shelter navigation and source clarity easier without requiring a map view.`;
}

export function MunicipalityPage({ municipality }: MunicipalityPageProps) {
  return (
    <PageShell className="py-10 sm:py-14">
      <div className="space-y-8">
        <section className="space-y-5">
          <Badge variant="secondary">Municipality page</Badge>
          <SectionHeading
            eyebrow="Municipality"
            title={municipality.name}
            description={getMunicipalityIntro(municipality)}
          />
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{municipality.shelterCount} public shelters</span>
            <span>{municipality.hasShelters ? "Local list available below" : "Public list still limited"}</span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-4">
            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Municipality summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Public shelters
                  </p>
                  <p className="text-2xl font-semibold text-foreground">{municipality.shelterCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Page purpose
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Support municipality-level navigation and give users a trustworthy starting point
                    for local shelter records.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Related navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" render={<Link href="/find" />} variant="outline">
                  Back to search
                </Button>
                <Button className="w-full" render={<Link href="/om-data" />} variant="ghost">
                  About the data
                </Button>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Shelters in {municipality.name}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Each card shows the current public status, primary source connection, and the level
                of trust context currently available.
              </p>
            </div>

            {municipality.hasShelters ? (
              <div className="grid gap-4">
                {municipality.shelters.map((shelter) => (
                  <MunicipalityShelterCard key={shelter.id} shelter={shelter} />
                ))}
              </div>
            ) : (
              <MunicipalityEmptyState />
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
