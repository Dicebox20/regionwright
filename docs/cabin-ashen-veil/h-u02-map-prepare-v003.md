# H-U02 Upper Gallery & Landing — PREPARE v003

**Status:** review candidate. Geometry and ingress/egress are planned; not approved scene artwork. Existing Foundry scene is untouched.

## Textual top-down spatial layout (mandatory KB rule)
```text
                           NORTH ↑
                  ┌───────────────────────┐
                  │       ATTIC HATCH     │
          ┌───────┤        [Ladder]       ├───────┐
          │       │     NORTH GALLERY     │       │
 Parents  │ DOOR  ├───┬──────────────┬────┤ DOOR  │ Sophia
 bedroom◄─┤ W/NW  │   │              │    │ E/NE  ├─► bedroom
          │       │   │    OPEN TO   │    │ LOCKED│ (Old Iron Key)
          │       │   │ GREAT ROOM   │    │       │
          │ WEST  │   │    BELOW     │    │ EAST  │
          │ WALK  │   │ (BALUSTRADE) │    │ WALK  │
          │       │   │              │    │       │
 Nursery ◄─┤ DOOR  │   └──────────────┘    │ DOOR  ├─► Guest
          │ W/SW  │                        │ E/SE  │ bedroom
          └───────┤      SOUTH GALLERY     ├───────┘
                  │     STAIRS DOWN ↓     │
                  └───────────────────────┘
                           SOUTH ↓
```
## Frozen canvas
1440 × 1800 px, orthographic top-down, north up, logical 120px = 5ft. Unpainted grid. Central void is nonwalkable; gallery wraps all four sides.
## Doorway geometry
- West/NW at (280,625) → H-U04 Parents Bedroom (ordinary)
- West/SW at (280,1450) → H-U01 Nursery (ordinary)
- East/NE at (1160,625) → H-U05 Sophia Bedroom (locked, Old Iron Key)
- East/SE at (1160,1450) → H-U03 Guest Bedroom (ordinary)
- North (720,260) → H-A01 attic hatch (Ladder Hook)
- South (720,1560) → H-G06 existing Great Room stair
## Rendering constraints
Full map should visually include four doors in exterior walls, wood balcony railing around open atrium, a clear attic hatch, and stone/wood stair treads. No text or spoilers. Avoid using a standalone empty rectangular room.
## Gates
PREPARE ✓ packet created. STRUCTURAL_RENDER pending. STRUCTURAL_INSPECT pending. FEATURE_MANIFEST, PAINT_RENDER, FINAL_INSPECT, BUILD, INJECT, VERIFY not yet passed.
