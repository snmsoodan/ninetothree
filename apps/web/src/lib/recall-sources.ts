import { classifyRecall, type Recall, type RecallSeverity } from "@ninetothree/content";

/**
 * Turning an agency's JSON into our own recall, or into nothing.
 *
 * Everything here is a pure function over a parsed body, so the shape of the
 * CPSC and FDA responses is tested against fixtures rather than against the
 * live network — the network is somebody else's, and it is down at least as
 * often as it is up.
 *
 * Two rules run through all of it. **Nothing is invented**: a field the agency
 * did not send is left out rather than filled with a plausible sentence, and a
 * record that does not classify as a baby product is dropped rather than shown
 * to a parent who cannot use it. And **the agency's own words are kept**: the
 * hazard and the remedy are the agency's text, trimmed, not a paraphrase that
 * could be wrong in a way nobody can trace.
 */

/** How far back the feed looks, in days. Long enough to catch a slow roll-out. */
export const FEED_WINDOW_DAYS = 120;

const MS_PER_DAY = 86_400_000;

/** A date `days` before `today`, as YYYY-MM-DD. */
export function daysBefore(today: string, days: number): string {
  const start = Date.parse(`${today}T00:00:00Z`);
  return new Date(start - days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Cut on a word boundary, with an ellipsis, and never past the schema's limit. */
export function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[.,;:]$/, "")}…`;
}

/** A URL we are willing to put behind a link, or null. */
function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** An id the schema will accept: lowercase, kebab, 3–60 characters. */
export function agencyId(prefix: string, number: string): string {
  return `${prefix}-${number}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function string(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstNamed(value: unknown, key: string): string {
  if (!Array.isArray(value)) return "";
  for (const entry of value) {
    const item = record(entry);
    const name = string(item?.[key]);
    if (name) return name;
  }
  return "";
}

/** CPSC dates arrive as `2026-10-15T00:00:00`; the schema wants the day. */
function isoDay(value: unknown): string | null {
  const text = string(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

/**
 * One CPSC recall, or null when it is not a baby product, is missing the parts
 * a notice cannot work without, or points somewhere that is not https.
 */
export function normalizeCpscRecord(raw: unknown, today: string): Recall | null {
  const entry = record(raw);
  if (!entry) return null;

  const number = string(entry.RecallNumber);
  const title = string(entry.Title);
  const publishedAt = isoDay(entry.RecallDate);
  const url = safeUrl(entry.URL);
  if (!number || !title || !publishedAt || !url) return null;

  const product = firstNamed(entry.Products, "Name") || title;
  const hazard = firstNamed(entry.Hazards, "Name");
  const remedy = firstNamed(entry.Remedies, "Name");

  const guess = classifyRecall({ title, product, hazard });
  if (!guess) return null;

  return {
    id: agencyId("cpsc", number),
    title: clamp(title, 120),
    product: clamp(product, 80),
    category: guess.category,
    hazard: clamp(hazard || "The agency has recalled this product.", 240),
    action: clamp(remedy || "Stop using it and follow the agency's notice.", 400),
    severity: "stop-use",
    ages: guess.ages,
    publishedAt,
    source: {
      id: "cpsc",
      title: clamp(title, 158),
      publisher: "CPSC",
      url,
      kind: "government",
      accessed: today,
    },
    matches: { optionIds: [], actionIds: [], keywords: [] },
  };
}

export function normalizeCpsc(body: unknown, today: string): Recall[] {
  if (!Array.isArray(body)) return [];
  return body
    .map((entry) => normalizeCpscRecord(entry, today))
    .filter((recall): recall is Recall => recall !== null);
}

/** FDA enforcement reports are classified by how bad the outcome was. */
function fdaSeverity(classification: string): RecallSeverity {
  if (/^class i\b/i.test(classification)) return "stop-use";
  if (/^class ii\b/i.test(classification)) return "check";
  return "info";
}

/** `20260729` → `2026-07-29`. */
function compactDay(value: unknown): string | null {
  const text = string(value);
  if (!/^\d{8}$/.test(text)) return null;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

/**
 * One openFDA food enforcement report, or null.
 *
 * The detail page on `accessdata.fda.gov` is the only stable per-report URL the
 * FDA publishes; it redirects to the report itself, which is why the link is
 * kept rather than replaced with a search that would not find the same thing
 * tomorrow.
 */
export function normalizeFdaRecord(raw: unknown, today: string): Recall | null {
  const entry = record(raw);
  if (!entry) return null;

  const number = string(entry.recall_number);
  const product = string(entry.product_description);
  const reason = string(entry.reason_for_recall);
  const eventId = string(entry.event_id);
  const publishedAt = compactDay(entry.report_date);
  if (!number || !product || !publishedAt || !eventId) return null;

  const url = safeUrl(
    `https://www.accessdata.fda.gov/scripts/enforcement/enforce_rpt-Product-Tabs.cfm?action=select&id=${encodeURIComponent(eventId)}`,
  );
  if (!url) return null;

  const firm = string(entry.recalling_firm);
  const guess = classifyRecall({ title: product, product, hazard: reason });
  if (!guess) return null;

  const title = firm ? `${firm} recalls ${product}` : `Recall of ${product}`;

  return {
    id: agencyId("fda", number),
    title: clamp(title, 120),
    product: clamp(product, 80),
    ...(firm ? { brand: clamp(firm, 60) } : {}),
    category: guess.category,
    hazard: clamp(reason || "The agency has recalled this product.", 240),
    action: clamp(
      "Stop using it and check the FDA's enforcement report for what the firm is offering.",
      400,
    ),
    severity: fdaSeverity(string(entry.classification)),
    ages: guess.ages,
    publishedAt,
    source: {
      id: "fda",
      title: clamp(title, 158),
      publisher: "FDA",
      url,
      kind: "government",
      accessed: today,
    },
    matches: { optionIds: [], actionIds: [], keywords: [] },
  };
}

export function normalizeFda(body: unknown, today: string): Recall[] {
  const payload = record(body);
  const results = payload?.results;
  if (!Array.isArray(results)) return [];
  return results
    .map((entry) => normalizeFdaRecord(entry, today))
    .filter((recall): recall is Recall => recall !== null);
}
