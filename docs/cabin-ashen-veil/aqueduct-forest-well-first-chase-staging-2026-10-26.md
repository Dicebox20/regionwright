# Cabin in the Ashen Veil — Aqueduct/Forest Well and First Chase Staging (2026-10-26)

Status: source and native endpoints INSTALLED; first-chase trigger and all four related native travel portals DISABLED; never player-tested. Owner workflow: preserve player-order puzzle chain, deferred gameplay tests, 25-minute work turns with GitHub record.

## Established canon
After the Study/587 sluice, the Weathered Key, the Parents' screwdriver/nightstand Gate Handle, and the Roof Clock Replacement Gear, the Aqueduct entrance must become available only through original components. First Crooked Man chase occurs inside the Aqueduct and pushes the party toward a distinct Forest Well and Northwestern Forest Maze. The Forest Well must permit later re-entry even if the Pond is full. The late NW Sune Grove chase is separate.
First chase established rules: DC13, 3 successes before 2 failures, no same tactic twice in a row for any PC, at most one captured PC deposited inside locked Sophia Bedroom. GM manual release fallback after roughly 20 minutes IRL, not a mandatory automatic timer.

## Verified native artwork and new Regions
Approved Northwest Forest Maze image (1448x1086 physical source, scene 5760x4320) visibly includes a central stone well. No separate Forest Well Scene exists in the 47-Scene world. The new staging uses its original art; central well landing coordinates inferred from the visual and still require owner-facing mapping/arrival confirmation.
- AQ-01 exit to well: Scene.CAVAQ01Scene0001.Region.CAVAQWELLNORTH01 with DISABLED RegionBehavior CAVAQWELLPORT001 targeting Scene.CAVFM01Scene0001.Region.CAVFMWELLARRV001.
- AQ-01 passive well return arrival: Region CAVAQWELLARRV001.
- Forest Maze central well reentry: Scene.CAVFM01Scene0001.Region.CAVFMWELLPORT001 with DISABLED RegionBehavior CAVFMWELLREENT01 targeting Scene.CAVAQ01Scene0001.Region.CAVAQWELLARRV001.
- Forest Maze passive emergence: Region CAVFMWELLARRV001.
- Existing AQ southern arrival Region woZ98KXx0RsWIPpl receives DISABLED behavior CAVAQCHASETRIG01 (tokenMoveIn/tokenMoveWithin). Original native Pond-AQ and AQ-Pond portals remain DISABLED.
- Static well closeup directly from approved FM original at worlds/cabin-in-the-ashen-veil/assets/puzzle-closeups/cav-forest-well-owner-map-crop-20261026.png, SHA256 27F6A8C73F6D67D8419315329A2401B0139FE2FF3C2FD281F634BCCCB5F2D3E7. No interactive art redrawn.

## Regionwright source improvements
- studio-cav-aqueduct-gate.js fixes a genuine bug: the second-component READY marker used undefined FPORT; now it uses the actual PORT id. The UI previously offered an already-installed component when another part was missing; now a tested nextAqueductPart helper selects only the missing original, or nothing. Extra actor inventory deletion readback prevents a false part-install claim.
- studio-cav-water-controller.js blocks water change if any AQ-01 token is present. As a temporary fail-closed measure, once Aqueduct traversal is flagged active, sluice stage switching blocks entirely until paired Pond/AQ route synchronization is implemented. This deliberate limitation prevents flood stranding; it must be replaced before Waterworks pressure/refill gameplay.
- studio-cav-first-chase-state.js: pure GM-adjudicated DC13, 3-success/2-failure state machine with exact expected rounds, per-PC no-repeat tactic rule, and capture maximum one PC. Failure marks capture_pending, not automatic teleport.
- studio-cav-first-chase.js: Studio campaign.cabin.firstChase handleRegionEvent, recordGMResult, confirmCaptureAfterGMTransfer and describe. Event activation requires elected GM, genuine player-owned AQ token, completed mechanical gate and certified travel plus drained water. GM supplies checked final total; no player-provided success flag. Per-round reserved/done receipt. Capture requires independently verified physical actor presence inside Sophia and her return portal locked, with actor absent from AQ.
- Existing Sophia Bedroom return portal is currently enabled. Do NOT auto-transfer captured PC until its lock/key release and GM manual 20-minute recovery protocol are installed and safe.
- All added travel portals, first chase region trigger, and player inventories stayed untouched/disabled in final elected-GM native readback. Actual chase state NULL, gate ready NULL, Pond water state NULL/full. No gameplay tests or rewards.

## Evidence and next gates
Local receipts: utility-harness/artifacts/cav-aqueduct-first-chase-scene-network-20261026.json, cav-forest-well-staged-20261026.json, cav-first-chase-sophia-capture-release-readonly-20261026.json, cav-aqueduct-forest-well-chase-final-postreload-20261026.json.
Source and installed Studio files SHA matched; complete Node source regressions pass. Next player-order build must wire 1) transactional entry/return after both original Gear and Handle are installed, 2) safe first-chase trigger and escape-to-well activation on a verified result, 3) Sophia confinement, Old Iron Key rescue and manual GM fallback, 4) AQ/Pond portals synchronized on sluice close/reopen with Forest Well return still usable while Pond full, 5) safe movement and actual player gameplay tests at campaign end. Do not enable partial route until all escape/return links are certified.
