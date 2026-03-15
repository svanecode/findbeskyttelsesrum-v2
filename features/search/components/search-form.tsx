import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchFormProps = {
  defaultQuery?: string | null;
  municipalitySlug?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function SearchForm({
  defaultQuery,
  municipalitySlug,
  latitude,
  longitude,
}: SearchFormProps) {
  return (
    <form action="/find" className="space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 rounded-full border-border/80 bg-background pl-10 text-base"
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
      <Button className="h-12 w-full rounded-full px-5 sm:w-auto" size="lg" type="submit">
        Search
      </Button>
    </form>
  );
}
