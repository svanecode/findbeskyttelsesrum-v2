import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const appV2Schema = "app_v2";

export function withAppV2Schema<TClient extends SupabaseClient>(client: TClient) {
  return client.schema(appV2Schema);
}

export async function createAppV2ServerClient() {
  const supabase = await createSupabaseServerClient();

  return supabase ? withAppV2Schema(supabase) : null;
}

export function createAppV2AdminClient() {
  return withAppV2Schema(createSupabaseAdminClient());
}

export function createAppV2BrowserClient() {
  const supabase = createSupabaseBrowserClient();

  return supabase ? withAppV2Schema(supabase) : null;
}
