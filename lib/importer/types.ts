export type ImportLifecycleState = "active" | "missing_from_source" | "suppressed";

export type ImportedShelterStatus = "active" | "temporarily_closed" | "under_review";

export type ImportedShelterMunicipality = {
  slug: string;
  name: string;
  regionName: string | null;
};

export type ImportedShelterBaseline = {
  slug: string;
  name: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  status: ImportedShelterStatus;
  accessibilityNotes: string | null;
  summary: string;
};

export type ImportedShelterSource = {
  canonicalSourceName: string;
  canonicalSourceReference: string;
  sourceName: string;
  sourceType: "official";
  sourceUrl: string | null;
  sourceReference: string;
  lastVerifiedAt: string | null;
  notes: string | null;
};

export type ImportedShelterRecord = {
  municipality: ImportedShelterMunicipality;
  shelter: ImportedShelterBaseline;
  source: ImportedShelterSource;
  lifecycle: {
    importState: Extract<ImportLifecycleState, "active">;
  };
};

export type ImporterWarningLevel = "warning" | "error";

export type ImporterWarning = {
  level: ImporterWarningLevel;
  code: string;
  message: string;
  reference?: string;
};

export type ImporterFetchStats = {
  fetchedRecords: number;
  normalizedRecords: number;
  skippedRecords: number;
  missingAddressCount: number;
  missingMunicipalityCount: number;
  missingCoordinatesCount: number;
};

export type ImporterFetchResult = {
  records: ImportedShelterRecord[];
  warnings: ImporterWarning[];
  stats: ImporterFetchStats;
};

export type ImporterRunSummary = {
  sourceName: string;
  snapshotName: string;
  dryRun: boolean;
  recordsSeen: number;
  inserted: number;
  updated: number;
  unchanged: number;
  restored: number;
  missing: number;
  recordsUpserted: number;
  importRunId: string | null;
  warningsCount: number;
  warningExamples: string[];
  fetchStats: ImporterFetchStats;
};
