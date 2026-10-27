# Cabin in the Ashen Veil — Owner-authorized player-facing puzzle narration audit and anti-spoiler rewrite

**Date:** October 27, 2026 Pacific afternoon. **Owner instruction:** This ChatGPT conversation now serves as a puzzle-testing and revision space. In response to the screenshot of the Family Carriage giving away its key solution, owner ordered an audit of ALL player-facing campaign text and removal of direct puzzle instructions. This explicit owner QA request authorizes text-only edits across scenes without taking ownership of the other Chat B late-game mechanical work. The established puzzle deployment and preservation workflow PREPARE / INSPECT / BUILD / VERIFY / CATALOGUE remains applicable. All Crooked Man haunts still remain GM-run, implemented last, not puzzle gates.

## Standard for all future player-facing puzzle prose

**Show the world; do not explain the solution.** Player-visible journals, dialogs, scene Regions, GM macro dialogs, private ChatMessages and UI status should convey sensory observations, physical details, atmosphere and the results of player-chosen actions. Never tell players which exact item to use, where to fetch it, where to stand, the intended sequence/combination, the successful DC or success count, or the direct solution in prose. Existing interaction controls may still allow a player to freely choose an action but should not name the hidden required item. The owner controls when the GM reveals further hints through roleplay. Keep ALL authentic source Item custody/claim/provenance checks, DCs, puzzle flags, API event handling, safety checks, and GM-only transactional prompts intact. Standard D&D Item mechanical rules are NOT puzzle spoilers and must not be deleted. Do not erase historical provenance or prior ChatMessage records.

Persist this as the default Cabin player-facing writing and puzzle-installation QA rule for both Chat A and Chat B. Future newly installed text must pass an anti-spoiler review during PREPARE and VERIFY, including disabled-but-staged Behaviors before they become live.

## PREPARE / original complete live-world content inventory

Used Dicebox Bridge 0.1.26 local PowerShell with the existing exact elected-GM Foundry 14.367 original world cabin-in-the-ashen-veil, exact unique Dev Chrome Foundry :30000 tab. Read-only inventory of **47 Scenes, 250 Regions, 60 native ExecuteScript sources, 5 Journals containing 331 total page records, 78 world Items, 326 Actor-embedded Items, 19 world Macros and 52 previous ChatMessages**, plus 32 studio-cav-* source module files. Original full JSON source snapshot utility-harness/artifacts/cav-player-facing-comprehensive-text-inventory-20261027.json. After-change snapshot cav-player-facing-comprehensive-text-inventory-final-after-70-20261027.json.

Risk review distinguished actually player-visible DialogV2 content, private/public ChatMessage narration and macro popup text from GM-only ledger/reconciliation dialogs, source comments and system item rules. Targeted journal, world item and historical ChatMessage scans returned no genuine new solution directives needing changes; some harmless prose ("must have trusted", "made to stand beside its companions") triggered broad search patterns and were rejected as false positives. Historical private messages are kept intact for forensic chronology, rather than silently rewriting a transcript. GM-only Region names describing item dependencies and source snapshots are not displayed as puzzle instructions; unchanged.

### Example: original Family Carriage

**Removed:** "The family carriage sits beneath its rotten canopy. A substantial iron lock holds the door shut. The keyhole is shaped for a long, old-fashioned key. Bring the character holding the carriage key up to the door to open it."

**Installed on exact original live enabled RegionBehavior:** "The family carriage sags beneath its rotting canopy, its lacquered panels dulled by years of neglect. A heavy iron lock holds the door fast, its surface pitted with rust. Beyond the warped glass, the interior waits in darkness. The handle rattles beneath your touch, but the door refuses to yield."

Original Behavior Scene.CAVEXT01Yard0001.Region.CAV01R0000000008.RegionBehavior.3nhNHvdSWo9ix10a was updated IN PLACE. Exact new source SHA256 b8a8a89b1064c21ba3efdbd4cc09dce451de9775bd808b0edd973271a1c0d580. Same original key provenance checks, one-and-only-one Ladder Hook, original private reward ChatMessage, Region identity and active state; no reward issued or player interaction performed.

## INSPECT / BUILD — exact 70 player-facing string replacements

Original native in-world behavior scripts: **11** exact original RegionBehavior sources text-only updated, **30** quoted visible passages reworded, each with exact original source equality preflight, elected-GM identification, preserved status/events/flags, same-call source readback and independent second GM source SHA proof. IDs:
- Early/midgame: Family Carriage 3nhNHvdSWo9ix10a; roof clock i6UNtWSFFaZgkdZD; Great Room fireplace CAV06FIRECLICK01; Donovan 587 CAVEXT03BOXBEH01; Study note CAVHG05NOTE00001; staged Privy CAVPRIVYRETBH001 and CAVPRIVYKEYBH001.
- Late player-visible text-only: Gazebo Lantern CAVLANTERNBEH001; Parents Hope Chest CAVHOPECHSTBEH01; workshop Wick shelf CAVWICKSHELFBEH1; disabled Vault Keystone dais CAVVKEYPLINTH001. Owner-wide prose QA instruction applies. Exact source/disabled status and ownership preserved; no late-game mechanic, Silver Key custody or Undercroft content edited.

Regionwright module files: **eight** exact original script files (no arbitrary rewrites of engine mechanics), **39** quoted UI/narration revisions. Files: studio-cav-aqueduct-gate.js (6 passages), studio-cav-basement-nightstand.js (8), studio-cav-drained-pickups.js (2), studio-cav-first-chase.js (1), studio-cav-sluice.js (9), studio-cav-sophia-confinement.js (5), studio-cav-sune-relief.js (1), studio-cav-water-controller.js (7). Text no longer directly says "Drain the water first", "needs the Screwdriver from the drained Bathhouse", "original iron key from the Parents' coat", "original Crank must be fitted" or the First Chase DC and success-count threshold. GM-only source logic and authentic puzzle condition validators were untouched. Module source changes copied byte-for-byte to the original installed Regionwright module on the authorized Foundry host after strict original-source SHA preflight, with pre-install backups and SHA readbacks. **Existing already initialized client/GM module API imports are still cached. No forced Foundry/client/module refresh occurred because Chat B shares the active world and runtime. Safe coordinated refresh required before declaring those live dynamic module strings activated for existing sessions.** Source disk and fresh independent read confirm installed bytes match repository.

Original GM Macro **CAV - First Chest (024)**, UUID Macro.CAVCHEST024MAC01, was updated IN PLACE in its player-viewable three-digit lock dialog only: replaced "The chest has three numbered tumblers. Enter the combination." with "Three numbered tumblers sit beneath a scarred brass plate, their markings worn smooth by age." The original numeric wheels, click/key handling, original answer 024, reward/control conditions, macro name, type and flags are unchanged. Original Macro command source SHA4908b0fd7da164a1eb33ddca1820ec143d47112414543e48c3e38bdbc5e46ef6 -> SHA68cc97e5c2d789f0c7137e72674a9834c6ae67ce7c04c039afd06ece70318ba9, independently read from actual native elected-GM macro.

**TOTAL: 30 original native RegionBehavior passages + 39 module source passages + 1 GM macro passage = 70 player-visible wording replacements.** No Region, Scene, Behavior, Macro or Item created or deleted; only the original 11 Behavior source strings, one original macro.command, and eight module source files changed. No flags, outcomes, key requirements, original actor items, tokens, Silver Key, Undercroft or reward transactions changed.

## VERIFY / QA evidence

Source JSON policy + all 70 explicit old/new phrase pairs: docs/cabin-ashen-veil/player-facing-puzzle-nonspoiler-text-audit-manifest-2026-10-27.json. Test tests/cav-player-facing-puzzle-no-direct-solutions.test.mjs adds FIVE anti-regression checks for strict source old-phrase absence/new approved-phrase presence, all 11 original native UUID+SHA entries, changed Macro provenance and permanent player-vs-GM safety policy.

**ALL 278/278 Cabin source tests PASS, 0 failures across 52 test files**, baseline before audit 273/273. Every altered module parses with Node and installed source exact SHA equality on disk.

Independent second elected-GM native sources read-only verification **11/11 PASS**:
utility-harness/artifacts/cav-player-facing-all-eleven-native-sources-independent-GM-proof-20261027.json.

Independent module deploy + native original first chest Macro readback **8/8 source files and 1/1 Macro PASS**:
utility-harness/artifacts/cav-player-facing-eight-modules-and-chest-macro-independent-postread-20261027.json.

Per-write machine receipts:
utility-harness/artifacts/cav-player-facing-native-seven-behaviors-guarded-write-20261027.json
utility-harness/artifacts/cav-player-prose-late-native-four-guarded-updates-20261027.json
utility-harness/artifacts/cav-player-prose-five-modules-real-deploy-20261027.json
utility-harness/artifacts/cav-player-facing-second-module-UI-three-source-patch-deploy-20261027.json
utility-harness/artifacts/cav-player-prose-sune-chase-narration-no-mechanics-changed-20261027.json
utility-harness/artifacts/cav-player-facing-first-chest-macro-narration-original-in-place-20261027.json.

The first attempted native-seven installer had a JAVASCRIPT syntax error before any world write, twice; script syntax fixed and the single actual guarded seven-behavior install succeeded without duplicate writes. The late four Behavior installer initially failed a strict multiline whitespace exact-text assertion BEFORE world write; reconciled expected seven spaces, then installed exactly four once. The macro policy regression initially failed due PowerShell serialization of nested arrays and a missing scope counter; source-only manifest corrected, full suite then passed 278. No false-positive reward ledger repair, staged promotion or simulated player progression.

A final fresh whole-world text inventory and literal residual scan found twelve heuristic "instruction" matches. Actual review showed GM-only disabled Vault transactional confirmation text (three sources), native successes AFTER key/puzzle rewards, one Sune/roof completion notice, one source commentary/safety requirement, and the harmless phrase "silver lock ... narrow keyway": these are not unearned player solution instructions. The residual scan is recorded in utility-harness/artifacts/cav-player-facing-final-residual-directive-quote-audit-20261027.json. This is a systematic source/static audit, **not a guarantee** against every possible unanticipated dynamic UI wording or manual GM narration. Player-facing non-GM GUI testing is newly authorized as this chat becomes the puzzle QA workspace.

## CONTINUE / acceptance boundaries

- All rewritten native script sources are saved to original Foundry Documents with both GM source proof and original metadata intact. Already-registered per-player pointer handlers or module imports may still show prior strings until the correct user changes scene, reopens interaction or a coordinated safe refresh occurs; do not equate updated disk/script Document with an already-open client dialog.
- The owner has now explicitly authorized beginning **puzzle QA and wording iteration in this chat**, a scoped change from the prior install-first timing rule; the broad campaign cross-workstream compatibility certification still waits for all installed content. Live puzzle testing should proceed with non-GM owner participation and explicitly controlled fixture interactions without forging original story/item receipts or player rewards.
- Keep future Chat A/Chat B installation transcriptions chronological and update this anti-spoiler rule. GM-only confirmation/provenance instructions remain deliberately intact to protect one-time item claims.