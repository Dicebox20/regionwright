# GitHub Release Guide

Publish three independent Foundry modules: Studio, Puzzles & Locks, and Hunting & Gathering.

## Prepare packages

From the repository root:

1. Run **npm ci**.
2. Run **npm run check**.
3. Run **npm run build:modules**.
4. Run **npm run package:modules**.

The ZIPs and SHA-256 sidecars are written to dist/packages/. Each ZIP has its own module.json at its root.

## Prepare stable manifests

After the final GitHub repository URL is known, run:

**npm run prepare:github-release -- https://github.com/OWNER/REPOSITORY**

This updates the three built manifests and creates stable manifests under dist/:

- regionwright.json
- regionwright-puzzles-locks.json
- regionwright-hunting-gathering.json

Review each stable manifest's project, versioned download, issue tracker, and changelog URLs. The versioned download must match the ZIP created from that module's own manifest version.

## Publish

Create a release tag, attach the three ZIPs and three stable manifests, and use the same release notes in the GitHub release and [CHANGELOG.md](../CHANGELOG.md). Install the packages in a clean Foundry v14 world and verify each module independently before announcing the release.
