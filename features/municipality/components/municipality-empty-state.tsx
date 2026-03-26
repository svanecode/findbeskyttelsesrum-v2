import Link from "next/link";

export function MunicipalityEmptyState() {
  return (
    <div className="space-y-4 py-8">
      <p className="text-base text-foreground">No shelter records connected yet.</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <Link
          className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
          href="/find"
        >
          Back to search
        </Link>
        <Link
          className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
          href="/om-data"
        >
          About the data
        </Link>
      </div>
    </div>
  );
}
