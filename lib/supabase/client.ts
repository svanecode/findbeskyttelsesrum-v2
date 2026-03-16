"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv, hasPublicSupabaseEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  if (!browserClient) {
    const { url, publishableKey } = getPublicSupabaseEnv();
    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}
