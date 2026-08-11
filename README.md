# Redrawn

**An atlas of territory seized, populations displaced, confined and killed — from the earliest historical record to the present.**

559 sourced events, 1600 BCE to 2026, on an interactive map and globe: every episode in which a state, empire or armed force took territory, moved a population against its will, or held one in place.

Each entry carries its dates, parties, figures with their ranges, a death range with the basis it was measured on, the documented forms of violence, formal findings by courts and commissions, the population it acted on, and its own sources — each tagged by publisher tier. Contested events set out the competing characterizations and attribute them rather than picking one.

---

## Publishing it

The site is static: no server, no database, no build tooling beyond Python 3.

**GitHub Pages (this repo is already set up for it)**

1. Push to `main`.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.

That's it. `.github/workflows/deploy.yml` builds and publishes on every push, and works out the correct URLs by itself — GitHub tells the workflow both the site URL and the `/Human-Project/` subpath, which the build bakes into every link, the sitemap and the social tags.

**Anywhere else**

```bash
SITE_URL=https://your.domain python3 build_site.py
# upload the contents of dist/
```

Add `BASE_PATH=/subdir` only if the site will live in a subdirectory. `dist/` includes ready configs for Netlify, Cloudflare Pages, Vercel and nginx.

---

## What's in the repo

```
build_site.py        the generator — one file, standard library only
data/
  events.json        the dataset: 559 events, every field
  world.json         Natural Earth 50m coastlines, simplified
  schema.md          the entry schema, as handed to each researcher
  popspec.md         the spec for population baselines and currency dates
src/
  app.js             the application (~100 KB, no framework)
  app.css            styles for the map
  body.html          the app's markup
vendor/d3.min.js     d3 v7
static/              host configs copied verbatim into dist/
```

`dist/` is generated and git-ignored. Don't edit it; edit `data/` or `src/` and rebuild.

---

## How it's built

`build_site.py` produces three things from the same dataset:

**The app** — `index.html` plus split assets. The shell paints immediately and the data loads behind a progress bar; the map is ready in well under a second on a warm cache. `world.json` is immutable and cached for a year, `events.json` revalidates hourly so corrections propagate.

**559 prerendered pages** — one per event, with the full text, figures, sources and JSON-LD, linking into the live map. The map needs JavaScript; search engines and people without it don't get one. This is what makes individual events findable on the open web rather than only linkable.

**The data** — the whole dataset as JSON and CSV, served with open CORS, so `assets/events.json` doubles as a small read-only API.

---

## Correcting an entry

Errors are expected in a dataset this size, and the entries are written so they can be checked: every figure names its source and says what it rests on.

Edit the record in `data/events.json` and open a pull request. Useful things to include: which field is wrong, what it should be, and a source that isn't an open-edited encyclopedia. The `weakSources` flag marks entries that currently rest only on reference, press or open-edited sources — **those are the ones most worth improving**, and the map's Evidence filter lists them.

Derived fields (`_share`, `_mag`, `_deaths`, `countries`, source `tier`) are computed; leave them and they'll be regenerated.

---

## Reading the numbers

Some cautions travel with the data, and the site states them too:

- **Territory figures overlap between events and are not additive.** Crimea sits inside the Ukraine invasion figure; Sinai inside the 1967 figure.
- **Death ranges are built on different bases** — direct killing, conflict deaths including combatants, excess mortality including disease and starvation, deaths in transit. They differ by an order of magnitude. Do not sum them naively.
- **People displaced more than once are counted more than once.**
- **Figures before roughly 1800 rest on royal inscriptions, chronicles and modern reconstruction.** Assyrian totals were written to impress; medieval chroniclers inflated by convention; the Mongol tolls that circulated for centuries have been cut by an order of magnitude by modern scholarship. Each entry says what its number rests on.
- **A form of violence absent from an entry means no consulted source documents it** — not that it did not happen.
- **Population shares above 100%** are real, not errors: a registered-refugee population that grows by descent, or a numerator counting incidents rather than people. Those show as a multiple, with a caveat.

The [method page](https://creativecommons.org/licenses/by/4.0/) — `about.html` in the built site — is the long version.

---

## Licence

Text and data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Reuse it, including commercially, with credit and a link back. See `LICENSE.txt` for third-party components.

Please keep each entry's own sources attached where you can. They are the load-bearing part; this atlas is a finding aid for them.

No tracking, no cookies, no third-party requests. The page loads nothing it does not ship.
