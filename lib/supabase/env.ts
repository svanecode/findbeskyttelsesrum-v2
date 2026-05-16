function getFirstDefined(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim());
}

export function getSupabaseWriteEnv() {
  const url = getFirstDefined(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const secretKey = getFirstDefined(process.env.SUPABASE_SECRET_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !secretKey) {
    throw new Error(
      "Missing Supabase write environment variables. Expected NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return { url, secretKey };
}
