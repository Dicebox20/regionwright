# Regionwright: Hunting & Gathering

A standalone Regionwright module for environmental resource gameplay.

Version 0.4.2 consolidates Hunting, Fishing, and Mining behind one active-GM HUD and one Foundry module identity: `regionwright-hunting-gathering`. The module owns the three gameplay runtimes, catalogs, Region interactions, sockets, item packs, macros, and styles. Gathering remains visible as a planned activity.

The public API is available at `game.modules.get("regionwright-hunting-gathering").api`, with `api.hunting`, `api.fishing`, and `api.mining` namespaces. The H&G Region Control is the only setup control; Fishing and Mining no longer register separate controls or depend on each other.

## Standalone legacy-flag lookup hotfix v0.4.2

The Fishing catalog installer reads saved legacy flag data without calling `getFlag()` for an uninstalled module scope. Foundry v14 rejects `getFlag()` on inactive scopes, so this keeps standalone startup and idempotent item detection working after the old Fishing module is removed.

On first ready as the active GM, subsystem-owned flags from `regionwright-fishing`, `regionwright-mining`, and the historical `regionwright` fishing scope are moved into the consolidated namespace. Legacy Fishing image and macro script paths are rewritten to the new module folders; failures are reported per document and retried at the next active-GM startup. Stable fish, bait, ore, pack-entry, Region flag, and macro identifiers are preserved. Legacy scopes remain read-compatible for documents that cannot be migrated immediately, including world compendium entries.

Fishing artwork includes the existing Game-icons attribution record at `assets/fishing/game-icons/license.txt`. Mining source and catalog assets were migrated from the existing Regionwright Mining package; no external artwork was generated or re-derived during consolidation.

## Hunting v0.2.0

Hunting adds a first playable bow-physics prototype. The flow is visible Survival tracking, visible Stealth approach distance, mouse-aimed hold-to-draw/release shooting, and visible Survival harvesting after a lethal hit. The projectile model uses draw strength, actual range, gravity, crosswind, and live aim sway.

Real hunts accept only the module-owned `Hunting Bow` item identified by `flags.regionwright-hunting-gathering.huntingBow`. Generic bows are deliberately not accepted. The GM test hunt bypasses equipment and inventory rewards.

## UI refresh v0.2.1

Regionwright dialogs now use a flat Foundry-like visual language: translucent charcoal window content, typography and spacing for hierarchy, subtle divider lines, and no decorative nested card panels. Functional borders remain on controls and playable canvases.

## Native Foundry UI v0.2.2

Regionwright now inherits Foundry VTT 14 application and form styling directly. The H&G and Hunting roots use `standard-form`; activity navigation uses Foundry `nav.tabs`; buttons, selects, checkboxes, window surfaces, text colors, focus states, hover states, and disabled states are left to Foundry. Regionwright CSS is limited to layout and the game-specific hunting range.

## Hunting live-play corrections v0.3.0

Hunting now separates character rolls from the bow game. Track and Approach run in a compact native Foundry roll window; Take the Shot opens a dedicated shooting window; lethal shots hand off to a compact Harvest roll window. Hunting skill buttons call the Actor's D&D5e skill roll directly with the configuration dialog disabled and d20 advantage mode forced to NORMAL. The Hunting Bow is sight-zeroed at 30 yards, Show Hitboxes only overlays anatomy, and fired aim/impact markers are anchored to target-local coordinates so resizing cannot detach them from the quarry.

## Source-backed ballistics v0.3.1

Hunting replaces the simplified trajectory approximation with fourth-order Runge-Kutta integration. The arrow model uses real gravity, air-relative quadratic drag calibrated to kappa = 0.00231 m^-1, a 74.5 m/s full-draw reference velocity, 7 cm sight height, and 20/30/40/50/60-yard hunting sight pins. Crosswind enters as moving air in the drag calculation rather than an independent artificial lateral acceleration.

## Draw-feel playtest v0.3.2

Full draw now takes 1.5 seconds. The draw meter has 50%, 75%, and 100% milestone markers that pulse once as they are crossed. These thresholds are feedback only: release strength remains continuous and feeds the RK4 ballistics at the exact release percentage. Full draw has a 0.7-second settled window before fatigue increases sway. A temporary four-stage bow schematic provides rest/half/heavy/full visual feedback and is intentionally replaceable with final art later.

## Draw-tension playtest v0.3.3

The v0.3.2 milestone-pulse and placeholder four-stage bow experiment was removed after live-play feedback. Draw is now continuous and visually simple again, but no longer linear: full draw takes 1.3 seconds and uses a quadratic ease-out so the early pull is quick and the final portion slows significantly as the bow approaches full tension. Exact continuous draw strength still feeds the RK4 ballistics.

## Heavy-bow resistance playtest v0.3.4

The useful 50%, 75%, and 100% draw-marker pulses return, without restoring the rejected staged bow art. Draw timing now comes from a force/work-inspired model: normalized bow force rises from 20% at the start of the power stroke to full resistance at full draw, while the player's pulling power is treated as constant. Full draw takes 2.5 seconds, producing approximately 0.83s to 50%, 1.56s to 75%, 2.10s to 90%, 2.30s to 95%, and 2.50s to 100%. Release strength remains continuous and feeds the RK4 ballistics exactly.

## Windage and stable reticle v0.3.5

Crosswind remains part of the RK4 arrow physics as air-relative velocity. The shooting range now shows a prominent wind arrow pointing in the direction the air pushes the arrow, with current mph beside it; shot results report signed drift direction. Automatic reticle sway is removed entirely from the Hunting runtime. The reticle follows mouse movement only. Heavy-bow draw resistance and 50/75/100 pulse markers remain unchanged from v0.3.4.

## Back-loaded draw gradient v0.3.6

The heavy-bow draw now uses one smooth strongly back-loaded time curve instead of the prior linear-force work model. Full draw is 4.0 seconds. With T(s) = 0.12s + 0.88s^4 in normalized time, draw reaches about 50% at 0.46s, 75% at 1.47s, 90% at 2.74s, 95% at 3.32s, and 100% at 4.00s. Live strength is recovered with a bounded binary inverse, so the progression has no discrete speed changes. The 50/75/100 pulse markers, RK4 ballistics, wind HUD, and mouse-only reticle are unchanged.

## Moving quarry playtest v0.3.7

Whitetail quarry now walks smoothly across a bounded shooting lane, pauses briefly, then reverses. The pattern is deterministic per hunt seed. Movement affects the shot itself: the arrow is still integrated with RK4, then quarry displacement during flight is converted to meters and subtracted before anatomical hit classification. Shooting a walking deer therefore requires lead; waiting for a pause does not. The quarry remains side-on/broadside in this first movement pass.

## Stamina playtest v0.3.8

The Hunt window now has a visible Stamina gauge. Drawing drains stamina continuously at 1 + 16*drawStrength^2 per second, so the easy early draw is cheap and near/full draw is expensive. The accepted four-second draw consumes about 44 stamina, leaving roughly 3.3 seconds of full-draw hold from a fresh start. At zero stamina the bow automatically lowers rather than firing. Lowering the bow begins recovery after 0.6 seconds at 24 stamina per second. Stamina never modifies accuracy or reticle position.

## Draw-sensitive arrow speed v0.3.9

Arrow launch velocity is now strongly back-loaded against continuous draw strength. Full draw remains 74.5 m/s to preserve the accepted trajectory/drop calibration, but velocity now follows 5 + (74.5 - 5) * strength^2. This yields about 22.4 m/s at 50%, 44.1 m/s at 75%, 61.3 m/s at 90%, and 74.5 m/s at 100%. RK4 flight time therefore changes sharply with draw strength and directly increases or decreases moving-quarry lead. Shot results now display launch speed alongside flight time.

## Force-draw energy launch model v0.3.10

Partial-draw arrow speed is no longer controlled by an independent hand-tuned exponent. The accepted draw-time curve is treated as normalized cumulative work under the existing constant-pulling-power interpretation: E/E_full = 0.12*s + 0.88*s^4. With constant arrow mass and bow efficiency, kinetic energy implies v/v_full = sqrt(E/E_full). Full draw remains calibrated at 74.5 m/s, preserving the accepted full-draw trajectory. The engine remains SI internally, while the shot result reports launch velocity in feet per second.

## Realistic heavy-self-bow draw model v0.3.11

The previous fourth-power gameplay draw curve is replaced by an approximately linear force-draw model for a heavy medieval-style self bow. Normalized draw force is F/F_full = s, normalized stored energy is E/E_full = s^2, and under the constant-player-power approximation normalized draw time is T(s)=s^2. Full draw is 2.5 seconds: 50% at 0.625s, 75% at 1.406s, 90% at 2.025s, 95% at 2.256s, and 100% at 2.5s. Because launch velocity is derived from sqrt(E/E_full), partial-draw speed is linear in draw fraction for this model while full draw remains calibrated at 74.5 m/s (about 244 fps). Stamina constants are intentionally unchanged for this first realism playtest.

## Synchronized flight, dynamic lead, and tracer v0.3.12

Arrow rendering now uses sampled positions from the same RK4 projectile equations as hit resolution and runs for the real physical flight duration without the former 1.1-second animation cap. Quarry movement advances on that same real clock. While drawing, a faint Lead chevron predicts only the quarry center at the current arrow-arrival time; it updates with draw strength and hides when the quarry is paused or displacement is negligible. Wind and vertical drop remain separate player compensations. A short-lived tracer follows the sampled projectile path and fades after impact.

## Conservative moving-target aim forgiveness v0.3.13

The visible v0.3.12 Lead chevron is removed. Synchronized RK4 arrow animation and tracer feedback remain. Moving shots now receive a tiny hidden horizontal collision forgiveness of at most 0.12 m, but only when the quarry is moving, the player has already aimed in the correct direction of travel, the unassisted physical result is a miss, and a bounded correction converts that miss into anatomical contact. Trailing aim, vertical misses, already-valid hits, paused quarry, and larger misses receive no assistance. The rendered arrow/tracer remains the unmodified physical RK4 path.

## Calm-only drop calibration v0.3.14

Live Hunting temporarily ignores wind so vertical arrow drop can be calibrated independently. Both the impact calculation and sampled RK4 trajectory are called with windMph=0. The wind HUD, wind-compensation instruction, and wind-drift result text are removed from the live shot interface. The underlying deterministic wind and air-relative RK4 wind implementation remain in hunting-engine.js for later reactivation after drop calibration is accepted.

## Heavy-bow stamina feel v0.3.15

The calm-only drop-calibration mode from v0.3.14 continues. Heavy-bow exertion is stronger without adding camera or reticle shake: stamina drain is 1 + 23*s^2 points/second, so it accelerates as draw effort rises and reaches 24/s at full draw. With the 2.5-second quadratic draw this leaves about 68.75 stamina at full draw and about 2.86 seconds of full-draw hold from fresh. Below 50% stamina the meter pulses red, with the period continuously shortening from about 1100ms to about 350ms near zero. Reduced-motion disables that animation. Positive 50/75/100 draw milestone pulses and reached markers now use Foundry success green.

## Ballistics Lab + unified projectile simulation v0.3.16

The active-GM Hunting & Gathering HUD now includes a deterministic Ballistics Lab. A single `simulateArrowShot()` RK4 implementation powers both impact-only and sampled trajectory consumers. The lab compares Current Hybrid, Meyer Reference, and Heavy Warbow Reference profiles at fixed ranges and draw strengths using Traditional/Unsighted, Automatic Pin, or Explicit Zero aiming modes. It reports arrow mass, launch/impact velocity and kinetic energy, flight time, launch elevation, raw horizontal-launch fall, sighted point-of-aim error, physical-to-screen projection scale, and rendered pixel offset. The Heavy Warbow profile uses the 85 g / 55.1 m/s experimental launch reference while retaining kappa 0.00231 m^-1 provisionally until a downrange-data fit is locked. Live Hunting remains calm-only and otherwise unchanged.

## Ballistics Lab observer safety hotfix v0.3.17

Ballistics Lab resize observation is now optional and guarded. The dialog queries the plot first and only calls `ResizeObserver.observe()` when the target is a concrete DOM `Element`; missing targets are safely ignored. This addresses the intermittent client TypeError observed during lab rendering without changing projectile physics or diagnostics.

## Ballistics Lab graph reliability v0.3.18

The trajectory SVG is now created programmatically after the Foundry DialogV2 has rendered, inside a stable HTML mount point. This avoids relying on inline SVG content surviving application parsing/render timing. A Show/Hide Graph control collapses the plot without affecting diagnostics; showing it recreates a missing SVG and redraws the current shot, providing a recovery path if the visualization ever disappears. Ballistic calculations are unchanged.

## Ballistics Lab canvas renderer v0.3.19

The trajectory visualization now uses an HTML canvas rather than SVG. The canvas draws the same line of sight, launch axis, RK4 trajectory, target plane, deer-height reference, and impact marker from the existing projection result. The canvas is present directly in the DialogV2 HTML and can be recreated by Show Graph if it is ever missing. Ballistic calculations are unchanged.

## Trained Holdover v0.3.20

The GM Ballistics Lab adds a lab-only Trained Holdover aiming mode. It represents an expert unsighted archer applying learned range compensation: for the selected profile, range, and draw strength, the existing numerical sight-angle solver is fed the shot's actual draw-dependent launch speed and solves the elevation needed to intersect the point of aim at that range. The former Traditional label is clarified to Horizontal Reference. Live Hunting physics and aiming remain unchanged.

## GM Live Holdover Calibration v0.3.21

The Hunting tab now exposes a GM-only Live Holdover Calibration launcher at fixed 20, 35, 50, and 65 yard ranges. It opens the real Hunt shooting window directly in no-reward test mode. The calibration retains draw timing, stamina, moving quarry, the canonical RK4 flight clock, arrow/tracer animation, anatomy collision, and bounded moving-target forgiveness. Only the vertical aiming solution changes: the engine solves the launch elevation needed to cross the exact anatomical point under the reticle at the chosen range using the arrow's actual draw-dependent launch speed. Normal Hunting continues to use its existing pin-sight path.

## Switchable Hunting test modes and physical quarry movement v0.3.22

The GM Hunting panel now uses one bounded Test Mode selector with Normal Test Hunt, Live Trained Holdover, and Movement Calibration. Fixed-range options are supplied by the selected mode. Quarry motion now has a fixed 4.8 m physical lane: `deerMotionAtMs` returns physical position and velocity, rendering projects that physical state into the available screen lane, and hit resolution subtracts physical release-to-impact movement directly instead of deriving metres from distance-scaled deer pixels. Test shots report release velocity/phase, target travel during flight, release aim offset, physical horizontal miss, and any bounded forgiveness. Existing normal Test Hunt and Live Holdover APIs remain available for compatibility.

## Movement diagnostic phase cleanup v0.3.23

When a deterministic deer movement profile is reversed, the diagnostic phase name now mirrors with the physical direction (`walk-right`/`walk-left` and pause direction labels). Position, physical velocity, 4.8 m lane calibration, easing, pause timing, hit resolution, ballistics, and forgiveness are unchanged.

## Testing-only anatomical target v0.3.24

GM Hunting test modes now use a separate anatomical target profile derived from the supplied broadside deer reference. The test lungs are shifted forward behind the front shoulder, the heart sits low/front within the chest, and a distinct abdomen/gut region sits farther rearward. The visible testing overlay is rendered directly from `DEER_TEST_HIT_ZONES`, and test-mode classification/forgiveness receives that same array. Normal Hunting continues to default to the unchanged production `DEER_HIT_ZONES`.

## Impact visual synchronization v0.3.25

Quarry rendering now projects physical `positionM` using the same target-scale pixels-per-meter conversion used by the arrow trajectory. This makes the impact-time deer center, deer-local impact marker, arrow tip, and tracer endpoint share one visual coordinate system. Authoritative projectile physics, target movement in metres, trained holdover, anatomy, hit classification, and forgiveness are unchanged.
