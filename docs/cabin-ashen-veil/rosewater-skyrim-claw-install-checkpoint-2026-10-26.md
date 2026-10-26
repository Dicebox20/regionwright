# Cabin in the Ashen Veil — Rosewater dragon-claw ring installation checkpoint

**Owner instruction, 2026-10-26:** the three-ring Rosewater puzzle is based on Skyrim's rotating dragon claw locks. This is a mechanical/visual direction, NOT an approval to copy game artwork or to invent a canon symbol list.

## Correct established scene and canon

Single unified Bathhouse map already installed. Rosewater is the drained-only central main-pool area Region Scene.8yLMRDvxyw58dydh.Region.CAVBROSEWATER001, not another BATH-04 Scene or invented separate Boiler Room. Existing full Bathhouse has no Rosewater ring Region. Keep existing broad drained Screwdriver pickup Region CAVBATHSCRDRY001 and original script CAVBATHSCRBEH001 intact. Click overlap exclusion was already source-installed in the previous checkpoint.

The owner-approved answer remains **outer 90°, middle 270°, inner 180°**, corresponding to four-sector state **[1,3,2]**. Skyrim's normal door is three concentric glyph wheels aligned at the top, activated at the center. Regionwright implements an adaptation with FOUR positions per wheel to honor prior campaign canon. Each ring can be clicked to rotate clockwise; separate clockwise/counterclockwise buttons exist for accessible and precise movement. Twelve medallions (four per ring) surround the shared center, with a fixed top marker and central seal. The visual is coded in Regionwright Puzzles & Locks; no Skyrim asset or original artwork was copied.

## Installed source, strict ownership boundaries

New modules/regionwright-puzzles-locks/scripts/rosewater-dragon-claw-panel.js builds the visual using the existing Rosewater campaign config and original three-ring engine/preset. The module exposes rosewater.open through Puzzles & Locks API. The visual only draws actual GM Region state; clicked rings request discrete turns, and the central seal requests submit, never declares success locally. Temporary four-label panel smoke-test strings were NEVER committed as canonical art/owner-approved symbols.

New modules/regionwright/scripts/studio-cav-rosewater-state.js implements deterministic GM reduction for three independent 90-degree rings, canonical [1,3,2] and monotonic revisions. Rotation ±1, reset and submit require exact request schema. Reserved/incomplete sessions and invalid/stale/forged results fail closed; a solved lock cannot be reset or solved twice.

New modules/regionwright/scripts/studio-cav-rosewater-rings.js exposes the elected GM service and player RegionEvent dispatch through regionwright.api.campaign.cabin.rosewaterRings. Exact source world, GM, owned PC token in the Region, viewed scene, actual water-status open/drained, native behavior identity/events/script, Puzzles & Locks canonical preset, and OWNER_APPROVED symbol flag with approvalSource owner are mandatory for real gameplay. Player requests use existing Foundry flagged chat-message service pattern, not arbitrary client page execution. On valid input, GM reserves/writes only cavRosewaterRingSession on this one Region, with expectedRevision and lastMessageId; uncertainty leaves status reserved for reconciliation. A successful solve only records ring session DONE — does NOT award Sune's Scrying Bowl, open unverified hatch, move tokens or change Sluice state.

The previous 2/1 Boiler puzzle, its enabled Regions and their GM service remain unchanged. The Bowl remains existing unique Item.1n5LONw3nYIy61O9. The owner still must identify its new exact pickup location on this unified map.

## PREPARE, BUILD and VERIFY evidence

Elected Gamemaster 1 on Foundry 14.367 in world cabin-in-the-ashen-veil; initial 47 Scenes; both Regionwright modules active. Source JS scripts copied to their installed module folders with exact SHA256 equality, syntax checks passed. Full known non-destructive Cabin source/regression suite **79 PASS / 0 FAIL**, including six new tests: two independent four-step ring-state tests, two graphical ring markup tests (3 concentric rings, 12 glyph medallions, canonical rotation degrees and center submit), two owner-approval fail-closed symbol tests.

A single GM source reload timed out waiting for navigation but subsequent READ-ONLY reconciliation confirmed game.ready TRUE, exactly correct elected GM and world, Puzzles & Locks rosewater.open function, Studio rosewaterRings.describe and event handler available. GM service reported not-commissioned, drained false, session NULL, owner symbols NULL. Reopening the panel using TEST-ONLY placeholder labels performed an explicitly non-playing smoke check: 3 clickable rings, 12 medallions, central seal, reset, marker and CSS present; no new ChatMessage, Item or Region session persisted.

A new native RegionBehavior with exact **16-character ID CAVROSEWATERSCR1**, type executeScript, source invoking regionwright.api.campaign.cabin.rosewaterRings.handleRegionEvent, events behaviorViewed/behaviorUnviewed/behaviorDeactivated, was added ONLY to drained central-ring Region using elected GM native createEmbeddedDocuments. Native readback verified **disabled:true** and original Screwdriver script still enabled, and bound Region metadata still STAGED_DISABLED. Receipt on owner machine: utility-harness/artifacts/cav-rosewater-skyrim-concentric-native-disabled-region-20261026.json. No Rosewater session, approved symbols, token movement or item changes.

A draft screenshot of the new UI was saved locally as utility-harness/artifacts/cav-skyrim-style-rosewater-draft-ui-preview-20261026.jpg, but a separate D&D5e Animations warning dialog appeared above it. It is **NOT a clean approved visual**. The attempt to dismiss warning without suppressing future notices failed after Dev Chrome dropped its CDP listener. Foundry 30000 and Dev Chrome 9224 were both OFFLINE at 13:18 Pacific. Do not claim a successful new post-shutdown GM readback; restart/service debugging is separately needed. No blind restart loop performed.

## Activation requirements and next encounter step

1. Select or discover FOUR owner-approved symbols, ideally evocative of Sune/Rosewater rather than copying Skyrim's copyrighted art. Do not interpret the owner's Skyrim interaction reference as a decision on exact symbol identities or icon artwork. Owner-approved flags and artwork must remain absent in the meantime.
2. Stabilize Foundry/Dev Chrome and confirm elected GM, exact world, approved art/symbol flags, exact current native disabled Behavior and its source/event set; inspect map geometry and ring/screwdriver click separation.
3. Only after owner-approved art and actual drained-water conditions, change native Region binding STAGED_DISABLED to ENABLED and enable Behavior. Preserve the one-time GM session and no direct Sluice, hatch or item mutations. Later true player interaction test remains deferred by owner's established testing-phase decision.
4. Identify Sune's Bowl original pickup location on the same unified map; preserve its world Item and unique GM-authoritative claim. Crooked Man actor and chase remain deferred.
5. Continue chronological proof, metadata and handoff to GitHub; do not confuse code unit tests with gameplay acceptance.

**Current level: source + non-gameplay UI verified, native disabled dispatch verified; no playable ring activation yet.**
