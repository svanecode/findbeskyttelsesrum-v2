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
    <header className="border-b border-white/8 bg-[#090b0f]/92 text-[#f7efe6] backdrop-blur">
      <PageShell className="flex items-center justify-between gap-4 py-4">
        <div>
          <Link className="inline-flex items-center gap-2" href="/">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#ff7a1a] text-sm font-semibold text-[#1a1009]">
              FB
            </span>
            <p className="text-base font-semibold tracking-[-0.02em] text-[#f7efe6]">
              Findbeskyttelsesrum
            </p>
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className={buttonVariants({
                className:
                  "text-[#cdbdac] hover:bg-white/6 hover:text-[#fff7ef] dark:hover:bg-white/6",
                size: "sm",
                variant: "ghost",
              })}
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
