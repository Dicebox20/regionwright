# Cabin in the Ashen Veil — Unified Bathhouse Region Installation and Owner Design Correction
**Date:** 2026-10-26 Pacific, approximately 11:05–11:19. **Owner directive:** “looks like we'll need to add the missing regions.” This follows the explicit owner correction: the Bathhouse was redesigned as **one already installed unified map**, not two separate BATH-03/BATH-04 rooms awaiting new artwork.

## Design authority and supersession
OWNER-APPROVED CURRENT DIRECTION: use the existing unified Bathhouse surface and the owner-approved filled/drained variants, including boiler equipment already visibly painted on the LEFT. Do not build additional Boiler/Reliquary Scenes or render new tactical backgrounds under the old plan. The archived Oct 26 BATH-03/BATH-04 standalone-map briefs, preview artworks and draft exit routing are historical evidence **SUPERSEDED by this owner correction**. Preserve them for audit, but never treat their generated door geometry/estate egress as current canon.

The central drained main-pool floor is the documented location of the Rosewater three-ring mechanism (outer 90°, middle 270°, inner 180°), and the left-side visible machinery clearly supplies Boiler vessel/pressure fixtures. The two RIGHT-side octagonal basins have been given neutral physical-area Region names; their puzzle/reliquary/plinth identity is NOT yet approved. The Bowl remains the unique original world Item `Item.1n5LONw3nYIy61O9` and was not moved or duplicated. The physical location of the Bowl's final **single-map** pickup fixture, and any relevant dry escape semantics, must be reconciled with this redesign before gameplay. A separate Boiler→estate teleport is no longer presumed to be necessary or valid.

## Installed live native Regions
GM verification: `game.world.id=cabin-in-the-ashen-veil`, Foundry 14.367, Gamemaster 1 active elected GM, 47 Scenes. Exact original scene backgrounds and approved artwork SHA flags matched. Native Region creation via authenticated `Scene.createEmbeddedDocuments("Region",...,{keepId:true})`; no direct LevelDB writes, no arbitrary browser page code, no token movement. Original Regions/Behaviors checked before and after.

**Four matching new passive Regions in BOTH versions:**
- `CAVBBOILERVESL01` — BATH - Boiler Vessel Machinery, rectangle x370,y635,w300,h238.
- `CAVBBOILERCTRL01` — BATH - Boiler Pressure Controls, x365,y938,w280,h250; candidate binding for the existing Regionwright two-wheel Boiler pressure UI with solution (2,1).
- `CAVBSIDENORTH001` — BATH - North Side Basin, x1420,y630,w200,h170; no puzzle identity asserted.
- `CAVBSIDESOUTH001` — BATH - South Side Basin, x1420,y890,w215,h205; no puzzle identity asserted.

**Additional new passive Region in DRAINED variant only:**
- `CAVBROSEWATER001` — BATH-DRAINED - Rosewater Ring Area at Main Pool Drain, x976,y826,w108,h115; later Puzzles & Locks four-quarter-turn UI binding. Its footprint **overlaps** the pre-existing broad screwdriver pickup Region `CAVBATHSCRDRY001`. This is safe now because the new Region has **ZERO behaviors**, but input-hit collisions must be reconciled before activating the ring UI. No new Region has an ExecuteScript or TeleportToken behavior.

**Counts after:** filled `Scene.CAVBATHScene0001` 2→6 Regions, drained `Scene.8yLMRDvxyw58dydh` 3→8 Regions. Total new native Regions **9**; number of Scenes stays 47; both Bathhouses remain empty and with zero wall docs. The two original Trail Fork arrival/return Regions, native return teleports and pre-existing drained screwdriver script remain unchanged and enabled. Both backgrounds and Level art unchanged. All new regions carry `dicebox-campaign-helper.cavUnifiedBathFixtureKey`, `installBatch=cav-unified-bath-fixtures-20261026-v1`, `phase=PASSIVE_GM_REVIEW` and geometry provisional flags.

## Verification and exact evidence
- BEFORE live elected-GM snapshot: `utility-harness/artifacts/cav-unified-bath-missing-region-live-before-20261026.json`.
- AFTER filled Scene verified receipt: `utility-harness/artifacts/cav-bath-filled-unified-fixtures-installed-20261026.json`.
- AFTER drained Scene verified receipt: `utility-harness/artifacts/cav-bath-drained-unified-fixtures-installed-20261026.json`.
- Independent **native readback PASS_NONDESTRUCTIVE_REGION_INSTALL**: `utility-harness/artifacts/cav-bath-unified-nine-regions-post-verification-20261026.json`. Explicitly compared all original Region names, flags, shapes, ownership, behavior counts; existing Trail teleports and screwdriver behavior still enabled; Bowl original world Item still present; all 9 new native Regions have zero behaviors, backgrounds/tokens/walls unchanged.
- Preview overlay reconstructed from approved 1536×1024 map and exact 2160×1440 Foundry Scene rectangles: [Drive evidence overlay](https://drive.google.com/file/d/1D0SnfkahA3bndF-vp3gTXWRxPJwCx322/view?usp=drivesdk), in **Unapproved Render Evidence** because it includes annotation and is NOT a replacement tactical background or live canvas screenshot.

## Next required work
1. INSPECT exact Region and surrounding walls/doors in the unified map with owner; adjust rectangles if needed. Existing Scene geometry is flagged provisional, so do not claim walls/physical collisions playtested.
2. Replace/deprecate earlier separate-BATH-03/BATH-04 *runtime assumptions* in Rosewater safety/source (the old Sluice guard searches for separate lower Scenes, which were not built); preserve fail-closed safety for any occupied or water-state transition.
3. Bind Regionwright Puzzles & Locks canonical Rosewater four-sector UI to `CAVBROSEWATER001` **only after** resolving overlap with original screwdriver pickup. Boiler 2/1 pressure wheel UI belongs at `CAVBBOILERCTRL01` on appropriate water variants, not in a fake new Boiler Scene.
4. Identify where Bowl's original one-time pickup and any former Reliquary service connection now exist ON THIS MAP, without inventing a plinth or route; install only with actual map evidence/owner approval.
5. Defer full gameplay testing and the Crooked Man Actor/token to the user-approved later testing phase; maintain exact source/Scene receipts and GitHub history.

**Status:** LIVE NATIVE REGION SKELETON INSTALLED + INDEPENDENTLY VERIFIED, puzzle Behaviors NOT wired/activated.
