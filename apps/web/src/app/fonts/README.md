# Fonts

Three families, latin subset only, committed so the build never reaches the
network.

| File                     | Family                | Weights   | Source                                                  |
| ------------------------ | --------------------- | --------- | ------------------------------------------------------- |
| `inter-latin.woff2`      | Inter                 | 100 – 900 | https://fonts.google.com/specimen/Inter                 |
| `newsreader-latin.woff2` | Newsreader            | 400 – 500 | https://fonts.google.com/specimen/Newsreader            |
| `atkinson.woff2`         | Atkinson Hyperlegible | 400       | https://fonts.google.com/specimen/Atkinson+Hyperlegible |
| `atkinson-bold.woff2`    | Atkinson Hyperlegible | 700       | https://fonts.google.com/specimen/Atkinson+Hyperlegible |

All three are licensed under the SIL Open Font License 1.1, which permits
redistribution and self-hosting. The full licence text is at
https://openfontlicense.org.

`next/font/google` downloads the font during the build. When that request is
slow or blocked, the build fails with `TypeError: Cannot read properties of
null (reading '1')` from `@next/font/dist/google/loader.js` — an error that
names neither the font nor the network. It happened twice on CI with no code
change to blame. `next/font/local` reads these files instead, so the build is
deterministic and offline.

## What each one costs, and why it is loaded the way it is

Every preloaded font is on the critical path of every page, so the defaults
here are not Next's defaults.

- **Inter** is the body face. Preloaded, `display: swap`, `adjustFontFallback:
Arial` — the paragraphs are the page, and Arial's metrics are close enough
  that the swap does not reflow them.
- **Newsreader** is the display face and the largest thing painted on most
  pages. Preloaded, `display: swap`, `adjustFontFallback: "Times New Roman"`
  so the swap cannot move the heading it replaces.
- **Atkinson Hyperlegible** is the second typeface a parent can choose, not a
  larger one: it separates `I l 1` and `O 0`, which a size setting cannot fix.
  It is only used when that setting is on, so it is `preload: false` — a
  preload put 22 kB of a font most parents never see on the critical path of
  every page.

The 4× font preloads were 107 kB of a 460 kB page before #45. Two of them
remain; the two Atkinson files are fetched only when the setting is on.

Subsetting these files further was measured and rejected: with the whole
character set of the app, Inter falls 48,432 → 38,496 bytes and Newsreader
58,152 → 55,332, because the variable-font axis data, not the glyphs, is most
of the file. Thirteen kilobytes is not worth a build step that has to run
before every font change.

To add a weight or a subset, download the woff2 from Google Fonts with a
browser user agent (the CSS endpoint serves woff2 only to modern clients) and
add it to the `src` array in `../layout.tsx`.
