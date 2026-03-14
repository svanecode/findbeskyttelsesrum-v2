export type OverrideStatus = "active" | "temporarily_closed" | "under_review";

export type ShelterOverrideValues = {
  name: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  capacity: number | null;
  status: OverrideStatus | null;
  accessibilityNotes: string | null;
  summary: string | null;
};

export const editableOverrideFields = [
  "name",
  "addressLine1",
  "postalCode",
  "city",
  "capacity",
  "status",
  "accessibilityNotes",
  "summary",
] as const;

export function hasAnyOverrideValue(values: ShelterOverrideValues) {
  return editableOverrideFields.some((field) => {
    const value = values[field];

    return value !== null && value !== "";
  });
}

export function formatOverrideStatusLabel(status: OverrideStatus | null) {
  switch (status) {
    case "active":
      return "Active";
    case "temporarily_closed":
      return "Temporarily closed";
    case "under_review":
      return "Under review";
    default:
      return "No override";
  }
}
