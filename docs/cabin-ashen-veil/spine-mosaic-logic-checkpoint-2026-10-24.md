# Spine Mosaic logic checkpoint — 2026-10-24

Scope: source-only, no Foundry write, no deployment or product-stage claim.

Changed: modules/regionwright-puzzles-locks/scripts/spine-mosaic-engine.js
Added exported pure evaluateSpineCollection(config,collectedIds): returns valid, complete, missing. Does not alter existing create, shuffle, evaluate-order contracts. Source change verified by six Node assertions (none/missing/full/duplicate/unknown/ordered).

Outstanding:
- Bind collected book IDs to actual Foundry actor/party inventory and campaign milestones; do not assume six books are all present initially.
- Book source art split into six rough crops; requires cleanup and image UI binding; asset ZIP is in ChatGPT handoff, not confirmed present on this PC.
- Owner has not approved publication chronology or resulting solution order; do not invent it or reuse left-to-right art order as proof.
- GM-only reward application and hidden-room reveal must be implemented after exact target verification.
- Maintain four-to-nine generic spine engine compatibility; add a targeted regression test for inventory gating and never silently pass when collection data is missing.
- Sune Sliding Mosaic: 8 preliminary crops; bottom-right blank, complete master image missing.
- Greenhouse mixing, Waterworks pressure, and Chimney Clock remain in guidance, not new source implementations in this turn.

Status: SOURCE MODIFIED, PURE TESTS PASS; NOT LIVE-VERIFIED.
