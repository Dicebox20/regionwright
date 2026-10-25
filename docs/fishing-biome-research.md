# Fishing Biome Research

This document records the design boundary for Fishing within `regionwright-hunting-gathering`. Official D&D labels guide the environment keys; the species, bait, and item purposes are proposed homebrew content unless explicitly marked as an official creature name.

## Official environment set

The catalog uses the 2024 Basic Rules travel-terrain set: Arctic, Coastal, Desert, Forest, Grassland, Hill, Mountain, Swamp, Underdark, Urban, and Waterborne. Xanathar's Guide to Everything uses Underwater as an encounter environment, so the module exposes `underwater` and accepts `waterborne` as an alias. The 2014 Basic Rules favored-terrain list supplies the older core set and does not include Hill, Urban, or Waterborne as separate favored terrains.

| Module key | Official basis | Fishing interpretation |
| --- | --- | --- |
| `arctic` | Arctic terrain | Frozen lakes, thaw channels, polar rivers |
| `coastal` | Coastal terrain | Tidal pools, estuaries, reefs |
| `desert` | Desert terrain | Oases, wadis, irrigation channels |
| `forest` | Forest terrain | Shaded streams and woodland ponds |
| `grassland` | Grassland terrain | Farm ponds, broad rivers, seasonal creeks |
| `hill` | 2024 terrain and Xanathar's environment | Rocky streams and millponds |
| `mountain` | Mountain terrain | Alpine streams and glacial run-off |
| `swamp` | Swamp terrain | Warm, slow, murky water |
| `underdark` | Underdark terrain | Subterranean rivers and lakes |
| `urban` | 2024 terrain and Xanathar's environment | Canals, reservoirs, docks, sewer outflows |
| `underwater` | Xanathar's environment; 2024 calls travel across water Waterborne | Open water and submerged habitats |

## Canon and homebrew boundary

The official rules provide Fishing Tackle as adventuring gear, but they do not publish a universal fish table or assign ordinary fish stat bonuses when eaten. The core food rules make food relevant to hunger and exhaustion, not to an automatic ability increase. In this module, Fishing Tackle is an optional convenience bag rather than a prerequisite for the activity: when prepared, it uses the dnd5e container field and accepts fishing gear only. Accordingly:

- Ordinary catches are `ration` items with one ration and no automatic mechanical eating effect.
- Unusual catches can be `material` or `utility` items for bait, oil, teeth, hide, trade, crafting, or quest purposes.
- The catalog records an `edibleEffect` note, but does not apply stat changes, poison, or disease automatically.
- Piranha, Quipper, and Reef Shark are official creature names used as dangerous catch inspirations; their stat blocks are not copied into the module.

## Per-environment proposals

| Environment | Common catches | Special catch purpose | Preferred bait |
| --- | --- | --- | --- |
| Arctic | Arctic Char, Icefin, Coldwater Salmon | Cold-weather trade and smoked provisions | Ice Minnows, Salmon Roe, Shiny Junk |
| Coastal | Coastal Mackerel, Red Rockfish | Reef Shark teeth, hide, oil, trophy | Shrimp, Squid Strips, Fish Chum |
| Desert | Oasis Carp, Sunbaked Sunfish, Dune Catfish | Water-route trade and oasis scarcity | Oasis Grubs, Date Dough, Beetle Larvae |
| Forest | Brook Trout, Woodland Bass, Leafscale Perch | Local trade and downtime food | Worms, Grubs, Live Minnows |
| Grassland | River Carp, Prairie Bluegill, Channel Catfish | Cheap food and smoked provisions | Crickets/Grasshoppers, Bread Dough, Live Minnows |
| Hill | Creek Trout, Hill Pike, Stream Crayfish | Bait and streamside trade | Worms, Crayfish Tails, Cheese Scraps |
| Mountain | Mountain Trout, Alpine Salmon, Stoneback Char | Premium food and mountain trade | Stoneflies, Salmon Roe, Shiny Junk |
| Swamp | Blackwater Catfish, Marsh Gar | Piranha teeth, eel oil, predator bait | Leeches, Small Frogs, Carrion Chum |
| Underdark | Cavefish, Glowbass | Blind Eel oil and Quipper teeth/trophy | Glowworms, Cave Grubs, Fungal Bait |
| Urban | Canal Carp, Dockside Bream | Trade, oil, bait, or evidence from contaminated catches | Bread Dough, Cheese Scraps, Kitchen Scraps, Shiny Junk |
| Underwater | Sea Snapper, Deepwater Tuna | Quipper/reef-shark specimen materials | Shrimp, Squid Strips, Fish Chum |

## Official references

- [Basic Rules 2014: Classes and favored terrain](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes)
- [Xanathar's Guide to Everything: encounter environments](https://www.dndbeyond.com/sources/dnd/xgte)
- [Basic Rules 2024: DM's Toolbox and travel terrain](https://www.dndbeyond.com/sources/dnd/br-2024/dms-toolbox)
- [Basic Rules 2014: food, water, and foraging](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/adventuring)
- [Official Fishing Tackle equipment entry](https://www.dndbeyond.com/equipment/44-fishing-tackle)
- [Piranha](https://www.dndbeyond.com/monsters/5195160-piranha), [Quipper](https://www.dndbeyond.com/monsters/16989-quipper), and [Reef Shark](https://www.dndbeyond.com/monsters/16994-reef-shark)
