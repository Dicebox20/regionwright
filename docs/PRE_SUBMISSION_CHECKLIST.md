# Regionwright Release Checklist

## Product identity

- [ ] Release Studio as regionwright.
- [ ] Release Puzzles & Locks as regionwright-puzzles-locks.
- [ ] Release Hunting & Gathering as regionwright-hunting-gathering.
- [ ] Confirm all three may be installed together and none is a replacement edition.

## Packages and manifests

- [ ] Run npm ci, npm run check, npm run build:modules, and npm run package:modules.
- [ ] Confirm each ZIP contains its own module.json at the archive root.
- [ ] Confirm every module version and SHA-256 sidecar matches the ZIP.
- [ ] Add the final repository address to each stable manifest using the release-preparation command.
- [ ] Confirm all download links resolve to the matching module and version.

## Runtime acceptance

- [ ] Install each module in a disposable Foundry v14 world.
- [ ] Enable modules in different combinations and confirm optional APIs fail safely when absent.
- [ ] Exercise one representative Studio workflow, one Puzzles & Locks workflow, and one H&G workflow.
- [ ] As the active GM, verify legacy migrations and read back affected documents.
- [ ] Run a player-context check for any feature whose evidence depends on non-GM permissions or sockets.
- [ ] Record Foundry version, system, module versions, account role, and actual observed outcome.

Do not describe static checks, ZIP verification, or a saved receipt as successful gameplay.
