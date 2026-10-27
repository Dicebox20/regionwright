# Cabin in the Ashen Veil — Read-only global Regionwright Puzzle Region audit

> **CURRENT LIVE CORRECTION (14:03 PDT):** The three owner-supplied Aqueduct Regions ALL EXIST (11 Aqueduct Regions / 148 Walls now), but each has 0 puzzle Behaviors. The older missing-physical-Region findings below are a historical 13:38 snapshot; see the corrective section at the end. No new Region creation is needed.


Date 2026-10-27 PDT, approximately 13:38–13:49. Project owner requested all Regions supposed to have Regionwright puzzles checked, specifically missing Aqueduct Waterworks pressure. AUDIT ONLY — no native Foundry world, Region, Behavior, module, actor, Item, token or Chat A source writes.

## Authority, method and evidence

- Exact current original Foundry 14.367 world `cabin-in-the-ashen-veil`, elected `Gamemaster 1`, CDP original Dev Chrome connected to /game; modules `regionwright` 0.2.0 and `regionwright-puzzles-locks` 0.1.2 both active.
- Read native Scene/Region/Wall/Tile documents and exact embedded native RegionBehaviors, native Regionwright target flags on all Scene Region/Tile/Wall collections, campaign bridging flags and installed module APIs. Cross-reference canonical/current original map and Regionwright Puzzles & Locks source, 2026-10-24 engine/art/installation evidence, 2026-10-26/27 Chat A and Chat B source/handoffs.
- Original current live snapshot: **47 Scenes, 250 Regions, 141 native RegionBehaviors: 112 enabled, 29 disabled**. These are world totals, NOT the number of Regionwright puzzles. Only ONE native target had a persisted `regionwright.slidingMosaic` configuration; campaign Studio bindings for Boiler/Rosewater are deliberately different and were separately audited.
- Exact evidence copies beside this report:
  1. `cav-regionwright-campaign-full-audit-20261027.json` — full 47 scene/250 Region/141 Behavior inventory, original scenes including AQ01, matched map IDs/behavior enabled states.
  2. `cav-regionwright-direct-configured-targets-20261027.json` — exhaustive `Region`, `Tile`, `Wall` puzzle flag scan, no hidden/missed Spine target.
  3. `cav-regionwright-pressure-runtime-capabilities-20261027.json` — active loaded module API keys, Annex precise rectangle, Bath/Boiler/Rosewater campaign binding flags.
  4. `cav-regionwright-script-spotchecks-20261027.json` — current native exact script/event bindings for major canonical puzzles.
- Source repos: Chat A independent `C:\Users\rujie\Documents\Region Editor`, branch `codex/cav-sune-integration-20261026`, audited HEAD `b136fb9fd64e2a16cfbafd3cd12d235dfe1aa778` with several live uncommitted files **not touched**. Chat B isolated `codex/cav-late-game-chat-b-20261026`, starting HEAD `3855d50b59cc1c0b9cfcc91b3e2b083d8b45cf2d`, initially clean.
- No non-GM functional puzzle interaction or live pressure setting/solution test was performed. Source availability is not world Region installation.

## Confirmed missing Regionwright gameplay integrations

### CRITICAL 1 — AQ-01 Waterworks Pressure five-valve original puzzle ABSENT
- Current `Scene.CAVAQ01Scene0001` approved original `aqueducts_unified_gondian_owner-approved.png`: **8 Regions, 143 Walls**. FIVE Regions have zero Behaviors: North Bridge walkway `qOxNY7T7UaRxjrjX`, East Bridge walkway `Q5DqqnOXPmf7ivqD`, Waterworks Annex observation `kmPmr5ijLCEOJNk3`, West Bridge walkway `A84K235zGzM9lGrT`, passive arrival from Forest Well `CAVAQWELLARRV001`. These are observational/travel fixtures, not evidence of five puzzle controls.
- Existing `Scene.CAVAQ01Scene0001.Region.kmPmr5ijLCEOJNk3`, name **Waterworks Annex — observation**, x1240,y2720,w300,h260, has **0 Behaviors and 0 puzzle flags**. There is no native five-valve Waterworks control, current authoritative GM pressure session, obstruction-clearance controller, intake/main actuation binding or pressure-restoration reward Region anywhere in AQ01.
- Other AQ native state: Southern Access `Region.woZ98KXx0RsWIPpl.RegionBehavior.CAVAQCHASETRIG01` is intentionally DISABLED for owner-deferred Crooked Man; Southern return `CAVAQ01RETURN001/CAVAQ01RETBEH001` disabled; northern Forest Well portal `CAVAQWELLNORTH01/CAVAQWELLPORT001` disabled with distinct enabled independent access gate `CAVAQWELLACCESS1`. Their lack of active teleport is a gating decision, NOT five pressure missing Regions.
- Puzzles & Locks `waterworks-pressure-engine.js` exists, full five colors red/blue/green/yellow/purple and `waterworks-pressure.js` prototype exists in the active module/catalog. All **five Waterworks plus two Boiler gauge images** are present in installed module assets (`pressure-waterworks-{red,blue,green,yellow,purple}.png`, `pressure-boiler-{left,right}.png`). But active `regionwright-puzzles-locks.api` exposes only `boilerCampaign` as campaign pressure endpoint, NOT an Aqueduct `waterworksCampaign` service. The catalog's `regionwright:standalone:waterworks-pressure` entry is a **standalone demo**, not AQ01 native gameplay.
- Source default targets [2,4,3,1,5] are explicitly DESIGN PLACEHOLDERS, NOT owner-approved pressure values. Obstruction `TEST` button in standalone UI is simulated only. DO NOT import either as a canonical world-puzzle completion or overwrite live flags. A legitimate Waterworks source must model authoritative obstruction state, GM-validated valve adjustments, persisted solved/restored flag and actual item/phase dependencies.
- Recover with PREPARE actual approved map/Annex visual and walls; choose distinct actual control/obstruction Region geometry AFTER no-overlap checking. Reuse original observation as observation, do not overwrite it merely because near expected panel. Owner-delegated design decisions can approve UI/logic but must remain documented distinct from earlier canonical solution. INSTALL only after guard/read-only preview, VERIFY current elected GM exact source, rehydrate safely. Never enable Crooked Man chase as part of Waterworks installation.

### CRITICAL 2 — H-U05 Sophia six-book Regionwright Spine Mosaic ABSENT
- Original `Scene.CAVHU05Scene0001.Region.CAVB994894A7432F` is the approved in-room bookcase. Its old close-up `RegionBehavior.LRYrBIQNN92SCJai` is ENABLED. Chat B T27 added separate Gond-half `RegionBehavior.CAVGONDREWARD001`, intentionally DISABLED, and hidden original Gond Tile. **No native `regionwright.spineMosaic` config exists** on this Region or ANY Wall/Tile/Region world target. The separate original six-book progress/Veil/cavity issuer ledgers remain absent; T27 issuer is not an ordering UI.
- Original 6 book Item UUIDs are GM-library-only, years 1442–1447. The sixth remains Veil-only. No fake H-U06 hidden room: owner superseded old blueprint and explicitly placed original concealed reward in existing H-U05 bookcase.
- Implement approved six-book Regionwright `spineMosaic` config and genuine player interaction on existing bookcase without breaking original click zoom, without assigning auto tokenEnter unguarded completion and without pretending client-supplied solution is authoritative. Connect original canonical Veil/sixth-book claimant evidence, revealed original Gond Tile and earned actor reward. Native player acceptance later.

## Confirmed installed Regionwright-based canonical puzzles (NOT missing)

| Puzzle | Exact live target | Current result |
| --- | --- | --- |
| SG-05 Sune sliding mosaic | `Scene.CAVSG05Scene0001.Region.L15BdSqcbCOLPnIN`, configured `flags.regionwright.slidingMosaic` 3×3 / initial [4,5,1,2,0,8,7,6,3], persistent status `locked`. Enabled RegionBehavior `Q8Hr2Dnw6hBpWNjr` delegates to guarded Studio Sune service | INSTALLED, no authentic player solve/playtest yet; not missing |
| Bath Boiler 2/1 filled | `Scene.CAVBATHScene0001.Region.CAVBBOILERCTRL01.RegionBehavior.CAVBOILERSCRPT01` | ENABLED; campaign Studio `boilerCampaign` variant rather than direct `regionwright` flag. Original approved two-valve goal [2,1], not generic demo [2,4]. Player solve not tested |
| Bath Boiler 2/1 drained | `Scene.8yLMRDvxyw58dydh.Region.CAVBBOILERCTRL01.RegionBehavior.CAVBOILERSCRPT01` | ENABLED, mirrored original GM service; no duplicate install needed |
| Bath Rosewater 3 rings | `Scene.8yLMRDvxyw58dydh.Region.CAVBROSEWATER001.RegionBehavior.CAVROSEWATERSCR1` | ENABLED; `rosewaterRings` campaign service, approved rose/sun/moth/thorn and outer/mid/inner angles 90°/270°/180°. Actual drain/source/overlap and full player acceptance remain gating checks; Region is not missing |
| Bath Sune Bowl | `Scene.8yLMRDvxyw58dydh.Region.CAVROSEBOWLREG01.RegionBehavior.CAVROSEBOWLPICK1` | ENABLED original separate Bowl pickup fixture, only valid after authenticated Rosewater/sluice conditions; not a generic panel family |

## Existing Regions that are custom interactions, not proven absent

- **EXT-06 Greenhouse lye-only**: actual `Scene.CAVEXT06Scene001.Region.CAVB6E433D528867.RegionBehavior.CAVEXT06LYEMIX01` is ENABLED, native 6886-character guard/click script; NO generic `regionwright.ingredientMixing` configuration. Review source parity with established lye-only Greenhouse and original authentic Waterworks-restored source; not automatically missing a Region.
- **H-R01 Roof Clock**: actual `Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001` with enabled `i6UNtWSFFaZgkdZD` custom close-up; not a Regionwright generic Timing Dial config. Use current owner-approved roof listener and item/provenance work, not a redundant dial.
- **EXT-03 Donovan 587 lockbox**: Region `CAVEXT03BOXREG01` already has enabled custom `CAVEXT03BOXBEH01`; not necessarily a missing Regionwright Lockpicking/Rotating Lock.
- **H-G06 Great Room chest**: `Scene.CAVHG06GreatRoom.Region.ibN7AGsY4AlG582M.RegionBehavior.CAV024CHESTBEH01` is an enabled **First Chest 024** macro controller; original filled **027 Dust Pellet** later used in SG-05/Undercroft is a separate upstream canon requirement requiring reconciliation. Do NOT overwrite/renumber 024 without auditing original chest sequence and item sources.
- **H-U07 Sune east shrine**: `Region.CAVSUNEACTION001.RegionBehavior.CAVSUNEPRAYBEH01` is installed DISABLED; this is an incomplete separate story puzzle, not a missing generic Regionwright visual panel.
- **H-B01 Vault**: three true Item sockets `CAVVAULTPOWER001`, `CAVVAULTGOND0001`, `CAVVAULTSUNE0001`, separate bench turn `CAVVTURNBEH00001`, all DISABLED pending authentic actor custody/source providers. This is intentional incomplete progression, not missing physical Regions.
- **UND-01/UND-02**: original Keystone recess, stone lever and paired safe portals physically staged DISABLED pending true Keystone and owner story progress; not pressure-puzzle defects.
- **EXT-04 Privy copper fixtures** are staged DISABLED for Veil/claim dependencies. Owner deferred Crooked Man encounters; not part of requested pressure repair.

## Catalog distinction

The Regionwright Puzzles & Locks module has 10 standalone visual demo families (tumbler, rotation lock, laser grid, timing dial, ingredient mixing, spine mosaic, sliding mosaic, Waterworks pressure, Boiler pressure, Rosewater rings). Their catalog entries merely prove reusable UI/engine availability. They are **not** a mandate to add 10 new Regions. The only currently persisted direct `regionwright` family flag is the SG-05 `slidingMosaic`; Boiler and Rosewater are correctly bound via campaign-scoped Studio APIs.

## Repair sequence / next authoritative work

1. **PREPARE/INSPECT** AQ approved original imagery and 143 Walls, identify distinct physical Waterworks panel plus actual obstruction/reward/control sites. Reconcile restored-water state versus Pond/Bath sluice and owner-deferred Crooked encounter. Approve exact five-valve canonical pressures (current default provisional), persistence and reward semantics.
2. **BUILD** campaign Waterworks Regionwright pressure UI and elected-GM API, no standalone TEST toggle as world state. Install exact native Annex-area Region/controller and obstruction producer with no overlap; write guarded source to Regionwright module after isolated checks, no fabricated completion.
3. **VERIFY** exact current active GM, region/behavior IDs, source hash, genuine valve and obstruction state persistence without side effects, UI rendered; stage controlled nonGM playtest later per owner approval.
4. **Sophia** configure canonical Spine Mosaic on original bookcase, preserve original close-up; do not enable Gond issuer until native six-book/Veil conditions verified.
5. **CONTINUITY** inspect custom Greenhouse and roof/lock pieces for user-visible UI parity, not blindly reconfigure as new Regionwright families. Recheck Rosewater overlap and 027 source. Run global player dependency test after installations. No Chat A checkout/Foundry writes during this audit.

**Status:** 2 confirmed missing Regionwright campaign puzzle integrations; 3 installed puzzle families (Sune Mosaic, Boiler, Rosewater), 2 Boiler scene instances and 1 Rosewater instance; other scripted puzzle Region gaps recorded as integration/readiness findings, not falsely classified as missing. All claims bounded to current elected-GM native read-only evidence, no gameplay playtest or reward mutation.
## LIVE CORRECTION 2026-10-27 14:03 PDT — owner supplied real Region UUIDs

The original 13:38–13:49 audit above is a valid HISTORICAL SNAPSHOT, but it became stale for **Aqueduct physical Region presence**. A new separate elected-GM read-only world inspection following the owner's direct UUID identification found original `Scene.CAVAQ01Scene0001` now has **11 Regions and 148 Walls** (earlier snapshot 8 Regions / 143 Walls). These world changes occurred between observations; actor/worker responsible and cause are NOT established.

**All three owner-specified physical Regions ACTUALLY EXIST in current live Foundry:**

| Exact Region UUID | Present name / rectangle | Native RegionBehavior count | Region puzzle flags | Corrected classification |
| --- | --- | --- | --- | --- |
| `Scene.CAVAQ01Scene0001.Region.Aa4VBYBx3MRxr1H8` | Gondian Charging Station x3007,y46,w300,h240 | **0** | none | Physical Region EXISTS; Gondian charger Behavior and true source/Veil state wiring not installed |
| `Scene.CAVAQ01Scene0001.Region.WdVwSJ9NJYOL8IYl` | Region x1116,y3093,w540,h180, owner identifies Five-Valve Pressure Puzzle | **0** | none | Physical Region EXISTS; five-valve Regionwright puzzle Behavior and authoritative pressure service not installed |
| `Scene.CAVAQ01Scene0001.Region.9Rq8tVF0CrLGkYcT` | Region (2) x402,y3630,w180,h180, owner identifies Water Obstruction | **0** | none | Physical Region EXISTS; obstruction interaction Behavior and authoritative obstruction-restoration proof not installed |

No need to add/recreate these three Region documents. The earlier phrases "missing pressure Region", "missing obstruction Region", and "missing charger Region" were WRONG as a description of the CURRENT live world. Amend repair plan: **preserve these exact three owner-identified Regions; ADD the required puzzle behaviors/logic and connect the authoritative state, without overlapping new Regions or replacing original observation `kmPmr5ijLCEOJNk3`**. Existing original observation remains separate. A valid outcome may require appropriate panel names, but do not rename without a justified workflow.

The Regionwright Waterworks UI/engine demo already exists but defaults are placeholders and not owner-approved canonical valve pressures. No story completion, player action or reward is certified merely by Region presence. No Foundry documents were modified during this recheck. The precise new live read-only scene census is `LIVE-RECHECK-2026-10-27-1403.json`, capturing all 11 Region IDs and the three verified shapes/empty Behavior arrays.

Keep both earlier and later snapshots as chronological evidence; the later evidence governs CURRENT presence claims. Other earlier puzzle checks (Sophia Spine absent, Sune sliding mosaic / Boiler / Rosewater installed) were not individually rechecked in this narrow corrective inspection.