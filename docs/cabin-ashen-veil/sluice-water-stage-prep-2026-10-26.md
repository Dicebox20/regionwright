# Cabin in the Ashen Veil — Sluice/Flood Staging Contract (2026-10-26)

**Status:** Source-prepared, NOT enabled for water changes. Owner-approved water visuals and token-safe landings required before activation.

## Canon
The crank comes from Donovan's 587 lockbox after Allen's Study note. Installation consumes the one original iron Crank from an authorized player's actor inventory and is permanent. Installing alone does **not** drain water. A separate deliberate sluice OPEN changes the Pond and Bathhouse simultaneously to DRained; CLOSE restores both to FULL. The system must never treat Pond and Bathhouse as independent authoritative states.

## Present live evidence
- EXT-02 Scene `CAVEXT02Scene001`, Sluice Region `CAVEXT02SLUICE01`, RegionBehavior `CAVEXT02SLCBEH01`.
- Canon world Item: `Item.g3VYdgc1qkgkHGvn` Sluice Crank; original assigned actor copy carries `cavDonovanCrankSourceUuid` and `cavDonovanCrankRegionUuid` after valid 587 GM claim.
- Approved Pond backgrounds installed: `Maps/cabin-in-the-ashen-veil/ext-02_pond_full_owner-approved.png`, `Maps/cabin-in-the-ashen-veil/ext-02_pond_drained_owner-approved.png`.
- Bathhouse surface scene `CAVBATHScene0001` approved unified map exists, but no approved drained alternate stage map is registered, `alternateBackground=null`; Google Drive title search for Bathhouse drained did not locate an asset. Do NOT invent a dry image or automatically swap Bath to an unsupported state.
- No verified safe shoreline/landing coordinate mapping, token rescue, reversible exits or refilled pond hazard interlocks have been approved/installed.
- Exact scene permission and source-image checks passed for 587 note, shack lockbox, and sluice static closeup. All three remain static look/click interactions.

## Installed this turn
Regionwright Studio `studio-cav-sluice.js` implements only one-time crank fitting after the valid Study→587 chain; source/installed SHA matches. The live Sluice RegionBehavior dispatches Studio on `behaviorViewed`, `behaviorUnviewed`, `behaviorDeactivated`, preserving the approved closeup. The original `noDrainActivation: true` flag remains; new `cavSluiceInstallController.drainEnabled=false`. No Crank has been consumed, no water flag recorded, and no scene art changed.

## Prepared (not connected)
`studio-cav-water-state.js`: pure canonical state resolver with closed/full default, open/drained and close/full coupled transitions, rejects split/discordant water states, gates on crank installation, both owner-approved art stages, measured positions and safe returns. No runtime write hook, no button or Region event for water changes until the visual and route gate passes.

## Next bounded work order
1. Recover/approve actual Bathhouse dry-stage art consistent with existing scene (or a validated static overlay/art mechanism approved by owner).
2. Measure/render/verify shore landings, drained pool floor, pond stairs, Reliquary hatch, Bathhouse Boiler dry escape, refill token evacuation and reverse access. Keep first chase safe.
3. Preview/source audit a single GM atomic transition with reserved/pending/done receipts on EXT-02 sluice Region, using `planCavWaterChange`. Explicit click to open/close, never tokenEnter. Ensure both backgrounds+flood flags are updated only after safe positions preflight; interrupted writes require reconciliation, not blind retry.
4. Only then remove the `noDrainActivation` and visual gate flags, and authorize gameplay operations. Full player playtests postponed until entire campaign chain complete under current owner exception.

### Testing
Pure stage source tests verify precedence and safety requirements but do not replace later Foundry player travel testing. Do not use them to claim a safe live drain.

