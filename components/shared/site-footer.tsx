import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { getLatestImportDate } from "@/lib/supabase/queries";

const footerLinks = [
  { href: "/find", label: "Find beskyttelsesrum" },
  { href: "/om-data", label: "Om data" },
] as const;

export async function SiteFooter() {
  const lastUpdated = await getLatestImportDate();

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
            <p>Offentlige beskyttelsesrumsdata for Danmark.</p>
            <p className="italic">Uafhængig. Ikke tilknyttet den danske stat.</p>
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
              Kommuneoversigt
            </Link>
          </div>
        </div>

        <div className="space-y-3 leading-6">
          <p className="font-medium text-foreground">Datakilder</p>
          <p>BBR · DAR · Datafordeler</p>
          <p>Sidst opdateret: {lastUpdated ?? "Ukendt"}</p>
        </div>
      </PageShell>
    </footer>
  );
}
