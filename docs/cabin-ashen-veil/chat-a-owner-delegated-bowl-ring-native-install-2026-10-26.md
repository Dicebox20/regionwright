# Cabin in the Ashen Veil — Owner-delegated Rosewater and Sune Bowl native installation

Date: October 26, 2026 Pacific, approximately 23:23–23:38.
Workstream: Chat A early/midgame. Owner explicitly said: "approved, you have approval authority for the cabin in the ashen campaign creative and technical decisions". This is campaign-scoped delegation to the coordinator for creative and technical decisions, not retroactive proof that the owner personally chose a coordinate or solved any puzzle.

## PREPARE / owner creative decision
Regionwright source baseline 054fd0593fbf9087742793993efe8aa4d9e7597f, branch codex/cav-sune-integration-20261026, zero tracked modifications before work. Bridge local PowerShell operational; no exact chat-to-chat Foreman endpoint identity, so no cross-chat send.

Approved drained unified Bathhouse artwork Maps/cabin-in-the-ashen-veil/bathhouse_unified_surface_drained_owner-approved_2026-10-26.png, image 1536x1024 pixels, placed in 2160x1440 Scene 8yLMRDvxyw58dydh, 120-pixel grid. Viewed the actual complete artwork and cropped northern chamber.

Existing Rosewater ring CAVBROSEWATER001 centered at central drain: (976,826,108,115), fully inside original Screwdriver rectangle CAVBATHSCRDRY001 (870,710,360,330). Existing installed original Screwdriver runtime already masks ring clicks via native Region.testPoint, so this geometry is technically safe for separate handlers, pending later actual player acceptance. Exercised owner-delegated approval to RETAIN the ring geometry.

Approved new Sune Scrying Bowl pickup as a separate reliquary on the visible northern ceremonial rug, in the existing single-map Bathhouse: x977,y375,width108,height88, center (1031,419); a 120-pixel snapped token center at (1020,420) can access it. The Bowl fixture does not overlap any original Region, nor Ring or Screwdriver. This does not revive discarded standalone BATH-03/BATH-04 scenes.

## BUILD / source and tests
The unique original World Item Item.1n5LONw3nYIy61O9 remains the only canonical Sune Scrying Bowl template. Updated new Bowl service Behavior constant to exactly 16 characters CAVROSEBOWLPICK1, matching Foundry-safe original native ID requirements. Native Region ID CAVROSEBOWLREG01 also 16 characters. All original Bowl GM receipt/owner provenance, exact player Actor/item, full Rosewater DONE solution and sluice proof guards remain intact.

New source/installed module disk SHA256 25E589ADD4E9A4C80F943E91AAFC5EF7FFCF426D6698E03700A1BB956BD825F5, with prior deployed version preserved at utility-harness/artifacts/cav-owner-bowl-before-native-id-update-20261027.js.txt. New tests/cav-owner-approved-reliquary-bowl-fixture-install.test.mjs includes 4 tests for exact geometry, both 16-char IDs, fail-closed story requirements and unchanged original Screwdriver masking. Focused 4/4 PASS, full Cabin regression 246/246 PASS (44 files, 0 failures) before any live native writes.

## BUILD / guarded seven-step existing-world native installation
Authenticated exact elected Gamemaster 1 in Foundry 14.367 world cabin-in-the-ashen-veil, 47 Scenes. Preflight verified original source/events/disabled Rosewater Behavior, stage flags, approved Rose/Sun/Moth/Thorn, original World Item, empty target region and Actor inventories, preserved Screwdriver and no Crank/water/ring reward progress.

1. Created ONE native Region Scene.8yLMRDvxyw58dydh.Region.CAVROSEBOWLREG01 at the northern ceremonial rug with exactly one ENABLED executeScript Behavior CAVROSEBOWLPICK1 pointing to the original GM-checked Bowl service, and owner-delegate provenance/geometry metadata.
2. Wrote delegated owner geometry approval on existing original ring.
3. Wrote delegated owner Bowl fixture approval on ring referencing exact new Region UUID, scene, art and geometry.
4. Cleared previous active ownerReviewRequired flag, with original value archived in preflight receipt.
5. Set original ring binding status ENABLED, retained puzzle kind/provider and previous historical records; recorded owner geometry approval and native Behavior installed.
6. Enabled exactly the existing original CAVROSEWATERSCR1 native ExecuteScript Behavior; its source, ID and event list are unchanged.
7. Marked original ring phase COMMISSIONED, NOT solved.

Every action individually source/precondition-guarded and GM write-readback checked; installer status installed-native-gm-readback-pass. Receipt utility-harness/artifacts/cav-owner-delegated-rosewater-ring-bowl-fixture-native-install-20261027.json.

## Independent verification and limitations
Second elected GM read-only process PASS in original world: 47 Scenes, 240 Regions, 128 Behaviors (including independent late-game additions); Bowl Region one exact enabled Behavior, original ring enabled and binding ENABLED, owner placement approvals exact. Fresh URL import updated Bowl module returns nativeReady=true, ringNativeReady=true, sourceItemReady=true, status original-rosewater-rings-not-solved, sluiceReady=false, no ring claim or Bowl award. Original Rosewater ring GM service describe returns status ready but drained false; blockers original Crank absent and original Pond/Bath drain not committed. Exact GM receipt utility-harness/artifacts/cav-owner-delegated-ring-bowl-native-independent-postread-20261027.json.

IMPORTANT CACHED RUNTIME: existing already-initialized Regionwright Bowl API still holds the previous module code with old 18-char Behavior ID; it reports original-pickup-behavior-not-installed even though FRESH updated module import verifies source/native binding. A safe COORDINATED Foundry module reload is necessary to bring active Bowl API up to date, avoiding interruption of Chat B active-world work. No forced reload or actual player acceptance this turn. The map rug is the visual site but no separate decorative item Tile was installed (original Item art is a generic, non-topdown loot icon).

This installment intentionally does not set genuine Crank, water, or solved ring transactions; no Bowl Items granted. Full compatibility diagnostic/player testing remains deferred until all content installations complete, as previously instructed by owner.

STATUS: Source 246 PASS; 1 new native Bowl Region/Behavior and existing ring commissioned; two independent GM readbacks PASS; active module API reload and real player acceptance pending.
