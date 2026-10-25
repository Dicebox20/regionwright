# Iggwilv's Tower - Foundry Injection Macro Series

This directory is the macro-first replacement for the earlier manual scene work. Inject each file as a **Script Macro** in Foundry and run them in numeric order. They are designed to be rerun safely: the scene installer updates the named final-draft scene instead of creating a duplicate.

Use the Foundry names in [IGGWILV_MACRO_NAMING_SCHEME.md](../IGGWILV_MACRO_NAMING_SCHEME.md). The first three injected files are named by their ordered macro counterparts: `IGG | 00 | SETUP | Preflight final maps`, `IGG | 01 | SETUP | Install final-draft scenes`, and `IGG | 02 | AUDIT | Scenes and Regions`.

## Required macro order

1. `01C_IGGWILV_UPLOAD_AND_INSTALL_FINAL_MAPS.js` - choose all eleven final PNGs once. It uploads them to Foundry User Data, then creates or repairs every Scene background and grid.
2. `02B_IGGWILV_VERIFY_FINAL_MAP_TEXTURES.js` - confirms Foundry can actually decode every installed background texture.
3. `02_IGGWILV_AUDIT_SCENES_AND_REGIONS.js` - confirms every scene is configured and reports the Regions currently installed. This is the baseline before door-by-door planning.
4. Future scripts in this folder will install only the reviewed door Regions, then the campaign objects, effects, and puzzle states.

All assets are referenced relative to Foundry User Data as `Big Maps/<filename>`. The macros deliberately fail fast if an image cannot be served by Foundry, preventing another set of blank scenes.
