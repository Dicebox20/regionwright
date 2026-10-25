# Cabin in the Ashen Veil — Dimensioned Architectural Blueprint v1

**Status:** PROPOSED / WORKING architectural design; draft intended for owner review, not approved campaign dimensions, authoritative Spatial Blueprint, Foundry scene, runtime test or approved render. **Source:** owner requested a real physical house blueprint supporting map construction, player navigation, and an altered in-world house plan kept in the Great Room. This initial dimensioned proposal is a deliberate new architectural choice, not an attempt to revive the retired historical 29-map plan.

## Structural concept

Build an **asymmetrical, carefully extended family lodge** around a **double-height Great Room**, with a walkable upstairs gallery looking down into it. The central home is 76 ft wide (west–east) and 52 ft deep (south–north), with a west study/bedroom bay, two east wing projections and a north Great Room hearth/chimney bay. The full irregular ground extent is x = -10 to 90 ft and y = 0 to 57 ft; a 20 × 7 ft porch extends south. These numbers are **proposed**, not supplied by the owner or approved to replace the discarded historical 90 × 60 ft sketch.

**Coordinate convention:** North is up. The southwest corner of the main 76 × 52 ft rectangle is (0,0); x increases east and y north. Dimensions are feet. Exterior wall nominal 1 ft and interior partitions 0.6 ft are **render intent**, not yet inset wall solids. These editable footprints/portal centers can seed the required Dicebox Feature Manifest but cannot be used to mutate Foundry before structural inspection and authorized BUILD.

**Why the Great Room matters:** Entry via the Foyer goes directly to the Great Room (south), Allen’s locked Study branches west, and Dahlia’s accessible Studio branches east. A prominent physical drawing table sits in the Great Room (38,25.5). Family portraits and the distinct `027` box remain visible. The upper gallery overlooks this central space, so returning here feels natural both geographically and narratively.

## Rendered proposal

- [Four-level overview PNG](./ashen_house_blueprint_overview_v1.png)
- [Ground image](./ashen_house_ground_v1.png) · [Editable SVG](./ashen_house_ground_v1.svg)
- [Upper image](./ashen_house_upper_v1.png) · [Editable SVG](./ashen_house_upper_v1.svg)
- [Basement image](./ashen_house_basement_v1.png) · [Editable SVG](./ashen_house_basement_v1.svg)
- [Attic Roof image](./ashen_house_attic_roof_v1.png) · [Editable SVG](./ashen_house_attic_roof_v1.svg)
- [Structured proposed coordinates, doors, windows, stairs and reachability tests](./ashen_house_blueprint_geometry_v1.json)

## Room schedules (each actual traversable room is a separate Foundry Scene)

### Ground

| Scene concept | Room | Approx. area | Narrative or puzzle role |
|---|---|---:|---|
| `H-G01` | Dining Room *(story-room proposal)* | 384 ft² | Dining table, household place settings |
| `H-G02` | Foyer | 448 ft² | Grandfather clock, two separate stair flights |
| `H-G03` | Kitchen *(story-room proposal)* | 384 ft² | Family worktable, warm hearth |
| `H-G04` | Pantry *(story-room proposal)* | 224 ft² | Dry stores, shelves |
| `H-G05` | Allen’s Study | 1,064 ft² | Rufus—both eyes missing, 587 note |
| `H-G06` | Great Room | 1,108 ft² | Blueprint displayed on table, 027 combination box |
| `H-G07` | Dahlia’s Art Studio | 864 ft² | Empty-mirror vanity, painting containing 027 clue |
| `H-G08` | Hidden Candle Workshop | 308 ft² | wick, wax trays |

### Upper

| Scene concept | Room | Approx. area | Narrative or puzzle role |
|---|---|---:|---|
| `H-U01` | Unused Nursery *(story-room proposal)* | 384 ft² | Empty cradle, carefully folded linens |
| `H-U02` | Upper Gallery / Landing | 898 ft² | Stair arrival, attic pull-down hatch |
| `H-U03` | Guest Bedroom *(story-room proposal)* | 384 ft² | Spare bed, worn suitcase |
| `H-U04` | Parents’ Bedroom | 1,064 ft² | Coat with Old Iron Key, broken nightstand—Gate Handle |
| `H-U05` | Sophia’s Bedroom | 864 ft² | Stuffed bear—first Rufus eye, six-book Spine Mosaic |
| `H-U06` | Spine Mosaic Hidden Room | 308 ft² | Gond emblem half, hidden bookshelf entrance |

### Basement

| Scene concept | Room | Approx. area | Narrative or puzzle role |
|---|---|---:|---|
| `H-B01` | Allen’s Workshop | 1,456 ft² | Weathered-Key stairs from Foyer, repair benches |
| `H-B02` | Secured Vault | 624 ft² | Four-input lock mechanism, Keystone display |

**Upper floor structural requirement:** The gallery uses the perimeter of the Great Room volume; its middle (x=29..47, y=16..47) is **OPEN TO BELOW**, not an upper-floor room with a duplicate floor. Side passage widths are **5 ft**, with a north gallery joining them. The Study’s west bay aligns beneath the Parents’ Bedroom bay. The east Candle Workshop and Spine Hidden Room occupy **the same x=76..90, y=30..52 wing footprint on successive stories**; they do not overlap rooms on their own floor. A solid floor separates the two secret rooms unless a later campaign decision adds a link.

**Basement design:** This is a **partial** below-grade footprint, not an automatic basement beneath the whole house. A direct foyer-to-workshop stair reaches the Workshop; the guarded Vault branches east and yields the **Keystone**, not the Bowl. Other earth under the house remains unexcavated rather than creating unsupported extra basements, crypts or rooms. The Undercroft remains accessed from the Grove and is not secretly connected to this basement.

## Door, stair, and route ledger

| Route ID | Connection | Gate | Proposed midpoint (ft) |
|---|---|---|---|
| `P-EXT-FOYER` | Carriage Yard exterior ↔ Foyer | regular | `[38, 0]` |
| `P-FOYER-GREAT` | Foyer ↔ Great Room | regular | `[38, 16]` |
| `P-FOYER-DINING` | Foyer ↔ Dining Room | regular | `[24, 8]` |
| `P-FOYER-KITCHEN` | Foyer ↔ Kitchen | regular | `[52, 8]` |
| `P-GREAT-STUDY` | Great Room ↔ Allen’s Study | locked:BrassStudyKey | `[24, 34]` |
| `P-GREAT-STUDIO` | Great Room ↔ Dahlia’s Art Studio | regular | `[52, 34]` |
| `P-KITCHEN-PANTRY` | Kitchen ↔ Pantry | regular | `[76, 8]` |
| `P-STUDIO-CANDLE` | Dahlia’s Art Studio ↔ Hidden Candle Workshop | hidden:PrayerProtection | `[76, 41]` |
| `P-UPPER-NURSERY` | Upper Gallery / Landing ↔ Unused Nursery | regular | `[24, 8]` |
| `P-UPPER-GUEST` | Upper Gallery / Landing ↔ Guest Bedroom | regular | `[52, 8]` |
| `P-UPPER-PARENTS` | Upper Gallery / Landing ↔ Parents’ Bedroom | regular | `[24, 34]` |
| `P-UPPER-SOPHIA` | Upper Gallery / Landing ↔ Sophia’s Bedroom | locked:OldIronKey | `[52, 34]` |
| `P-SOPHIA-SPINE` | Sophia’s Bedroom ↔ Spine Mosaic Hidden Room | hidden:SixBooks | `[76, 41]` |
| `P-WORKSHOP-VAULT` | Allen’s Workshop ↔ Secured Vault | locked:FourVaultInputs | `[52, 38]` |
| `V-FOYER-UPPER` | Foyer ↔ Upper Gallery / Landing | regular | `[43, 8]` |
| `V-FOYER-BASEMENT` | Foyer ↔ Allen’s Workshop | WeatheredKey | `[31, 8]` |
| `V-UPPER-ATTIC` | Upper Gallery / Landing ↔ Attic Storage | LadderHook | `[38, 49]` |
| `V-UPPER-ROOF` | Parents’ Bedroom ↔ Roof and Chimney | regular | `[12, 52]` |

**Stair alignment:** Both up and down stair starts are in the Foyer, but they occupy distinct footprints. Upper stair reaches central Upper Landing; basement stair reaches Allen’s Workshop behind the existing Weathered-Key gate. Attic access remains through a pull-down ladder requiring the Ladder Hook. Proposed roof entry uses the **north window of the Parents’ Bedroom**; the chimney clock is on the north Great Room hearth projection. Roof clearances and stair rise/landings still require a real section/elevation check before render.

## In-world Great Room blueprint: three linked products, one geometry

1. **BP-1 Master (this file + JSON/SVG):** True architectural polygons, complete wing, hidden Candle and Spine rooms, actual door coordinates. Keep secret annotations GM-only.
2. **BP-2 Scene Connection Plan:** Derive from the portal table in JSON, including stable logical room IDs, vertical stair links, item gates, secret transition reveal and eventually authorized Foundry Scene IDs. Don’t fake runtime UUIDs.
3. **BP-3 Player Handout (LATER):** A believable aged construction drawing left displayed on the Great Room table. Show real exterior silhouette and normal room proportions, but **erase and redraw part of the east wing beside Dahlia’s Studio**. A heavy, suspiciously revised east-wall line hides the Candle Workshop volume; faint overwritten measurements hint that the north wall is thicker than it should be. The upstairs version subtly misaccounts for the Spine Mosaic Room directly above that same wing. Use erasures, parchment wear, occasional pencil geometry and Allen’s drafting hand — **not** game labels such as “secret door.”

**The clue must be fair:** Physical external structure/measurements and the actual room artwork need to agree with BP-1, while player handout BP-3 intentionally differs. Players who compare their explored Studio walls, house exterior, and erased drawing can infer concealed volume. In the final handout, the lies must be intentional source-canon deltas and should not accidentally move entire occupied rooms.

**Physical placement in Great Room:** The house plan is placed on a robust family drafting table around (38,25.5) ft, distinct from the Great Room `027` lockbox at approximately (27,26) ft. It should be visible on the map as an identifiable paper/map, but the handwriting and erased lines belong in a **separate inspectable journal/handout**, not illegible pixels. The master geometry remains unedited as the player image is aged/annotated.

## Access-chain safeguards

| Test | Result in proposed route graph |
|---|---|
| Studio accessible from Foyer before Brass Study Key | **PASS** |
| Study inaccessible before Brass Study Key | **PASS** |
| Sophia Bedroom locked before Old Iron Key | **PASS** |
| Candle Workshop unavailable before Prayer of Protection | **PASS** |
| Spine Hidden Room unavailable before books solved | **PASS** |
| Workshop/Vault not available from Foyer without Weathered Key and four Vault inputs | **PASS** |
| Room polygons on each floor have no positive-area overlap | **PASS** |
| Basement under footprint / upper concealed wing directly above lower concealed wing | **PASS** (coordinate check) |
| Roof access safe; stairs fit structural elevations; Foundry transitions | **UNVERIFIED** |

## What is still intentionally provisional

- **Five additional story rooms are included only as architectural proposals**: Dining Room, Kitchen, Pantry, Unused Nursery and Guest Bedroom. The existing questline-only 31 logical-location estimate remains unchanged as controlling *questline* scope; adopting all five as standalone traversable scenes would produce an estimated **36 logical locations**, before unrelated optional chambers or stage variants. This is not a target or authorization to resurrect the retired 29-map roster.
- The Cabin’s true facade width/height is not measured from the owner-supplied exterior reference; the 76×52 ft core / irregular wings are a viable candidate only. Check against the approved estate grounds illustration before committing a real Spatial Blueprint.
- Gallery rail height, fireplace chimney run, beam supports, load paths, structural wall thickness, staircase rise and clear width, actual glazing/door swings, and accessibility need further technical reconciliation.
- The player-facing plan is **not made yet**. The two hidden rooms are shown plainly here on purpose; this is the GM/build variant.
- Room-scale render/interaction design still follows Dicebox `PREPARE → STRUCTURAL_RENDER → STRUCTURAL_INSPECT → FEATURE_MANIFEST/Spatial Blueprint → PAINT_RENDER → FINAL_INSPECT → BUILD → STAGE → INJECT → VERIFY → RECEIPT`, including separate stateful visual fixtures and no retroactive approval of unverified Foundry behavior.

**Next bounded decision:** Decide whether this irregular footprint and double-height Great Room are the right architectural direction. If so, validate the five story rooms and measured shell against the approved grounds map, refine the stair sections and final structural blueprint. BP-3 player handout follows BP-1 structural approval; it must not become the geometry authority.