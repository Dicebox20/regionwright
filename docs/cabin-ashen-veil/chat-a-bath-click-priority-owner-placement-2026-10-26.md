# Cabin in the Ashen Veil — Chat A Bathhouse interaction domains and remaining owner placement

Date: 2026-10-26 Pacific (~23:11–23:20).
Scope: Chat A early/midgame. Owner directs full compatibility testing only after all campaign installation.

## Corrected prior interpretation
The original drained Screwdriver Region and Rosewater ring Region overlap geometrically, but previously installed Regionwright drained pickup runtime code has a deliberate click exclusion. The screwdriver handler checks the actual native Rosewater Region.testPoint before allowing a Screwdriver pickup click. It rejects Screwdriver click handling inside the smaller ring while preserving Screwdriver clicks outside it. This makes the earlier claim that overlap necessarily prevents independent clicks too broad.

Source and installed Foundry module SHA256 match exactly: 305D50CDD6EFBEA963C30EFB8A2DBA0FEB82BE48E203B1ABDB1E88D5AE7BCC7E. No code or world data changed to achieve this; the click mask predates this turn.

## Original approved drained Bathhouse geometry
Scene: 8yLMRDvxyw58dydh, 2160×1440, grid 120.
Screwdriver Region CAVBATHSCRDRY001: rectangle (870,710,360,330); existing pickup Behavior CAVBATHSCRBEH001 enabled.
Rosewater staged Region CAVBROSEWATER001: rectangle (976,826,108,115); Rosewater Behavior CAVROSEWATERSCR1 disabled, ownerReviewRequired true, status STAGED_DISABLED. Rosewater rectangle fully inside Screwdriver rectangle.

Read-only exact elected-GM Foundry14.367 Region.testPoint and installed source helper:
- (1030,883): inside both; Screwdriver click correctly suppressed.
- (900,750), (1200,750), (900,1000), (1200,1000): within Screwdriver only; click permitted.
Native machine receipt: utility-harness/artifacts/cav-chat-a-bath-click-separation-native-point-proof-20261026.json — PASS.
The live world had 47 Scenes, 239 Regions, 126 Behaviors at this read, including concurrent additions from another workstream. None modified by Chat A.

## Source-only installation safety regression
Four new tests appended to existing tests/cav-unified-bath-pickup-ring-click-separation.test.mjs: real rectangle containment, ring center masking, four Screwdriver-only points, and source event ordering. Focused suite 6/6 PASS; all Cabin source regressions 242/242 PASS, 0 failures across 43 test files. No live player acceptance was attempted, per owner.

## Remaining genuinely owner-controlled decisions
1. Current ring hit rectangle has source-supported priority routing, so do not assume it must move merely because it overlaps. It still requires explicit owner approval of the exact position and art alignment. The presence of this source code is not retroactive owner geometry approval.
2. Unique original World Item Sune’s Scrying Bowl (Item.1n5LONw3nYIy61O9) has no approved distinct pickup shape/location on the unified drained Bathhouse. An earlier unapproved BATH-04 draft included a central plinth, but cannot be transferred to this map without the owner choosing the physical fixture.
3. Genuine player-operated Crank and paired Pond/Bath drain, completed original Rosewater rings [1,3,2] and commissioned original native ring remain necessary for the Bowl. No stage flags should be forged.
4. The Bowl source fail-closed null fixture fix was deployed and verified by a fresh elected-GM import in the prior turn; the existing initialized module API still needs a coordinated reload to use it. Do not interrupt parallel Chat B active GM.
5. Crooked Man Actor/first chase gameplay remains owner-deferred; Aqueduct route and Sophia confinement source/native work are already staged and gated.
6. No other clearly owner-approved and entirely uninstalled Chat A mechanic was found in the inspected pending chain during this turn. Avoid inventing Scenes, NPCs, puzzle rewards or destination art.

STATUS: CLICK-PRIORITY SOURCE AND NATIVE POINT CLASSIFICATION VERIFIED. RING ART ALIGNMENT AND BOWL LOCATION STILL AWAIT OWNER APPROVAL; CAMPAIGN NOT PLAYER-TESTED.
