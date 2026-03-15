"use server";

import { revalidatePath } from "next/cache";

import { createAppV2AdminClient } from "@/lib/supabase/app-v2";
import { hasAnyOverrideValue, type ShelterOverrideValues } from "@/lib/shelter/overrides";

import { requireAuthorizedAdmin } from "./lib/auth";
import {
  initialOverrideFormState,
  normalizeOptionalString,
  validateCapacity,
  validateOverrideStatus,
  validatePostalCode,
  type OverrideFormState,
} from "./lib/override-form";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getTrimmed(formData: FormData, key: string) {
  return getString(formData, key).trim();
}

function getOverrideValues(formData: FormData): ShelterOverrideValues {
  const capacityValue = normalizeOptionalString(getString(formData, "capacity"));

  return {
    name: normalizeOptionalString(getString(formData, "name")),
    addressLine1: normalizeOptionalString(getString(formData, "addressLine1")),
    postalCode: normalizeOptionalString(getString(formData, "postalCode")),
    city: normalizeOptionalString(getString(formData, "city")),
    capacity: capacityValue ? Number(capacityValue) : null,
    status: normalizeOptionalString(getString(formData, "status")) as ShelterOverrideValues["status"],
    accessibilityNotes: normalizeOptionalString(getString(formData, "accessibilityNotes")),
    summary: normalizeOptionalString(getString(formData, "summary")),
  };
}

function mapPayload(values: ShelterOverrideValues) {
  return {
    name: values.name,
    address_line1: values.addressLine1,
    postal_code: values.postalCode,
    city: values.city,
    capacity: values.capacity,
    status: values.status,
    accessibility_notes: values.accessibilityNotes,
    summary: values.summary,
  };
}

export async function saveShelterOverride(
  _previousState: OverrideFormState,
  formData: FormData,
): Promise<OverrideFormState> {
  const admin = await requireAuthorizedAdmin();

  if (!admin) {
    return {
      status: "error",
      fieldErrors: {
        form: "An authorized admin session is required.",
      },
    };
  }

  const shelterId = getTrimmed(formData, "shelterId");
  const shelterSlug = getTrimmed(formData, "shelterSlug");
  const reason = getTrimmed(formData, "reason");
  const values = getOverrideValues(formData);
  const fieldErrors: OverrideFormState["fieldErrors"] = {};

  if (!shelterId || !shelterSlug) {
    return {
      status: "error",
      fieldErrors: {
        form: "The shelter reference is missing.",
      },
    };
  }

  if (reason.length < 10) {
    fieldErrors.reason = "Add a short reason with at least 10 characters.";
  } else if (reason.length > 500) {
    fieldErrors.reason = "Keep the reason below 500 characters.";
  }

  if (values.postalCode && !validatePostalCode(values.postalCode)) {
    fieldErrors.postalCode = "Postal code must be a 4-digit Danish postal code.";
  }

  if (!validateCapacity(values.capacity === null ? null : String(values.capacity))) {
    fieldErrors.capacity = "Capacity must be a whole number of 0 or more.";
  }

  if (values.status && !validateOverrideStatus(values.status)) {
    fieldErrors.status = "Choose a valid shelter status.";
  }

  if (!hasAnyOverrideValue(values)) {
    fieldErrors.form = "Add at least one override value or use clear override instead.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      fieldErrors,
      message: "Please correct the override form and try again.",
    };
  }

  try {
    const supabase = createAppV2AdminClient();

    const existingResponse = await supabase
      .from("shelter_overrides")
      .select("id")
      .eq("shelter_id", shelterId)
      .eq("is_active", true)
      .maybeSingle();

    const payload = {
      shelter_id: shelterId,
      reason,
      is_active: true,
      created_by: existingResponse.data ? undefined : admin.email,
      updated_by: admin.email,
      effective_until: null,
      ...mapPayload(values),
    };

    const overrideResponse = existingResponse.data
      ? await supabase
          .from("shelter_overrides")
          .update(payload)
          .eq("id", existingResponse.data.id)
          .select("id")
          .single()
      : await supabase.from("shelter_overrides").insert(payload).select("id").single();

    if (overrideResponse.error) {
      return {
        status: "error",
        fieldErrors: {
          form: "The override could not be saved.",
        },
      };
    }

    await supabase.from("audit_events").insert({
      actor_type: "admin",
      actor_identifier: admin.email,
      entity_type: "shelter_override",
      entity_id: overrideResponse.data?.id ?? existingResponse.data?.id ?? null,
      event_type: existingResponse.data ? "override_updated" : "override_created",
      payload: {
        shelter_id: shelterId,
        shelter_slug: shelterSlug,
        reason,
        values,
      },
    });

    revalidatePath(`/admin/shelters/${shelterSlug}/override`);
    revalidatePath(`/beskyttelsesrum/${shelterSlug}`);
    revalidatePath("/admin");

    return {
      ...initialOverrideFormState,
      status: "success",
      message: "Override saved.",
    };
  } catch {
    return {
      status: "error",
      fieldErrors: {
        form: "The override service is not configured yet.",
      },
    };
  }
}

export async function clearShelterOverride(
  _previousState: OverrideFormState,
  formData: FormData,
): Promise<OverrideFormState> {
  const admin = await requireAuthorizedAdmin();

  if (!admin) {
    return {
      status: "error",
      fieldErrors: {
        form: "An authorized admin session is required.",
      },
    };
  }

  const shelterId = getTrimmed(formData, "shelterId");
  const shelterSlug = getTrimmed(formData, "shelterSlug");

  if (!shelterId || !shelterSlug) {
    return {
      status: "error",
      fieldErrors: {
        form: "The shelter reference is missing.",
      },
    };
  }

  try {
    const supabase = createAppV2AdminClient();

    const existingResponse = await supabase
      .from("shelter_overrides")
      .select("id")
      .eq("shelter_id", shelterId)
      .eq("is_active", true)
      .maybeSingle();

    if (!existingResponse.data) {
      return {
        status: "error",
        fieldErrors: {
          form: "There is no active override to clear.",
        },
      };
    }

    const updateResponse = await supabase
      .from("shelter_overrides")
      .update({
        is_active: false,
        effective_until: new Date().toISOString(),
        updated_by: admin.email,
      })
      .eq("id", existingResponse.data.id);

    if (updateResponse.error) {
      return {
        status: "error",
        fieldErrors: {
          form: "The override could not be cleared.",
        },
      };
    }

    await supabase.from("audit_events").insert({
      actor_type: "admin",
      actor_identifier: admin.email,
      entity_type: "shelter_override",
      entity_id: existingResponse.data.id,
      event_type: "override_cleared",
      payload: {
        shelter_id: shelterId,
        shelter_slug: shelterSlug,
      },
    });

    revalidatePath(`/admin/shelters/${shelterSlug}/override`);
    revalidatePath(`/beskyttelsesrum/${shelterSlug}`);
    revalidatePath("/admin");

    return {
      ...initialOverrideFormState,
      status: "success",
      message: "Override cleared.",
    };
  } catch {
    return {
      status: "error",
      fieldErrors: {
        form: "The override service is not configured yet.",
      },
    };
  }
}
