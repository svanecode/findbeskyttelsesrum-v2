import { isValidModerationStatus } from "./moderation";

export type OverrideFormState = {
  status: "idle" | "success" | "error";
  fieldErrors: {
    reason?: string;
    name?: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    capacity?: string;
    status?: string;
    notesPublic?: string;
    form?: string;
  };
  message?: string;
};

export const initialOverrideFormState: OverrideFormState = {
  status: "idle",
  fieldErrors: {},
};

export function normalizeOptionalString(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

export function validatePostalCode(value: string | null) {
  if (!value) {
    return true;
  }

  return /^\d{4}$/.test(value);
}

export function validateCapacity(value: string | null) {
  if (!value) {
    return true;
  }

  return /^\d+$/.test(value) && Number(value) >= 0;
}

export function validateOverrideStatus(value: string | null) {
  if (!value) {
    return true;
  }

  return isValidModerationStatus(value) || value === "active" || value === "temporarily_closed" || value === "under_review";
}
