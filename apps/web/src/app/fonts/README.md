# Fonts

Two variable fonts, latin subset only, committed so the build never reaches the
network.

| File                     | Family     | Weights   | Source                                       |
| ------------------------ | ---------- | --------- | -------------------------------------------- |
| `inter-latin.woff2`      | Inter      | 100 – 900 | https://fonts.google.com/specimen/Inter      |
| `newsreader-latin.woff2` | Newsreader | 400 – 500 | https://fonts.google.com/specimen/Newsreader |

Both are licensed under the SIL Open Font License 1.1, which permits
redistribution and self-hosting. The full licence text is at
https://openfontlicense.org.

`next/font/google` downloads the font during the build. When that request is
slow or blocked, the build fails with `TypeError: Cannot read properties of
null (reading '1')` from `@next/font/dist/google/loader.js` — an error that
names neither the font nor the network. It happened twice on CI with no code
change to blame. `next/font/local` reads these files instead, so the build is
deterministic and offline.

To add a weight or a subset, download the woff2 from Google Fonts with a
browser user agent (the CSS endpoint serves woff2 only to modern clients) and
add it to the `src` array in `../layout.tsx`.
