import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  appConfigFindings,
  easFindings,
  findings,
  LIMITS,
  renderDataSafety,
  renderInfoPlist,
  renderListing,
  renderPrivacyInfo,
  renderPrivacyManifest,
  renderScreenshots,
  renderStore,
  stable,
  type StoreSource,
} from "./render.ts";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");

function read<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const source = read<StoreSource>(join(here, "store.json"));
const appConfig = read<unknown>(join(app, "app.json"));
const easConfig = read<unknown>(join(app, "eas.json"));

function copy(change: (draft: StoreSource) => Tweak): StoreSource {
  const draft = structuredClone(source);
  change(draft);
  return draft;
}

type Tweak = void;

describe("the store source", () => {
  it("fits both stores' limits and names its six scenes", () => {
    expect(findings(source)).toEqual([]);
    expect(source.screenshots).toHaveLength(LIMITS.screenshot.scenes);
  });

  it("agrees with app.json and eas.json", () => {
    expect(appConfigFindings(source, appConfig)).toEqual([]);
    expect(easFindings(easConfig)).toEqual([]);
  });

  it("would notice a description that does not fit", () => {
    const draft = copy((next) => {
      next.listing.ios.description = "x".repeat(LIMITS.ios.description + 1);
      next.listing.android.shortDescription = "y".repeat(LIMITS.android.shortDescription + 1);
    });
    expect(findings(draft)).toEqual([
      `App Store description is ${LIMITS.ios.description + 1} characters; the limit is ${LIMITS.ios.description}`,
      `Play short description is ${LIMITS.android.shortDescription + 1} characters; the limit is ${LIMITS.android.shortDescription}`,
    ]);
  });

  it("would notice two scenes with one name, or too few", () => {
    const draft = copy((next) => {
      next.screenshots[1]!.id = next.screenshots[0]!.id;
      next.screenshots.pop();
    });
    expect(findings(draft)).toEqual([
      `5 screenshot scenes; both stores want ${LIMITS.screenshot.scenes}`,
      `two screenshots share the id ${source.screenshots[0]!.id}`,
    ]);
  });

  it("would notice a manifest that tracks while the app says it does not", () => {
    const draft = copy((next) => {
      next.privacy.collected[0]!.tracking = true;
    });
    expect(findings(draft)).toContain(
      "the manifest says no tracking, but a collected type says it tracks",
    );
  });

  it("would notice an iOS permission that is not a usage description", () => {
    const draft = copy((next) => {
      next.permissions.push({
        platform: "ios",
        key: "NSAppleMusicUsageDescription",
        value: "x",
        why: "y",
      });
      next.permissions.push({
        platform: "ios",
        key: "NSCamera",
        value: "z",
        why: "y",
      });
    });
    expect(findings(draft)).toEqual(["NSCamera is not an iOS usage description"]);
  });
});

describe("the Apple manifest", () => {
  it("names both collected types and all four required-reason APIs", () => {
    const manifest = renderPrivacyManifest(source);
    expect(manifest.NSPrivacyTracking).toBe(false);
    expect(
      manifest.NSPrivacyCollectedDataTypes.map((entry) => entry.NSPrivacyCollectedDataType),
    ).toEqual(["NSPrivacyCollectedDataTypeEmailAddress", "NSPrivacyCollectedDataTypeName"]);
    expect(
      manifest.NSPrivacyAccessedAPITypes.map((entry) => entry.NSPrivacyAccessedAPIType),
    ).toEqual([
      "NSPrivacyAccessedAPICategoryFileTimestamp",
      "NSPrivacyAccessedAPICategoryUserDefaults",
      "NSPrivacyAccessedAPICategorySystemBootTime",
      "NSPrivacyAccessedAPICategoryDiskSpace",
    ]);
    expect(manifest.NSPrivacyCollectedDataTypes[0]!.NSPrivacyCollectedDataTypePurposes).toEqual([
      "NSPrivacyCollectedDataTypePurposeAppFunctionality",
    ]);
  });

  it("renders a plist Xcode can read", () => {
    const plist = renderPrivacyInfo(source);
    expect(plist.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(plist).toContain("<key>NSPrivacyTracking</key>\n\t<false/>");
    expect(plist).toContain("<string>NSPrivacyCollectedDataTypeEmailAddress</string>");
    expect(plist).toContain("<string>C617.1</string>");
    expect(plist.endsWith("</plist>\n")).toBe(true);
  });

  it("declares no encryption question and no permission the app does not ask for", () => {
    expect(renderInfoPlist(source)).toEqual({ ITSAppUsesNonExemptEncryption: false });
  });

  it("passes an iOS usage description through to Info.plist when one is added", () => {
    const draft = copy((next) => {
      next.permissions.push({
        platform: "ios",
        key: "NSCameraUsageDescription",
        value: "To photograph a bottle.",
        why: "Not used today.",
      });
      next.permissions.push({
        platform: "android",
        key: "POST_NOTIFICATIONS",
        value: "Reminders.",
        why: "Not used today.",
      });
    });
    expect(renderInfoPlist(draft)).toEqual({
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "To photograph a bottle.",
    });
  });
});

describe("the Play answers", () => {
  it("says what is collected, that nothing is shared, and how to be deleted", () => {
    const doc = renderDataSafety(source);
    expect(doc).toContain("| Email Address | Yes | No | Yes | App Functionality |");
    expect(doc).toContain("| Does your app share user data with third parties? | No |");
    expect(doc).toContain("| Does your app track users across apps or websites? | No |");
    expect(doc).toContain(`${source.app.privacyUrl} and ${source.listing.android.contactEmail}`);
    expect(doc).toContain("No contacts, photos, camera, microphone, location, health data");
  });
});

describe("the listings", () => {
  it("prints the count against each limit", () => {
    const doc = renderListing(source);
    expect(doc).toContain(
      `**Name** (${[...source.listing.ios.title].length}/${LIMITS.ios.title}): ${source.listing.ios.title}`,
    );
    expect(doc).toContain(
      `**Short description** (${[...source.listing.android.shortDescription].length}/${LIMITS.android.shortDescription})`,
    );
    expect(doc).toContain(source.listing.android.fullDescription);
  });

  it("counts keywords in bytes, because App Store Connect does", () => {
    const doc = renderListing(source);
    expect(doc).toContain(
      `**Keywords** (${new TextEncoder().encode(source.listing.ios.keywords).length}/100 bytes)`,
    );
  });
});

describe("the screenshot brief", () => {
  it("names every scene and both sizes for both stores", () => {
    const doc = renderScreenshots(source);
    for (const scene of source.screenshots) expect(doc).toContain(scene.headline);
    expect(doc).toContain("| App Store | 1320x2868 | 2064x2752 |");
    expect(doc).toContain("| Google Play | 1080x1920 | 1600x2560 |");
    expect(doc).toContain("24 files");
  });
});

describe("the generated files", () => {
  it("are what is committed", () => {
    for (const [name, expected] of Object.entries(renderStore(source))) {
      expect(readFileSync(join(here, name), "utf8")).toBe(expected);
    }
  });
});

describe("drift", () => {
  it("is reported when app.json loses the manifest, the version or the identifier", () => {
    const altered = structuredClone(appConfig) as { expo: Record<string, unknown> };
    altered.expo.version = "9.9.9";
    const ios = altered.expo.ios as Record<string, unknown>;
    delete ios.privacyManifest;
    const problems = appConfigFindings(source, altered);
    expect(problems).toContain('expo.version is "9.9.9"; store.json says "0.1.0"');
    expect(problems.some((line) => line.startsWith("expo.ios.privacyManifest is undefined"))).toBe(
      true,
    );
  });

  it("is reported when eas.json has no preview apk or no submission", () => {
    expect(easFindings({ build: {}, submit: {} })).toEqual([
      "eas.json has no development profile",
      "eas.json has no preview profile",
      "eas.json has no production profile",
      "eas.json cannot submit the production build",
    ]);
    expect(easFindings(null)).toEqual(["eas.json has no build object"]);
    expect(
      easFindings({
        build: {
          development: { developmentClient: false, distribution: "store" },
          preview: { distribution: "store", android: { buildType: "app-bundle" } },
          production: { autoIncrement: false },
        },
        submit: {},
      }),
    ).toEqual([
      "the development profile needs developmentClient true and internal distribution",
      "the preview profile must be internal",
      "the preview profile should build an apk",
      "the production profile should increment the build number",
      "eas.json cannot submit the production build",
    ]);
  });

  it("treats key order as formatting, not a fact", () => {
    expect(stable({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(stable({ a: [2, { c: 4, d: 3 }], b: 1 }));
  });
});
