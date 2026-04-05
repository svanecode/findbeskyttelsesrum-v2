import Link from "next/link";
import type { MunicipalityShelterListItem } from "@/lib/supabase/queries";

type MunicipalityShelterCardProps = {
  shelter: MunicipalityShelterListItem;
};

export function MunicipalityShelterCard({ shelter }: MunicipalityShelterCardProps) {
  const address = `${shelter.addressLine1}, ${shelter.postalCode} ${shelter.city}`;
  const rowLabel = shelter.name ? `${shelter.name} · ${address}` : address;

  return (
    <Link
      className="block transition-colors hover:bg-muted/50"
      href={`/beskyttelsesrum/${shelter.slug}`}
    >
      <div className="grid gap-3 px-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{rowLabel}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-mono text-sm text-foreground">{shelter.capacity} pladser</p>
        </div>
      </div>
    </Link>
  );
}
