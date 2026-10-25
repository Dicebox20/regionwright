# Unified HUD Player Context Checkpoint — 2026-10-24

Source changed: modules/regionwright-puzzles-locks/scripts/puzzle-hud.js.
All seven test rows remain within ONE HUD. The Test and Reset test buttons now require a selected active non-GM player and use the existing `deployPuzzleHUD(..., {scope: "player", playerId})` route. The test opens on the player's authenticated client and therefore runs with their non-GM UI permissions. Reset test means a fresh standalone puzzle seed on that player session, not a reset of real campaign documents. No privileged GM write is granted; no GM impersonation. Offline recipients are rejected.

Read-only live evidence: world `cabin-in-the-ashen-veil`, Gamemaster 1 elected GM. Player 1 ID `ndip9BpbRtT8hMbF`, role 2, OFFLINE. Test actor `Actor.XsogNG0pRJtZEy4f` (Test of Clese), currently not owned by Player 1 and not assigned as that user's character. No ownership or user assignment changes have been made: standalone visual puzzle tests have no actor requirement.

Verification: `node --check` and source route assertions passed. NOT yet deployed to installed module; no player-side live test because Player 1 offline. A real actor-inventory/Region walkthrough still requires explicit target binding plus actual player character ownership; it is not provided by generic standalone opener. Preserve active GM responsibility for persistent writes.
