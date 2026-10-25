# Contributing to Regionwright

Thank you for helping improve Regionwright.

## Source boundaries

- Treat modules/regionwright, modules/regionwright-puzzles-locks, and modules/regionwright-hunting-gathering as the only module source roots.
- Make a module's runtime change inside its own folder. Do not add a root module manifest or duplicate module sources.
- Keep each module independently installable. Cross-module behavior must use a public optional API and must continue to work when the other module is absent.
- Preserve stable Foundry IDs, saved-data namespaces, flags, pack-entry IDs, and documented migration behavior.
- Use clear player-facing wording, visual selection, and map feedback. Do not make raw UUIDs a normal setup requirement.
- Do not edit Foundry database files directly. Back up a disposable world and use the module's supported migration path.

See [Project Standards](docs/PROJECT_STANDARDS.md), [Module Strategy](docs/EDITION_STRATEGY.md), and the [item pricing guide](docs/REGIONWRIGHT-ITEM-PRICING.md).

## Local workflow

Install dependencies with **npm ci**, then run:

- **npm run check** for module-boundary/import checks, JavaScript syntax checks, and the Node suite.
- **npm run build:modules** to build all three standalone module folders.
- **npm run package:modules** to create the three ZIPs and checksum sidecars.
- **npm run test:e2e** for the separate Foundry utility-harness browser suite when that environment is available.

Test Foundry behavior in a disposable world before a release. Record the Foundry version, game system, module versions, user role, and the interaction you actually performed. A source check or test harness is not evidence of a live Foundry interaction.

## Pull requests

Keep changes focused on one module or a shared compatibility contract. Explain what changed, what commands were run, and the exact runtime evidence available. Update the changelog for user-visible changes.

## Reporting issues

Include the Foundry version, game system, enabled module IDs, steps to reproduce, and a screenshot for visual issues.
