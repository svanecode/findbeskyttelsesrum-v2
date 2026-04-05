export const reportTypeOptions = [
  { value: "incorrect_address", label: "Forkert adresse" },
  { value: "unavailable", label: "Beskyttelsesrum fjernet eller utilgængeligt" },
  { value: "incorrect_capacity", label: "Forkert kapacitet" },
  { value: "duplicate_record", label: "Dubleret resultat" },
  { value: "other", label: "Andet" },
] as const;

export type ShelterReportType = (typeof reportTypeOptions)[number]["value"];

export type ReportIssueState = {
  status: "idle" | "success" | "error";
  fieldErrors: {
    reportType?: string;
    message?: string;
    contactEmail?: string;
    form?: string;
  };
  message?: string;
};

export const initialReportIssueState: ReportIssueState = {
  status: "idle",
  fieldErrors: {},
};

const reportTypeValues = new Set(reportTypeOptions.map((option) => option.value));

export function isValidReportType(value: string): value is ShelterReportType {
  return reportTypeValues.has(value as ShelterReportType);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
