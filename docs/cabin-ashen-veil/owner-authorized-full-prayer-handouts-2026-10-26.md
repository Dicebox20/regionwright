# Cabin in the Ashen Veil — Owner-authorized new full Prayer handouts

**Date:** 2026-10-26 (Pacific). **Workstream:** Chat B late game. **Owner authorization:** "you can make up your own prayer text" (this conversation). **Content status:** NEWLY AUTHORED CAMPAIGN TEXT, not reconstructed original words. **Deployment status:** SOURCE READY, no native Foundry Journal or Item writes confirmed in Turn 20. The original source Item identities, acquisition gates, Scene IDs, and unique-reward constraints are unchanged.

## Prayer of Protection

**Canonical quest Item:** `Item.5jwy75XyFezukf3b` — `Prayer of Protection`. **Acquisition:** owner-original Ornate Music Box `Item.YaKs6z2AWlEAlyzx` in Parents' Hope Chest `Scene.CAVHU04Scene0001`, after genuine original Silver Key. **Use:** read deliberately at Sune's altar in Dahlia's actual Art Studio **H-U07 / `Scene.CAVHU07Scene0001`**, for safely gated passage into actual H-U08 Workshop. Not a general-purpose prayer that automatically opens any door.

> Lady of the Rose, let beauty be a shelter, not a prize.
>
> Where fear has shut a door, lay your hand upon its latch.
>
> Guard the names spoken softly in this house, the hands that reach through darkness, and the hearts that tremble yet do not turn away.
>
> Let no cruel thing wear the face of love; let no false voice lead the living from the living.
>
> If a way was hidden for the sake of mercy, show it only to those who come to protect.
>
> By rose, by candle, by the kindness we remember, keep us from harm, and guide us safely home.

## Prayer of Devotion

**Canonical quest Item:** `Item.GXLYq6Tf4OgPNbkU` — `Prayer of Devotion`. **Acquisition:** original Boathouse **`Scene.CAVEXT07Scene001`** after restored original water/rowboat, magical thorns cleared, legitimate arrival and verified physical pickup. **Use:** separately read at the actual H-U07 Sune altar, meeting original provenance and once-only criteria for the original **Sune Emblem Half** `Item.t9uCIpsKeSvtC31w`. Not an alternate for the Protection passage, and no immediate emblem spawn on obtaining the book.

> Bright Lady, I offer no perfect face and no spotless soul.
>
> I offer the lamp I keep alight for someone lost, the hand I extend when mine is shaking, and the promise to cherish what the darkness would erase.
>
> Teach me to see worth beneath ruin, to mend before I judge, and to carry beauty where none is left to see.
>
> Let love be measured not in promises, but in the kindness we choose when kindness is hardest.
>
> By the rose that blooms through ash, I offer my devotion—not for what I hope to gain, but for what I refuse to abandon.

## Established-workflow integration acceptance

1. The owner has delegated authorship of the *wording*, not bypass of existing puzzle conditions. These new texts must be tracked as **new owner-authorized writing** under this date. Do **not** backdate or label them as recovered verbatim from historical original materials.
2. Both existing `GM_LIBRARY_ONLY` original world Items remain unchanged until an elected-GM preflight can safely inspect native live state. Do not clone library originals, change preexisting custody or grant either prayer to player Actors now.
3. Create exactly one original GM-held, initially **no-player-access** `JournalEntry` with one readable text page for each prayer. Bind its UUID to the matching original world Item using an additive workstream-scoped source provenance flag; preserve the existing Item image, name, original custody flags and any historical description (save readback before updating).
4. The full prayer text should also appear in the actual original `loot` Item's readable description so a later legitimate character Item copy conveys the prayer. Do not grant general Journal viewing access prematurely; permission to view the Journal must be earned alongside the corresponding original Item. Verify actual Foundry v14 permission behavior with a non-GM user during acceptance.
5. Only after the original Protection Item is legitimately recovered and read in H-U07 may the altar control reveal the paired H-U07→H-U08 Workshop route; preserve the existing `CAVVANITYREG0001` Region and use an owner-approved distinct altar interaction. Journal creation itself must **never** open a passage.
6. Only after the original Devotion Item is legitimately recovered from the Boathouse and deliberately read at H-U07 may the existing Sune-half decision review an award. Do not create a Boathouse pickup Region or paired boat portal on assumed geometry.
7. Suggested fixed Journal IDs for *future native preflight, not claimed installed*: Protection `CAVPRAYERPROTECT`; Devotion `CAVPRAYERDEVOTN1`. Verify that both are unused before installation. Never automatically retry uncertain `JournalEntry.createDocuments` or Item update mutations; independently re-read receipts and reconcile partial results.
8. Do not modify Chat A's checkout or shared `studio-campaign.js`, Studio Vanity Behavior, Aqueduct phase, unified Bathhouse source or owner-deferred Ritual Chamber. This is a content authority exception only.

## Exact import-source plan

The accompanying JSON file `owner-authorized-full-prayer-handouts-2026-10-26.json` includes stable quest Item UUIDs, proposed Journal IDs, exact line arrays and safe HTML paragraph content. It is a **read-only plan**, not a native execution script.

## Verification note

CFT Dev GM session was observed switching from `/game` to Foundry `/join` during Turn 20; the Dicebox Bridge session subsequently terminated. This source package was therefore committed via GitHub without making unverified native writes. Preserve source, live, and player-tested status as separate evidence classes.
