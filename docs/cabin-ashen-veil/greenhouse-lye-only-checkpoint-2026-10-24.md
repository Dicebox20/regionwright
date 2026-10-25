# Greenhouse Lye-only Puzzle — 2026-10-24

Owner-directed change: Lye is the ONLY required ingredient. Greenhouse water restoration is an independent Waterworks access prerequisite, not a recipe ingredient. Crimson Veil gates the Bathhouse lye acquisition, not the Greenhouse reaction itself. All other ingredient requirements in the earlier puzzle guidance are superseded.

Source modified: `modules/regionwright-puzzles-locks/scripts/ingredient-mixing-engine.js`. New `evaluateGreenhouseLyeUse(state)` and corrected `evaluateIngredientPrerequisites(state)` require authoritative boolean `waterRestored` and `lyeAvailable`; missing/unknown evidence fails closed. The generic multi-ingredient `evaluateIngredientMix` remains backward compatible. Node syntax and eight pure-logic assertions passed.

Proposed implementation split: Region triggers lye insertion interaction, confirms actual item possession (and consumes lye only if explicitly approved), reads authenticated GM-owned Waterworks completion flag, transitions plant-killer production state and unlocks far-dock vegetation interaction. Never accept a player's self-reported prerequisite state. Do not deploy based only on pure-engine tests.

Outstanding: connect gate to authoritative GM-side handler, exact item/Region IDs, idempotent reward state, approved one-button visual overlay, live tests including non-GM, repeat entry, no-lye, water-off. This is not deployed and does not alter current world data.
