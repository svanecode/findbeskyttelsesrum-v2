import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card">
      <PageShell className="space-y-4 py-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Data clarity matters.</p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            This baseline separates public shelter records, source provenance, and manual
            operational overrides so trust signals can stay visible as the product grows.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/om-data">About the data</Link>
          <Link href="/find">Find shelters</Link>
        </div>
      </PageShell>
    </footer>
  );
}
