/**
 * Everything in the content package that is not the content itself.
 *
 * The main entry point re-exports the registries — `PACKS`, `LINKS`,
 * `ARTICLES`, `CHECKLISTS`, `TRIAGE`, `RECALLS` — and those are module-level
 * arrays built from 85 JSON files. Importing anything from the main entry
 * therefore puts the whole library in the bundle, which is fine on the server
 * and wrong in a browser: a client component that needs `recallKey` should not
 * download every stage pack to get it.
 *
 * This entry point is the schemas, the pure functions and the types, with no
 * data behind them. Client modules import from here; server modules import
 * from the main entry.
 */
export * from "./schema";
export {
  loadPacks,
  sortPacks,
  assertValidPacks,
  findPackForStage,
  nextPack,
  previousPack,
  findAction,
  type LoadResult,
  type PackIssue,
} from "./loader";
export {
  LINK_TYPES,
  LinkType,
  PLATFORMS,
  Platform,
  StageRef,
  stageOrdinal,
  LinkEntry,
  loadLinks,
  assertValidLinks,
  linksForStage,
  linksForDomain,
  searchLinks,
  groupByType,
  type LinkIssue,
  type LinkLoadResult,
} from "./links";
export {
  MAX_GRADE,
  readingGrade,
  proseFields,
  lintPack,
  lintPacks,
  lintLink,
  lintLinks,
  lintArticle,
  lintArticles,
  lintChecklist,
  lintChecklists,
  type LintRule,
  type LintFinding,
} from "./lint";
export {
  Article,
  loadArticles,
  assertValidArticles,
  articleProse,
  articlesForStage,
  articlesForAction,
  articleHref,
  type ArticleIssue,
  type ArticleLoadResult,
} from "./articles";
export {
  Checklist,
  ChecklistItem,
  ChecklistSection,
  loadChecklists,
  assertValidChecklists,
  checklistProse,
  checklistsForStage,
  checklistHref,
  checklistCount,
  type ChecklistIssue,
  type ChecklistLoadResult,
} from "./checklists";
export { LOCALES, DEFAULT_LOCALE, localeData, dirFor, intlFor, type LocaleData } from "./locales";
export { POLICIES, POLICIES_EFFECTIVE, CORRECTIONS, CORRECTION_WINDOWS } from "./policies";
export type { PolicyLink, Correction } from "./policies";
export {
  SCHEDULES,
  ENABLED_LOCALES,
  US_SCHEDULE,
  UK_SCHEDULE,
  appointmentsFor,
  buildIcs,
  dateForWeek,
  scheduleFor,
} from "./schedule";
export type {
  AppointmentStatus,
  AppointmentsOptions,
  DatedAppointment,
  Locale,
  Schedule,
  ScheduleEntry,
} from "./schedule";
export {
  STOPWORDS,
  FUZZY_FLOOR,
  parseQuery,
  trigrams,
  similarity,
  search,
  buildIndex,
  type SearchDoc,
  type SearchHit,
  type SearchKind,
} from "./search";
export {
  Chooser,
  ChooserAnswer,
  ChooserQuestion,
  ChooserRecommendation,
  choose,
  chooserIssues,
  type ChooserAnswers,
  type ChooserResult,
} from "./chooser";
export {
  TRIAGE_KINDS,
  TriageKind,
  TriageAnswer,
  TriageNode,
  TriageResult,
  TriageTree,
  EMERGENCY_ESCALATIONS,
  WATCH_ESCALATIONS,
  REASSURANCE,
  treeIssues,
  walk,
  paths,
  walkAnswers,
  nextNode,
  encodePath,
  decodePath,
  reassuranceIn,
  type TriagePath,
  type TriageStep,
} from "./triage";
export {
  RECALL_SEVERITIES,
  RECALL_BECAUSES,
  RecallMatches,
  Recall,
  recallIssues,
  loadRecalls,
  assertValidRecalls,
  matchRecalls,
  recallKey,
  type RecallSeverity,
  type RecallBecause,
  type RecallIssue,
  type RecallSubject,
  type RecallMatch,
} from "./recalls";
