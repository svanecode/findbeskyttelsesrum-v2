import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import type { FeaturedShelter } from "@/lib/supabase/queries";

import { AddressSearchForm } from "./address-search-form";

type HomePageProps = {
  featuredShelters: FeaturedShelter[];
};

export function HomePage({ featuredShelters }: HomePageProps) {
  const primaryShelter = featuredShelters[0] ?? null;
  const statusBadgeClass =
    primaryShelter?.status === "active"
      ? "w-fit bg-[var(--status-active-bg)] text-[var(--status-active)] hover:bg-[var(--status-active-bg)]"
      : primaryShelter?.status === "under_review"
        ? "w-fit bg-[var(--status-under-review-bg)] text-[var(--status-under-review)] hover:bg-[var(--status-under-review-bg)]"
        : "w-fit bg-[var(--status-closed-bg)] text-[var(--status-closed)] hover:bg-[var(--status-closed-bg)]";

  return (
    <div className="bg-background text-foreground">
      <section
        className="border-b border-border"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <PageShell className="flex min-h-[calc(100vh-4.5rem)] items-center py-14 sm:py-18" variant="default">
          <div className="page-hero mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <div className="space-y-5">
              <h1 className="display-serif">Find det nærmeste beskyttelsesrum.</h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Søg på adresse eller brug din aktuelle placering. Kilde og dato vises på hvert
                resultat.
              </p>
            </div>

            <div className="mt-10 w-full max-w-3xl">
              <AddressSearchForm />
            </div>

            <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[0.72rem] tracking-[0.14em] text-muted-foreground uppercase sm:text-[0.78rem]">
              <span>BBR + DAR officielle data</span>
              <span aria-hidden="true">›</span>
              <span>Opdateres dagligt</span>
              <span aria-hidden="true">›</span>
              <span>~3,4 mio. registrerede pladser</span>
            </p>
          </div>
        </PageShell>
      </section>

      {primaryShelter ? (
        <section className="py-14 sm:py-18">
          <PageShell variant="default">
            <div className="space-y-6 border border-border bg-card px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-8 sm:py-8">
              <p className="font-mono text-[0.72rem] tracking-[0.14em] text-muted-foreground uppercase">
                Nyligt verificeret beskyttelsesrum
              </p>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-3xl leading-tight text-foreground sm:text-4xl">
                      {primaryShelter.addressLine1}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {primaryShelter.municipality.name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-mono text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
                      {primaryShelter.capacity}
                    </p>
                    <p className="text-sm text-muted-foreground">pladser</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                  <Badge className={statusBadgeClass}>
                    {primaryShelter.statusLabel}
                  </Badge>
                  <div className="space-y-1 text-sm leading-6 text-muted-foreground">
                    <p>{primaryShelter.primarySourceName ?? "Kilde afventer"}</p>
                    <p>{primaryShelter.lastVerifiedLabel ?? "Verificeringsdato ikke angivet"}</p>
                  </div>
                  <Link
                    className="inline-block text-sm text-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-primary"
                    href={`/beskyttelsesrum/${primaryShelter.slug}`}
                  >
                    Åbn beskyttelsesrum →
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
                <Link
                  className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
                  href="/find?q=Kobenhavn"
                >
                  Udforsk København
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
        </section>
      ) : null}
    </div>
  );
}
