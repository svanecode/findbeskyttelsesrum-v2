import Link from "next/link";
import { ArrowUpRight, Compass, MapPinned } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShelterDetail } from "@/lib/supabase/queries";

import { createMapsUrl } from "./lib/maps";
import { ReportIssueForm } from "./report-issue-form";

type ShelterDetailPageProps = {
  shelter: ShelterDetail;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

export function ShelterDetailPage({ shelter }: ShelterDetailPageProps) {
  const mapsUrl = createMapsUrl(shelter.latitude, shelter.longitude, shelter.name);

  return (
    <PageShell className="py-10 sm:py-14">
      <div className="space-y-8">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{shelter.statusLabel}</Badge>
            {shelter.dataQualityScore !== null ? (
              <Badge variant="outline">Quality {shelter.dataQualityScore}/100</Badge>
            ) : (
              <Badge variant="outline">{shelter.qualityState}</Badge>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {shelter.name || "Unnamed shelter record"}
            </h1>
            <p className="max-w-3xl text-pretty text-base leading-7 text-muted-foreground">
              {shelter.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>
              {shelter.addressLine1}, {shelter.postalCode} {shelter.city}
            </span>
            {shelter.municipality.slug !== "unknown" ? (
              <Link
                className="text-foreground underline underline-offset-4"
                href={`/kommune/${shelter.municipality.slug}`}
              >
                {shelter.municipality.name} municipality
              </Link>
            ) : (
              <span>{shelter.municipality.name}</span>
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Key facts</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <DetailItem label="Status" value={shelter.statusLabel} />
                <DetailItem label="Capacity" value={`${shelter.capacity} people`} />
                <DetailItem
                  label="Primary source"
                  value={shelter.primarySourceName ?? "Source still being connected"}
                />
                <DetailItem
                  label="Last verified"
                  value={shelter.lastVerifiedLabel ?? "No public verification date yet"}
                />
                <DetailItem
                  label="Last imported"
                  value={shelter.lastImportedLabel ?? "No public import timestamp yet"}
                />
                <DetailItem
                  label="Accessibility"
                  value={shelter.accessibilityNotes ?? "No accessibility notes yet"}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Source and trust</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>{shelter.sourceSummary}</p>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      {shelter.primarySourceName ?? "Primary source not connected yet"}
                    </p>
                    <p>{shelter.primarySourceTypeLabel ?? "Source type unavailable"}</p>
                    <p>{shelter.qualityState}</p>
                    {shelter.primarySourceReference ? (
                      <p>Reference: {shelter.primarySourceReference}</p>
                    ) : null}
                  </div>
                  {shelter.primarySourceUrl ? (
                    <a
                      className="mt-4 inline-flex items-center gap-2 text-foreground underline underline-offset-4"
                      href={shelter.primarySourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open primary source
                      <ArrowUpRight className="size-4" />
                    </a>
                  ) : null}
                </div>
                <p>
                  Public shelter data can be incomplete or become outdated. Important decisions
                  should be checked against the latest official source when possible.
                </p>
              </CardContent>
            </Card>

            {shelter.publicNotes ? (
              <Card className="border border-border/70 bg-card/95">
                <CardHeader>
                  <CardTitle>Public notes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  <p>{shelter.publicNotes}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPinned className="mt-1 size-4 shrink-0 text-foreground" />
                  <div className="space-y-1">
                    <p className="text-foreground">
                      {shelter.addressLine1}, {shelter.postalCode} {shelter.city}
                    </p>
                    {shelter.latitude !== null && shelter.longitude !== null ? (
                      <p>
                        Coordinates: {shelter.latitude.toFixed(6)}, {shelter.longitude.toFixed(6)}
                      </p>
                    ) : (
                      <p>Coordinates are not available for this public record yet.</p>
                    )}
                  </div>
                </div>
                {mapsUrl ? (
                  <a
                    className={buttonVariants({ variant: "outline" })}
                    href={mapsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Compass />
                    Open in maps
                  </a>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Help improve this record</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportIssueForm shelterId={shelter.id} shelterName={shelter.name} />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Related navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link className={buttonVariants({ className: "w-full", variant: "outline" })} href="/find">
                  Back to search
                </Link>
                {shelter.municipality.slug !== "unknown" ? (
                  <Link
                    className={buttonVariants({ className: "w-full", variant: "ghost" })}
                    href={`/kommune/${shelter.municipality.slug}`}
                  >
                    View municipality page
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Record coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  This page is a public record view. It is designed to show the current shelter
                  details, source context, and known gaps clearly rather than imply complete
                  certainty.
                </p>
                <p>
                  Richer source history, moderation tools, and map support can be added later
                  without changing the public route contract.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
