import type { ImporterFetchResult } from "@/lib/importer/types";

export type ImporterSnapshot = {
  name: string;
};

export interface OfficialSourceAdapter {
  readonly sourceName: string;
  readonly sourceUrl: string | null;
  fetchRecords(snapshot: ImporterSnapshot): Promise<ImporterFetchResult>;
}
