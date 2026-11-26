/**
 * The shared state machine: the one place a pin, a finished week, a choice and
 * a notice are defined, for all three platforms.
 *
 * Nothing in this package touches a browser, a file or a clock it was not
 * handed. The web supplies a localStorage adapter, the apps supply an
 * AsyncStorage one, and this module does not know the difference.
 */
export {
  DRAFT_KEY,
  DRAFT_TTL_DAYS,
  EMPTY_STATE,
  ONBOARDING_STEPS,
  STORAGE_KEY,
  stepsFor,
  type AppState,
  type Choice,
  type CustomAppointment,
  type Notice,
  type OnboardingDraft,
  type OnboardingStep,
  type Pin,
  type ProgressEntry,
  type ProgressSnapshot,
  type ProgressStatus,
  type SnoozedEntry,
  type WeekCompletion,
} from "./model";
export {
  decodeDraft,
  decodeState,
  migrateAppointments,
  migrateChoices,
  migrateCompleted,
  migrateNotifications,
  migrateNotices,
  migratePins,
  migrateReminded,
  migrateSnoozed,
} from "./migrate";
export { createStore, type Store } from "./store";
export { memoryIO, type StoreIO } from "./io";
export {
  chosenOption,
  isDone,
  isPinned,
  isSkipped,
  isSnoozed,
  isWeekComplete,
  stageInput,
  visibleNotices,
  type StageInputValue,
} from "./selectors";
export {
  DEFAULT_NOTIFICATIONS,
  FREQUENCY_WEEKS,
  NOTIFICATION_FREQUENCIES,
  NOTIFICATION_KINDS,
  SEND_REASON_COPY,
  isQuietHour,
  shouldSend,
  type NotificationFrequency,
  type NotificationKind,
  type NotificationPrefs,
  type SendContext,
  type SendReason,
} from "./notifications";
export {
  CONTRASTS,
  DEFAULT_READING,
  LETTERS,
  MOTIONS,
  READING_ATTRIBUTES,
  READING_STORAGE_KEY,
  applyReading,
  migrateReading,
  readingAttributes,
  readingBootstrapScript,
  type Contrast,
  type Letters,
  type Motion,
  type ReadingPrefs,
} from "./reading";
export {
  DEFAULT_HUMOUR,
  DEFAULT_PERSONA,
  PERSONA_NOTE,
  PERSONA_ORDER,
  dateQuestion,
  migrateHumour,
  migratePersona,
  statusOptions,
  type DateQuestion,
} from "./persona";
export {
  REMINDER_KINDS,
  addDays,
  dueReminders,
  localDate,
  reminderKey,
  unseen,
  wouldPush,
  type Reminder,
  type ReminderKind,
  type ReminderSources,
} from "./reminders";
export { resolvePins, type ResolvedPin } from "./pins";
export { settledIds, weekProgress, type WeekProgress, type WeekRef, type WeekStatus } from "./week";
export {
  LATER_DIALOG,
  LATER_OPTIONS,
  SKIP_DIALOG,
  SKIP_REASONS,
  STEP_PRIORITY_LABEL,
  STEPS_SUBTITLE,
  catchUpToggle,
  hiddenNotice,
  minutesLabel,
  setAsideNotice,
  stepStatusLabel,
  stepsHeading,
  type StepReason,
} from "./week-copy";
export { datedAppointments, type DatedItem } from "./appointments";
export {
  currentMatches,
  newMatches,
  subjectFrom,
  syncNotices,
  updatesFor,
  type AgeUpdate,
  type AgeUpdates,
} from "./recalls";
