# Cabin in the Ashen Veil — Owner-directed region fixes, October 27 2026

## Scope and owner workflow

The owner is testing one Region at a time and expects a reported defect fixed without re-approval; unrelated extra repairs require approval. This batch addresses exactly three owner requests: locked Yard-to-Maze notice, free-loot click retrieval for authentic original Items, and image-free Donovan's 587 lockbox using the same three-wheel controls as the first chest.

## Locked Yard gate

Original Scene.CAVEXT01Yard0001.Region.CAV01R0000000002 retains original disabled teleport Behavior GRC83AT3emhbNVUL until original maze-side CAVFM01Scene0001.Region.t9MFbLLnSR173tGH unlock Behavior runs. New enabled 16-character native ExecuteScript Behavior CAVMAZELOCKMSG01 reports privately on actual player token entry that the heavy iron gate will not budge. Script checks that the original teleport remains disabled and does not reveal the puzzle solution. Native install and independent GM readback PASS; no player interaction was simulated.

## Donovan's 587 lockbox

Updated ONLY original Scene.CAVEXT03Scene001.Region.CAVEXT03BOXREG01 Behavior CAVEXT03BOXBEH01. Removed image markup showing a closeup that inadvertently reveals the lock combination. Replaced three-number dropdowns with the first chest's visual style: three stacked digit/arrow selectors, keyboard arrows and mousewheel. Original 587 answer, source Study note prerequisite, GM-only attempt service, Sluice Crank grant, all one-time ledgers, original Region events/flags untouched. Final original native source SHA256 5f921f26ef3b4c074d313ac201e91b51fedfeb6877961cffe5d512e0636bdda9. Native write and independently elected GM source verification PASS. No user combination attempt executed; no item was granted.

## Six free-loot original Regions: click to Collect

Six original ungated direct-item pickups now support player clicks, while preserving their original token movement pickup scripts and existing authentic claim systems:

- Shack Interior Oars, Scene.CAVEXT03Scene001.Region.TWKOyz83JjJu94E7 (CAVOARSBEHAV0001). Historical one-time award already DONE on Skaal Tel. Clicking should now show Close without issuing another item.
- Donovan Lamp Oil, Scene.CAVEXT03Scene001.Region.CAVEXT03OILREG01 (CAVEXT03OILBEH01).
- Parents Coat Old Iron Key, Scene.CAVHU04Scene0001.Region.CAVHU04COATREG01 (CAVHU04COATBEH01).
- Attic West Clockwork Winder, Scene.KwpmPrYgEC7KQVCZ.Region.82gAoSwyIPu8EdQs (SuECFpdFlDtFf3j0), real ladder / attic teleport requirements unchanged.
- Attic East Minute Hand, Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG (whiZBUmM3mbZEOwF), real ladder / attic teleport requirements unchanged.
- Sophia Bear First Glass Eye, Scene.CAVHU05Scene0001.Region.CAVB0FDF8543F6D9 (aZlQOQfF6gPrMaye), original locked Sophia door requirement unchanged.

Created a fixed allowlisted GM-side source helper modules/regionwright/scripts/studio-cav-free-pickup-click.js and added import/install of that service to the existing studio-campaign.js bootstrap. Source and installed module bytes match, original installed bootstrap matched prior source exactly, and no entire Foundry/Regionwright reload occurred. The helper was hot-registered in elected GM session via only its own dynamic import (listener ID 659). Its requests are authenticated via actual ChatMessage sender, scene, Region observer permission, player character ownership, distance, exact canonical source Item, original legitimate access gate, one-time ledger status and no preexisting source Item. GM, not the player's browser, reserves/grants original embedded Item and records a source-provenance DONE receipt.

Updated the SIX native original RegionBehavior scripts IN PLACE with clickable Collect dialogs. Oars gained player behaviorViewed/unviewed/deactivated events; original tokenMoveIn retained. Other five preserved all original events and original movement rewards. No Actor/Item/Token/flag/progression changes or chat messages occurred during installation. Source before/after SHAs and original complete scripts remain in docs/cabin-ashen-veil/cav-six-free-click-pickup-original-behavior-source-manifest-2026-10-27.json. Real puzzle-gated Carriage Ladder Hook, Rowboat Mirror, Vanity rewards, Crank, Nightstand, Vault, original Silver Key and drainage items were not made freely collectible.

## Verification / receipts / next

Source tests added six; all Cabin source tests 290/290 PASS, zero failures across 54 test files (before 284). Exact guarded native six-behavior writes 6/6 PASS and an independent separately connected elected-GM source/state inspection 6/6 PASS. Original Yard locked-gate notice, original disabled portal and image-free Donovan 587 Behavior independently verified. No actual non-GM click and one-time item claim acceptance performed.

Host receipt paths under utility-harness/artifacts:
- cav-locked-maze-gate-player-notice-20261027.json
- cav-donovan-587-lockbox-wheel-without-image-native-update-20261027.json
- cav-free-click-GM-service-hot-register-no-world-reload-20261027.json
- cav-six-free-pickup-player-click-native-original-behavior-updates-20261027.json
- cav-free-click-six-regions-gate-donovan-independent-elected-GM-proof-20261027.json

To load updated original behaviorViewed handlers, the player may need to leave/re-enter a scene or refresh only their own client. GM service is currently hot-armed and will be rearmed by the source bootstrap on any future coordinated module restart. Do not cause a global Foundry/module reload while the other late-game workstream is active. Next single playtest checkpoint: Donovan Shack Lamp Oil click Region CAVEXT03OILREG01, selecting one nearby player-owned character and pressing Collect. Owner reports PASS/MISSING/FAIL before any unrelated repair.