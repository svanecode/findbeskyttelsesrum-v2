"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireAuthorizedAdmin } from "./lib/auth";
import {
  initialModerationActionState,
  isValidModerationStatus,
  type ModerationActionState,
} from "./lib/moderation";

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function signInAdmin(
  _previousState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const email = getTrimmedString(formData, "email");
  const password = getTrimmedString(formData, "password");

  if (!email || !password) {
    return {
      status: "error",
      message: "Enter both email and password.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        status: "error",
        message: "Supabase Auth is not configured yet.",
      };
    }

    const signInResponse = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInResponse.error) {
      return {
        status: "error",
        message: "Sign-in failed. Check the credentials and try again.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/login");

    return {
      status: "success",
      message: "Signed in successfully.",
    };
  } catch {
    return {
      status: "error",
      message: "The login service is not available right now.",
    };
  }
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/admin");
  revalidatePath("/admin/login");

  redirect("/admin/login");
}

export async function updateShelterReportStatus(
  _previousState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const admin = await requireAuthorizedAdmin();

  if (!admin) {
    return {
      status: "error",
      message: "An authorized admin session is required for moderation actions.",
    };
  }

  const reportId = getTrimmedString(formData, "reportId");
  const nextStatus = getTrimmedString(formData, "nextStatus");

  if (!reportId || !isValidModerationStatus(nextStatus)) {
    return {
      status: "error",
      message: "The moderation request is invalid.",
    };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const reportResponse = await supabase
      .from("shelter_reports")
      .select("id, shelter_id, status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportResponse.error || !reportResponse.data) {
      return {
        status: "error",
        message: "The report could not be found anymore.",
      };
    }

    const updateResponse = await supabase
      .from("shelter_reports")
      .update({ status: nextStatus })
      .eq("id", reportId);

    if (updateResponse.error) {
      return {
        status: "error",
        message: "The report status could not be updated.",
      };
    }

    await supabase.from("audit_events").insert({
      actor_type: "admin",
      actor_identifier: admin.email,
      entity_type: "shelter_report",
      entity_id: reportId,
      event_type: "report_status_changed",
      payload: {
        shelter_id: reportResponse.data.shelter_id,
        previous_status: reportResponse.data.status,
        next_status: nextStatus,
      },
    });

    revalidatePath("/admin");

    return {
      ...initialModerationActionState,
      status: "success",
      message: `Report marked as ${nextStatus}.`,
    };
  } catch {
    return {
      status: "error",
      message: "The moderation service is not configured yet.",
    };
  }
}
