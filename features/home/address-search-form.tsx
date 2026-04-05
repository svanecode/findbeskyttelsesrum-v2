"use client";

import { LocateFixed, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

export function AddressSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(trimmedQuery)}&type=adresse&per_side=6&fuzzy=`,
        );

        if (!response.ok) {
          throw new Error("Autocomplete request failed.");
        }

        const data = (await response.json()) as Array<{ tekst: string }>;
        const nextSuggestions = data.map((item) => item.tekst);

        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  function selectSuggestion(suggestion: string) {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setActiveIndex(-1);
    startTransition(() => {
      router.push(`/find?q=${encodeURIComponent(suggestion)}`);
    });
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSuggestions(suggestions.length > 0);
      setActiveIndex((currentIndex) => Math.min(currentIndex + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, -1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  function handleInputBlur() {
    blurTimerRef.current = setTimeout(() => {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }, 150);
  }

  function handleInputFocus() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }

    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Placering er ikke tilgængelig i denne browser.");
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
          setLocationMessage("Adgang til placering blev nægtet. Du kan stadig søge på adresse.");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationMessage("Din aktuelle placering er ikke tilgængelig lige nu.");
          return;
        }

        setLocationMessage("Vi kunne ikke læse din aktuelle placering.");
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
        className="relative grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-[52px] w-full border border-border bg-white pl-11 pr-4 text-base text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none placeholder:text-muted-foreground focus:border-foreground"
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder="Indtast adresse, område eller postnummer"
            value={query}
          />
          {showSuggestions && suggestions.length > 0 ? (
            <div
              className="absolute top-full right-0 left-0 z-50 border border-border border-t-0 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              style={{ borderRadius: "0 0 2px 2px" }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion}-${index}`}
                  className="cursor-pointer px-11 py-[10px] text-[0.9rem]"
                  onMouseDown={() => selectSuggestion(suggestion)}
                  style={{
                    backgroundColor: activeIndex === index ? "var(--muted)" : "transparent",
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <button
          className="h-[52px] w-full bg-primary px-7 text-base font-medium text-primary-foreground transition-colors hover:opacity-95 sm:w-auto"
          type="submit"
        >
          Søg
        </button>
      </form>

      <div className="flex items-center gap-3 py-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
        <div className="h-px flex-1 bg-border" />
        <span>eller</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 border border-input bg-background px-4 text-base font-medium text-foreground transition-colors hover:bg-accent"
        disabled={isLocating}
        onClick={handleUseLocation}
        type="button"
      >
        {isLocating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
        <span>📍 Brug min placering</span>
      </button>
      {locationMessage ? (
        <p className="text-sm leading-6 text-muted-foreground">{locationMessage}</p>
      ) : null}
    </div>
  );
}
