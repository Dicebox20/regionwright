# H-U02 — PREPARE v004: landing-only visual authority

**Status:** PREPARE corrected; STRUCTURAL_RENDER reference candidate v003 exists, but PAINT_RENDER and final approval are pending. No live-scene changes in this revision.

## Reference evidence (different roles, never treat blueprint annotation as visible scenery)
- **Spatial geometry reference:** `house-blueprint-review/ashen_house_upper_v1.png` and `ashen_house_blueprint_geometry_v1.json`. These are concept/topology evidence, not a player-facing renderer; do NOT copy or include any room names or GM notes.
- **Visual example reference:** `C:\Users\rujie\Downloads\Haunted Halloween Headquarters Floorplan (1).png` (overhead interior map candidate), plus the approved Great Room image `Maps/cabin-in-the-ashen-veil/h-g06-great-room-aged-fifty-years-approved-2026-10-23.png` for house continuity. Source is reference only; no imported furnishings or adjacent rooms.
- **Map extent:** one landing scene only, 1440 by 1800 logical pixels, north up, top-down orthographic 90°, no visible grid.

## Only what must be visible
- A weathered wooden second-story landing with dark boards, dust, age, warmth, subtle wear and shadows.
- A central rectangular open space looking down into darkness, bounded by carved timber railings. That space is not a walkable floor.
- Continuous walkable floor around that opening, with clear circulation on all sides.
- Four plainly visible door thresholds, two on each side wall (upper-left, lower-left, upper-right, lower-right). Show doors and jambs only; neither depict nor identify anything beyond them.
- An attic-style square hatch in the northern landing floor, recognizable as a closed hatch; no view beyond.
- A south-end staircase descending out of view, with visible steps and bannisters only; no view beyond.
- Modest decorative wall trim, dust, perhaps a wall sconce where physically visible. No other rooms, set dressing, architectural space, or objects beyond the landing.

## Visual-only top-down reference diagram
```
                   NORTH ↑
       ┌────────────────────────┐
       │          hatch         │
  door ┤   upper landing       ├ door
       │     ╔══════════╗      │
       │     ║  OPEN    ║      │
       │     ║  VOID    ║      │
       │     ║ rails    ║      │
  door ┤     ╚══════════╝      ├ door
       │    lower landing      │
       │    steps descending   │
       └────────────────────────┘
                   SOUTH ↓
```

## Rendering instruction contract
Describe only the above physical features. Never name the destinations, subjects, contents, locks, characters, puzzles or stories associated with doors or hatch; never include annotations, signs, labels, symbols, a compass, text, title, or drawn grid. No roof, no bedrooms, no exterior. Crop strictly to this one landing. Do not improvise additional objects. The reference is for style and physical layout only.

## Workflow gates
- PREPARE visual source reconciliation: completed.
- STRUCTURAL_RENDER: `h-u02-prepared-battlemap-v003.png` is a geometry-only candidate, awaiting style evaluation.
- STRUCTURAL_INSPECT / FEATURE_MANIFEST / PAINT_RENDER / FINAL_INSPECT / BUILD / STAGE / INJECT / VERIFY: pending; do not declare any player-facing map replaced.
- Existing H-U02 live scene and two-way stair links remain unchanged.
