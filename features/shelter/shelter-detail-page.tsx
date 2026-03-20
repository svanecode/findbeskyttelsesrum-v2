import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";

import {
  DataStrip,
  MetadataItem,
  MetadataList,
  PublicPageIntro,
  PublicPanel,
  PublicSurface,
} from "@/components/shared/public-primitives";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { ShelterDetail } from "@/lib/supabase/queries";

import { createMapsUrl } from "./lib/maps";
import { ReportIssueForm } from "./report-issue-form";

type ShelterDetailPageProps = {
  shelter: ShelterDetail;
};

function buildNearbySearchUrl(shelter: ShelterDetail) {
  if (shelter.latitude === null || shelter.longitude === null) {
    return null;
  }

  const params = new URLSearchParams({
    lat: shelter.latitude.toString(),
    lng: shelter.longitude.toString(),
  });

  return `/find?${params.toString()}`;
}

export function ShelterDetailPage({ shelter }: ShelterDetailPageProps) {
  const mapsUrl = createMapsUrl(shelter.latitude, shelter.longitude, shelter.name);
  const nearbySearchUrl = buildNearbySearchUrl(shelter);
  const addressLabel = `${shelter.addressLine1}, ${shelter.postalCode} ${shelter.city}`;

  return (
    <PageShell className="space-y-10 py-10 sm:space-y-12 sm:py-14">
      <section className="space-y-8">
        <PublicPageIntro
          title={shelter.name || shelter.addressLine1 || "Shelter record"}
          description={addressLabel}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{shelter.statusLabel}</Badge>
              <span>{shelter.capacity} people</span>
              {shelter.municipality.slug !== "unknown" ? (
                <Link className="underline decoration-border underline-offset-4" href={`/kommune/${shelter.municipality.slug}`}>
                  {shelter.municipality.name}
                </Link>
              ) : (
                <span>{shelter.municipality.name}</span>
              )}
            </div>
          }
        />

        <DataStrip
          items={[
            {
              label: "Source",
              value: shelter.primarySourceName ?? "Source pending",
            },
            {
              label: "Verified",
              value: shelter.lastVerifiedLabel ?? "Not listed",
            },
            {
              label: "Imported",
              value: shelter.lastImportedLabel ?? "Not listed",
            },
          ]}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-8">
          <PublicPanel className="space-y-6">
            <p className="text-base leading-7 text-foreground">{shelter.summary}</p>

            <MetadataList className="gap-y-5">
              <MetadataItem label="Status" value={shelter.statusLabel} />
              <MetadataItem label="Capacity" value={`${shelter.capacity} people`} />
              <MetadataItem
                label="Accessibility"
                value={shelter.accessibilityNotes ?? "No accessibility notes published."}
              />
              <MetadataItem
                label="Reference"
                value={shelter.primarySourceReference ?? "No public reference listed."}
              />
            </MetadataList>

            {(shelter.publicNotes || shelter.sourceSummary) ? (
              <div className="space-y-4 border-t border-border/70 pt-5 text-sm leading-6 text-muted-foreground">
                {shelter.sourceSummary ? <p>{shelter.sourceSummary}</p> : null}
                {shelter.publicNotes ? <p>{shelter.publicNotes}</p> : null}
              </div>
            ) : null}

            {shelter.sources.length > 1 ? (
              <div className="space-y-3 border-t border-border/70 pt-5">
                {shelter.sources.slice(1).map((source) => (
                  <div key={source.id} className="flex flex-col gap-1 text-sm leading-6 text-muted-foreground sm:flex-row sm:justify-between sm:gap-4">
                    <p className="text-foreground">{source.sourceName}</p>
                    <p className="sm:text-right">
                      {source.sourceTypeLabel}
                      {source.lastVerifiedLabel ? ` · ${source.lastVerifiedLabel}` : ""}
                      {source.importedAtLabel ? ` · ${source.importedAtLabel}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {shelter.primarySourceUrl ? (
              <a
                className={cn(buttonVariants({ variant: "link" }), "px-0")}
                href={shelter.primarySourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open source
                <ArrowUpRight />
              </a>
            ) : null}
          </PublicPanel>

          <PublicSurface className="p-5 sm:p-6">
            <ReportIssueForm shelterId={shelter.id} shelterName={shelter.name} />
          </PublicSurface>
        </div>

        <aside className="space-y-4">
          <PublicPanel className="space-y-4">
            <div className="space-y-1 text-sm leading-6 text-muted-foreground">
              <p className="text-foreground">{addressLabel}</p>
              {shelter.latitude !== null && shelter.longitude !== null ? (
                <p>
                  {shelter.latitude.toFixed(6)}, {shelter.longitude.toFixed(6)}
                </p>
              ) : (
                <p>Coordinates not published.</p>
              )}
            </div>

            {mapsUrl ? (
              <a
                className={buttonVariants({ className: "w-full rounded-2xl", variant: "outline" })}
                href={mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                <Compass />
                Open in maps
              </a>
            ) : null}

            {nearbySearchUrl ? (
              <Link
                className={buttonVariants({ className: "w-full rounded-2xl", variant: "outline" })}
                href={nearbySearchUrl}
              >
                Nearby shelters
                <ArrowRight />
              </Link>
            ) : null}

            <Link className={cn(buttonVariants({ variant: "ghost" }), "px-0")} href="/find">
              Back to search
            </Link>
          </PublicPanel>
        </aside>
      </div>
    </PageShell>
  );
}
