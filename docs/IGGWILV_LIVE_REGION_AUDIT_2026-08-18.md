# Iggwilv’s Tower — Live Region Audit

Audited from the live **Into the Feywild** world database on 2026-08-18.

## Result

- Scenes: **11/11**
- Regions: **68/68**
- Region keys: complete and unique (`T01–T20`, `A01–A20`, `G01–G12`, `P01–P15`, `E01`).
- Region Behavior documents: **0**.
- Functional teleports: **0/20**.
- Functional puzzle/item/encounter triggers: **0/28**.
- Arrival/reverse-travel geometry overlaps: **14**.

The Regions currently contain shapes, names, and `flags.regionwright.iggwilvTower` metadata only. They cannot teleport, consume/grant items, run puzzles, or start encounters.

## Teleport routes

| Route | Source | Arrival / destination | Metadata | Geometry / logic |
|---|---|---|---|---|
| T01 | Iggwilv Tower — Floor 1 Landing | A01 — Iggwilv Tower — Curiosities Room | Paired | No teleport behavior; arrival overlaps T02 |
| T02 | Iggwilv Tower — Curiosities Room | A02 — Iggwilv Tower — Floor 1 Landing | Paired | No teleport behavior |
| T03 | Iggwilv Tower — Floor 1 Landing | A03 — Iggwilv Tower — Private Chambers | Paired | No teleport behavior; arrival overlaps T04 |
| T04 | Iggwilv Tower — Private Chambers | A04 — Iggwilv Tower — Floor 1 Landing | Paired | No teleport behavior |
| T05 | Iggwilv Tower — Floor 1 Landing | A05 — Iggwilv Tower — Private Library | Paired | No teleport behavior; arrival overlaps T06 |
| T06 | Iggwilv Tower — Private Library | A06 — Iggwilv Tower — Floor 1 Landing | Paired | No teleport behavior; arrival overlaps T05 |
| T07 | Iggwilv Tower — Floor 1 Landing | A07 — Iggwilv Tower — Witch's Laboratory | Paired | No teleport behavior; arrival overlaps T08 |
| T08 | Iggwilv Tower — Witch's Laboratory | A08 — Iggwilv Tower — Floor 1 Landing | Paired | No teleport behavior; arrival overlaps T07 |
| T09 | Iggwilv Tower — Private Library | A09 — Iggwilv Tower — Private Study | Paired | No teleport behavior; arrival overlaps T10; Private Study lock is not enforced; G01 is inside the Study instead of on the Library side. |
| T10 | Iggwilv Tower — Private Study | A10 — Iggwilv Tower — Private Library | Paired | No teleport behavior |
| T11 | Iggwilv Tower — Private Library | A11 — Iggwilv Tower — Hidden Library | Paired | No teleport behavior; arrival overlaps T12; Hidden-bookcase arrangement puzzle is absent; this travel Region is unguarded. |
| T12 | Iggwilv Tower — Hidden Library | A12 — Iggwilv Tower — Private Library | Paired | No teleport behavior; arrival overlaps T11 |
| T13 | Iggwilv Tower — Floor 1 Landing | A13 — Iggwilv Tower — Floor 2 Landing | Paired | No teleport behavior; arrival overlaps T14 |
| T14 | Iggwilv Tower — Floor 2 Landing | A14 — Iggwilv Tower — Floor 1 Landing | Paired | No teleport behavior |
| T15 | Iggwilv Tower — Floor 2 Landing | A15 — Iggwilv Tower — Arcane Vault | Paired | No teleport behavior; arrival overlaps T16; Overlaps G11, but has no dependency on the Sovereign Seal/password gate. |
| T16 | Iggwilv Tower — Arcane Vault | A16 — Iggwilv Tower — Floor 2 Landing | Paired | No teleport behavior |
| T17 | Iggwilv Tower — Floor 2 Landing | A17 — Iggwilv Tower — Summoning Chamber | Paired | No teleport behavior; arrival overlaps T18 |
| T18 | Iggwilv Tower — Summoning Chamber | A18 — Iggwilv Tower — Floor 2 Landing | Paired | No teleport behavior |
| T19 | Iggwilv Tower — Floor 2 Landing | A19 — Iggwilv Tower — Astral Garden | Paired | No teleport behavior; arrival overlaps T20 |
| T20 | Iggwilv Tower — Astral Garden | A20 — Iggwilv Tower — Floor 2 Landing | Paired | No teleport behavior; arrival overlaps T19 |

## Puzzle, item, gate, and encounter Regions

| Key | Scene | Kind | Requires | Grants | Audit |
|---|---|---|---|---|---|
| E01 | Iggwilv Tower — Astral Garden | encounter | — | astral-fruit | No Region Behavior; Requires no completed stations and has no Astral Treant encounter binding. |
| G01 | Iggwilv Tower — Private Study | gate | star | — | No Region Behavior; Wrong side of the locked door and not linked to T09. |
| G02 | Iggwilv Tower — Witch's Laboratory | gate | ingredient-cabinet-key | astral-water, demon-skull | No Region Behavior |
| G03 | Iggwilv Tower — Private Study | puzzle | — | powdered-silver | No Region Behavior |
| G04 | Iggwilv Tower — Private Chambers | gate | obsidian-crows-foot-key | iggwilvs-sovereign-seal | No Region Behavior |
| G05 | Iggwilv Tower — Astral Garden | gate | sunglobe | — | No Region Behavior; Not aggregated into E01 awakening state. |
| G06 | Iggwilv Tower — Astral Garden | gate | astral-water | — | No Region Behavior; Not aggregated into E01 awakening state. |
| G07 | Iggwilv Tower — Astral Garden | gate | fey-infused-plant-food | — | No Region Behavior; Not aggregated into E01 awakening state. |
| G08 | Iggwilv Tower — Curiosities Room | gate | fey-infused-water | — | No Region Behavior; Shares its exact shape with G09; no sequential Nixie state. |
| G09 | Iggwilv Tower — Curiosities Room | gate | astral-fruit | arcane-lock-password | No Region Behavior; Shares its exact shape with G08; no sequential Nixie state. |
| G10 | Iggwilv Tower — Summoning Chamber | puzzle | demon-skull, black-tallow-candles, powdered-silver | obsidian-thorn | No Region Behavior; No Cambion summoning or encounter binding. |
| G11 | Iggwilv Tower — Floor 2 Landing | gate | iggwilvs-sovereign-seal, arcane-lock-password | — | No Region Behavior; Overlaps T15; the teleport can bypass this lock. |
| G12 | Iggwilv Tower — Floor 2 Landing | gate | thorn-key | — | No Region Behavior; No destination travel/encounter after the final door. |
| P01 | Iggwilv Tower — Floor 1 Landing | pickup | — | star | No Region Behavior |
| P02 | Iggwilv Tower — Private Study | pickup | — | ingredient-cabinet-key | No Region Behavior |
| P03 | Iggwilv Tower — Curiosities Room | clue | — | hourglass-covens-hourglass | No Region Behavior |
| P04 | Iggwilv Tower — Private Library | pickup | — | skeleton-bones | No Region Behavior; No Skeleton encounter or actor binding. |
| P05 | Iggwilv Tower — Witch's Laboratory | craft | skeleton-bones | calcium-rich-bone-meal | No Region Behavior |
| P06 | Iggwilv Tower — Witch's Laboratory | puzzle | red-leaf-fern, epsom-salts, blood-meal, calcium-rich-bone-meal | fey-infused-plant-food | No Region Behavior; Four-ingredient requirements are metadata only; Ingredient Mixing is not configured. |
| P07 | Iggwilv Tower — Private Chambers | pickup | — | sunglobe | No Region Behavior |
| P08 | Iggwilv Tower — Private Chambers | pickup | — | epsom-salts | No Region Behavior |
| P09 | Iggwilv Tower — Private Library | pickup | — | red-leaf-fern | No Region Behavior |
| P10 | Iggwilv Tower — Summoning Chamber | pickup | — | blood-meal | No Region Behavior; No vampire-assistant actor/social binding. |
| P11 | Iggwilv Tower — Floor 2 Landing | pickup-trap | — | obsidian-crows-foot-key | No Region Behavior; No Flying Sword trap/encounter binding. |
| P12 | Iggwilv Tower — Hidden Library | pickup | — | black-tallow-candles | No Region Behavior |
| P13 | Iggwilv Tower — Astral Garden | social | ordinary-water | fey-infused-water | No Region Behavior; No Adult/Child Faerie Dragon social interaction binding. |
| P14 | Iggwilv Tower — Arcane Vault | pickup | — | ivory-thorn | No Region Behavior |
| P15 | Iggwilv Tower — Floor 2 Landing | craft | ivory-thorn, obsidian-thorn | thorn-key | No Region Behavior |

## PDF-critical defects

1. **Hidden bookcase arrangement puzzle is missing.** `T11` travels directly to the Hidden Library; no Region represents or enforces the arrangement puzzle.
2. **Study star lock is circular.** `G01` is inside the Private Study although the socket must be reachable from the Private Library side, and `T09` is not gated by it.
3. **Ingredient puzzle is metadata only.** `P06` names all four ingredients but has no Ingredient Mixing behavior and cannot grant Fey-Infused Plant Food.
4. **Treant chain is disconnected.** `G05`, `G06`, and `G07` do not feed a shared completion state; `E01` has no prerequisites and no Astral Treant encounter.
5. **Nixie stages are disconnected.** `G08` and `G09` occupy the same rectangle but have no rehydration → fruit → password state sequence.
6. **Arcane Vault can be bypassed.** `T15` physically overlaps `G11` and is not gated by the Sovereign Seal plus Arcane Lock Password.
7. **Summoning has no encounter.** `G10` cannot consume components, summon the Cambion, begin combat, or award the Obsidian Thorn.
8. **Encounter bindings are absent.** The six dedicated Tower Actor UUIDs are not referenced by any Region Behavior.
9. **Teleport bounce risk.** Fourteen arrival rectangles overlap reverse-direction travel rectangles and would immediately send tokens back unless destinations or cooldown/suppression logic are changed.
10. **Final progression is incomplete.** `G12` checks the Thorn Key only in metadata and has no post-door travel or finale trigger.

## Dedicated Tower actors currently available

- Nixie: `Actor.88UZTmEStCJvgRQA`
- Cowardly Vampire Ritual Assistant: `Actor.yp5N7pZJ55H7JAu1`
- Child Faerie Dragon: `Actor.6Qz6BnNqn3eegGKJ`
- Cambion: `Actor.zIuxjSzp3qPbFdJF`
- Astral Treant: `Actor.p6Fe5QOVEoGfeWA9`
- Adult Faerie Dragon: `Actor.ZxwpNOpwal02ivlJ`

## Required correction order

1. Move arrival rectangles clear of reverse travel Regions and bind each `T` Region to its matching `A` Region.
2. Gate `T09`, `T11`, and `T15` behind the Study star, bookcase arrangement, and Vault two-part lock respectively.
3. Attach item grant/consume behaviors and configure Ingredient Mixing at `P06`.
4. Build persistent state chains for the Treant and Nixie.
5. Bind the Cambion, Treant, Nixie, vampire assistant, and faerie-dragon actors to their encounter/social Regions.
6. Add Flying Sword and Skeleton encounter actors, then define the final `G12` destination/finale.

