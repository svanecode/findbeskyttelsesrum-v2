import { FixtureOfficialSourceAdapter } from "@/lib/importer/adapters/fixture-adapter";
import { DatafordelerOfficialSourceAdapter } from "@/lib/importer/adapters/datafordeler-official-adapter";
import { fixtureSnapshotNames } from "@/lib/importer/fixtures/shelter-fixtures";
import { runOfficialImporter } from "@/lib/importer/service";

function getMode() {
  return process.argv[2] ?? "fixture";
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

  console.log(`[importer] mode=${mode} source=${adapter.sourceName} snapshot=${snapshotName}`);
  const summary = await runOfficialImporter({
    adapter,
    snapshotName,
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown importer error.";

  console.error(`[importer] failed: ${message}`);
  process.exit(1);
});
