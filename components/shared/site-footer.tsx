import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";

const footerLinks = [
  { href: "/find", label: "Find shelters" },
  { href: "/om-data", label: "About the data" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted text-[0.8rem] text-muted-foreground">
      <PageShell className="grid gap-8 py-8 sm:py-10 md:grid-cols-3">
        <div className="space-y-3">
          <Link
            className="inline-block text-[0.9rem] font-medium tracking-[0.04em] text-foreground"
            href="/"
            style={{ fontVariant: "all-small-caps" }}
          >
            Findbeskyttelsesrum
          </Link>
          <div className="space-y-2 leading-6">
            <p>Public shelter data for Denmark.</p>
            <p className="italic">
              Independent. Not affiliated with the Danish state.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-medium text-foreground">Links</p>
          <div className="flex flex-col gap-2">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                className="transition-colors hover:text-foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
            <Link className="transition-colors hover:text-foreground" href="/kommune">
              Municipality index
            </Link>
          </div>
        </div>

        <div className="space-y-3 leading-6">
          <p className="font-medium text-foreground">Data sources</p>
          <p>BBR · DAR · Datafordeler</p>
          <p>Last updated: March 26, 2026</p>
        </div>
      </PageShell>
    </footer>
  );
}
