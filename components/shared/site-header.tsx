import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";

const navigation = [
  { href: "/find", label: "Find shelters" },
  { href: "/om-data", label: "About the data" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background text-foreground">
      <PageShell className="flex items-center justify-between gap-4 py-4">
        <Link
          className="text-[0.9rem] font-medium tracking-[0.04em] text-foreground"
          href="/"
          style={{ fontVariant: "all-small-caps" }}
        >
          Findbeskyttelsesrum
        </Link>

        <nav className="hidden items-center justify-end gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="text-sm text-muted-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-[color,text-decoration-color] hover:text-foreground hover:decoration-current"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="text-sm text-muted-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-[color,text-decoration-color] hover:text-foreground hover:decoration-current md:hidden"
          href="/find"
        >
          Search →
        </Link>
      </PageShell>
    </header>
  );
}
