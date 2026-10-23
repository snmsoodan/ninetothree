import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ARTICLES } from "../article-registry";
import { loadChecklists } from "../checklists";
import {
  lintArticles,
  lintChecklists,
  lintLinks,
  lintPacks,
  lintRecalls,
  lintTriages,
  type LintFinding,
} from "../lint";
import { LINKS } from "../link-registry";
import { loadPacks } from "../loader";
import { RECALLS } from "../recall-registry";
import { paths } from "../triage";
import { TRIAGE } from "../triage-registry";

/** Every JSON content directory is read the same way, so a finding names a file. */
function readDir(name: string): { file: string; data: unknown }[] {
  const dir = join(import.meta.dirname, "..", "..", name);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.flatMap((file) => {
    const text = readFileSync(join(dir, file), "utf8");
    try {
      return [{ file, data: JSON.parse(text) as unknown }];
    } catch (error) {
      console.error(`✗ ${file}: invalid JSON — ${(error as Error).message}`);
      process.exitCode = 1;
      return [];
    }
  });
}

const parsed = readDir("packs");
const { packs, issues } = loadPacks(parsed.map((r) => r.data));

const checklistFiles = readDir("checklists");
const { checklists, issues: checklistIssues } = loadChecklists(checklistFiles.map((r) => r.data));

/** A finding names the file, not just the pack id, so the fix is one click away. */
const fileFor = new Map<string, string>();
for (const entry of [...parsed, ...checklistFiles]) {
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

if (checklistIssues.length > 0) {
  console.error(`\n✗ ${checklistIssues.length} checklist problem(s):\n`);
  for (const issue of checklistIssues) {
    const where = fileFor.get(issue.checklistId) ?? issue.checklistId;
    console.error(`  ${where} → ${issue.path}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`✓ ${checklists.length} checklists valid`);
  for (const checklist of checklists) {
    const items = checklist.sections.reduce((n, section) => n + section.items.length, 0);
    console.log(
      `  ${checklist.id.padEnd(22)} ${String(checklist.sections.length)} sections · ${String(items)} items · ${String(checklist.sources.length)} sources`,
    );
  }
}

report(lintPacks(packs), "content lint problem(s)");
report(lintLinks(LINKS), "catalogue lint problem(s)");
report(lintArticles(ARTICLES), "article lint problem(s)");
report(lintChecklists(checklists), "checklist lint problem(s)");
report(lintTriages([TRIAGE]), "triage lint problem(s)");
report(lintRecalls(RECALLS), "recall lint problem(s)");

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

  console.log(`✓ ${RECALLS.length} recalls, none of them promising anything`);
  for (const recall of RECALLS) {
    const matches = [
      ...recall.matches.optionIds,
      ...recall.matches.actionIds,
      ...recall.matches.keywords,
    ];
    console.log(
      `  ${recall.id.padEnd(14)} ${recall.severity.padEnd(9)} ${recall.publishedAt} · matches ${String(matches.length)}`,
    );
  }
}
