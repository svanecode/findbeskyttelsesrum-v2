import Link from "next/link";

export function MunicipalityEmptyState() {
  return (
    <div className="space-y-4 py-8">
      <p className="text-base text-foreground">Ingen beskyttelsesrum er tilknyttet endnu.</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <Link
          className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
          href="/find"
        >
          Tilbage til søgning
        </Link>
        <Link
          className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
          href="/om-data"
        >
          Om data
        </Link>
      </div>
    </div>
  );
}
