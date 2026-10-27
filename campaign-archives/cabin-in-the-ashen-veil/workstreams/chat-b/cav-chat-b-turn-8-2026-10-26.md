# Cabin in the Ashen Veil — Chat B Turn 8 Late-Game Handoff

**Date (Pacific):** 2026-10-26. **Scope:** L1-H magical thorn dock, full-Pond rowboat, Boathouse Prayer of Devotion, Studio Sune half. **Status:** isolated source & pure-fixture verified, **not** live installed/commissioned/player accepted. Chat A retains sole live Foundry write/integration authority.

## Source branch and baseline
- Repo: `Dicebox20/regionwright`; branch: `codex/cav-late-game-chat-b-20261026`; isolated worktree: `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game`. Starting parent `5cee7047d4ed50c677e4f8d26d73071ab9ea3c05`.
- Chat A observed separate `codex/cav-sune-integration-20261026` at `fb8ef607d4cf892557db402e5041c93294b3a79d` read-only. No Checkout A or live world writes.
- Dicebox Bridge doctor local runtime and PowerShell ready, canonical chat identity unavailable; first source-write request failed with uninitialized MCP before receipt; doctor + read-only filesystem confirmed **no file created**, then retried under a new bounded unique request ID and succeeded. No duplicate execution or relay.

## Original authority and IDs
- Latest owner-approved LOCK-12: fictional Lye-only Greenhouse → original Plant Killer quest item, one scripted use against designated **magical thorns** at far Pond/Boathouse dock. Pond must be FULL for rowboat to Boathouse. Boathouse original Prayer of Devotion, with full readable Journal, gives one Sune half by separate explicit Devotion reading at Dahlia Studio H-G07 altar. **Prayer of Protection** separately gates Candle Workshop and cannot replace Devotion at altar.
- Original Oct24 GM Item creation artifact `utility-harness/artifacts/cabin-puzzle-items-receipt-20261024.json`: Plant Killer `Item.YNWpGEGB17mqDFWe`, Prayer of Devotion `Item.GXLYq6Tf4OgPNbkU`, Sune Emblem Half `Item.t9uCIpsKeSvtC31w`. Historical created source identities, NOT present/current-world reread.
- Pond `Scene.CAVEXT02Scene001`, original canonical water controller from `studio-cav-water-controller.js` and `studio-cav-water-state.js`: Pond/Bath shared closed/full/full stage. Actual initial NULL may mean full; integration must normalize through verified authoritative current GM readback, not assume NULL means a safe boat route.
- Exact physical thorn/boat/arrival/return, Boathouse pickup Region, Studio altar Scene+Region UUID and Oars original Item provenance remain UNKNOWN. Do not substitute fabricated UUIDs.

## Isolated source and tests
- New `modules/regionwright/scripts/studio-cav-late-dock-devotion-contract.js`, **pure** exports:
  - `planThornDockClear(receipt)`: only certified magical thorn fixture + original Plant Killer from Greenhouse; one scripted use and persistent barrier clearance; idempotent scene-reload/rehydration plan, no actual plant effects or chemistry.
  - `planRowboatToBoathouse(receipt)`: full normalized Pond AND Bath, Sluice closed, pending water transaction absent, original rowboat and oars, cleared thorns, native portal/landing/return geometry safe.
  - `planBoathouseDevotionPickup(receipt)`: distinct one-time Devotion prayer item with authentic readable Journal and legitimate Boathouse access.
  - `planSuneDevotionHalf(receipt)`: authentic Prayer of Devotion read explicitly at Studio's actual altar, once-only original Sune Half; Protection prayer/Wick and Gond Half remain independent.
- New `tests/cav-late-dock-devotion-contract.test.mjs` with 87 focused adversarial cases and all source syntax checks passing.
- Complete local `node --test <all tests/cav-*.test.mjs Windows-expanded>`: **596/596 PASS across 34 files**. This is PURE FIXTURE, NOT native game execution or real player acceptance. No `studio-campaign.js`, shared registry, original Items/Regions, assets or installed module edits.

## Native integration preconditions and safety
- All `origin:"elected-gm-readback"` markers are pure **data labels** and cannot authenticate player messages alone. Actual GM must verify sender, elected-GM, scene/token ownership, physical Region containment, correct world, original Item source IDs/actor inventory, real water state and native one-writer once-only ledger.
- Reserve before real item/portal/Region effects, reread actor/scene/native geometry before marking done; uncertain reservation must stop for GM reconciliation.
- Thorn clearance is permanent as campaign progression; scene rehydration after reload must never consume another scripted use or create another Item.
- Rowboat requires genuine Pond FULL, including the paired Bath stage, correct approved artwork and safe return—not Greenhouse Waterworks state, drained Pond or an unsafe inferred NULL.
- Devotion handout must remain readable and obtained only once. Studio original Sune altar handler must keep Devotion and Protection prayers as two independent actions/ledgers. Never auto-grant Vault/Keystone after a Sune half.
- Any missing live UUID, original source or safety evidence is STOP. Chat A owns implementation and gameplay acceptance; source PR stays draft.

## Next bounded scope
L1-I: six storybooks with **ascending publication years 1442–1447** and H-U05 in-room concealed spine-compartment (later owner correction supersedes older H-U06 separate room). Distinct once-only Gond half. Then Vault with four and only four predicates, Keystone, inner/outer Undercroft, and ending in subsequent source-only units.

## Available-message transcript reconstruction
Owner said resume. Worker checked two repositories/Bridge (canonical Chat identity missing), inspected Oct24 item receipt, current water-controller source and owner chain documentation. First source operation returned Bridge MCP uninitialized; read-only check proved no file created. Worker then wrote one isolated pure source and 87 tests, ran all 596 Cabin cases successfully, produced matrix/chronological notes and prepared this handoff. No native world/Item changes or cross-chat relays. This reconstructs available evidence, not a lossless transcript.