import Link from "next/link";

export function SearchEmptyState() {
  return (
    <div className="space-y-4 py-6">
      <p className="text-base text-foreground">
        Søg efter en adresse, et område eller en kommune.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <Link
          href="/find?q=Kobenhavn"
          className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
        >
          Prøv København
        </Link>
        <Link
          href="/kommune/kobenhavn"
          className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
        >
          Kommuneoversigt
        </Link>
      </div>
    </div>
  );
}
