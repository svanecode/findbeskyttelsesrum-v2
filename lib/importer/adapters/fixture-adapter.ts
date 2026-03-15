import { fixtureSnapshotNames, fixtureSnapshots } from "@/lib/importer/fixtures/shelter-fixtures";
import type { OfficialSourceAdapter } from "@/lib/importer/source-adapter";
import type { ImportedShelterRecord } from "@/lib/importer/types";

export class FixtureOfficialSourceAdapter implements OfficialSourceAdapter {
  readonly sourceName = "fixture-official-register";
  readonly sourceUrl = "https://example.com/official-fixture-register";

  async fetchRecords(snapshot: { name: string }): Promise<ImportedShelterRecord[]> {
    const records = fixtureSnapshots[snapshot.name];

    if (!records) {
      throw new Error(
        `Unknown fixture snapshot "${snapshot.name}". Available snapshots: ${fixtureSnapshotNames.join(", ")}.`,
      );
    }

    return records;
  }
}
