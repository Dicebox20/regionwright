# Cabin in the Ashen Veil — Chat B Turn 7 (L1-G) Handoff — 2026-10-26

**Disposition:** PROPOSED / PURE LOCAL TESTED; **no live Foundry changes, no player acceptance, no shared registry edits**. Chat A remains integrating Foreman and sole GM/world writer.

## Scope, repository, starting checkpoint
- Isolated source branch: `Dicebox20/regionwright` `codex/cav-late-game-chat-b-20261026` at worktree `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game`.
- T7 starting parent: `8aa17d336893de3aa414727fa22332186ed5f9bd`; Chat A `C:\Users\rujie\Documents\Region Editor` observed independently at `fb8ef607d4cf892557db402e5041c93294b3a79d`, not modified.
- Dicebox Bridge doctor: local and PowerShell ready; canonical ChatGPT identity unavailable, so no partner relays.
- Working time bounded to one turn under owner's 25-minute policy.

## Canon and verified/historical evidence
- **Latest owner correction:** Oct24 Lye ONLY Greenhouse ingredient, true Waterworks restored is a distinct GM requirement, not a second ingredient or the Pond/Bath sluice. Oct22 LOCK-12 multi-ingredient Thornroot Ash directions are superseded; never revive.
- Crimson Veil phase opens Privy access and gates Bathhouse Lye claim. It does **not** separately gate Greenhouse mix once genuine original Lye is carried.
- Privy route historically installed Oct24: privy Scene `xx1rWBiWMLxJPlrw`; native return `Scene.xx1rWBiWMLxJPlrw.Region.zVgVWvnpPetxlF5e`; landing `Scene.xx1rWBiWMLxJPlrw.Region.663WrP9V8tPPOLvt`. These are historical receipt IDs, not independently verified current-world route safety or correct fixture.
- Original Oct24 GM Item receipt (26 items, inert loot): `Item.D1LRRg4n7y7pRWvk` Copper Tiny Key, `Item.vDR4cJU35iODR6gh` Lye, `Item.YNWpGEGB17mqDFWe` Plant Killer. Current existence/actor inventories unverified.
- Privy Optional fishing parody may call a verified Hunting & Gathering module and display **Legendary Fish**; mandatory no-module fallback DC12 Sleight of Hand OR Survival, failure retryable with time cost, or safe reasonable improvised tool without rolling. Neither module RNG nor unverified plugin should block progression.

## Files delivered — isolated, source only
- `modules/regionwright/scripts/studio-cav-late-privy-soap-contract.js`: `planPrivyRetrievalAttempt`, `planPrivyCopperKeyPickup`, `planSoapRoomLyeCaseUnlock`, `planSoapRoomLyePickup`.
- `modules/regionwright/scripts/studio-cav-late-greenhouse-lye-contract.js`: `planGreenhouseLyeMix`, reuses read-only existing owner-corrected `evaluateGreenhouseLyeUse` from original ingredient engine without modifying generic 2–4 ingredient UI or source.
- `tests/cav-late-privy-soap-greenhouse-contract.test.mjs` — 98 adversarial local fixtures.
- Updated chronological `docs/cabin-ashen-veil/chat-b-late-game-progress.md`, dependency/canon `docs/cabin-ashen-veil/chat-b-late-chain-evidence-matrix-2026-10-26.md`, unique T7 dated handoff and machine metadata archive.

## Acceptance
- Focused T7 tests **98/98 PASS**, full `node --test <tests/cav-*.test.mjs>` **509/509 PASS across 33 files**, new JavaScript `node --check` both source files PASS.
- Pure functions output `gm-review-*`, `gm-review-retry`, `gm-review-fallback`, `deny`, `no-op`; no Foundry writes, no loot distribution, no Item consumption, no automatic unlocks, no actual DC roll submission.
- Non-GM gameplay, live module activation, original current-world readback, Fishing module integration, route/lighting/collision and true Waterworks are **not** certified.

## STOP conditions for Chat A
1. Reverify exact current Privy Scene, portal return/landing and toilet retrieval Region. Historical route receipt is not a safety certificate for current changed map.
2. Verify exact BATH-02 Soap Room, lye glass-case Region/Behavior, Greenhouse EXT-06 station/return, real Waterworks restoration record. The sluice stage `cavPondBathWaterState` is NOT authoritative Greenhouse Waterworks.
3. Reverify original Key, Lye, Plant Killer world Item sources and necessary actor provenance flags, prevent key/item duplication and unresolved `reserved` ledger auto-retry. Decide Lye consumption per owner workflow.
4. No real-world chemical proportions or actual caustic preparation directions; these are purely fantasy item flags.
5. Actual GM request adapter must independently authorize authenticated sender and owned non-GM character/token at correct Region (not trust client receipt booleans), persist `reserved → native effect → reread → done`, and reconcile uncertainty manually.
6. Chat A alone may add shared Studio imports or install live after source review; preserve static-map artwork and Regionwright interactive UI boundary.

## Next bounded scope
L1-H: Once-only Plant Killer fantasy effect on magical thorn dock, safe Pond FULL for Boathouse rowboat, original Prayer of Devotion and Sune emblem half; or prioritize six book H-U05 Spine if Chat A changes worker scope.

## Transcript reconstruction (not lossless)
Owner said resume. Chat B read Bridge status, isolated clean worktree, latest owner Oct24 Greenhouse correction, older conflicting Oct22 LOCK-12, original Item creation receipt and installed historical Privy route. Created two new pure source contracts and 98 fixture tests, checked 509 Cabin tests, documented owner canon precedence and IDs. No installed module, Scene, Item, Region, token, Actor, or chat relay write.