# CAV — Independent Map Music: 47 Scenes (Early Game)

Installed and independently elected-GM verified on 2026-10-27. Each map has a native Foundry v14 Ambient Sound emitter centered on its image, covering all four corners plus one grid margin; volume easing OFF, walls OFF, repeat ON, darkness activation [0,1]. Does **not** depend on GM Scene activation.

**Owner-selected ceremonial perimeter:** All eight outer Grove Scenes SG-01 through SG-04, SG-06 through SG-09 use **Demon Slayer - The Smell of Fear.mp3**. The central SG-05 clearing uses a different track. Existing music file was found in the owner local Foundry library and returned HTTP 200; no audio was downloaded or reproduced in Git.

**GM control:** Foundry Macro Directory → **CAV — Independent Scene Music (GM)** → **Install / Verify / Restore Original Map Sounds**. It preserves ten original rainy/atmospheric sound effects and ADOPTS original Yard Elwynn Forest music without a duplicate. Last installed code backup is `CAV-Independent-Scene-Music-GM-Macro.js`; restoring original sound setup will delete only the 46 sources owned by the macro and restore the original Yard emitter fields/flags. Partial install fails closed with macro pending flag; do not replay one-time installers.

**Listener caveat:** Native Ambient Sounds generally rely on a player-controlled token inside the audible area, not merely the player opening a Scene tab. Actual client-side volume and playback when navigating independently still require a non-GM test with appropriate tokens on the destination Scenes.

| Player-facing Scene | Track from owner library | Vol. | Radius (ft) | Origin |
| --- | --- | ---: | ---: | --- |
| Aqueduct — Water Channels | The River pt1.mp3 | 0.15 | 158 | New GM Sound Layer emitter |
| Bathhouse — Interior A | Dungeon - Caverns.mp3 | 0.17 | 62 | New GM Sound Layer emitter |
| Bathhouse — Interior B | Dungeon - Caverns.mp3 | 0.17 | 62 | New GM Sound Layer emitter |
| Grounds — Front Yard | Elwynn Forest-Music.mp3 | 0.22 | 98 | Original yard music retained |
| Grounds — Pond | The River pt1.mp3 | 0.15 | 158 | New GM Sound Layer emitter |
| Grounds — Small Shack | Wilderness Music - Night Camp.mp3 | 0.16 | 46 | New GM Sound Layer emitter |
| Grounds — Outbuilding | Wilderness Music - Night Camp.mp3 | 0.16 | 45 | New GM Sound Layer emitter |
| Grounds — Gazebo | Feywild - Lake Dreamgrove.mp3 | 0.16 | 58 | New GM Sound Layer emitter |
| Grounds — Greenhouse | Dark Forest Ambient Music - (Royalty Free).mp3 | 0.18 | 58 | New GM Sound Layer emitter |
| Grounds — Waterside Clearing | The River pt1.mp3 | 0.15 | 116 | New GM Sound Layer emitter |
| Grounds — Rear Terrace | Autumn Ambience - Relaxing Wind and Forest Sounds - D&D Ambience.mp3 | 0.16 | 46 | New GM Sound Layer emitter |
| Grounds — Woodland Path | Wilderness Music - Calm Forest.mp3 | 0.16 | 116 | New GM Sound Layer emitter |
| Woods — Winding Trails | Dark Forest Ambient Music - (Royalty Free).mp3 | 0.18 | 158 | New GM Sound Layer emitter |
| Attic — Central Room | Ambience - Horror Rain.mp3 | 0.14 | 46 | New GM Sound Layer emitter |
| Attic — West Storage | Ambience - Horror Rain.mp3 | 0.14 | 46 | New GM Sound Layer emitter |
| Attic — North Storage | Ambience - Horror Rain.mp3 | 0.14 | 46 | New GM Sound Layer emitter |
| Attic — East Storage | Ambience - Horror Rain.mp3 | 0.14 | 46 | New GM Sound Layer emitter |
| Basement — Workroom | Dungeon Music - Stealth 2.mp3 | 0.17 | 46 | New GM Sound Layer emitter |
| Basement — Inner Room | Ambience - Dark Tidings.mp3 | 0.18 | 46 | New GM Sound Layer emitter |
| Basement — Supply Closet | Ambience - Dark Tidings.mp3 | 0.18 | 46 | New GM Sound Layer emitter |
| F1 — Dining Room | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| F1 — Entrance Hall | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 33 | New GM Sound Layer emitter |
| F1 — Kitchen | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| F1 — Pantry | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| F1 — Study | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| F1 — Great Room | Dungeon Music - Stealth 1.mp3 | 0.16 | 35 | New GM Sound Layer emitter |
| F1 — Family Room | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| Roof — Chimney | Dark Forest Ambient Music - (Royalty Free).mp3 | 0.18 | 46 | New GM Sound Layer emitter |
| F2 — Nursery | Memories (Sad Music Box) by Michael Ortega.mp3 | 0.17 | 46 | New GM Sound Layer emitter |
| F2 — Upper Landing | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 34 | New GM Sound Layer emitter |
| F2 — Guest Room | Mystical Theme - RPG Toolkit.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| F2 — Main Bedroom | Memories (Sad Music Box) by Michael Ortega.mp3 | 0.17 | 46 | New GM Sound Layer emitter |
| F2 — Small Bedroom | Memories (Sad Music Box) by Michael Ortega.mp3 | 0.17 | 46 | New GM Sound Layer emitter |
| F2 — Art Studio | Dungeon Music - Stealth 1.mp3 | 0.16 | 46 | New GM Sound Layer emitter |
| F2 — Workroom | Dungeon Music - Stealth 2.mp3 | 0.17 | 46 | New GM Sound Layer emitter |
| Grove — Northwest Path | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 116 | New GM Sound Layer emitter |
| Grove — North Walk | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 116 | New GM Sound Layer emitter |
| Grove — Northeast Path | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 116 | New GM Sound Layer emitter |
| Grove — West Entrance | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 116 | New GM Sound Layer emitter |
| Grove — Central Clearing | The Queen of Air and Darkness.mp3 | 0.16 | 116 | New GM Sound Layer emitter |
| Grove — East Walk | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 116 | New GM Sound Layer emitter |
| Grove — Southwest Path | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 93 | New GM Sound Layer emitter |
| Grove — South Walk | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 116 | New GM Sound Layer emitter |
| Grove — Southeast Path | Demon Slayer - The Smell of Fear.mp3 | 0.19 | 93 | New GM Sound Layer emitter |
| Underground — Entry Passage | Underdark Path.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| Underground — Old Rooms | Underdark Path.mp3 | 0.19 | 46 | New GM Sound Layer emitter |
| Underground — Deep Chamber | Shadow Temple.mp3 | 0.18 | 46 | New GM Sound Layer emitter |

All other legacy AmbientSound placeables, Region Behaviors, lights, map walls, and Scene playlists remain in place. The current Early Game FXMaster ambience stays active; future scene chapter ambience phases were not changed.
