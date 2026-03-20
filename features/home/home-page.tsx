import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  DataStrip,
  PublicPageIntro,
  PublicPanel,
  PublicSurface,
} from "@/components/shared/public-primitives";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import type { FeaturedShelter } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

import { AddressSearchForm } from "./address-search-form";

type HomePageProps = {
  featuredShelters: FeaturedShelter[];
};

export function HomePage({ featuredShelters }: HomePageProps) {
  const primaryShelter = featuredShelters[0] ?? null;

  return (
    <div className="bg-background">
      <PageShell className="space-y-12 py-10 sm:space-y-16 sm:py-14">
        <section className="mx-auto max-w-4xl space-y-8">
          <PublicPageIntro
            title="Find a nearby shelter."
            description="Search by address or use your current location."
            meta={
              <p className="text-sm leading-6 text-muted-foreground">
                Source and update date are shown on every shelter record.
              </p>
            }
          />

          <PublicSurface className="p-5 sm:p-8">
            <AddressSearchForm />
          </PublicSurface>

          <DataStrip
            items={[
              { label: "Coverage", value: "Shelters are shown with municipality context." },
              { label: "Source", value: "Each record points back to its public source." },
              { label: "Freshness", value: "Verification and import dates stay visible." },
            ]}
          />
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          {primaryShelter ? (
            <PublicPanel className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{primaryShelter.statusLabel}</Badge>
                <span className="text-sm text-muted-foreground">{primaryShelter.municipality.name}</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {primaryShelter.addressLine1}
                </h2>
                <p className="text-base leading-7 text-muted-foreground">
                  {primaryShelter.postalCode} {primaryShelter.city}
                </p>
              </div>
              <div className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-3">
                <p>{primaryShelter.capacity} people</p>
                <p>{primaryShelter.primarySourceName ?? "Source pending"}</p>
                <p>{primaryShelter.lastVerifiedLabel ?? "Update date unavailable"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  className={buttonVariants({ variant: "link" })}
                  href={`/beskyttelsesrum/${primaryShelter.slug}`}
                >
                  Open shelter
                  <ArrowRight />
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "ghost" }), "px-0 text-muted-foreground")}
                  href={`/kommune/${primaryShelter.municipality.slug}`}
                >
                  {primaryShelter.municipality.name}
                </Link>
              </div>
            </PublicPanel>
          ) : (
            <div className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Search first. Shelter pages show address, status, source, and the latest public
              update information.
            </div>
          )}

          <div className="space-y-4 text-sm leading-6">
            <Link className="block border-b border-border/70 pb-4 text-foreground" href="/find?q=Kobenhavn">
              Copenhagen search
            </Link>
            <Link className="block border-b border-border/70 pb-4 text-foreground" href="/om-data">
              About the data
            </Link>
          </div>
        </section>
      </PageShell>
    </div>
  );
}
