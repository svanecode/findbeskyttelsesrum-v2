"use client";

import { LocateFixed, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddressSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not available in this browser.");
      return;
    }

    setLocationMessage(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(() => {
          router.push(
            `/find?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          );
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage("Location access was denied. You can still search by address.");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationMessage("Your current location is unavailable right now.");
          return;
        }

        setLocationMessage("We could not read your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  return (
    <div className="space-y-3">
      <form
        action="/find"
        className="grid gap-3 rounded-[1.35rem] border border-white/7 bg-[#0a0d12] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-[#9f8d7b]" />
          <Input
            className="h-[4.35rem] rounded-[1.1rem] border-white/8 bg-[#080a0e] pl-13 text-[1.05rem] text-[#fff5ea] placeholder:text-[#9f8d7b] shadow-none"
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter an address, area, or postcode"
            value={query}
          />
        </div>
        <Button
          className="h-[4.35rem] w-full rounded-[1.1rem] bg-[#ff7a1a] px-7 text-[1rem] font-semibold text-[#1a1009] shadow-[0_10px_24px_rgba(255,122,26,0.24)] hover:bg-[#ff8f39] lg:w-auto"
          size="lg"
          type="submit"
        >
          Search
        </Button>
      </form>
      <Button
        className="h-12 rounded-[1.2rem] border-white/10 bg-[#151922] px-5 text-[#f5ecdf] hover:bg-[#1b202b]"
        disabled={isLocating}
        onClick={handleUseLocation}
        type="button"
        variant="outline"
      >
        {isLocating ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}
        Use my location
      </Button>
      {locationMessage ? (
        <p className="text-sm leading-6 text-[#a99986]">{locationMessage}</p>
      ) : null}
    </div>
  );
}
