import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/find", label: "Find shelters" },
  { href: "/om-data", label: "About the data" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background/90 backdrop-blur">
      <PageShell className="flex items-center justify-between gap-4 py-4">
        <div>
          <Link className="inline-flex items-center gap-2" href="/">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              FB
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Findbeskyttelsesrum
              </p>
              <p className="text-base font-semibold text-foreground">v2 baseline</p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {navigation.map((item) => (
            <Button key={item.href} render={<Link href={item.href} />} size="sm" variant="ghost">
              {item.label}
            </Button>
          ))}
        </nav>
      </PageShell>
    </header>
  );
}
