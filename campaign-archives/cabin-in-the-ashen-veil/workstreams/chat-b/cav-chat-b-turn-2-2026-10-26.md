# Chat B T2 — second-chase Silver Tiny Key and Hope Chest (2026-10-26)
**Status:** PROPOSED / PURE-TESTED, not promoted, installed, or player-accepted.
**Foreman:** Chat A (sole live Foundry writer). **Worker:** Chat B. **Source repo:** Dicebox20/regionwright.
**Independent branch:** `codex/cav-late-game-chat-b-20261026`; **T2 base:** `c39903349645801450aadafed0847c5f9a481d5a`; **Chat A observed source HEAD:** `54faf5c29b75cd8ef4b3ea26eda6d3ed0f2db9a8` (read-only).
**Worktree:** `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game`; Chat A checkout unchanged.

## Delivered, isolated source
- `modules/regionwright/scripts/studio-cav-late-silver-hope-contract.js`: pure `planSilverTinyKeyMarker(receipt)` and `assessHopeChestUnlock(receipt)`, v1.
- `tests/cav-late-silver-hope-contract.test.mjs`: 26 new fixture tests.
- Existing L1-A `assessSecondChaseEligibility` remains separate; 12 tests.
- New read-only Region/Item/API/canon/test/boundary evidence matrix `docs/cabin-ashen-veil/chat-b-late-chain-evidence-matrix-2026-10-26.md`.
- No imports from shared Studio registry, no mutations, no Foundry startup hook, no Item duplication, no client payload trusted by any operational adapter (none exists).

## Contract and mandatory integration checks
Silver Key world marker can be staged ONLY from elected-GM readback after the second chase is truly resolved (escaped or captured), exact original Item and SG-01 bust Region verified, marker ledger equals `none`. `reserved` is reconciliation-only; `visible`/ `claimed` never create duplicates. If Veil began without chase, return `gm-review`, not hostile pursuit/automatic grant. Physical key pickup remains a separate adapter to design.

Parents chest requires an explicit click by actual non-GM owner in `Scene.CAVHU04Scene0001`, approved chest Region location, original key **on acting actor** with source UUID and marker Region provenance both matching a verified GM source registry; ledger must be `locked`. A `reserved` ledger fails closed, `unlocked` cannot repeat. This is **an eligibility decision only**; no chest state updated and no Music Box/Prayer granted.

Proposed flag/receipt names and dummy test IDs are NOT live canonical IDs. Chat A must resolve genuine source and Region UUIDs, choose the one-writer ledger field schema, verify Item identity, preserve original Templates and review source before registering it.

## Acceptance / evidence
`node --test tests/cav-late-second-chase-contract.test.mjs tests/cav-late-silver-hope-contract.test.mjs`: **38/38 PASS**.
`node --test tests/cav-*.test.mjs` via explicit Windows-expanded file list: **121/121 PASS across 27 test files**.
`node --check modules/regionwright/scripts/studio-cav-late-silver-hope-contract.js`: PASS.
Evidence **LOCAL PURE FIXTURE**. Live module, GM adapter, Region inventory, user authentication, once-only persistence, scene swap, and end-to-end non-GM gameplay NOT verified.

## Unresolved BLOCKERS / STOP
SG-01 current late NW Region UUID; SG-01 safe chase route and marker geometry; exact source UUID/existence for Silver Tiny Key, Music Box, Prayer and Wick; Parents chest Region and authentic Item flags; Allen warning note GM flag; Waterworks true restored flag, first chase authentic completed state. Original Crooked Man Actor/token deferred until final gameplay testing. Do not manufacture outcomes or silently activate missing modules.

## Chat A handoff
Review this source branch/commit as a proposal. Decide the authoritative receipt mapper and flag names, then implement/approve native event integration and original Item reconciliation. Upon verified source IDs, Chat B can implement next pure L1-C Music Box/Prayer and Workshop Wick contracts without touching shared registries.

## Transcript reconstruction — not lossless
User requested continuation in at-most 25-minute turns with continuity after each. Chat B read Bridge doctor (runtime ready, canonical chat identity unavailable); inspected two isolated worktrees; saw Chat A source HEAD advance to 54faf5c; inspected original spec LOCK-09/10, historical inventory, first chase and existing Parents-nightstand Studio module. Authored isolated once-only Silver Key marker / Hope Chest pure contracts, ran 38 tests plus 121-test Cabin regression, and prepared this handoff. No Foundry writes or live chat-to-chat Bridge delivery claimed.