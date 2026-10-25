# Regionwright Project Standards

These are the current project-wide product and source rules. For ownership and the compatibility handoff, see [Module Strategy](EDITION_STRATEGY.md).

## Product ownership

| Module | Foundry ID | Owns |
| --- | --- | --- |
| Regionwright: Studio | regionwright | Region authoring, native behavior plans, Studio activities, traps, and campaign integrations |
| Regionwright: Puzzles & Locks | regionwright-puzzles-locks | Reusable locks and puzzle games, their setup hub, runtime, and Puzzle HUD |
| Regionwright: Hunting & Gathering | regionwright-hunting-gathering | Hunting, Fishing, Mining, resource catalogs, item packs, migrations, and H&G HUD |

These are separate Foundry modules, not replacement editions. Their canonical source roots are modules/regionwright, modules/regionwright-puzzles-locks, and modules/regionwright-hunting-gathering.

## Runtime boundaries

- Each module owns its manifest, entry point, settings, socket namespace, styles, and release package.
- A module must work when the other two are absent.
- Optional integrations go through a documented public API and must have a safe absent-module path.
- Do not import runtime source from a sibling module folder or from the retired root-level source layout.
- Preserve established identifiers and document flags unless an explicit migration is designed and recorded.
- Keep migration writes under the elected active GM and make failures visible and retryable.
- Keep shared Foundry surfaces native. Module styles may handle layout, map feedback, and game-specific play areas.

## Setup and accessibility

Prefer named visual pickers, map highlights, short guidance, and a visible review before world changes. Keep raw identifiers and code out of normal user setup. Avoid automatic or permanent changes when the selection, authority, or effect is unclear.

## Development commands

Use **npm run check**, **npm run build:modules**, and **npm run package:modules**. Build outputs and release ZIPs belong under dist/. Never place a competing module manifest at the repository root.

Superseded module sources and packages are preserved in [the dated module archive](../archives/regionwright-legacy-modules-20261018.zip). Earlier project rules and release records are preserved in the [workspace retirement archive](../archives/regionwright-workspace-retirement-20261018.zip) and [retired project files archive](../archives/regionwright-retired-project-files-20261018.zip). Extracted retired module roots are kept under [retired active layout](../archives/retired-active-layout-20261018/).

## Shared item pricing

For priced equipment, consumables, trade goods, services, and magic items, follow the [Regionwright Item Pricing Guide](REGIONWRIGHT-ITEM-PRICING.md). Keep official prices distinct from homebrew estimates and price consumables by use or unit.
