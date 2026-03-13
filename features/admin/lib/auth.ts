import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAuthState =
  | {
      kind: "unauthenticated";
      email: null;
    }
  | {
      kind: "unauthorized";
      email: string;
    }
  | {
      kind: "authorized";
      email: string;
      userId: string;
    };

function getAllowedAdminEmails() {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminAuthConfigured() {
  return getAllowedAdminEmails().length > 0;
}

export function isAllowedAdminEmail(email: string) {
  return getAllowedAdminEmails().includes(email.trim().toLowerCase());
}

export async function getAdminAuthState(): Promise<AdminAuthState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      kind: "unauthenticated",
      email: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      kind: "unauthenticated",
      email: null,
    };
  }

  const email = user.email.toLowerCase();

  if (!isAllowedAdminEmail(email)) {
    return {
      kind: "unauthorized",
      email,
    };
  }

  return {
    kind: "authorized",
    email,
    userId: user.id,
  };
}

export async function requireAuthorizedAdmin() {
  const authState = await getAdminAuthState();

  if (authState.kind !== "authorized") {
    return null;
  }

  return authState;
}
