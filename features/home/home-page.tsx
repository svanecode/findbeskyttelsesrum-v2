import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
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
    <div className="bg-[#090b0f] text-[#f7efe6]">
      <div className="bg-[radial-gradient(circle_at_top,_rgba(255,122,26,0.24),_transparent_40%),radial-gradient(circle_at_78%_18%,_rgba(255,153,67,0.1),_transparent_26%),linear-gradient(180deg,_#090b0f_0%,_#0a0c10_56%,_#0d1117_100%)] pb-20 sm:pb-28">
        <PageShell className="space-y-10 py-10 sm:space-y-14 sm:py-16">
          <section className="mx-auto max-w-5xl">
            <PublicSurface className="overflow-hidden border-[#f08a3c]/16 bg-[linear-gradient(180deg,rgba(20,24,31,0.98)_0%,rgba(15,18,24,0.98)_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.48)]">
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_0%,rgba(255,146,61,0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
                <div className="pointer-events-none absolute right-[-8%] bottom-[-10%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.12),transparent_68%)] blur-2xl" />
              </div>

              <div className="relative space-y-8 p-6 sm:space-y-10 sm:p-8 lg:p-12">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.46fr)] lg:items-end">
                  <div className="space-y-9">
                    <PublicPageIntro
                      className="space-y-7"
                      title="Find the nearest shelter fast."
                      description="Search by address or use your current location."
                      meta={
                        <p className="max-w-xl text-sm leading-6 text-[#bdaa97]">
                          Source and update date stay visible from search to detail.
                        </p>
                      }
                    />

                    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,17,0.98)_0%,rgba(7,9,12,0.98)_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.28)] sm:p-4">
                      <AddressSearchForm />
                    </div>
                  </div>

                  {primaryShelter ? (
                    <PublicPanel className="border-[#f08a3c]/12 bg-[linear-gradient(180deg,rgba(16,19,25,0.96)_0%,rgba(12,15,20,0.96)_100%)] p-5">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            className="bg-[#ff7a1a] text-[#1a1009] hover:bg-[#ff8b36]"
                            variant="secondary"
                          >
                            {primaryShelter.statusLabel}
                          </Badge>
                          <span className="text-sm text-[#bdaa97]">
                            {primaryShelter.municipality.name}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-lg font-semibold tracking-[-0.03em] text-[#fff6ec]">
                            {primaryShelter.addressLine1}
                          </p>
                          <p className="text-sm leading-6 text-[#bdaa97]">
                            {primaryShelter.postalCode} {primaryShelter.city}
                          </p>
                        </div>
                        <p className="text-sm leading-6 text-[#bdaa97]">
                          {primaryShelter.primarySourceName ?? "Source pending"}
                          {primaryShelter.lastVerifiedLabel
                            ? ` · ${primaryShelter.lastVerifiedLabel}`
                            : ""}
                        </p>
                        <Link
                          className={cn(
                            buttonVariants({ variant: "link" }),
                            "px-0 text-[#ff9c52] hover:text-[#ffb06d]",
                          )}
                          href={`/beskyttelsesrum/${primaryShelter.slug}`}
                        >
                          Open shelter
                          <ArrowRight />
                        </Link>
                      </div>
                    </PublicPanel>
                  ) : null}
                </div>

                <div className="grid gap-5 border-t border-white/7 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.38fr)] lg:items-center">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Source", value: "Linked on every shelter record" },
                      { label: "Status", value: "Visible without leaving the main journey" },
                      { label: "Freshness", value: "Verified and imported dates kept in view" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <p className="text-xs text-[#8f8171]">{item.label}</p>
                        <p className="text-sm leading-6 text-[#d3c3b0]">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm leading-6 text-[#bdaa97] lg:justify-end">
                    <Link
                      className="inline-flex items-center gap-2 text-[#f1e3d1] transition-colors hover:text-[#ffb06d]"
                      href="/find?q=Kobenhavn"
                    >
                      Copenhagen search
                      <ArrowRight className="size-4 text-[#ff8e42]" />
                    </Link>
                    <Link
                      className="inline-flex items-center gap-2 text-[#bdaa97] transition-colors hover:text-[#ffb06d]"
                      href="/om-data"
                    >
                      About the data
                      <ArrowRight className="size-4 text-[#ff8e42]" />
                    </Link>
                  </div>
                </div>
              </div>
            </PublicSurface>
          </section>
        </PageShell>
      </div>
    </div>
  );
}
