import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchFormProps = {
  defaultQuery?: string | null;
  municipalitySlug?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  compact?: boolean;
};

export function SearchForm({
  defaultQuery,
  municipalitySlug,
  latitude,
  longitude,
  compact = false,
}: SearchFormProps) {
  return (
    <form action="/find" className="space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#9f8d7b]" />
        <Input
          className={compact
            ? "h-11 rounded-[2px] border-border bg-card pl-11 text-sm text-foreground placeholder:text-muted-foreground shadow-none"
            : "h-12 rounded-[1.1rem] border-white/10 bg-[#0b0d11] pl-11 text-base text-[#fff5ea] placeholder:text-[#9f8d7b] shadow-none"}
          defaultValue={defaultQuery ?? ""}
          name="q"
          placeholder="Search by address, area, or postcode"
        />
      </div>
      {municipalitySlug ? <input name="municipality" type="hidden" value={municipalitySlug} /> : null}
      {latitude !== null && longitude !== null ? (
        <>
          <input name="lat" type="hidden" value={latitude} />
          <input name="lng" type="hidden" value={longitude} />
        </>
      ) : null}
      <Button
        className={compact
          ? "h-11 w-full rounded-[2px] bg-primary px-5 text-primary-foreground hover:opacity-95 sm:w-auto"
          : "h-12 w-full rounded-[1.1rem] bg-[#ff7a1a] px-5 text-[#1a1009] hover:bg-[#ff8f39] sm:w-auto"}
        size="lg"
        type="submit"
      >
        Search
      </Button>
    </form>
  );
}
