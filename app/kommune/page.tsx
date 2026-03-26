import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { getMunicipalitySummaries } from "@/lib/supabase/queries";

export const revalidate = 300;
export const metadata = {
  title: "Kommuneoversigt",
  description:
    "Oversigt over alle danske kommuner med registrerede beskyttelsesrum fra BBR.",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("da-DK").format(value);
}

export default async function Page() {
  const municipalities = await getMunicipalitySummaries();

  return (
    <PageShell className="py-10 sm:py-14" variant="default">
      <div className="space-y-8">
        <section className="space-y-5">
          <p className="font-mono text-[0.72rem] tracking-[0.14em] text-muted-foreground uppercase">
            Kommuner
          </p>
          <div className="space-y-3">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-[2.4rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[3.2rem]">
              Kommuneoversigt
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {formatCount(municipalities.length)} kommuner med registrerede beskyttelsesrum.
            </p>
          </div>
          <div className="border-b border-border" />
        </section>

        <section className="max-w-5xl">
          <ul className="border-t border-border">
            {municipalities.map((municipality) => (
              <li key={municipality.slug} className="border-b border-border">
                <Link
                  className="grid gap-3 px-1 py-4 transition-colors hover:bg-muted sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-2"
                  href={`/kommune/${municipality.slug}`}
                >
                  <span className="font-medium text-foreground">{municipality.name}</span>
                  <span className="text-left font-mono text-sm text-muted-foreground sm:text-right">
                    {formatCount(municipality.shelterCount)}
                  </span>
                  <span className="text-left font-mono text-sm text-muted-foreground sm:min-w-[10rem] sm:text-right">
                    {formatCount(municipality.totalCapacity)} pladser
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
