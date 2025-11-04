Hybrid narrative: precompute + lazy bundles
-----------------------------------------

This folder contains helpers and schemas for the hybrid precompute approach:

- Precompute at build-time to produce small per-biome-per-locale bundles of
  "pre-rendered" variants. Each variant is an almost-final sentence with only
  a handful of runtime placeholders (persona name, numbers, small runtime picks).

- At runtime the client lazy-loads the relevant bundle when the player enters
  a biome (or when the locale/persona changes). Bundles are cached in
  IndexedDB for offline usage.

Why this approach?
- Low runtime cost: the client only selects variant IDs and does tiny substitutions.
- Offline-friendly: bundles can be stored locally and do not require a server.
- Small-ish bundles: authoring controls number of variants per template.
- Localizable: bundles are split by locale so you only load the current language.

What's included
- `schemas.ts` — Zod schemas for bundles, variants and lexicon entries.
- `scripts/validate-narrative-bundle.js` — quick CLI validator for bundle files.

Next steps (planned)
- Precompute CLI to generate bundles from author templates + lexicons.
- Runtime loader `loader.ts` that lazy-imports bundles and caches to IndexedDB.
- Orchestrator runtime wrapper that exposes `generateNarrative(snapshot, opts)`.
