# Cabin in the Ashen Veil — Underground Static Battlemap RENDER Brief (Unapproved Candidate)
**Date:** 2026-10-26 Pacific. **Stage:** PREPARE → proposed RENDER, **NOT OWNER-APPROVED ART**. No native world Scene created. Owner retains authority to revise all dimensions, connections and geometry.

## Proven existing scenes and continuity
- Only approved paired aboveground Bathhouse backgrounds are \`Scene.CAVBATHScene0001\` (full) and \`Scene.8yLMRDvxyw58dydh\` (drained). 2160×1440 native Scene space, grid 120, source artwork 1536×1024, owner coordinates flagged provisional. Do not change wall/landing grid without owner visual review.
- Current full 47-Scene Foundry inventory, read from a clone, confirms **BATH-03 Boiler Room and BATH-04 Rosewater Reliquary are genuinely absent**. The existing H-B03 Basement Supply Closet is unrelated.
- Owner's approved story progression: ring puzzle on drained **central Bathhouse pool floor** (outer 90°, middle 270°, inner 180°), hatch/stairs into BATH-04, original Sune's Scrying Bowl collected from plinth, dry eastern service door to BATH-03, onward escape route from Boiler independent of pressure and of the pool's refilling.

## Static scene BATH-04: Rosewater Reliquary (DRAFT ART DIRECTION)
- Rectilinear underground medieval stone reliquary, desaturated aged warm gray with cracked flagstones, faded rose-red petals/motifs, brass/bronze Sune details, faint water staining but **walkable dry floor**, dust from fifty years' abandonment. Same painterly aerial/top-down realism as approved Cabin battlemap.
- A clearly readable **single entry stair/shaft from the drained central Bathhouse hatch** (position TBD after measuring actual upstairs pool/hatch), a center ceremonial plinth suitable for separately installing the original Bowl Tile/Item, and a **clearly readable eastern service doorway** with an unboltable door to the Boiler.
- West/north/south perimeter solid walls, no fabricated secret passages, no intrinsically magic animated tile. Do not paint the actual live Rosewater three-ring UI onto this scene—the canonical ring puzzle is UPSTAIRS on drained Bathhouse surface and must be created through Regionwright Puzzles & Locks.
- Composition/crop/style proposed only. Owner must approve precise landing and all wall, stair, door polygon coordinates from the final RENDER/INSPECT receipt. Do not transfer fabricated art geometry to Foundry.
- No text, labels, arrows, DM notes, token silhouettes or floor grids should be baked into approved tactical background; optional *separate* planning diagram may carry labels.

## Static scene BATH-03: Boiler Room (DRAFT ART DIRECTION)
- Fifty-year neglected subterranean boiler machinery: large copper/iron vessel, oxidized manifold pipes, soot/ash, two mechanically distinct wheel fixtures/pressure mechanisms but no draggable/interactive dial graphic painted by Campaign Helper. Puzzles & Locks owns the live pressure panel and wheels (canon solution **2/1**). Dry safe walkable route remains around machinery.
- **Western service doorway** must match BATH-04's east service connection. Its dry passage and return work independently of restoring Boiler/Waterworks pressure, even after main Bathhouse surface refills.
- Boiler also needs a distinct, estate-reaching **dry exit**; the canon does not yet specify its exact door side or destination. Until owner-approved connection is identified, DO NOT fabricate an exit to an unspecified House room or imply that a passage is already installed. The drawing may reserve an undecorated possible wall landing but must flag this as proposed/TBD, not canon.
- Avoid sharp boiler pipes/floor obstacles that make the west door or potential exit physically impassable. Owner approves obstacles and wall/light topology from actual render.

## Required owner checks before BUILD
1. Each room has its own final separate top-down, gridless, label-free tactical PNG and explicit owner art approval.
2. Approve measurements and orientation of drained Bathhouse hatch to the BATH-04 entrance, Reliquary EAST to Boiler WEST, and Boiler onward estate exit.
3. The BATH-04 plinth is suitable for the **existing original world item** \`Item.1n5LONw3nYIy61O9\`, NOT a copy made in Scene BUILD. Bowl visual currently uses a generic world item pouch icon; a local \`scrying_bowl_512.png\` candidate exists but is not listed in the owner-approved item-art attachment manifest. It requires separate approval before attachment.
4. Regionwright's approved four-symbol interactive ring artwork is still unverified. Its former six-sector demonstration art is NOT the live campaign rings.
5. No lower-room token placement, alternate scene art, fixture Region, teleport or Sluice status changed during PREPARE.

## Source guards already implemented
As of this turn, the single canonical Sluice refuses refill when one of the two underground rooms exists without the other (partial/duplicate Scene), or when a PC remains underground and no live native, reciprocal service door plus verified pressure-independent Boiler→estate exit is available. When both rooms are entirely absent, normal Sluice behavior is unchanged. This guard can be safely audited through pure tests before any GM writes. A successful source test is not proof of a tested route.
