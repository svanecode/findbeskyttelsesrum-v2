import { FixtureOfficialSourceAdapter } from "@/lib/importer/adapters/fixture-adapter";
import { DatafordelerOfficialSourceAdapter } from "@/lib/importer/adapters/datafordeler-official-adapter";
import { fixtureSnapshotNames } from "@/lib/importer/fixtures/shelter-fixtures";
import { runOfficialImporter } from "@/lib/importer/service";

function getMode() {
  return process.argv[2] ?? "fixture";
}

function isDryRun() {
  return process.argv.includes("--dry-run");
}

function getFixtureSnapshotName() {
  const snapshotName = process.argv[3] ?? "baseline";

  if (!fixtureSnapshotNames.includes(snapshotName)) {
    throw new Error(`Unknown fixture snapshot "${snapshotName}". Available snapshots: ${fixtureSnapshotNames.join(", ")}.`);
  }

  return snapshotName;
}

async function main() {
  const mode = getMode();
  const adapter =
    mode === "datafordeler" ? new DatafordelerOfficialSourceAdapter() : new FixtureOfficialSourceAdapter();
  const snapshotName = mode === "datafordeler" ? "live" : getFixtureSnapshotName();
  const dryRun = isDryRun();

  console.log(`[importer] mode=${mode} source=${adapter.sourceName} snapshot=${snapshotName} dryRun=${dryRun}`);
  const summary = await runOfficialImporter({
    adapter,
    snapshotName,
    dryRun,
  });

  console.log(
    `[importer] summary recordsSeen=${summary.recordsSeen} inserted=${summary.inserted} updated=${summary.updated} unchanged=${summary.unchanged} restored=${summary.restored} missing=${summary.missing} warnings=${summary.warningsCount}`,
  );
  console.log(
    `[importer] fetchStats fetched=${summary.fetchStats.fetchedRecords} normalized=${summary.fetchStats.normalizedRecords} skipped=${summary.fetchStats.skippedRecords} missingAddress=${summary.fetchStats.missingAddressCount} missingMunicipality=${summary.fetchStats.missingMunicipalityCount} missingCoordinates=${summary.fetchStats.missingCoordinatesCount}`,
  );

  for (const warning of summary.warningExamples) {
    console.warn(`[importer] warning ${warning}`);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown importer error.";

  console.error(`[importer] failed: ${message}`);
  process.exit(1);
});
