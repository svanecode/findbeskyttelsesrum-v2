export const reportStatusOptions = [
  { value: "reviewing", label: "Mark as reviewing" },
  { value: "resolved", label: "Mark as resolved" },
  { value: "rejected", label: "Mark as rejected" },
] as const;

export type ModerationStatus = (typeof reportStatusOptions)[number]["value"];

export type ModerationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialModerationActionState: ModerationActionState = {
  status: "idle",
};

const allowedStatuses = new Set(reportStatusOptions.map((option) => option.value));

export function isValidModerationStatus(value: string): value is ModerationStatus {
  return allowedStatuses.has(value as ModerationStatus);
}

export function formatReportType(value: string) {
  switch (value) {
    case "incorrect_address":
      return "Incorrect address";
    case "unavailable":
      return "Shelter removed or unavailable";
    case "incorrect_capacity":
      return "Incorrect capacity";
    case "duplicate_record":
      return "Duplicate record";
    case "other":
      return "Other";
    default:
      return value;
  }
}

export function formatReportStatus(value: string) {
  switch (value) {
    case "open":
      return "Open";
    case "reviewing":
      return "Reviewing";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    default:
      return value;
  }
}
