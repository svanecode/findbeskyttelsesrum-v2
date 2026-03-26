import Link from "next/link";
import type { MunicipalityShelterListItem } from "@/lib/supabase/queries";

type MunicipalityShelterCardProps = {
  shelter: MunicipalityShelterListItem;
};

export function MunicipalityShelterCard({ shelter }: MunicipalityShelterCardProps) {
  const statusColor =
    shelter.status === "active"
      ? "var(--status-active)"
      : shelter.status === "under_review"
        ? "var(--status-under-review)"
        : "var(--status-closed)";
  const address = `${shelter.addressLine1}, ${shelter.postalCode} ${shelter.city}`;
  const rowLabel = shelter.name ? `${shelter.name} · ${address}` : address;

  return (
    <Link
      className="block transition-colors hover:bg-muted/50"
      href={`/beskyttelsesrum/${shelter.slug}`}
    >
      <div className="grid gap-3 px-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-1 size-2 shrink-0 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{rowLabel}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-mono text-sm text-foreground">{shelter.capacity} spaces</p>
        </div>
      </div>
    </Link>
  );
}
