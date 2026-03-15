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
      <form action="/find" className="space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full border-border/80 bg-background pl-10 text-base"
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter an address or area"
            value={query}
          />
        </div>
        <Button className="h-12 w-full rounded-full px-5 sm:w-auto" size="lg" type="submit">
          Search
        </Button>
      </form>
      <Button
        className="h-11 rounded-full px-5"
        disabled={isLocating}
        onClick={handleUseLocation}
        type="button"
        variant="outline"
      >
        {isLocating ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}
        Use my location
      </Button>
      {locationMessage ? (
        <p className="text-sm leading-6 text-muted-foreground">{locationMessage}</p>
      ) : null}
    </div>
  );
}
