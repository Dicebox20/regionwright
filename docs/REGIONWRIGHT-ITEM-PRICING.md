# Regionwright Item Pricing Guide

This is the shared pricing reference for Regionwright, Studio, and companion modules. It is a design policy, not a runtime dependency or an instruction to overwrite existing world items. A module may use a different game system or campaign economy; in that case, label and follow that system's rules.

## Pricing principles

1. Use a published 2024 D&D price when the item is listed in the official [Equipment rules](https://www.dndbeyond.com/sources/dnd/br-2024/equipment). Do not assign a mundane item's price from its rarity.
2. Preserve the listed unit: per item, bundle, dose, container, day, or other stated amount. If the rules do not give a price, do not imply that a proposed value is official.
3. Separate an item's function from its sale price. A fish that counts as one ration has one ration of food utility; that does not make its market value 5 sp.
4. Mark custom values as **homebrew** and record whether they are a purchase price, crafting cost, or resale value.
5. Apply availability and local-market judgment explicitly. The DM determines whether listed equipment is stocked; a price table is not a guarantee of availability.

For new or revised item records, include a source/status (`official`, `homebrew`, or `unpriced`), price and denomination, priced unit, item family, consumption/durability, and resale rule where relevant. Never silently replace existing world-item prices.

## Pricing by item family

| Item family | Shared rule |
| --- | --- |
| Weapons and ammunition | Use the 2024 Equipment table and its listed bundle/unit. Price custom ammunition by a comparable listed bundle; label the estimate homebrew. |
| Armor and shields | Use the listed armor/shield price. Custom construction, materials, or quality must be called out separately; mundane rarity is not a multiplier. |
| Tools, kits, packs, and durable adventuring gear | Use the listed item price. A custom durable tool should be compared to a similar item's cost and usefulness, with the estimate marked homebrew. |
| Ordinary consumables (food, drink, bait, oil, etc.) | Use the official listed price for the stated quantity or container when available. Otherwise price per use/dose, not as though a single unit were durable gear. |
| Potions and other magic consumables | Use the magic-item rarity price as the starting point, then halve it for a consumable unless it is a Spell Scroll. Apply any base mundane-item cost when the magic item incorporates equipment. |
| Spell Scrolls | Use the explicit scroll price when listed. For other spell levels, the 2024 scroll value is twice its scribing cost; do not apply the general consumable half-price rule to Spell Scrolls. |
| Other magic items | Use the 2024 rarity-value table as a baseline, add the cost of any mundane item incorporated into it, and account for availability or a non-gold quest price if the campaign uses one. |
| Trade goods, gems, art, and valuables | Use their stated or appraised market value. Unlike ordinary equipment, trade goods and valuables retain full marketplace value when sold under the 2024 rule. |
| Crafting materials and salvage | Use a published recipe/material cost if one exists. For nonmagical crafting, raw materials cost half the item's purchase price; a component without a known market price needs a clearly labeled campaign estimate. |
| Services, lodging, food, and lifestyle | Use the 2024 Services and Food, Drink, and Lodging tables where applicable. Custom services should state the unit (per day, mile, casting, etc.) and be labeled homebrew. |
| Fish and other catches | Track food/ration function, crafting/trade purpose, and sale value as distinct fields. A catch's rarity can affect fishing difficulty without dictating its price. |

### 2024 magic-item reference values

| Rarity | Baseline value |
| --- | ---: |
| Common | 100 gp |
| Uncommon | 400 gp |
| Rare | 4,000 gp |
| Very Rare | 40,000 gp |
| Legendary | 200,000 gp |
| Artifact | Priceless |

These are magic-item values, not universal price bands for every object called common, rare, or legendary. Halve a consumable magic item's value except for Spell Scrolls. Add the mundane equipment cost when a magic item incorporates it (for example, magic plate armor includes the plate armor price).

## Crafting references

- **Nonmagical items:** raw materials cost half the purchase price. Crafting takes purchase price in gp divided by 10, rounded up to whole 8-hour workdays, with the required tools and proficiency. The DM decides whether materials are available.
- **Potions of Healing:** a character proficient with an Herbalism Kit can craft one using 25 gp of raw materials and one 8-hour day.
- **Magic items:** the 2024 crafting table gives Common 5 days/50 gp, Uncommon 10 days/200 gp, Rare 50 days/2,000 gp, Very Rare 125 days/20,000 gp, and Legendary 250 days/100,000 gp. Halve time and cost for consumables other than Spell Scrolls. Add the complete price of any mundane base item.
- **Spell Scrolls:** use the level-specific 2024 Scribing Spell Scrolls cost/time table, plus any required spell components. The scroll's market-value rule is separate from its crafting cost.

See the official [2024 Equipment and crafting rules](https://www.dndbeyond.com/sources/dnd/br-2024/equipment) and [2024 Magic Items rules](https://www.dndbeyond.com/sources/dnd/br-2024/magic-items) for full prerequisites and tables.

## Fishing module profile

These are campaign-specific homebrew choices, not official D&D prices. They apply only when a Regionwright fishing catalog needs a proposed price; they do not alter existing compendium or actor items automatically.

### Gear and bait

- The legacy D&D Fishing Tackle kit is listed at **1 gp** and includes a rod and several supplies. The fishing module's separate **Fishing Pole** and optional fishing-only **Fishing Tackle** container are custom items; their current catalog records each list **1 gp**. The legacy price is a reference point, not proof that each split item has an official price. [Legacy Fishing Tackle reference](https://www.dndbeyond.com/equipment/44-fishing-tackle)
- Price bait by the single cast/use, even if an inventory item is stacked in multiples. Suggested homebrew prices:

| Suggested price per use | Bait |
| --- | --- |
| 1 cp | Worms; Grubs; Crickets and Grasshoppers; Bread Dough; Cheese Scraps; Fish Chum; Date Dough; Beetle Larvae; Carrion Chum; Cave Grubs; Kitchen Scraps; Shiny Junk |
| 5 cp | Live Minnows; Stonefly Nymphs; Shrimp; Squid Strips; Crayfish Tails; Leeches; Small Frogs; Glowworms; Fungal Bait |
| 1 sp | Ice Minnows; Salmon Roe; Oasis Grubs |

The module's current bait records are priced at **0 gp** and are initially supplied in stacks of three; the suggested values above are guidance only and have not been applied to those records.

### Fish value and food function

The current fishing module keeps its campaign's XGtE-inspired rarity dice, scaled to one tenth, for catch market value: Common `(1d6 + 1) gp`, Uncommon `1d6 × 10 gp`, Rare `2d10 × 100 gp`, Very Rare `(1d4 + 1) × 1,000 gp`, Legendary `2d6 × 2,500 gp`. This is a campaign-specific sale-value mechanic, separate from the 2024 magic-item price table. Most ordinary fish count as one ration; catches explicitly marked as materials/trophies may have no ration value. Eating a fish grants no automatic stat bonus.

## Applying this guide across modules

When an item family is reused in another Regionwright feature, reuse the rule and source status—not a fishing-specific price. Keep module-specific custom prices in that module's catalog or documentation, link back here, and do not make a companion module depend on the Regionwright runtime merely to read this guidance.
