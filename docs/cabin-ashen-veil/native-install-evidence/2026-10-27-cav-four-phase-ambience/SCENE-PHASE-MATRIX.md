# Cabin in the Ashen Veil — Four-phase ambience matrix (GM)

Created 2026-10-27 Pacific. Original 59-page Foundry Journal `JournalEntry.9dngVaa6ctgFAqd2` read in full. 47 current Scenes are mapped to descriptions. Only **Early Game** is applied and verified; Midgame, Late Game and Crimson Veil are prepared, intentionally inactive and not playtested.

**How to switch:** Macro Directory → `CAV — Ambience Phases (GM)` → choose phase. Restore Original Scene Ambience returns every original darkness/weather/dark-hue setting and removes only the two FXMaster IDs owned by this macro. All changes use native Scene configuration plus documented FXMaster direct effects API. Only elected GM can run. No automatic storyline phase listener.

**Safeguards:** All 47 Scene IDs, Region Behaviors, teleports, walls, tokens, ambient sound objects and ambient light objects preserved. Global light and token vision untouched. Original Carriage Yard FXMaster rain preserved. Existing generic fog removed indoors; low-density API-managed fog added only to 15 eligible exterior Scenes with stable IDs. Future phases deepen darkness; Crimson also uses a red color grade. Visual intensity should be checked with non-GM player before live phase switch.

| Scene title | Original read-aloud reference | Early | Mid | Late | Crimson | Early FX | Tone |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Aqueduct — Water Channels | AQ-01 — Main Aqueduct | 0.33 | 0.42 | 0.51 | 0.62 | — | Underground flowing water and copper conduits |
| Bathhouse — Interior A | BATH-01 — Main Bath — filled; BATH-01 — Main Bath — drained | 0.23 | 0.32 | 0.41 | 0.52 | — | Cool mineral-hazed bathhouse |
| Bathhouse — Interior B | BATH-01 — Main Bath — filled; BATH-01 — Main Bath — drained | 0.29 | 0.38 | 0.47 | 0.58 | — | Exposed, damp, drained bathing chambers |
| Grounds — Front Yard | EXT-01 — Carriage Yard | 0.15 | 0.24 | 0.33 | 0.44 | — | Wet leaves and an abandoned carriage |
| Grounds — Pond | EXT-02 — Pond and Sluice Gate — full; EXT-02 — Pond and Sluice Gate — drained | 0.19 | 0.28 | 0.37 | 0.48 | fog | Still black pond and damp sluice stones |
| Grounds — Small Shack | EXT-03 — Donovan's Shack | 0.24 | 0.33 | 0.42 | 0.53 | — | Weathered timber and sheltered silence |
| Grounds — Outbuilding | EXT-04 — Privy | 0.24 | 0.33 | 0.42 | 0.53 | — | Weathered timber and sheltered silence |
| Grounds — Gazebo | EXT-05 — Forgotten Gazebo | 0.25 | 0.34 | 0.43 | 0.54 | fog | Moss and vines over a deserted gazebo |
| Grounds — Greenhouse | EXT-06 — Greenhouse | 0.24 | 0.33 | 0.42 | 0.53 | — | Clouded glass and tangled vegetation |
| Grounds — Waterside Clearing | EXT-07 — Boathouse Clearing | 0.23 | 0.32 | 0.41 | 0.52 | fog | Weathered estate grounds in late autumn |
| Grounds — Rear Terrace | EXT-08 — Rear Deck and Family Grounds | 0.23 | 0.32 | 0.41 | 0.52 | fog | Weathered estate grounds in late autumn |
| Grounds — Woodland Path | EXT-TRAIL — Forest Trail Fork | 0.23 | 0.32 | 0.41 | 0.52 | fog | Weathered estate grounds in late autumn |
| Woods — Winding Trails | FM-01 — Iron Gate Entrance | 0.25 | 0.34 | 0.43 | 0.54 | fog | Tangled autumn hedges and shaded roots |
| Attic — Central Room | H-A01 — Central Attic | 0.30 | 0.39 | 0.48 | 0.59 | — | Dry rafters and settled dust |
| Attic — West Storage | H-A02 — West Attic Storage | 0.30 | 0.39 | 0.48 | 0.59 | — | Dry rafters and settled dust |
| Attic — North Storage | H-A03 — North Attic Storage | 0.30 | 0.39 | 0.48 | 0.59 | — | Dry rafters and settled dust |
| Attic — East Storage | H-A04 — East Attic Storage | 0.30 | 0.39 | 0.48 | 0.59 | — | Dry rafters and settled dust |
| Basement — Workroom | H-B01 — Allen's Basement Workshop | 0.37 | 0.46 | 0.55 | 0.66 | — | Tarnished mechanical fittings and cold stone |
| Basement — Inner Room | H-B02 — Secured Vault | 0.43 | 0.52 | 0.61 | 0.72 | — | Thick, sealed masonry and still air |
| Basement — Supply Closet | H-B03 — Basement Supply Closet | 0.35 | 0.44 | 0.53 | 0.64 | — | Cold stone, dormant machinery |
| F1 — Dining Room | H-G01 — Dining Room | 0.19 | 0.28 | 0.37 | 0.48 | — | Dusty domestic silence |
| F1 — Entrance Hall | H-G02 — Foyer | 0.19 | 0.28 | 0.37 | 0.48 | — | Dusty domestic silence |
| F1 — Kitchen | H-G03 — Kitchen | 0.19 | 0.28 | 0.37 | 0.48 | — | Dusty domestic silence |
| F1 — Pantry | H-G04 — Pantry | 0.19 | 0.28 | 0.37 | 0.48 | — | Dusty domestic silence |
| F1 — Study | H-G05 — Allen's Study | 0.23 | 0.32 | 0.41 | 0.52 | — | Ordered papers and tarnished metalwork |
| F1 — Great Room | H-G06 — Great Room | 0.50 | 0.59 | 0.68 | 0.75 | — | Broad shadowed room, familiar but neglected |
| F1 — Family Room | H-G09 — Rear Family Room | 0.19 | 0.28 | 0.37 | 0.48 | — | Dusty domestic silence |
| Roof — Chimney | H-R01 — Roof and Chimney Clock | 0.28 | 0.37 | 0.46 | 0.57 | — | Weathered shingles and exposed wind |
| F2 — Nursery | H-U01 — Nursery | 0.21 | 0.30 | 0.39 | 0.50 | — | Faded nursery and silent cradle |
| F2 — Upper Landing | H-U02 — Upper Landing | 0.24 | 0.33 | 0.42 | 0.53 | — | Quiet upper-floor unease |
| F2 — Guest Room | H-U03 — Guest Bedroom | 0.24 | 0.33 | 0.42 | 0.53 | — | Quiet upper-floor unease |
| F2 — Main Bedroom | H-U04 — Parents' Bedroom | 0.24 | 0.33 | 0.42 | 0.53 | — | Quiet upper-floor unease |
| F2 — Small Bedroom | H-U05 — Sophia's Bedroom | 0.22 | 0.31 | 0.40 | 0.51 | — | Well-loved books and a quiet small bedroom |
| F2 — Art Studio | H-U07 — Dahlia's Art Studio | 0.24 | 0.33 | 0.42 | 0.53 | — | Dusty pigments and worn canvases |
| F2 — Workroom | H-U08 — Candle Workshop | 0.29 | 0.38 | 0.47 | 0.58 | — | Hardened wax and disused crafting tools |
| Grove — Northwest Path | SG-01 — Northwest Grove Corner | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — North Walk | SG-02 — Northern Processional Walk | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — Northeast Path | SG-03 — Northeast Grove Corner | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — West Entrance | SG-04 — Western Grove Walk | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — Central Clearing | SG-05 — Memorial Clearing | 0.28 | 0.37 | 0.46 | 0.57 | fog | Weathered stone and old rosebeds |
| Grove — East Walk | SG-06 — Eastern Grove Walk | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — Southwest Path | SG-07 — Southwest Grove Corner | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — South Walk | SG-08 — Southern Grove Walk | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Grove — Southeast Path | SG-09 — Southeast Grove Corner | 0.29 | 0.38 | 0.47 | 0.58 | fog | Mossy memorial paths beneath bare branches |
| Underground — Entry Passage | UND-01 — Undercroft Approach | 0.41 | 0.50 | 0.59 | 0.70 | — | Damp enclosed stone |
| Underground — Old Rooms | UND-02 — Sealed Refuge | 0.41 | 0.50 | 0.59 | 0.70 | — | Damp enclosed stone |
| Underground — Deep Chamber | UND-03 — Ritual Chamber | 0.45 | 0.54 | 0.63 | 0.74 | — | Heavy silence over ancient stone |

Original narrative text and original Scene native snapshot saved in the adjacent machine-readable read-only proof JSON. No player spoiler dialogue has been added to Scene descriptions.

**FXMaster version verified:** 8.3.6. API probe created and removed a stable low fog row in an unoccupied Grove Scene, preserving earlier FX. Full Early phase readback `pass:true`: 47/47 Scene settings, 15/15 FX rows, existing 11 sound objects, five ambient lights and all original Regions verified unchanged.
