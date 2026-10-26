# Cabin in the Ashen Veil — 2026-10-26 Chain Usability Baseline

**Owner request:** "Can you give me an upate on how much of the chain is usable?"

**Evidence/read-only scope:** Regionwright checkout `Dicebox20/regionwright` branch `codex/cav-sune-integration-20261026` latest pre-baseline `462bc1cf9cfad4b2bdcbf4f7a78f828591418e41`, local `docs/cabin-ashen-veil/region-puzzle-chain-audit-2026-10-25.md`, the later owner-directed `regionwright-puzzle-update-log-2026-10-26.md` and specific newer GM/native checkpoints. Foundry 30000 online, Dev Chrome 9224 offline at latest audit. No new live player test attempted for this report.

## Definitions
- **SOURCE/Built:** Source or GM authority implemented, with installed native Region/Behavior where separately documented.
- **STRUCTURAL:** Native Region IDs, script integration/disabled teleport and prerequisites verified; not proof of actual user operation.
- **PLAYABLE/PASSED:** Only after real non-GM owned token uses the UI and a GM confirms item, state, travel and once-only persistence. This criterion currently has **no full-chain receipt**.
- **BLOCKED:** Known disabled, missing, or intentionally deferred actor/portal/interaction.
- **Estimate:** The earlier full audit covers ~16 larger categories but predates many Oct26 builds; dividing across major gameplay waves gives only **roughly 40% of the main progression with substantial interactive installation**. Not a quantitative total of all nodes or a verified playable-percentage. Early-game appears **mostly built**, midgame **partially built**, late-game largely incomplete. The user's requested "usable" should NOT be reported as 40% player-tested.

## Current stage-by-stage reconciliation

| Stage / dependencies | October 26 source + native evidence | Usability boundary |
| --- | --- | --- |
| Start, exterior routes, foyer, carriage navigation | Broad teleport skeleton, existing travel Regions; Oct25 live inventory 46 Scenes, 203 Regions, 68/68 teleport IDs structurally resolving; Oct26 now 47 Scenes due owner-approved drained Bathhouse clone | Structural only; gates and player movement need non-GM verification |
| Pond rowboat / oars / Studio mirror and carriage | Original Regions/scripts and source Items present in Oct25 audit | Not player-tested |
| Attic / roof clock, replacement Gear | Oct26 original roof clock GM listener armed; original items and Region preserved | Structurally integrated, no item acquisition gameplay receipt |
| Four Sune busts → sliding memorial mosaic → 1000 gp and Brass Study Key | Oct26 live enabled SG05 viewed/unviewed script and Regionwright sliding-mosaic UI, GM reward/provenance guards, new real 1000gp container source, Study Key flags corrected | Installation complete at Region level; actual player solve/reward untested; board client-completion trust risk recorded |
| Brass Study Key → Study 587 → Donovan 587 lockbox → original Crank | Oct26 elected-GM Study587 hook moved from Macro to Studio ready; original door and note/lockbox Regions and one-time source Crank verified | Installed, but zero real player progression / Crank claimed |
| Sluice controls → Pond and Bathhouse drained state | Oct26 player-click original Crank install and open/close native Behavior `CAVEXT02SLCBEH01`, GM water transaction, owner-approved paired Pond/Bath maps; controller drainEnabled true | Current `CrankInstall=null`, `waterState=null`, `transition=null` — no completed drain; cannot call actual drained chain usable |
| Drained Pond Weathered Key → Basement | Oct26 original key Item and explicit Region; foyer gated Basement native portal initially disabled, original return enabled | Ready for legitimate puzzle unlock, not tested |
| Drained Bath Screwdriver → Parents drawer → Gate Handle | Oct26 original screwdriver pickup Region/Item source; independent repair and second-click once-only Handle grant; original roof replacement Gear preserved | Installed, no actual player claim |
| Gear + Handle → Aqueduct gate | Oct26 exact player part sockets and GM states, native portal pair staged disabled, certified safe-route commissioning API source installed | **Blocked from traversal**: no actual installed player parts/water and Crooked Man Actor explicitly deferred |
| First Crooked Man chase and Forest Well | Oct26 DC13 3 successes before 2 failures source, Sophia capture/rescue structural Regions and disabled AQ→Forest well routes staged | **Not active** until authentic NPC, gate commissioning and later gameplay testing |
| Boiler pressure | Oct26 both original unified Bathhouse variants have one enabled `CAVBOILERSCRPT01` Behavior; GM 2/1 service and Regionwright UI rendered; 73+ later 83 source cases pass | Ready for targeted player test, not completed by a player |
| Rosewater 3-ring lock | Owner-approved `rose/sun/moth/thorn`; original 90/270/180 engine, draft actual UI inspected, strict original Crank+Sluice proof LIVE loaded under GM Oct26, native `CAVROSEWATERSCR1` disabled | **Blocked** until genuine committed synchronized water drain, no Bowl pickup fixture approved |
| Greenhouse lye / plant killer and Waterworks downstream | Source lye-only amendment and pure evaluator; older Oct25 live audit found Region backend incomplete | Region/player service completion unverified, conservatively incomplete |
| Late SG01 chase, Silver Key, music box, Prayer/Workshop, Gazebo, Rufus and source charge | Oct25 audit and Oct25 completion plan show multiple absent behaviors/reward integrations; no newer Oct26 final native installation receipts for these | Incomplete / not playable end-to-end |
| Crimson Veil, six books, Privy fishing, emblem/Vault/Keystone, Undercroft/ending | Oct25 audit confirms major gaps; later owner correction Bowl on unified Bathhouse, Vault Keystone distinct; no newer complete player install receipts | Mostly incomplete |

## Implications / immediate blockers
1. **Testing readiness is not completed progression.** The early chain can be piloted from the start, but no real non-GM end-to-end proof has been run. Source suite **83/83 PASS** is not player acceptance.
2. The next *authentic midgame* prerequisite is real Study→587 Crank→Sluice open, followed by Pond/Bath synchronized drain; GM proof currently lists three missing receipts. Never manufacture these flags or spawn fake PCs to advance.
3. Aqueduct route and first chase remain deliberately disabled until original parts, water and owner-deferred Crooked Man Actor/token/GM actual chase plan are complete.
4. The later chain (second chase, Rufus, Greenhouse, books, Vault, Undercroft) needs additional source integration and native installation, not merely test passes.
5. **Current shortest path toward a playable vertical slice:** start → Sune → Study587 → fit Crank → genuine drained Pond/Bath → Basement/Screwdriver/Handle; confirm real player interactions and safe return paths in the owner's future test phase. Then commission AQ/chase and Rosewater with exact receipts, and continue late chain.

**Status interpretation:** ~40% substantial early/mid integration is a planning estimate; **zero full-chain player tests** and **no defensible certified whole-chain usable percentage**. Keep the latter explicit in user-facing progress reports.
