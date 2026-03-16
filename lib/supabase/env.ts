function getFirstDefined(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim());
}

export function hasPublicSupabaseEnv() {
  return Boolean(getFirstDefined(process.env.NEXT_PUBLIC_SUPABASE_URL) && getFirstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ));
}

export function getPublicSupabaseEnv() {
  const url = getFirstDefined(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = getFirstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!url || !publishableKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return { url, publishableKey };
}
