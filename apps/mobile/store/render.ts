/**
 * The store facts, rendered from one file.
 *
 * `store.json` is the source. Apple's privacy manifest in `app.json`, the
 * `PrivacyInfo.xcprivacy` that ships beside it, the Play data-safety answers and
 * both listings are all views of that file, the same way `tokens.css` is a view
 * of `tokens.ts`. Two stores that disagree about what the app collects is the
 * failure this exists to prevent, and it is a failure nobody notices until a
 * submission is rejected.
 *
 * Everything here is pure. `index.ts` reads and writes; this file decides.
 */

export interface ScreenshotScene {
  /** Stable name, so a missing capture is attributable. */
  id: string;
  screen: string;
  headline: string;
  sub: string;
  shows: string;
}

export interface Permission {
  platform: "ios" | "android";
  /** The plist key, e.g. `NSPhotoLibraryAddUsageDescription`. */
  key: string;
  /** The sentence the system shows. A parent has to understand it. */
  value: string;
  why: string;
}

export interface StoreSource {
  app: {
    name: string;
    iosBundleId: string;
    androidPackage: string;
    version: string;
    copyright: string;
    supportUrl: string;
    marketingUrl: string;
    privacyUrl: string;
    iosCategory: string;
    androidCategory: string;
  };
  privacy: {
    tracking: boolean;
    collected: {
      /** Manifest suffix, e.g. `EmailAddress`. */
      type: string;
      linked: boolean;
      tracking: boolean;
      /** Manifest suffixes, e.g. `AppFunctionality`. */
      purposes: string[];
      why: string;
    }[];
    accessed: { category: string; reasons: string[]; why: string }[];
  };
  permissions: Permission[];
  listing: {
    ios: {
      title: string;
      subtitle: string;
      keywords: string;
      promotionalText: string;
      description: string;
      whatsNew: string;
      supportUrl: string;
      marketingUrl: string;
      privacyUrl: string;
    };
    android: {
      title: string;
      shortDescription: string;
      fullDescription: string;
      whatsNew: string;
      contactEmail: string;
      privacyUrl: string;
    };
  };
  screenshots: ScreenshotScene[];
}

/**
 * The sizes both stores accept without a conversation. Compact is the phone,
 * expanded is the tablet, and each of the six scenes is captured at both, which
 * is what "six screenshots per platform at compact and expanded" means.
 */
export const SCREENSHOT_SIZES = {
  ios: {
    compact: { width: 1320, height: 2868 },
    expanded: { width: 2064, height: 2752 },
  },
  android: {
    compact: { width: 1080, height: 1920 },
    expanded: { width: 1600, height: 2560 },
  },
} as const;

/** What the stores will reject. Kept as numbers so the check can print them. */
export const LIMITS = {
  ios: { title: 30, subtitle: 30, keywords: 100, promotionalText: 170, description: 4000 },
  android: { title: 30, shortDescription: 80, fullDescription: 4000 },
  screenshot: { scenes: 6, headline: 34, sub: 72 },
  permission: { value: 240 },
} as const;

const PRIVACY_PREFIX = "NSPrivacyCollectedDataType";
const PURPOSE_PREFIX = "NSPrivacyCollectedDataTypePurpose";
const ACCESSED_PREFIX = "NSPrivacyAccessedAPICategory";

export interface PrivacyManifest {
  NSPrivacyTracking: boolean;
  NSPrivacyCollectedDataTypes: {
    NSPrivacyCollectedDataType: string;
    NSPrivacyCollectedDataTypeLinked: boolean;
    NSPrivacyCollectedDataTypeTracking: boolean;
    NSPrivacyCollectedDataTypePurposes: string[];
  }[];
  NSPrivacyAccessedAPITypes: {
    NSPrivacyAccessedAPIType: string;
    NSPrivacyAccessedAPITypeReasons: string[];
  }[];
}

/**
 * The object that goes into `app.json` as `ios.privacyManifest`. Expo compiles
 * this into the app's `PrivacyInfo.xcprivacy`, and `renderPrivacyInfo` writes
 * the same manifest as the file a reviewer can read without a build.
 */
export function renderPrivacyManifest(source: StoreSource): PrivacyManifest {
  return {
    NSPrivacyTracking: source.privacy.tracking,
    NSPrivacyCollectedDataTypes: source.privacy.collected.map((entry) => ({
      NSPrivacyCollectedDataType: `${PRIVACY_PREFIX}${entry.type}`,
      NSPrivacyCollectedDataTypeLinked: entry.linked,
      NSPrivacyCollectedDataTypeTracking: entry.tracking,
      NSPrivacyCollectedDataTypePurposes: entry.purposes.map(
        (pupose) => `${PURPOSE_PREFIX}${pupose}`,
      ),
    })),
    NSPrivacyAccessedAPITypes: source.privacy.accessed.map((entry) => ({
      NSPrivacyAccessedAPIType: `${ACCESSED_PREFIX}${entry.category}`,
      NSPrivacyAccessedAPITypeReasons: [...entry.reasons],
    })),
  };
}

/** The plist keys Expo reads from `ios.infoPlist`, derived from the same facts. */
export function renderInfoPlist(source: StoreSource): Record<string, string | boolean> {
  const plist: Record<string, string | boolean> = {
    // Nothing in this app ships a cipher that a US export rule asks about.
    ITSAppUsesNonExemptEncryption: false,
  };
  for (const permission of source.permissions) {
    if (permission.platform === "ios") plist[permission.key] = permission.value;
  }
  return plist;
}

function xml(value: unknown, depth: number): string {
  const pad = "\t".repeat(depth);
  if (typeof value === "boolean") return `${pad}<${value ? "true" : "false"}/>`;
  if (typeof value === "string") return `${pad}<string>${escapeXml(value)}</string>`;
  if (typeof value === "number") return `${pad}<integer>${value}</integer>`;
  if (Array.isArray(value)) {
    const inner = value.map((item) => xml(item, depth + 1)).join("\n");
    return `${pad}<array>\n${inner}\n${pad}</array>`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const inner = entries
    .map(([key, item]) => `${pad}\t<key>${escapeXml(key)}</key>\n${xml(item, depth + 1)}`)
    .join("\n");
  return `${pad}<dict>\n${inner}\n${pad}</dict>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * The file Apple reads. Tab indentation and key order are Xcode's, so a
 * person diffing this against a generated one sees nothing but real changes.
 */
export function renderPrivacyInfo(source: StoreSource): string {
  const body = xml(renderPrivacyManifest(source), 0);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    body,
    "</plist>",
    "",
  ].join("\n");
}

function bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

function table(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [head, rule, body].join("\n");
}

function collectedLabel(type: string): string {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** The Play Console answers, in the words the form asks for. */
export function renderDataSafety(source: StoreSource): string {
  const collected = source.privacy.collected.map((entry) => [
    collectedLabel(entry.type),
    "Yes",
    "No",
    entry.linked ? "Yes" : "No",
    entry.purposes.map((purpose) => purpose.replace(/([a-z])([A-Z])/g, "$1 $2")).join(", "),
  ]);
  const answers: [string, string][] = [
    [
      "Does your app collect or share any of the required user data types?",
      source.privacy.collected.length > 0 ? "Yes" : "No",
    ],
    ["Is all of the user data collected by your app encrypted in transit?", "Yes"],
    ["Do you provide a way for users to request that their data be deleted?", "Yes"],
    [
      "Where can users request deletion?",
      `${source.app.privacyUrl} and ${source.listing.android.contactEmail}`,
    ],
    ["Does your app share user data with third parties?", "No"],
    ["Does your app use data for advertising or marketing?", "No"],
    ["Does your app track users across apps or websites?", source.privacy.tracking ? "Yes" : "No"],
    ["Is the app directed to children?", "No. It is written for parents and expectant parents."],
    ["Does the app contain ads?", "No"],
  ];
  const accessed = source.privacy.accessed.map((entry) => [
    entry.category.replace(/([a-z])([A-Z])/g, "$1 $2"),
    entry.reasons.join(", "),
    entry.why,
  ]);

  return [
    "# Play data safety",
    "",
    "Generated from `apps/mobile/store/store.json` by `pnpm --filter @ninetothree/mobile store`.",
    "Do not edit this file; edit the source and re-run the command.",
    "",
    "## What is collected",
    "",
    table(["Data type", "Collected", "Shared", "Linked to a person", "Purpose"], collected),
    "",
    "Nothing else leaves the phone. The shelf, the settings, the cached weeks and the",
    "session live in the app's own storage and are deleted when the app is uninstalled",
    "or you sign out.",
    "",
    "## Why each Apple required-reason API is called",
    "",
    "Play does not ask for this, and it is here because a reviewer comparing the two",
    "stores should see the same list in both places.",
    "",
    table(
      ["Category", "Reason", "Why the app calls it"],
      [
        ...accessed,
        [
          "No other API",
          "None",
          "No contacts, photos, camera, microphone, location, health data or advertising identifier is read.",
        ],
      ],
    ),
    "",
    "## Answers to paste into Play Console",
    "",
    table(
      ["Question", "Answer"],
      answers.map(([question, answer]) => [question, answer]),
    ),
    "",
    `Support: ${source.listing.android.contactEmail}. Privacy policy: ${source.app.privacyUrl}.`,
    "",
  ].join("\n");
}

/** Both listings, with the store's own character counts, in one readable file. */
export function renderListing(source: StoreSource): string {
  const ios = source.listing.ios;
  const android = source.listing.android;
  const count = (label: string, value: string, limit: number) =>
    `**${label}** (${[...value].length}/${limit}): ${value}`;

  return [
    "# Store listings",
    "",
    "Generated from `apps/mobile/store/store.json` by `pnpm --filter @ninetothree/mobile store`.",
    "Do not edit this file; edit the source and re-run the command.",
    "",
    "## App Store",
    "",
    `- ${count("Name", ios.title, LIMITS.ios.title)}`,
    `- ${count("Subtitle", ios.subtitle, LIMITS.ios.subtitle)}`,
    `- **Keywords** (${bytes(ios.keywords)}/${LIMITS.ios.keywords} bytes): ${ios.keywords}`,
    `- ${count("Promotional text", ios.promotionalText, LIMITS.ios.promotionalText)}`,
    `- **Category:** ${source.app.iosCategory}`,
    `- **Support:** ${ios.supportUrl}`,
    `- **Marketing:** ${ios.marketingUrl}`,
    `- **Privacy:** ${ios.privacyUrl}`,
    `- **Copyright:** ${source.app.copyright}`,
    "",
    "### Description",
    "",
    ios.description,
    "",
    "### What is new",
    "",
    ios.whatsNew,
    "",
    "## Google Play",
    "",
    `- ${count("Title", android.title, LIMITS.android.title)}`,
    `- ${count("Short description", android.shortDescription, LIMITS.android.shortDescription)}`,
    `- **Category:** ${source.app.androidCategory}`,
    `- **Contact:** ${android.contactEmail}`,
    `- **Privacy:** ${android.privacyUrl}`,
    "",
    "### Full description",
    "",
    android.fullDescription,
    "",
    "### What is new",
    "",
    android.whatsNew,
    "",
    "## The same product, twice",
    "",
    "Both descriptions say what the app does, that it costs nothing, and that it is",
    "not a substitute for a provider. Neither promises an outcome. If you change one,",
    "change the other in the same commit, or the two stores will describe two apps.",
    "",
  ].join("\n");
}

/** The six frames, and the pixel sizes that will not be rejected. */
export function renderScreenshots(source: StoreSource): string {
  const scenes = source.screenshots.map((scene, index) => [
    String(index + 1),
    scene.screen,
    scene.headline,
    scene.sub,
  ]);
  const sizes = (["ios", "android"] as const).map((platform) => {
    const { compact, expanded } = SCREENSHOT_SIZES[platform];
    return [
      platform === "ios" ? "App Store" : "Google Play",
      `${compact.width}x${compact.height}`,
      `${expanded.width}x${expanded.height}`,
    ];
  });
  const overlays = source.screenshots.map((scene) => [
    `${scene.headline}  /  ${scene.sub}`,
    scene.shows,
  ]);

  return [
    "# Listing screenshots",
    "",
    "Generated from `apps/mobile/store/store.json` by `pnpm --filter @ninetothree/mobile store`.",
    "Do not edit this file; edit the source and re-run the command.",
    "",
    `Six scenes, captured twice: compact for a phone, expanded for a tablet, for both`,
    `stores. That is ${LIMITS.screenshot.scenes * 2 * 2} files, named`,
    "`<platform>-<compact|expanded>-<id>.png`.",
    "",
    table(["#", "Screen", "Headline", "Sub"], scenes),
    "",
    "## Sizes",
    "",
    table(["Store", "Compact", "Expanded"], sizes),
    "",
    "A capture is a real device frame with the app running, not a mock. The same six",
    "scenes in the same order on both stores, so a person comparing them sees one product.",
    "",
    "## Overlay copy",
    "",
    table(["Line", "What the frame shows"], overlays),
    "",
    "## How to capture",
    "",
    "No simulator exists on this machine, so these are the steps rather than the files.",
    "`EVIDENCE.md` §88 records that gap.",
    "",
    "1. `pnpm --filter @ninetothree/mobile start` and open the app on a 6.9 inch iPhone",
    "   and a 13 inch iPad. Sign in with a test household that has a pregnancy and a",
    "   child, so the shelf and Together have something to show.",
    "2. For each row above, open the named screen and take a screenshot. The status bar",
    "   should show a full battery and a plausible time; crop it to the size in the table.",
    "3. Repeat on a 1080x1920 Android phone and a 1600x2560 tablet.",
    "4. Put the files in `apps/mobile/store/screenshots/`, named as above. Nothing in CI",
    "   can check them, so the release checklist in `RUNBOOK.md` §16 is the gate.",
    "",
  ].join("\n");
}

/** Every generated file, keyed by its name inside `apps/mobile/store/`. */
export function renderStore(source: StoreSource): Record<string, string> {
  return {
    "PrivacyInfo.xcprivacy": renderPrivacyInfo(source),
    "DATA-SAFETY.md": renderDataSafety(source),
    "LISTING.md": renderListing(source),
    "SCREENSHOTS.md": renderScreenshots(source),
  };
}

function chars(value: string): number {
  return [...value].length;
}

/** What would make a submission bounce, in the source itself. */
export function findings(source: StoreSource): string[] {
  const problems: string[] = [];
  const ios = source.listing.ios;
  const android = source.listing.android;
  const check = (where: string, length: number, limit: number) => {
    if (length > limit) problems.push(`${where} is ${length} characters; the limit is ${limit}`);
  };

  check("App Store name", chars(ios.title), LIMITS.ios.title);
  check("App Store subtitle", chars(ios.subtitle), LIMITS.ios.subtitle);
  check("App Store keywords", bytes(ios.keywords), LIMITS.ios.keywords);
  check("App Store promotional text", chars(ios.promotionalText), LIMITS.ios.promotionalText);
  check("App Store description", chars(ios.description), LIMITS.ios.description);
  check("Play title", chars(android.title), LIMITS.android.title);
  check("Play short description", chars(android.shortDescription), LIMITS.android.shortDescription);
  check("Play full description", chars(android.fullDescription), LIMITS.android.fullDescription);

  if (source.screenshots.length !== LIMITS.screenshot.scenes) {
    problems.push(
      `${source.screenshots.length} screenshot scenes; both stores want ${LIMITS.screenshot.scenes}`,
    );
  }
  const ids = new Set<string>();
  for (const scene of source.screenshots) {
    if (ids.has(scene.id)) problems.push(`two screenshots share the id ${scene.id}`);
    ids.add(scene.id);
    check(`screenshot ${scene.id} headline`, chars(scene.headline), LIMITS.screenshot.headline);
    check(`screenshot ${scene.id} sub`, chars(scene.sub), LIMITS.screenshot.sub);
  }

  for (const permission of source.permissions) {
    check(`permission ${permission.key}`, chars(permission.value), LIMITS.permission.value);
    if (permission.platform === "ios" && !permission.key.endsWith("UsageDescription")) {
      problems.push(`${permission.key} is not an iOS usage description`);
    }
  }

  if (!source.privacy.tracking && source.privacy.collected.some((entry) => entry.tracking)) {
    problems.push("the manifest says no tracking, but a collected type says it tracks");
  }
  if (source.app.iosBundleId !== source.app.androidPackage) {
    problems.push("the two platforms are two apps; use one identifier unless that is deliberate");
  }
  return problems;
}

/** Whether `app.json` still agrees with the source. */
export function appConfigFindings(source: StoreSource, appConfig: unknown): string[] {
  const problems: string[] = [];
  const expo = (appConfig as { expo?: Record<string, unknown> } | null)?.expo;
  if (!expo) return ["app.json has no expo object"];
  const ios = (expo.ios ?? {}) as Record<string, unknown>;
  const android = (expo.android ?? {}) as Record<string, unknown>;

  const expect = (where: string, actual: unknown, wanted: unknown) => {
    if (stable(actual) !== stable(wanted)) {
      problems.push(
        `${where} is ${JSON.stringify(actual)}; store.json says ${JSON.stringify(wanted)}`,
      );
    }
  };

  expect("expo.name", expo.name, source.app.name);
  expect("expo.version", expo.version, source.app.version);
  expect("expo.ios.bundleIdentifier", ios.bundleIdentifier, source.app.iosBundleId);
  expect("expo.android.package", android.package, source.app.androidPackage);
  expect("expo.ios.privacyManifest", ios.privacyManifest, renderPrivacyManifest(source));
  expect("expo.ios.infoPlist", ios.infoPlist, renderInfoPlist(source));
  return problems;
}

/** Whether `eas.json` can produce the three artefacts the checklist names. */
export function easFindings(easConfig: unknown): string[] {
  const problems: string[] = [];
  const eas = easConfig as {
    build?: Record<string, Record<string, unknown>>;
    submit?: Record<string, unknown>;
  } | null;
  if (!eas?.build) return ["eas.json has no build object"];

  const development = eas.build.development;
  if (!development) problems.push("eas.json has no development profile");
  else if (development.developmentClient !== true || development.distribution !== "internal") {
    problems.push("the development profile needs developmentClient true and internal distribution");
  }

  const preview = eas.build.preview;
  if (!preview) problems.push("eas.json has no preview profile");
  else {
    if (preview.distribution !== "internal") problems.push("the preview profile must be internal");
    const android = (preview.android ?? {}) as Record<string, unknown>;
    if (android.buildType !== "apk") problems.push("the preview profile should build an apk");
  }

  const production = eas.build.production;
  if (!production) problems.push("eas.json has no production profile");
  else if (production.autoIncrement !== true) {
    problems.push("the production profile should increment the build number");
  }
  if (!eas.submit?.production) problems.push("eas.json cannot submit the production build");
  return problems;
}

/** Key order and JSON formatting are not facts; these two objects are equal. */
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
