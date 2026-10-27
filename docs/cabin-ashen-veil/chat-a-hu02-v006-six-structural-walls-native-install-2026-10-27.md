# Cabin in the Ashen Veil — H-U02 V006 six native structural wall segments

**Date:** October 27, 2026, afternoon Pacific. **Workstream:** Chat A early/midgame, with Chat B retaining sole late-game Undercroft and SG-01 Silver Key scope. **Owner authority:** Owner explicitly delegated all Cabin creative and technical approvals on October 26, and requires GM-roleplayed checkpoint haunts/Crooked Man encounters to be LAST. Full combined compatibility diagnostic and real non-GM player acceptance follow completion of ALL content installation.

## PREPARE / STRUCTURAL INSPECT

Source Regionwright branch codex/cav-sune-integration-20261026, prior HEAD c3b35b0c0f6ade862c55993f91fad14adb242b8e, clean tracked checkout. Native Dicebox Bridge 0.1.26 local PowerShell ready; current canonical chat identity absent, so no Foreman/partner send. Original Foundry 14.367 elected Gamemaster 1 in cabin-in-the-ashen-veil, original H-U02 Scene gGgUHlHdI7RFrbUh, 1440×1800, grid 220, 14 original Regions and zero initial Walls. Original owner-approved background Maps/cabin-in-the-ashen-veil/h-u02-upper-landing-owner-approved-textfree-v006-2026-10-24.png, bitmap 1086×1448, preserved.

Previous two Chat A turns had in-place migrated all 14 original room/stair/attic Regions to the approved physical features and verified that no Region rectangle remains off-scene. This turn enlarged and visually inspected the actual approved art with 200px scene-coordinate grid overlay. Identified unambiguous WEST and EAST exterior sidewall runs and the upper horizontal masonry framing; original Nursery west/Guest east portals remain in existing intentional gaps. The existing approved V006 image depicts a south shell just above two existing real player-character token centers, however. Original tokens Glow and X'ul remain at top-left (604,1495) and (648,1654) with 220px grid, centers (714,1605) and (758,1764), respectively. **Installing the illustrated SOUTH full collision boundary today could strand both tokens on the wrong side.** Thus chosen partial side/north shell leaves the southern boundary deliberately OPEN and leaves original token positions untouched, preserving future return/travel.

Original Foundry installed wall patterns were inspected read-only: Great Room walls and other previously commissioned Scenes use move=20, sight=20, light=20, sound=20 for ordinary fixed walls, and door=0, ds=0. The six new segments follow this native convention; there are no added manual door controls crossing original TeleportToken Regions. All 14 original interactive/arrival Region rectangles and two original PC token centers are excluded by geometric line-vs-rect checks.

## FEATURE MANIFEST / OWNER-DELEGATED CREATIVE DECISION

Authoritative machine-readable original art/Region geometry + six stable wall IDs:
docs/cabin-ashen-veil/h-u02-v006-conservative-side-shell-structural-wall-manifest-2026-10-27.json.

| Stable original new Wall ID | Role | Wall segment endpoints in H-U02 Scene coordinates |
|---|---|---|
| CAVHU02WALL00001 | West upper exterior run | (100,340) to (100,510) |
| CAVHU02WALL00002 | West lower exterior run | (100,770) to (100,1540) |
| CAVHU02WALL00003 | East upper exterior run | (1365,340) to (1365,510) |
| CAVHU02WALL00004 | East lower exterior run | (1365,770) to (1365,1540) |
| CAVHU02WALL00005 | North frame, west of Parents door | (415,65) to (580,65) |
| CAVHU02WALL00006 | North frame, east of Parents door | (875,65) to (1080,65) |

Native Wall properties: movement/sight/light/sound=20 (normal blocking), door=0 (ordinary solid wall), ds=0. No secret, locked or ordinary physical door Wall documents were added: all genuine FIVE scene-to-scene portals continue to be governed by their ORIGINAL native RegionBehaviors. All six Walls have exact project flag provenance under dicebox-campaign-helper with manifest build ID, owner-delegated decision, source owner-approved V006, and explicit PARTIAL_STRUCTURAL_SIDE_SHELL phase. No previously existing H-U02 Wall was overwritten (there were zero).

## BUILD / EXACT ELECTED GM

Preflight required exactly one original Foundry /game tab, authenticated elected GM, Foundry version/world ID, original owner-approved background/Scene dimensions/220 grid, original 14 Region shapes and exact IDs, original Sophia/Attic native teleport disabled and no fabricated attic claim, two original PC tokens unmoved, active non-GM user viewing Yard rather than H-U02, zero existing Walls, all six proposed 16-character stable IDs unique, no segments crossing any Region shape, no south closure. Source pure tests passed before native write.

Exactly ONE narrow Scene.createEmbeddedDocuments("Wall") batch with SIX specified _id values and keepId true, not arbitrary console code or a new module. Each original native wall persisted with exact desired coordinates and typed properties. Same-call independent property readback reported native-six-walls-gm-verified, exact six IDs, preserved all original Region document source (SHA-matched before/after) and two original tokens. Host receipt:
utility-harness/artifacts/cav-chat-a-hu02-owner-approved-six-partial-structural-walls-install-20261027.json.

## VERIFY / CATALOGUE

New pure-source test file tests/cav-hu02-v006-guarded-partial-perimeter-walls.test.mjs adds FIVE tests, covering six stable IDs, correct source manifest and line coordinates, zero segment crossing any of original 14 interactive Region rectangles, true Nursery/Guest gaps and no artificial bottom closure while existing PC tokens stand south of illustrated shell. Full Cabin source suite **273/273 PASS**, 0 failures, 51 test files (previously 268/268).

A SECOND independently connected elected-GM Foundry read-only process performed exact native verification PASS. All six actual Walls have correct stable IDs, coordinates, normal movement/sight/light/sound blocking, non-door state and explicit metadata; H-U02 still 14 Regions; zero wall intersections with original Regions; protected Sophia entry, Attic entry and Attic return still disabled; Glow and X'ul original token positions preserved; no H-U02 non-GM active viewer. Shared actual Foundry census 47 Scenes, 250 Regions, 140 RegionBehaviors, global Walls **61** (prior 55), H-U02 six. Receipt:
utility-harness/artifacts/cav-chat-a-hu02-six-partial-structural-walls-independent-GM-postread-20261027.json.

No test token walk, UI interaction, scene teleport, real non-GM visibility or pathfinding was performed, in deference to owner's install-first sequencing. Original source Regionwright gameplay JS and in-session cached API unchanged; no browser/module reload triggered, so Chat B continues undisturbed. No player Item/actor/reward/story state, Chat B Undercroft, Crooked Man chase or Silver Key edited.

## Remaining H-U02 structural work

**WALLS PARTIAL, NOT COMPLETE**. The southern outer shell and southwest stair enclosure cannot yet be safely blocked until the two original characters currently positioned south of the intended wall have a legitimate non-trapping route (coordinate with GM/real player before stage). Upper-left and upper-right diagonal jamb continuity and possible perimeter gap closure also require a later bounded structural feature inspection. The already installed six sidewall/north frame segments are VERIFIED native. Do NOT repeat/create duplicate Wall IDs, invent collision walls through side-door Region triggers, create physical door Wall documents that conflict with the original Region teleport logic, or move player tokens just to make a wall test pass.

Next source/installed build steps may focus on other confirmed early/midgame puzzle or scene elements, leaving this safe wall shell intact. Final integrated compatibility and non-GM player acceptance remain deferred until all campaign content including LAST GM-controlled haunt encounters is installed.