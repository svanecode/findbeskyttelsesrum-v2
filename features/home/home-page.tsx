import Link from "next/link";
import { ArrowRight, Database, MapPinned, ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeaturedShelter } from "@/lib/supabase/queries";

import { AddressSearchForm } from "./address-search-form";

type HomePageProps = {
  featuredShelters: FeaturedShelter[];
};

const trustPillars = [
  {
    icon: ShieldCheck,
    title: "Clear status",
    body: "Shelter pages should explain whether a record is active, under review, or temporarily unavailable.",
  },
  {
    icon: Database,
    title: "Visible source trail",
    body: "Source provenance is treated as product content, not hidden implementation detail.",
  },
  {
    icon: MapPinned,
    title: "Municipality context",
    body: "Municipality pages are part of the core information architecture from the start.",
  },
];

export function HomePage({ featuredShelters }: HomePageProps) {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.9),_transparent_50%),linear-gradient(180deg,_#fcfcfa_0%,_#f6f4ef_42%,_#ffffff_100%)]">
      <PageShell className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <section className="space-y-6">
            <Badge variant="secondary">Public utility baseline</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Find nearby shelters with clear source and municipality context.
              </h1>
              <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                Findbeskyttelsesrum v2 is being rebuilt to feel calm, fast, and trustworthy on
                mobile first. This first baseline focuses on the search entry point, public shelter
                records, and transparent data structure.
              </p>
            </div>
            <AddressSearchForm />
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Shelter data may be incomplete or change over time. Always verify important details on
              the shelter page and review the listed source information.
            </p>
          </section>

          <Card className="border border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>What this baseline already proves</CardTitle>
              <CardDescription>
                The product foundation is wired for real Supabase-backed content, thin routes, and
                clear separation between public records and import concerns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trustPillars.map((pillar) => {
                const Icon = pillar.icon;

                return (
                  <div key={pillar.title} className="flex gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{pillar.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{pillar.body}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </PageShell>

      <section className="border-y border-border/70 bg-background/80 py-12 sm:py-16">
        <PageShell className="space-y-8">
          <SectionHeading
            eyebrow="Featured shelters"
            title="Featured public shelter records"
            description="The homepage reads a small featured list from app_v2 so the public runtime can surface trusted records when imported data is ready."
          />
          <div className="grid gap-4">
            {featuredShelters.length > 0 ? (
              featuredShelters.map((shelter) => (
                <Card key={shelter.id} className="border border-border/70 bg-card/95">
                  <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <Badge variant="outline">{shelter.statusLabel}</Badge>
                      <div className="space-y-1">
                        <CardTitle>{shelter.name}</CardTitle>
                        <CardDescription>
                          {shelter.addressLine1}, {shelter.postalCode} {shelter.city}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p>{shelter.municipality.name}</p>
                      <p>{shelter.capacity} people</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">{shelter.summary}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>Source: {shelter.primarySourceName ?? "Not connected yet"}</span>
                      <span>Verified: {shelter.lastVerifiedLabel ?? "Unknown"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between gap-3">
                    <Link
                      className={buttonVariants({ variant: "link" })}
                      href={`/beskyttelsesrum/${shelter.slug}`}
                    >
                      View shelter
                      <ArrowRight />
                    </Link>
                    <Link
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                      href={`/kommune/${shelter.municipality.slug}`}
                    >
                      Municipality page
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="border border-dashed border-border/80 bg-card/90">
                <CardHeader>
                  <CardTitle>No featured shelters available yet</CardTitle>
                  <CardDescription>
                    Featured records will appear here once app_v2 contains imported shelters and at
                    least one record is marked for homepage display.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </PageShell>
      </section>
    </div>
  );
}
