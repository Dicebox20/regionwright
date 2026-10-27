# CAV Chat B Turn 30 — Independent full-scene map music, eight original Grove Smell of Fear placements

Pacific date: 2026-10-27, approximately 15:18–15:42 PDT. Owner-authorized technical and artistic choice for Cabin in the Ashen Veil. Specific correction: all EIGHT exterior Ceremonial Clearing Grove maps must play Smell of Fear. Original Crooked Man puzzle deferral unchanged; owner directed Early Game atmosphere during preceding phase installation.

## Owner goal and workflow

Use the native Foundry v14 Ambient Sound tool, not Scene playlists, to give different player-viewed Scenes their own full-map music without GM Scene activation. Fill complete map and play at constant volume at any position. Must preserve existing environmental sound sources, avoid duplicate music, and use actual audio already in the user's Foundry library. Search current owner 47 spoiler-safe Scenes, saved descriptions, 169 local audio files and native sound objects; use read-only original GM preflight, sound mapping, native create, independent GM audit, 63-file Cabin regression, GitHub archive.

Original elected Gamemaster on exact live Foundry 14.367 world cabin-in-the-ashen-veil, one shared world with active other participant. Original worktree: C:/Users/rujie/Documents/CAV-Chat-B-Late-Game, branch codex/cav-late-game-chat-b-20261026. Independent Chat A checkout and source never modified.

## Original Sound Layer findings and safe choice

The world initially had 47 Scenes, eleven AmbientSound documents: four Attic rain/horror emitters, three Basement dark/atmospheric emitters, original F1 Entry Hall atmosphere, Great Room atmosphere, upstairs Art Studio atmosphere, and one existing Carriage Yard music emitter Sound.VycoO0Tl8O20uL8L playing Elwynn Forest Music at volume .72. These 11 were not GM Scene playlists, though an unrelated Halloween playlist and a separate Yard playlist exist. Original 10 environmental sound sources were left untouched. Existing Yard music is retained as SAME DOCUMENT ID, same track, but resized and normalized to 0.22, constant volume. There are now exactly 47 music emitters and 10 additional original atmosphere emitters = 57 native AmbientSounds.

Looked up official Foundry ambient sound guidance/API v14: radius uses scene grid units, easing:false ensures uniform volume, walls:false ignores wall attenuation, repeat:true, hidden:false, darkness 0–1. Center x/y computed from actual Scene dimensions.sceneX/sceneY plus image width/height halves. Radius in feet is ceil((half diagonal in image pixels + 1.5 grid-squares margin) / grid size * grid distance), reaching all four Scene corners with margin, not a guessed fixed 58ft or 36ft. Every current Sound source's geometry verified.

Owner-requested eight perimeter Grove IDs EXACTLY:
- CAVSG01Scene0001 NW
- CAVSG02Scene0001 North
- CAVSG03Scene0001 NE
- CAVSG04Scene0001 West
- CAVSG06Scene0001 East
- CAVSG07Scene0001 SW
- CAVSG08Scene0001 South
- CAVSG09Scene0001 SE

All 8 assigned Music/Demon%20Slayer%20-%20The%20Smell%20of%20Fear.mp3 from EXISTING on-disk Foundry user music library, source file about 2.6 MB and was independently verified HTTP 200 audio/mpeg at live server. Central SG05 original Grove — Central Clearing gets a DIFFERENT existing track, Music/The%20Queen%20of%20Air%20and%20Darkness.mp3. 18 distinct original owner-local music tracks selected across 47 room/area descriptions; no music downloaded/re-encoded/uploaded to GitHub. Confirmed all 18 returned HTTP 200 from same live Foundry server.

## Native implementation

Pure scene music source at modules/regionwright/scripts/studio-cav-early-map-music-47.js maps exact original 47 stable Scene IDs to owner-approved current spoiler-safe names, source file path, radius, volume 0.14–0.22, stable unique 16-char native Sound ID, and new owner provenance flag dicebox-campaign-helper.cavEarlyMapMusicV1. Eight Smell of Fear sources, original Yard source reused, 46 newly created Sound documents. None changes any Scene playlist, Scene activation, Region, Wall, Token, FXMaster effects, native environment, lighting/sound source beyond adopted Yard.

New standalone GM-only Script Macro.CAVMUSICGM000001, display CAV — Independent Scene Music (GM), ownership.default=0. Menu allows:
- Install Early Game Music (already installed, idempotently checks before any replay)
- Verify Installed Music (read-only, checks all actual sound docs)
- Restore Original Map Sounds (removes only 46 music IDs, sets original Yard source fields and explicitly clears owner provenance flag)
- Cancel

Macro saves all 47 original Sound documents to its source, original Yard revert settings, original Scene IDs/names, exact track plans. Guarded installation writes pending transaction flag BEFORE placing sound docs, installs using native Scene.createEmbeddedDocuments('AmbientSound') per Scene or existing Yard updateEmbeddedDocuments, and confirms 47 before setting status installed. A partial invocation remains pending and MUST NOT be blindly replayed. The initial macro.execute call returned before its inner async IIFE settled, as on previous T29. Separate elected GM later readback confirmed full success, not the early return. Macro source updated once after successful install to improve original Yard flag removal on restore: source SHA256 e954a16a4aeeb9104cc8bfa963365667d82c1403afec6d6cbbbdccfb4800ee07, native Macro remains status installed and all 57 Sounds preserved.

## Independent native current GM proof

Separate GM program read exact actual saved Scenes/sounds and original preflight. Result pass:true, verified 47 of 47, total Sound count 57, eight exact perimeter source files, distinct center track, full radius covers four corners plus margin, 47 sound flags with constant volume and no walls, repeated audio, darkness 0–1, IDs stable; ALL ten pre-existing atmospheric sources exact document JSON unchanged. Original Yard retained same existing ID. Native scene map/art, Region counts, wall counts and ambient light counts unchanged at independent afterread. Macro status installed, pending null, lastVerified47, GM-only. At audit time a nonGM player was in Pond with two owned tokens; no assertion of client audible acceptance.

Audio playback caveat: Foundry Ambient Sounds normally depend on player-owned/controlled tokens in their sound area; simply opening a Scene without such a token does not by itself guarantee audible music. Playback when players navigate different Scenes should be tested from nonGM client. This is a native Sound installation proof, NOT independent-client listening proof.

All original 47 Scene music mapping rows in native-install-evidence/2026-10-27-cav-independent-scene-music/47-SCENE-MUSIC-MATRIX.md and JSON. Native one-time installer/runner, original user music HTTP HEAD proof script, actual baseline full original Sound JSON, installed Macro byte-exact backup, safe restore macro patch receipt, independent elected GM original sound preservation proof archived in same evidence folder. Archive copy of user session active IDs was redacted, original fully detailed read-only proof remains in local harness receipts. Do NOT replay one-time installers or native macro updater after success.

8 source integration tests plus 7? correction: 7 sound source guard tests and 8 independent elected-GM native receipt tests added, 15 new. Full Cabin isolated suite 1,392/1,392 PASS across 63 test files.

## Next
- NonGM multi-user scene-navigation audio/playback acceptance: ensure player has owned token in Scene and audio browser unlocked, move/view separately from GM activated scene; check loops and volume/fade when crossing map boundary. If tokenless Scene viewing must play, native AmbientSound alone is insufficient; design a separate bounded user-client scene-view listener without breaking existing native world after explicit confirmation.
- Verify actual scene player mix against 10 atmospheric sources and FXMaster rain; tune volume and track choices by modifying exact music sources through GM macro with checkpoint (current macro refuses unexpected drift).
- Owner's Early Game four-phase ambient FX remains untouched, further phases intentionally inactive.
- Continue missing puzzle Region behavior installation AQ01 3 already existing Regions, Sophia canonical Veil source, Vault sockets and Undercroft.