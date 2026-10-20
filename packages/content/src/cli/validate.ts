import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadPacks } from "../loader";

const dir = join(import.meta.dirname, "..", "..", "packs");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

const raw = files.map((file) => {
  const text = readFileSync(join(dir, file), "utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    console.error(`✗ ${file}: invalid JSON — ${(error as Error).message}`);
    process.exitCode = 1;
    return null;
  }
});

const { packs, issues } = loadPacks(raw.filter((r) => r !== null));

if (issues.length > 0) {
  console.error(`\n✗ ${issues.length} content problem(s):\n`);
  for (const issue of issues) {
    console.error(`  ${issue.packId} → ${issue.path}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`✓ ${packs.length} stage packs valid`);
  for (const pack of packs) {
    const actions = pack.coreActions.length;
    const flags = pack.redFlags.length;
    const sources = pack.sources.length;
    console.log(
      `  ${pack.id.padEnd(22)} ${String(actions)} actions · ${String(flags)} red flags · ${String(sources)} sources`,
    );
  }
}
