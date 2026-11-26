/**
 * The week as one printable page.
 *
 * On the web a parent presses ⌘P and the browser does the rest. The phone has
 * no such thing, so the same page is built here as plain HTML and handed to
 * the system print sheet — which is where a paediatrician's office is used to
 * getting it, and where the week survives a flight with no signal.
 *
 * Pure on purpose: the string is the whole output, so the tests can read it
 * without a device.
 */
import type { WeekModel } from "./week";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraph(value: string | null): string {
  return value ? `<p>${escape(value)}</p>` : "";
}

/** What a printer shows in the header, and what the file is called. */
export function weekShareTitle(model: WeekModel): string {
  return `${model.stageLabel} — ${model.heading}`;
}

export function weekShareFileName(model: WeekModel): string {
  const slug = model.packId || "nine-to-three";
  return `${slug}.html`;
}

export interface WeekShareOptions {
  /** The parent's local day, YYYY-MM-DD. Printed so a printed page has a date. */
  today: string;
  /** The one sentence the site puts under the title. */
  site?: string;
}

export function weekHtml(model: WeekModel, options: WeekShareOptions): string {
  const site = options.site ?? "nine to three";
  const steps = model.steps
    .map((step) => {
      const optionsList = step.options
        .map((option) => {
          const link = option.url ? ` (${escape(option.url)})` : "";
          const cost = option.cost ? ` · ${escape(option.cost)}` : "";
          return `<li>${escape(option.label)}${cost}${link}</li>`;
        })
        .join("");
      return [
        "<section>",
        `<h3>${escape(step.title)}</h3>`,
        paragraph(step.why),
        paragraph(step.minutesLine),
        paragraph(step.statusLabel),
        step.detail ? `<p>${escape(step.detail)}</p>` : "",
        optionsList ? `<ul>${optionsList}</ul>` : "",
        "</section>",
      ].join("");
    })
    .join("");

  const alsoKnow = model.alsoKnow.items
    .map((item) => `<li><strong>${escape(item.title)}</strong> ${escape(item.body)}</li>`)
    .join("");

  const appointments = model.appointments.items
    .map(
      (item) =>
        `<li><strong>${escape(item.label)}</strong> ${escape(item.window)}${item.who ? ` · ${escape(item.who)}` : ""}${item.note ? ` — ${escape(item.note)}` : ""}</li>`,
    )
    .join("");

  const flags = model.redFlags.items
    .map(
      (flag) =>
        `<li>${escape(flag.text)}${flag.callLabel ? ` — ${escape(flag.callLabel)}` : ""}${flag.phone ? `: ${escape(flag.phone)}` : ""}</li>`,
    )
    .join("");

  const sources = model.sources.items
    .map(
      (source) =>
        `<li><strong>${escape(source.title)}</strong> ${escape(source.detail)} (${escape(source.url)})</li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(weekShareTitle(model))}</title>
<style>
body{font-family:Georgia,serif;color:#1c1a17;line-height:1.5;margin:32px;max-width:44em}
h1{font-size:1.6em;margin:0 0 .2em}
h2{font-size:1.1em;margin:1.6em 0 .4em;border-top:1px solid #ddd;padding-top:.8em}
h3{font-size:1em;margin:1em 0 .2em}
p{margin:.3em 0}
ul{margin:.3em 0 .6em 1.1em;padding:0}
footer{margin-top:2em;color:#6b6b6b;font-size:.85em}
</style>
</head>
<body>
<h1>${escape(model.heading)}</h1>
<p>${escape(model.stageLabel)} · ${escape(site)} · ${escape(options.today)}</p>
${model.body ? `<h2>${escape(model.body.babyHeading)}</h2>${paragraph(model.body.babySize)}${paragraph(model.body.babyDevelopment)}<h2>${escape(model.body.youHeading)}</h2>${paragraph(model.body.youBody)}${paragraph(model.body.youMind)}` : ""}
${model.lens ? `<h2>${escape(model.lens.headline)}</h2>${paragraph(model.lens.body)}` : ""}
${model.steps.length > 0 ? `<h2>${escape(model.stepsHeading ?? "This week")}</h2>${steps}` : ""}
${alsoKnow ? `<h2>${escape(model.alsoKnow.heading)}</h2><ul>${alsoKnow}</ul>` : ""}
${appointments ? `<h2>${escape(model.appointments.heading)}</h2><ul>${appointments}</ul>` : ""}
${flags ? `<h2>${escape(model.redFlags.heading)}</h2><ul>${flags}</ul><p>${escape(model.redFlags.closing)}</p>` : ""}
${sources ? `<h2>${escape(model.sources.heading)}</h2><ul>${sources}</ul><p>${escape(model.sources.reviewed)}</p>` : ""}
<footer>${escape(site)} — the week, printed.</footer>
</body>
</html>`;
}
