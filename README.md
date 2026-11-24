# DCA Forecast

A phone-first page that shows what steady dollar-cost averaging adds up to (starting balance + a regular contribution + a growth rate over a number of years), and links to the major brokers so you can set up automatic investing there. One self-contained page: no accounts, no data stored, no network calls.

## Run
```
npm run build        # writes dist/page.html; open it in a browser
```

## Test
```
npm test             # CI runs the same thing
```

## Settings
Everything tunable (defaults, slider ranges, contribution frequencies, rate presets, broker list) is in `src/config.mjs`. Broker links are pinned by `tests/brokers.test.mjs`: https only, an exact allowlisted host, no query or fragment.

## Deployed
- Live: Claude artifact (sprint demo)
- Day snapshot: `2026-11-23 - DCA Forecast` (frozen; never edited)

## Ship a sprint day
```
npm run snapshot                                  # builds, then freezes today's page (private)
node scripts/snapshot.mjs dist/page.html --public # opts in to the public sprint site
```
Commit `snapshots/` to `main` (via PR). The index's nightly refresh logs the day automatically.
