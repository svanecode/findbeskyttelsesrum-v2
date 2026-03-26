import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { getBbrUsageLabel } from "@/lib/bbr-usage-codes";
import type { ShelterDetail } from "@/lib/supabase/queries";

import { ShelterDetailMap } from "./shelter-detail-map-dynamic";
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
  const mapsUrl =
    shelter.latitude !== null && shelter.longitude !== null
      ? `https://maps.google.com/?q=${shelter.latitude},${shelter.longitude}`
      : null;
  const nearbySearchUrl = buildNearbySearchUrl(shelter);
  const buildingType = getBbrUsageLabel(shelter.bbrUsageCode);
  const shortReference = shelter.primarySourceReference
    ? shelter.primarySourceReference.slice(-8)
    : null;

  return (
    <div className="bg-background text-foreground">
      <PageShell className="py-10 sm:py-14" variant="narrow">
        <div className="mx-auto max-w-2xl space-y-10 lg:max-w-none">
          <section className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {shelter.municipality.slug !== "unknown" ? (
                  <Link
                    className="transition-colors hover:text-foreground"
                    href={`/kommune/${shelter.municipality.slug}`}
                  >
                    {shelter.municipality.name}
                  </Link>
                ) : (
                  <span>{shelter.municipality.name}</span>
                )}
                <span aria-hidden="true">›</span>
                <span>{shelter.addressLine1}</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-[family-name:var(--font-instrument-serif)] text-[2.2rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[2.7rem]">
                  {shelter.addressLine1 || shelter.name || "Shelter record"}
                </h1>
                <p className="font-mono text-sm text-muted-foreground">
                  {shelter.postalCode} {shelter.city}
                </p>
              </div>

            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] lg:items-start">
            <main className="space-y-6 border border-border bg-card p-6 sm:p-8">
              <dl className="space-y-6">
                <div className="space-y-2">
                  <dt className="text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase">
                    Kapacitet
                  </dt>
                  <dd className="font-mono text-[1.4rem] text-foreground">{shelter.capacity} pladser</dd>
                </div>

                {buildingType ? (
                  <div className="space-y-2">
                    <dt className="text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase">
                      Bygningstype
                    </dt>
                    <dd className="text-base text-foreground">{buildingType}</dd>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <dt className="text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase">
                    Adresse
                  </dt>
                  <dd className="space-y-1">
                    <p className="text-base text-foreground">{shelter.addressLine1}</p>
                    <p className="text-base text-foreground">
                      {shelter.postalCode} {shelter.city}, {shelter.municipality.name}
                    </p>
                  </dd>
                </div>
              </dl>
            </main>

            <aside className="space-y-6">
              {shelter.latitude !== null && shelter.longitude !== null ? (
                <section className="space-y-3">
                  <ShelterDetailMap latitude={shelter.latitude} longitude={shelter.longitude} />
                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                    {mapsUrl ? (
                      <a
                        className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
                        href={mapsUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open in maps
                      </a>
                    ) : null}
                    {nearbySearchUrl ? (
                      <Link
                        className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
                        href={nearbySearchUrl}
                      >
                        Shelters nearby
                      </Link>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <div className="space-y-4">
                <Link
                  className="inline-block text-sm text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
                  href="/find"
                >
                  Back to search
                </Link>
                <ReportIssueForm shelterId={shelter.id} shelterName={shelter.name} />
              </div>
            </aside>
          </div>

          <p className="text-center font-mono text-[0.72rem] text-muted-foreground">
            Data: BBR · Importeret {shelter.lastImportedLabel ?? "Ikke angivet"}
            {shortReference ? ` · ${shortReference}` : ""}
          </p>
        </div>
      </PageShell>
    </div>
  );
}
