export type OverrideStatus = "active" | "temporarily_closed" | "under_review";

export type ShelterOverrideValues = {
  name: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  capacity: number | null;
  status: OverrideStatus | null;
  notesPublic: string | null;
};

export const editableOverrideFields = [
  "name",
  "street",
  "houseNumber",
  "postalCode",
  "city",
  "capacity",
  "status",
  "notesPublic",
] as const;

export function parseAddressLine1(addressLine1: string) {
  const trimmed = addressLine1.trim();
  const match = trimmed.match(/^(.*?)(?:\s+(\d+[A-Za-z0-9\-./]*))$/);

  if (!match) {
    return {
      street: trimmed,
      houseNumber: "",
    };
  }

  return {
    street: match[1].trim(),
    houseNumber: match[2].trim(),
  };
}

export function formatAddressLine1(street: string | null, houseNumber: string | null) {
  const streetValue = street?.trim() ?? "";
  const houseNumberValue = houseNumber?.trim() ?? "";

  return [streetValue, houseNumberValue].filter(Boolean).join(" ").trim();
}

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
