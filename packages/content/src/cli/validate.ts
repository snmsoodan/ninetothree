import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ARTICLES } from "../article-registry";
import { lintArticles, lintLinks, lintPacks, lintTriages, type LintFinding } from "../lint";
import { LINKS } from "../link-registry";
import { loadPacks } from "../loader";
import { paths } from "../triage";
import { TRIAGE } from "../triage-registry";

const packsDir = join(import.meta.dirname, "..", "..", "packs");
const files = readdirSync(packsDir).filter((f) => f.endsWith(".json"));

const raw = files.map((file) => {
  const text = readFileSync(join(packsDir, file), "utf8");
  try {
    return { file, data: JSON.parse(text) as unknown };
  } catch (error) {
    console.error(`✗ ${file}: invalid JSON — ${(error as Error).message}`);
    process.exitCode = 1;
    return null;
  }
});

const parsed = raw.filter((r) => r !== null);
const { packs, issues } = loadPacks(parsed.map((r) => r.data));

/** A finding names the file, not just the pack id, so the fix is one click away. */
const fileFor = new Map<string, string>();
for (const entry of parsed) {
  const id =
    typeof entry.data === "object" && entry.data !== null && "id" in entry.data
      ? String((entry.data as { id: unknown }).id)
      : null;
  if (id) fileFor.set(id, entry.file);
}

function report(findings: LintFinding[], heading: string): void {
  if (findings.length === 0) return;
  console.error(`\n✗ ${findings.length} ${heading}:\n`);
  for (const finding of findings) {
    const where = fileFor.get(finding.subject) ?? finding.subject;
    console.error(`  ${where} → ${finding.path}`);
    console.error(`    ${finding.rule}: ${finding.message}`);
    console.error(`    "${finding.excerpt}"`);
  }
  process.exitCode = 1;
}

if (issues.length > 0) {
  console.error(`\n✗ ${issues.length} content problem(s):\n`);
  for (const issue of issues) {
    const where = fileFor.get(issue.packId) ?? issue.packId;
    console.error(`  ${where} → ${issue.path}: ${issue.message}`);
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

report(lintPacks(packs), "content lint problem(s)");
report(lintLinks(LINKS), "catalogue lint problem(s)");
report(lintArticles(ARTICLES), "article lint problem(s)");
report(lintTriages([TRIAGE]), "triage lint problem(s)");

if (process.exitCode !== 1) {
  console.log(`✓ ${LINKS.length} catalogue entries pass the same lint`);
  console.log(`✓ ${ARTICLES.length} articles pass the same lint`);
  for (const article of ARTICLES) {
    console.log(
      `  ${article.id.padEnd(24)} ${String(article.sources.length)} sources · reviewed ${article.reviewedAt}`,
    );
  }

  const routes = paths(TRIAGE);
  console.log(`✓ ${routes.length} triage paths, none of them reassuring`);
  for (const result of TRIAGE.results) {
    console.log(
      `  ${result.id.padEnd(30)} ${result.kind.padEnd(9)} ${result.escalation.padEnd(20)} reviewed ${result.reviewedAt}`,
    );
  }
}
