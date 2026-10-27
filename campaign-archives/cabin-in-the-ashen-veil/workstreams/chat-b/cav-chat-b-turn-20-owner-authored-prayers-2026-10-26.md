# CAV Chat B — Turn 20 Owner-Authorized Full Prayer Wording Handoff

**Date Pacific:** 2026-10-26. **Turn:** 20, interrupted while preparing Undercroft after live browser /join event. **Owner-directed in-turn exception:** "you can make up your own prayer text." This authorizes **new creative wording** for both Sune prayers; it is not proof original historical pages were recovered and does not waive authentic item custody, GM native transaction or world/Scene ownership gates.

## Completed now — new canonical source text, source-only

- [Player-facing Protection and Devotion prayers](../../../../docs/cabin-ashen-veil/owner-authorized-full-prayer-handouts-2026-10-26.md) — archived separately as `docs/cabin-ashen-veil/owner-authorized-full-prayer-handouts-2026-10-26.md`.
- `docs/cabin-ashen-veil/owner-authorized-full-prayer-handouts-2026-10-26.json` — structured, exact-paragraph HTML + line arrays, exact original quest Item UUIDs and proposed distinct hidden Journal IDs. Status `SOURCE_ONLY_NOT_INSTALLED`.
- **Protection source remains** `Item.5jwy75XyFezukf3b`; legitimate Music Box chain `Item.YaKs6z2AWlEAlyzx`, Silver Key and Hope Chest `Scene.CAVHU04Scene0001`; deliberate H-U07 actual Art Studio altar reading is required for the paired H-U08 Workshop passage. Wording hints at mercy and a hidden way, but the Journal itself does not open a portal.
- **Devotion source remains** `Item.GXLYq6Tf4OgPNbkU`; must be recovered in legitimate `Scene.CAVEXT07Scene001` Boathouse after full-water original rowboat and thorn dock. Separate deliberate read at `Scene.CAVHU07Scene0001` Sune altar is prerequisite to original `Item.t9uCIpsKeSvtC31w` Emblem Half. Devotion never substitutes for Protection.
- Proposed future Journal IDs `CAVPRAYERPROTECT` and `CAVPRAYERDEVOTN1` are both 16 characters and are unverified for collision in live world; GM-only until legitimate Item pickup; do not auto-broadcast pages or grant Items.
- The new wording is **owner-delegated new canon 2026-10-26**, NOT historically owner-approved line-by-line and not "verbatim recovered original". Preserve original world Item names, images, `GM_LIBRARY_ONLY` source custody and descriptive fields until elected-GM live readback and preflight. Store description backups before adding full text, then bind Journal UUID to original Item through additive flags.

## Environment / verification truth

- Beginning of turn local Bridge PowerShell initially reported ready but `currentChat` identity unverified. Chat A read-only branch `codex/cav-sune-integration-20261026` HEAD `b1f926418facb5d1e483fadf7bb7fd7c166743d1` at preflight. Chat B local branch initially clean `82af2c57e3610417580e78b3754509d102325cfa`.
- Elected GM `/game` initially verified. Later browser navigated to `/join` during concurrent world activity; a subsequent check observed `/game` again, but the later Bridge powershell calls failed / timed out and `bridge_doctor` returned `Session terminated`. **Therefore no Foundry `JournalEntry`/Item writes, no new Region, no NPC or player interaction, no Undercroft staging, and no post-write GM readback were performed in Turn 20.** No attempt to switch to unapproved desktop/browser write path.
- Source JSON creation independently checked two distinct fixed 16-character Journal IDs and well-formed paragraph wrapper strings. The last full Cabin Node regression remains **1,219/1,219 across 43 tests from Turn 19**; no claim of rerun after this new content-only source.
- Source documentation authored on Regionwright **remote branch via GitHub** because Bridge local PowerShell session became unavailable. **Important:** the Windows local Chat B checkout may remain at T19 `82af2c57...`, while the remote now contains new T20 source commits. Upon Bridge recovery, inspect local status, then fast-forward `git pull --ff-only` on Chat B isolated branch only; do not overwrite or clean Chat A.
- No changes to `studio-campaign.js`, shared module registration, first AQ chase, canonical Crimson Veil, unified Bathhouse, altar/Vanity Region, owner-deferred Ritual Chamber, or active live puzzle state.

## Next native commissioning, when Bridge works

1. Reconnect Bridge by established workflow and verify exact elected-GM Foundry `/game` session, current original Item UUIDs, description, owner flags and current Journal inventory/collisions. If current-source changed, stop and reconcile.
2. Use established Journal creation/Item update workflow to create 2 GM-hidden one-page Journal entries with new owner-authorized complete prayer text, and add the full source text/binding to the existing two original `loot` Item descriptions without broad player access or reward duplication. Transaction must reserve/check uniqueness and independently reread both Journals/pages/Item flags. On uncertainty, stop rather than retry creation.
3. Commission physical Sune altar only after resolving its overlap with Chat A's existing H-U07 Vanity Region, then complete authentic Music Box→Protection passage and later Boathouse→Devotion/Sune-half acceptance.
4. Resume Undercroft physical Region audit only with exact owner-approved map geometry and original Keystone provenance; no premature inner door or reused Voss passage.
5. At next between-turn checkpoint, append dialogue to the **same existing living Chat B transcript** in the DCH archive. No new transcript/index.
