# Iggwilv's Tower - Region Naming Scheme

Use this exact format for every Region:

`IGG | TYPE-ID | Scene | Purpose`

`TYPE` separates behavior categories so an audit or reset macro can target them safely.

| Type | Meaning | Example |
|---|---|---|
| `T` | one-square travel threshold that teleports a token | `IGG | T01 | F1 Landing | West Door to Curiosities` |
| `A` | two-square arrival zone; **never** has a teleport behavior | `IGG | A01 | Curiosities | Arrival from F1 Landing` |
| `P` | puzzle or item interaction Region | `IGG | P16 | Witch Lab | Plant Food Cauldron` |
| `G` | visible but gated door/feature interaction | `IGG | G03 | F2 Landing | Rose Door` |
| `E` | optional encounter/event trigger Region | `IGG | E02 | Astral Garden | Awakened Treant` |

## Travel and arrival pairs

Each route has one `T` threshold and one matching `A` safe arrival. The number identifies the directional route, not both directions.

| Threshold Region | Matching Arrival Region |
|---|---|
| `IGG | T01 | F1 Landing | West Door to Curiosities` | `IGG | A01 | Curiosities | Arrival from F1 Landing` |
| `IGG | T02 | Curiosities | East Door to F1 Landing` | `IGG | A02 | F1 Landing | Arrival from Curiosities` |
| `IGG | T03 | F1 Landing | North Door to Private Chambers` | `IGG | A03 | Private Chambers | Arrival from F1 Landing` |
| `IGG | T04 | Private Chambers | South Door to F1 Landing` | `IGG | A04 | F1 Landing | Arrival from Private Chambers` |
| `IGG | T05 | F1 Landing | East Door to Private Library` | `IGG | A05 | Private Library | Arrival from F1 Landing` |
| `IGG | T06 | Private Library | West Door to F1 Landing` | `IGG | A06 | F1 Landing | Arrival from Private Library` |
| `IGG | T07 | F1 Landing | South Door to Witch Lab` | `IGG | A07 | Witch Lab | Arrival from F1 Landing` |
| `IGG | T08 | Witch Lab | North Door to F1 Landing` | `IGG | A08 | F1 Landing | Arrival from Witch Lab` |
| `IGG | T09 | Private Library | North Study Door` | `IGG | A09 | Private Study | Arrival from Private Library` |
| `IGG | T10 | Private Study | South Door to Private Library` | `IGG | A10 | Private Library | Arrival from Private Study` |
| `IGG | T11 | Private Library | Revealed Hidden Bookcase` | `IGG | A11 | Hidden Library | Arrival from Private Library` |
| `IGG | T12 | Hidden Library | Concealed Exit to Private Library` | `IGG | A12 | Private Library | Arrival from Hidden Library` |
| `IGG | T13 | F1 Landing | Central Stair to F2` | `IGG | A13 | F2 Landing | Arrival from F1 Stair` |
| `IGG | T14 | F2 Landing | Central Stair to F1` | `IGG | A14 | F1 Landing | Arrival from F2 Stair` |
| `IGG | T15 | F2 Landing | North Vault Door` | `IGG | A15 | Arcane Vault | Arrival from F2 Landing` |
| `IGG | T16 | Arcane Vault | South Door to F2 Landing` | `IGG | A16 | F2 Landing | Arrival from Arcane Vault` |
| `IGG | T17 | F2 Landing | Southwest Door to Summoning` | `IGG | A17 | Summoning Chamber | Arrival from F2 Landing` |
| `IGG | T18 | Summoning Chamber | Northeast Door to F2` | `IGG | A18 | F2 Landing | Arrival from Summoning Chamber` |
| `IGG | T19 | F2 Landing | Southeast Door to Astral Garden` | `IGG | A19 | Astral Garden | Arrival from F2 Landing` |
| `IGG | T20 | Astral Garden | Northwest Door to F2` | `IGG | A20 | F2 Landing | Arrival from Astral Garden` |

## Puzzle, gate, and event Regions

| Region name | Function |
|---|---|
| `IGG | P01 | F1 Landing | Removable Star Relief` | grants Star Emblem |
| `IGG | G01 | Private Library | Study Door Star Socket` | unlocks T09 |
| `IGG | P02 | Curiosities | Nixie Tank` | water/fruit quest stages |
| `IGG | P03 | Curiosities | Hourglass Coven Display` | grants Powdered Silver after riddle |
| `IGG | P04 | Private Chambers | Sunglobe` | grants Sunglobe |
| `IGG | P05 | Private Chambers | Epsom Salt Foot Bath` | grants Epsom Salts |
| `IGG | P06 | Private Chambers | Iggwilv Portrait Socket` | Crow's-Foot Key to Sovereign Seal |
| `IGG | P07 | Private Library | Red Leaf Fern` | grants fern |
| `IGG | P08 | Private Library | Calcium Source` | grants bones/bone meal |
| `IGG | P09 | Private Library | Hidden Bookcase Arrangement` | Regionwright Spine Mosaic |
| `IGG | P10 | Hidden Library | Black Tallow Candle Rack` | grants candles |
| `IGG | P11 | Private Study | Ingredient Cabinet Key Desk` | grants key |
| `IGG | P12 | Private Study | Hourglass Statue Riddle` | enables hourglass result |
| `IGG | P13 | Witch Lab | Reinforced Cabinet` | key to Astral Water/Demon Skull |
| `IGG | P14 | Witch Lab | Bone-Grinding Bench` | optional bone conversion |
| `IGG | P15 | Witch Lab | Plant Food Cauldron` | gated Regionwright Ingredient Mixing |
| `IGG | P16 | F2 Landing | Crow's-Foot Pedestal` | key + Flying Sword state |
| `IGG | G02 | F2 Landing | Rose-and-Thorn Door` | Thorn Key final gate, no F3 teleport |
| `IGG | P17 | Summoning Chamber | Vampire Assistant Workstation` | grants Blood Meal |
| `IGG | P18 | Summoning Chamber | Three-Component Binding Circle` | ritual to Obsidian Thorn |
| `IGG | P19 | Astral Garden | Sunglobe Plinth` | activation 1 |
| `IGG | P20 | Astral Garden | Astral Water Plinth` | activation 2 |
| `IGG | P21 | Astral Garden | Plant Food Plinth` | activation 3 |
| `IGG | E01 | Astral Garden | Dormant Astral Treant` | encounter/fruit resolution |
| `IGG | P22 | Astral Garden | Faerie-Dragon Water Source` | grants Fey-Infused Water |
| `IGG | G03 | Arcane Vault | Sovereign Seal Interface` | first Vault prerequisite |
| `IGG | G04 | Arcane Vault | Arcane Password Interface` | second Vault prerequisite |
| `IGG | P23 | Arcane Vault | Ivory Thorn Reliquary` | grants Ivory Thorn |

Do not name an arrival Region `Door`, a puzzle Region `Teleport`, or a secret passage `Hidden Door`. The stable IDs make macro updates and audits deterministic.
