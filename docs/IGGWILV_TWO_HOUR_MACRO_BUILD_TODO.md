# Iggwilv's Tower - Two-Hour Macro-First Setup

Strategy: every durable Foundry change is made by a rerunnable Script Macro. No manual Scene or Region placement is used for this build. The final-draft PNGs are the only map sources.

## 0:00-0:15 - Repair scene foundation

- [x] Inventory the eleven final-draft assets and exact canvases.
- [x] Create injected macro `00A_IGGWILV_AUDIT_FINAL_MAP_ASSETS.js` that uses Foundry FilePicker rather than assumptions.
- [x] Create injected macro `01_IGGWILV_INSTALL_FINAL_DRAFT_SCENES.js`.
- [x] Create injected macro `02_IGGWILV_AUDIT_SCENES_AND_REGIONS.js`.
- [ ] You inject/run 00A and paste the GM report here. Run 01 only after each final PNG is visible to Foundry.

## 0:15-0:45 - Door and map audit

- [ ] Inspect all eleven repaired scenes at map scale and record every actual doorway/stair/secret-bookcase threshold in pixels and grid cells.
- [ ] Compare each map against the PDF topology: F1 Landing has four exits; Private Library also has Study + secret library; F2 Landing has Vault/Summoning/Garden + shared stair; Floor 3 rose door has no destination.
- [ ] Confirm a 10-foot receiving zone exists inside each door and that every threshold faces a visually credible exit.
- [ ] Deliver a reviewed doorway coordinate table before any new teleport Region is injected.

## 0:45-1:15 - Player traversal

- [ ] Create one injected macro that removes only prior `Iggwilv Teleport` Regions, then creates one source and one 2x2 receiving Region for every direction.
- [ ] Include bidirectional routes: F1 <-> Curiosities, Chambers, Private Library, Laboratory; Private Library <-> Study and Hidden Library; F1 <-> F2 stair; F2 <-> Vault, Summoning, Garden.
- [ ] Do not create a Floor 3 teleport.
- [ ] Inject it, run the read-only audit, and test every route with a disposable token. A Region arrival must never immediately trigger the return Region.

## 1:15-1:40 - Campaign state and effects

- [ ] Create campaign items, journals, and GM-only discovery cards from the PDF.
- [ ] Install direct Region effects only where the guide defines them: star/Study clue, bookcase, laboratory cabinet, plant-food mixing, Treant activations, Nixie stages, crow-foot trap, Vault prerequisites, and summoning sequence.
- [ ] Keep concealed contents concealed until their Region/effect resolves.

## 1:40-2:00 - Verification and handoff

- [ ] Run a full player-perspective traversal test from F1 through every available room and back.
- [ ] Verify all 11 scene backgrounds, grid 64 px/5 ft, and 0 padding.
- [ ] Run the scene/region audit macro and save the report in GM chat.
- [ ] Deliver a final macro order, test results, and remaining Floor 3 work.

## Non-negotiable topology

| Source | Destination | Door/feature |
|---|---|---|
| F1 Landing | Curiosities | west door |
| F1 Landing | Private Chambers | north door |
| F1 Landing | Private Library | east door |
| F1 Landing | Witch's Laboratory | south door |
| Private Library | Private Study | north door |
| Private Library | Hidden Library | concealed bookshelf |
| F1 Landing | F2 Landing | central continuous spiral stair |
| F2 Landing | Arcane Vault | north door |
| F2 Landing | Summoning Chamber | southwest/west door |
| F2 Landing | Astral Garden | southeast/east door |
