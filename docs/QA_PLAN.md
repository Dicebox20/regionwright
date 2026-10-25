# Regionwright QA Plan

This plan covers the three independent module packages. A source check or test result does not establish Foundry runtime acceptance.

## Source and package checks

- npm run check validates the three module source boundaries, local imports, JavaScript syntax, and the active Node suite.
- npm run build:modules builds Studio, Puzzles & Locks, and Hunting & Gathering from modules/<id>.
- npm run package:modules creates one ZIP and SHA-256 sidecar per module.
- Confirm the ZIP root contains module.json and that each manifest's declared files exist.

## Disposable-world checks

Use a backed-up disposable Foundry v14 world. Verify each product separately and in useful combinations:

| Module | Representative workflow |
| --- | --- |
| Studio | Create and review a Region behavior or Studio activity; confirm only module-owned data changes |
| Puzzles & Locks | Configure a supported lock or game, then verify a player outcome and GM-authoritative update |
| Hunting & Gathering | Open the H&G control and exercise the chosen subsystem against its documented system requirements |

Test optional dependencies by loading Studio without Puzzles & Locks and confirm Studio remains usable. If a feature uses active-GM sockets or player permissions, use separate GM and player accounts.

## Migration gate

Before a main campaign launch, make a backup, enable the relevant module as the active GM, inspect migration logs, and read back the affected settings, macros, flags, packs, and documents. Do not edit LevelDB or other Foundry database files directly. Stop and inspect a partial migration outcome before retrying.

## Reporting evidence

Record whether work is planned, built, packaged, installed, tested in Foundry, or user-accepted. Include the actual Foundry and system versions, module versions, user role, exact interaction, and observable result. Do not infer gameplay readiness from a syntax check or checksum.
