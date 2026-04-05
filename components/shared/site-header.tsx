import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";

const navigation = [
  { href: "/find", label: "Find beskyttelsesrum" },
  { href: "/om-data", label: "Om data" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-foreground/20 bg-foreground text-background">
      <PageShell className="flex items-center justify-between gap-4 py-4">
        <Link
          className="font-mono text-xs tracking-widest text-background uppercase"
          href="/"
        >
          Findbeskyttelsesrum
        </Link>

        <nav className="hidden items-center justify-end gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="text-sm text-background/70 underline decoration-transparent decoration-1 underline-offset-4 transition-[color,text-decoration-color] hover:text-background hover:decoration-current"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="text-sm text-background/70 underline decoration-transparent decoration-1 underline-offset-4 transition-[color,text-decoration-color] hover:text-background hover:decoration-current md:hidden"
          href="/find"
        >
          Søg →
        </Link>
      </PageShell>
    </header>
  );
}
