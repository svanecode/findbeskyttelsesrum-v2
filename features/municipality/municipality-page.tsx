import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import type { MunicipalityDetail } from "@/lib/supabase/queries";

import { MunicipalityEmptyState } from "./components/municipality-empty-state";
import { MunicipalityShelterCard } from "./components/municipality-shelter-card";

type MunicipalityPageProps = {
  municipality: MunicipalityDetail;
};

export function MunicipalityPage({ municipality }: MunicipalityPageProps) {
  const summary = `${municipality.shelterCount} offentlige beskyttelsesrumsregistreringer`;

  return (
    <PageShell className="py-10 sm:py-14" variant="default">
      <div className="space-y-8">
        <section className="space-y-5">
          <p className="font-mono text-[0.72rem] tracking-[0.14em] text-muted-foreground uppercase">
            KOMMUNE
          </p>
          <div className="space-y-3">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-[2.4rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[3.2rem]">
              {municipality.name}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
            {municipality.description ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {municipality.description}
              </p>
            ) : null}
          </div>
          <div className="border-b border-border" />
        </section>

        <div className="sticky top-[57px] z-10 border-y border-border bg-background/95 py-3 backdrop-blur-[2px]">
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="font-mono text-muted-foreground">
              {municipality.shelterCount} beskyttelsesrum
            </p>
            <Link
              className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
              href="/find"
            >
              Tilbage til søgning
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          {municipality.hasShelters ? (
            <ul className="border-t border-border">
              {municipality.shelters.map((shelter) => (
                <li key={shelter.id} className="border-b border-border">
                  <MunicipalityShelterCard shelter={shelter} />
                </li>
              ))}
            </ul>
          ) : (
            <MunicipalityEmptyState />
          )}
        </section>

        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 text-sm">
          <Link
            className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="/find"
          >
            Tilbage til søgning
          </Link>
          <Link
            className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            href="/om-data"
          >
            Om data
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
