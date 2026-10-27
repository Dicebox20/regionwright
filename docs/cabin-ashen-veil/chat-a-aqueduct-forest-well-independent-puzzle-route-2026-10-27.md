# Cabin in the Ashen Veil — Chat A independent Aqueduct and Forest Well puzzle routing

Date: October 27, 2026 Pacific. Owner direction: Chat B installing Undercroft, Chat A continues early/midgame; Crooked Man haunts LAST and personally roleplayed by owner at checkpoints, not puzzle prerequisites. Full compatibility testing after all content installed.

## PREPARE / INSPECT
Regionwright branch codex/cav-sune-integration-20261026, prior commit f3c1bfccf077ec9d3b4d97573889289dd6b598f0, zero tracked changes at beginning. Dicebox Bridge local PowerShell healthy. Exact Foundry 14.367 elected Gamemaster 1 in original cabin-in-the-ashen-veil world. North Aqueduct original Region CAVAQWELLNORTH01 has original disabled outbound Forest Well teleport; FM well reentry, Pond entry, AQ Pond return and original first chase trigger are disabled. Original Gear, Handle, commissioned route and Well unlock claims are NULL. No actor/token/artificial progression. Chat B late-game and Undercroft work untouched.

Source studio-cav-aqueduct-routing.js previously required a Crooked Man Actor for Aqueduct route commissioning, enabled the first-chase trigger, and opened Forest Well only after a chase success/capture. This conflicted with the owner's checkpoint-haunt rule.

## BUILD
- Aqueduct route commissioning now requires actual original Gear + Handle consumption and original Crank-backed synchronized Pond/Bath drain, original source/GM authenticity and physical safe return. It no longer needs a Crooked Man Actor and NEVER enables first chase. The route ledger source is original-aqueduct-gear-handle-sluice; original water-phase Pond entry/return interlocks preserved.
- Gate native GM service now calls route commissioning after both original parts have actually been installed in the gate. Failure reports reconciliation rather than granting progress.
- New Forest Well pure check requires completed original independent route plus actual North Aqueduct arrival; never chase state.
- New elected-GM Forest Well physical unlock checks a real active non-GM user, owned character token physically within original North Region, the original commissioned Gear/Handle route, still-disabled original chase trigger, return/outbound portals disabled and no conflicting prior well claim. Writes RESERVED, enables Forest Well RETURN FIRST, then outbound, commits DONE provenance; Well reentry remains independent of water refill.
- Original first-chase source no longer attempts to unlock Forest Well after chase resolution. First chase native Behavior remains disabled for later GM roleplay. Studio campaign API now exposes the new physical north arrival handler and GM route reconciliation API.
- Four existing source files modified and copied with exact prior/new byte SHA and rollback backups to installed Regionwright module disk; no forced Foundry reload. Installed exact SHA256: routing 6E3614B81F6F466E70B0C0D53A32306593B95D03952F736705938178F8F4AAC0; gate 5AC15D623F0EEC90C658623E31D57A9431236A35823D4CD8B859CBF038BE07F2; first chase 559176C8B38036E318FD5AA72600224168EB13EED8D44BF5130B6383B8CB6DFE; studio campaign 05329214BD63D63D564E882621005E1685C513A85C323A6477141242DD39BC4D.

## SOURCE VERIFY
Updated tests/cav-aqueduct-routing.test.mjs from chase prerequisites to authentic physical item/drain and north arrival rules. Added tests/cav-forestwell-physical-north-arrival-nohaunt.test.mjs with seven cases using mock genuine Foundry GM state: positive north token → RESERVED/RETURN/OUTBOUND/DONE order; absent/forged route, wrong player/off-region, reserved claim and repeated use fail-closed. Whole source suite 253/253 PASS, 0 failures, 45 files (previous 246). Initial CRLF patcher failed before write; corrected. First disk deployment failed in preflight due a normalized-vs-byte SHA; corrected exact SHA, then four disk copies and Node syntax checks passed.

## NATIVE INSTALL / INDEPENDENT SECOND GM READBACK
On original north Aqueduct Region Scene.CAVAQ01Scene0001.Region.CAVAQWELLNORTH01, added exactly one enabled ExecuteScript native Behavior CAVAQWELLACCESS1 (16-char ID), events tokenMoveIn and tokenMoveWithin, dispatching the new Regionwright aqueductRoutes.handleForestWellNorthRegionEvent API. Original North exit teleport remains disabled. Elected GM exact preflight and individual write PASS. Machine receipt: utility-harness/artifacts/cav-chat-a-independent-north-well-arrival-native-install-20261027.json.

Independent second GM read-only check PASS: original world 47 Scenes, 244 Regions, 133 Behaviors; North Region two Behaviors including new script; original chase trigger disabled; Pond/AQ entry/return and both Forest Well directions disabled, no route/Well claim, no AQ tokens. Fresh installed module ESM import of new routing source PASS for legitimate puzzle-only commissioning and physical north unlock, even without chase. Receipt utility-harness/artifacts/cav-chat-a-independent-forestwell-native-gm-postread-20261027.json.

## OPEN DEPLOYMENT DEPENDENCY
Previously initialized active Regionwright module API still caches old source and does NOT yet have the new handler. Coordinate a SAFE module reload with Chat B after its Undercroft batch, then independently confirm the ACTIVE API exposes the physical north handler. Do not confuse the fresh ESM readback with live registered handler availability. No real player playtests or full compatibility diagnostic attempted per owner rule.

No Crooked Man, Silver Tiny Key, Undercroft, player items, quest stages or story claim flags were altered. Later real non-GM acceptance required after all installation completion. Source-only and GM checks are installation safety, not final campaign compatibility certification.
