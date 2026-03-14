"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatAddressLine1, hasAnyOverrideValue, type ShelterOverrideValues } from "@/lib/shelter/overrides";

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
    street: normalizeOptionalString(getString(formData, "street")),
    houseNumber: normalizeOptionalString(getString(formData, "houseNumber")),
    postalCode: normalizeOptionalString(getString(formData, "postalCode")),
    city: normalizeOptionalString(getString(formData, "city")),
    capacity: capacityValue ? Number(capacityValue) : null,
    status: normalizeOptionalString(getString(formData, "status")) as ShelterOverrideValues["status"],
    notesPublic: normalizeOptionalString(getString(formData, "notesPublic")),
  };
}

function mapPayload(values: ShelterOverrideValues) {
  return {
    name: values.name,
    street: values.street,
    house_number: values.houseNumber,
    postal_code: values.postalCode,
    city: values.city,
    capacity: values.capacity,
    status: values.status,
    notes_public: values.notesPublic,
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
    const supabase = createSupabaseAdminClient();

    const existingResponse = await supabase
      .from("shelter_status_overrides")
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
          .from("shelter_status_overrides")
          .update(payload)
          .eq("id", existingResponse.data.id)
      : await supabase.from("shelter_status_overrides").insert(payload);

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
      entity_id: existingResponse.data?.id ?? null,
      event_type: existingResponse.data ? "override_updated" : "override_created",
      payload: {
        shelter_id: shelterId,
        shelter_slug: shelterSlug,
        reason,
        effective_address_line1: formatAddressLine1(values.street, values.houseNumber),
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
    const supabase = createSupabaseAdminClient();

    const existingResponse = await supabase
      .from("shelter_status_overrides")
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
      .from("shelter_status_overrides")
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
