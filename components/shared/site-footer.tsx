import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#090b0f] text-[#cdbdac]">
      <PageShell className="space-y-4 py-8">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/om-data">About the data</Link>
          <Link href="/find">Find shelters</Link>
        </div>
      </PageShell>
    </footer>
  );
}
