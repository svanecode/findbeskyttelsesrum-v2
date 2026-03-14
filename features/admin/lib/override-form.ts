export type OverrideFormState = {
  status: "idle" | "success" | "error";
  fieldErrors: {
    reason?: string;
    name?: string;
    addressLine1?: string;
    postalCode?: string;
    city?: string;
    capacity?: string;
    status?: string;
    accessibilityNotes?: string;
    summary?: string;
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

  return value === "active" || value === "temporarily_closed" || value === "under_review";
}
