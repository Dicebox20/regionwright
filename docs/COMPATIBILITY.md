# Compatibility

## Foundry VTT

All three modules target Foundry VTT v14. Check each module manifest for its verified version.

## Game systems

Studio and Puzzles & Locks provide system-neutral Region and puzzle workflows. Hunting & Gathering declares D&D5e compatibility in its manifest and uses D&D5e items, skills, and compendium content for parts of its gameplay. Review that module's README and manifest before using a different system.

## Installing modules together

Regionwright: Studio, Regionwright: Puzzles & Locks, and Regionwright: Hunting & Gathering have distinct package IDs and can be installed at the same time. None is a replacement edition of another.

Studio can optionally use Puzzles & Locks through its public API. Without Puzzles & Locks, Studio remains available. Hunting & Gathering is independent of both.

## Saved data

The split preserves the established Regionwright IDs, document flags, packs, and module-specific namespaces where required. Puzzles & Locks and Hunting & Gathering perform active-GM migrations for their documented legacy settings, macro paths, or saved-data scopes. Back up the world before startup and verify migration logs and document readback in a disposable world before applying changes to a main campaign.
