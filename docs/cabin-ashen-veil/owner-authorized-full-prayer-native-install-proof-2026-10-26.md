# Owner-authorized Sune prayers — native Foundry installation proof

**Campaign:** Cabin in the Ashen Veil. **Pacific date:** 2026-10-26. **Source text authority:** owner directly authorized original creative writing, "you can make up your own prayer text." The separate document `owner-authorized-full-prayer-handouts-2026-10-26.md` and `.json` are the exact new text. Neither text is claimed recovered original.

## Native status: INSTALLED; ordinary-player acceptance NOT YET TESTED

After reconnecting the Dicebox Bridge and relaunching the ORIGINAL CFT Dev Chrome 158 / `ChromeForTestingDev\Profile` through localhost 9224, exact Foundry v14.367 `cabin-in-the-ashen-veil` elected `Gamemaster 1` was verified. The Chat B local repository was fast-forwarded from `82af2c57e3610417580e78b3754509d102325cfa` to the previously pushed T20 source `574a390a1e80612aa1bd1de4efcb044101b34eca`, preserving the separate Chat A checkout.

1. **Prayer of Protection:** existing original `Item.5jwy75XyFezukf3b`, no player Item copies, original `GM_LIBRARY_ONLY` custody preserved. The full owner-authorized prayer was appended to the original Item description, preserving its old description text. Journal `JournalEntry.CAVPRAYERPROTECT` with one text page `JournalEntry.CAVPRAYERPROTECT.JournalEntryPage.rcFIk4a2MGb4wUeD`, GM-only default ownership 0. Its Item link/provenance flags match the installed original.
2. **Prayer of Devotion:** existing original `Item.GXLYq6Tf4OgPNbkU`, no player Item copies, original `GM_LIBRARY_ONLY` custody preserved. The complete distinct prayer was appended to its old description, with GM-only Journal `JournalEntry.CAVPRAYERDEVOTN1`, page `JournalEntry.CAVPRAYERDEVOTN1.JournalEntryPage.qI6j50T4NxuwjCHk`, Item link/provenance flags matching source.
3. Both pages use text format 1 / HTML. Both Journals have exactly one page; both exact content hashes agree with `owner-authorized-full-prayer-handouts-2026-10-26.json`; there is one original Item and one Journal of each name. The original Item's `cabinPuzzleItem.status=GM_LIBRARY_ONLY` remains unchanged. Additive provenance `OWNER_AUTHORIZED_NEW_TEXT_2026-10-26`. All non-GM users failed Journal `OBSERVER` / `OWNER` permission checks.
4. The Studio's original enabled H-U07 Vanity Behavior, H-U08 Workshop Wick Behavior and the intentionally disabled original Privy Copper recovery Behavior remain unchanged. No player rewards, changes to Scene/Region/teleport, altar bypass, or campaign phase transition occurred.

## Independent post-write evidence and recoverability

- Dated read-only GM original description backup/preflight: `native-install-evidence/2026-10-26-chat-b-turn20-full-prayer-journals/cav-chatb-turn20-prayers-original-preflight-20261026.json`.
- One-time guarded native installer and actual success receipt: `cav-chatb-turn20-full-prayer-native-installer-20261026.mjs` and `cav-chatb-turn20-full-prayer-native-install-20261026.json`.
- **Independent separate current GM postread**: `cav-chatb-turn20-full-prayers-independent-postread-20261026.mjs` and `.json` with `pass:true` for both exact native original Items, Journal pages, permissions, and prior puzzle protections.
- Exact full-page SHA256: Protection `3846ba592db63090b03281b557327e7907dd91fb9a5d0be1c3b7473691508caa`, Devotion `c2791c061a43bc9498704dde4b66435f88d7e3c24ef4e1ae48ac118a2e5ae4bc`.
- Exact receipt file SHA256 from local proof: initial preflight `B3596EBAC830C950422711B9597C2E9B8D1BD910451C09B4E75DA6C8B3D3ADCB`, installer `A5F7D5C3E3AED333559D171875D5BDE9E6BC2EDA81B4E46A59716590226195CD`, postread `E87423F5795324D5CAA169C64713E84A61DCEC62FD70F7F74EB3F6F71E76629F`.
- After installer success, CFT Dev Chrome port 9224 briefly closed again. The dedicated profile was relaunched after verifying no owner process and healthy Foundry 30000. The first postread attempt failed **without modifying Foundry**; reran the READ-ONLY postread only after CDP returned and it PASSed. The native INSTALLER WAS NOT replayed.
- New `tests/cav-owner-authored-prayers-native-proof.test.mjs` 10/10 PASS cross-checks exactly the approved text, original source Items, installed Journal UUIDs, native page hashes, GM-only permissions, original Item source custody, actor copies zero and unchanged adjacent puzzle objects. Full `node --test tests/cav-*.test.mjs` = **1,229/1,229 across 44 files PASS**. Source/record testing cannot substitute for a non-GM playtest of actual permission and handout delivery.

## Remaining integration gates

The original Music Box / Hope Chest / Silver Tiny Key chain must legitimately award Protection before its actual reading at the original Sune H-U07 altar; still needs owner-resolved overlap with existing Vanity and a safe paired H-U07 ↔ H-U08 Workshop portal. The separate original Boathouse Prayer of Devotion must be recovered through the actual thorn-cleared Pond boat/Boathouse chain and deliberately read at H-U07 for one genuine Sune Emblem Half, not automatically rewarded by these Journals. Elected-GM Journal content installation does NOT make the physical puzzle paths playable.

New full prayer Item descriptions may be carried when items are legitimately acquired. Journal visibility should be enabled for eligible players only by a later explicit workflow; presently the Journals are safely GM-only and items not copied to any player. Do not auto-enable global Journal permissions.

This native result supersedes the earlier interrupted Turn20 `SOURCE_ONLY_NOT_INSTALLED` deployment STATUS, **not** the original source manifest's immutable creation-time status. The dated source manifest preserves historical provenance; this proof is the authoritative deployment receipt.