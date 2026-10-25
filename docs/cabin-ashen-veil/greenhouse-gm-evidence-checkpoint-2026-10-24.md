# Greenhouse GM evidence logic checkpoint — 2026-10-24

Source: modules/regionwright-puzzles-locks/scripts/ingredient-mixing-engine.js
Added pure evaluateGreenhouseCompletion({waterRestored,inventoryItems,alreadyComplete}). Verifies owned lye with positive quantity, an authoritative water-restored boolean, and duplicate-completion lockout. Tests: 7 assertions passed; syntax checked. This pure evaluator expects evidence supplied by a trusted GM-side adapter; it does NOT establish trust in arbitrary calling data.

NOT IMPLEMENTED: actual GM-side Region handler, exact Scene/Region/item IDs, sourcing authenticated actor inventory, authoritative Waterworks completion flag, idempotent persistence, item consumption/reward transaction, socket authorization, test HUD hook, and Foundry player playtest. Generic Ingredient Mixing finish remains unchanged and is NOT a secure Greenhouse implementation. Do not deploy as completed gameplay or claim that simply adding this function enforces prerequisites.

Owner canon: Lye is sole ingredient; water is Waterworks state, not an ingredient. Crimson Veil applies to lye acquisition in Bathhouse. The generic 2–4 ingredient Regionwright engine stays unchanged.
