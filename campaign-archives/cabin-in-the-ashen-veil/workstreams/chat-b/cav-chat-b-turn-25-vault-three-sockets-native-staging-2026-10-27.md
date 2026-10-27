# Cabin in the Ashen Veil — Chat B Turn 25: Three Vault Item Sockets and Sealed Workshop/Vault Passage

**Pacific date:** October 27, 2026, ~06:30–06:41 PDT. **Role:** Chat B independent late-game puzzle work, one shared live Foundry world with Chat A. **Owner authority:** delegated CAV creative and technical decisions; Crooked Man encounters, NPC, first/second chase and Silver pickup explicitly deferred. **Acceptance state:** SIX new physically grounded native Regions, SIX DISABLED native Behaviors, including one added to an existing central bench, installed and independently current elected-GM verified. No puzzle solved, no Item copied, no Vault opening and no player traversal/playtest.

## PREPARE — authoritative original Workshop and Vault
- Exact worker branch codex/cav-late-game-chat-b-20261026, parent f83d8742307085cd6f87402d7af5f0c73dfc9977; checkout initially clean. Chat A checkout C:\Users\rujie\Documents\Region Editor observed HEAD f8542fec3fcab9a1f84a6c015fec9cd4d33730cb, entirely READ ONLY and untracked work untouched.
- Bridge local PowerShell and original Dev Chrome port 9224 ready, exact Foundry /game elected Gamemaster 1, version 14.367, world cabin-in-the-ashen-veil, system dnd5e. Current ChatGPT/Bridge chat identity still missing/unverified; no peer relay claims. Native elected-GM current facts provide authority, not a client receipt origin string.
- Original owner-approved art inspected at natural pixel scale:
  - Scene.G6NMonfCwMvNzipL H-B01 - Allens Basement Workshop, image h-b01-allens-basement-workshop-approved-v002.png, 1536x1024, originally 3 Regions: passive stairhead CAVB9C0F653A2A6F x660,620,w190,h170; passive central bench CAVBABA9513F73A3 x770,315,w220,h185; ACTIVE original foyer stair return CAVBASEMENTRET01 with CAVBASEMENTPRT01.
  - Scene.tjTpG2RVZNoCqRLh H-B02 - Secured Keystone Vault, image h-b02-secured-keystone-vault-approved-v003.png, 1536x1024, originally 2 Regions: passive western entry CAVB1F6B8321128A x180,360,w200,h190 and original Keystone dais CAVB799A5357A114 x705,380,w210,h190, containing only previous T24 DISABLED original Keystone plinth Behavior CAVVKEYPLINTH001.
  - Both Scenes currently show native walls.size=0; **wall/collision and hidden Vault door safety are NOT player accepted**. Teleports must stay disabled until native collision and player flow are commissioned/tested.
- Original GM Library Items independently checked: charged-in-place source template Item.pbmUZPfC3WnsBRgi (item name Uncharged Gondian Power Source), Gond half Item.o9G3UJjEe2QX1ZH0, Sune half Item.t9uCIpsKeSvtC31w, original newly authorized Keystone reward Item.CAVKEYSTONEITEM1; all status GM_LIBRARY_ONLY and ZERO actor copies. Historical completed emblem Item.vbDWTbnAZg65ErSS is mechanism geometry not an added fourth/fifth inventory socket. Bowl Item.1n5LONw3nYIy61O9 is OUTER Undercroft, NEVER Vault reward.
- Canonical owner L1-J Vault logic requires exactly FOUR readiness predicates: true Weathered Key Basement access plus THREE independently earned original Item sockets, then explicit **Turn Joined Emblem** as a separate physical action. That turn must not instantly hand out Keystone; authentic plinth pickup remains another explicit one-time player action after safe Vault opening.

## BUILD — native physical stage, one-time elected-GM installer
New source modules/regionwright/scripts/studio-cav-late-vault-workshop-native-staging.js, new unit tests tests/cav-late-vault-workshop-native-staging.test.mjs and native forensic tests tests/cav-late-vault-workshop-native-receipt.test.mjs. Source plan verified no new overlaps with ANY original Region; native GM dry-run certified current exact owner maps, Item originals, empty player custody, existing active Basement stairs and T24 disabled plinth. Existing arrival built BEFORE any new sealed destination was created.

### H-B01 original Basement Workshop
1. NEW Region.CAVVAULTPOWER001 x610,y365,w130,h125, first original source socket, native DISABLED executeScript CAVVPOWERBEH0001; accepts ONLY Item.pbmUZPfC3WnsBRgi once original AQ-01 source is genuinely charged and acquired.
2. NEW Region.CAVVAULTGOND0001 x1020,y358,w125,h132, Gond half socket, DISABLED executeScript CAVVGONDBEH00001; original source Item.o9G3UJjEe2QX1ZH0 from true H-U05 six-book bookshelf compartment.
3. NEW Region.CAVVAULTSUNE0001 x890,y515,w130,h98, Sune half socket, DISABLED executeScript CAVVSUNEBEH00001; original Item.t9uCIpsKeSvtC31w earned by correct separate Sune Devotion/altar action.
4. **EXISTING** original central bench Region.CAVBABA9513F73A3 preserves exact original shape and gains only NEW DISABLED executeScript RegionBehavior.CAVVTURNBEH00001 — explicit Turn Joined Emblem actuator AFTER the three installed original sources; NOT a fourth socket.
5. NEW Region.CAVVAULTDOOR0001 x1325,y535,w150,h165, original eastern side sealed Workshop passage, DISABLED native teleportToken CAVVOUTTEL000001 targeting existing passive western Vault arrival Scene.tjTpG2RVZNoCqRLh.Region.CAVB1F6B8321128A (never enabled just by scene entry).
6. NEW **PASSIVE** Region.CAVVAULTLAND0001 x1095,y730,w150,h130, independent safe landing from Vault return, zero Behaviors to avoid immediate return loop.

### H-B02 original Secured Vault
7. NEW Region.CAVVAULTBACK0001 x50,y397,w118,h148 in western passage, DISABLED native teleportToken CAVVBACKTEL00001 targeting PASSIVE Scene.G6NMonfCwMvNzipL.Region.CAVVAULTLAND0001. Completely separate from original passive Vault western landing CAVB1F6B8321128A. T24 Keystone dais/plinth remains DISABLED.

Thus seven logical fixture roles: six NEW Region documents (five Workshop, one Vault) + ONE Behavior on old bench; **six new DISABLED Behavior documents** total (three socket reviews, bench turn review, two native teleports); one new passive Workshop arrival plus original passive Vault arrival. All scripts inert, non-granting and non-state-mutating; all new flags dicebox-campaign-helper.cavLateVaultWorkshopFixture.status=dormant-uncommissioned; no original Region recreated or changed except additive disabled Behavior on passive bench. Source GM readback verifies IDs, shapes and destination strings.

## VERIFY — exact real native and regression
- No-write GM preflight status original-vault-3-socket-native-preflight-pass-no-writes; one-time installer status vault-workshop-three-physical-sockets-joined-turn-and-two-way-sealed-native-installed, native postwrite original Workshop 8 Regions/Vault 3, old foyer stairs active and T24 Vault plinth disabled.
- **SEPARATE elected-GM readback pass:true** verifying all seven physical fixtures, exact Region IDs/rectangle coordinates, six disabled native Behaviors, four exact native executeScript source SHA256 values, both real paired destination Region UUIDs, original staircase and Vault western passive landing, original Keystone dais, original GM Library Items and zero Actor copies. First, second Crooked chase and Silver pickup remain disabled. No reward ledgers advanced.
- Current evidence under docs/cabin-ashen-veil/native-install-evidence/2026-10-27-chat-b-turn25-vault-workshop:
  - original census JSON SHA256 D53732E80736324AA24E3150C16260F6526CD186F0A832DFCBBAC10E51651BD9
  - one-time native installation JSON SHA256 27906A6C99CEDF00F3AE0A43B38BF3366CFFD1F969F7E820ACBCCC81BC0E1FF2
  - independent elected-GM postread JSON SHA256 9ECC0F8B0CFD69102087F9CD79BF02EC2D19CC9C01648F7D584031CC4A100C3A
  - exact census, one-time installer and separate independent readback JS source files. **DO NOT REPLAY installer**.
- New 11 source-plan tests and 8 forensic receipt tests, full isolated Cabin **1,301 / 1,301 across 52 test files PASS**, Node source syntax PASS. This is native source/GM postread verification, NOT ordinary-player full puzzle acceptance.

## NEXT (no Crooked Man)
1. Commission authentic native socket registration: per action read CURRENT GM verified original acting PC Item copy and source origin, exact previous source claim, unique custody and independent Item status, reserve original socket, install one real Item without duplication, reread, then done. Await ACTUAL Gond source charged by the legitimate Aqueduct mechanism; Gond half from genuine H-U05 books; Sune half from original Devotion/altar.
2. Genuine Weathered Key basement entry + EXACT THREE installed sockets => four prerequisites. On deliberate central bench *Turn Joined Emblem* action, native elected GM reserve original Vault stage, open paired original Workshop/Vault teleports and safe collision/wall segment, verify, then done. **No automatic Keystone award on turn.**
3. Commission original H-B02 plinth DISABLED CAVVKEYPLINTH001 only after genuine Vault open; explicit player take one Item.CAVKEYSTONEITEM1, reserve→one copy→reread→done.
4. Downstream UND-01 original rose/gear Keystone recess, separate stone lever press and safe UND01↔UND02 crossing still sealed and not playable; independent SG-05 Bowl+filled original Great Room 027 pellet opens OUTER approach first.
5. Crooked Man side content strictly deferred; Chat A checkout and original Vanity untouched. Append THIS turn to SAME one living Chat B transcript in DCH campaign archives; not another transcript/index.

**Evidence class:** Current elected-GM verified physical native staging; no story completion, no true Item pickup/socket insertion, no native wall safety or nonGM playtest.