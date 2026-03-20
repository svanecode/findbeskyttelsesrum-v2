import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { buttonVariants } from "@/components/ui/button-variants";

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
            <p className="text-base font-semibold tracking-[-0.02em] text-foreground">
              Findbeskyttelsesrum
            </p>
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </PageShell>
    </header>
  );
}
