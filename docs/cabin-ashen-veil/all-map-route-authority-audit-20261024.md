# All-map route authority audit — 2026-10-24

- Current Foundry: 32 scenes; prior inventory 20 Regions, plus 3 new and 2 teleport behaviors from verified Foyer/Great Room installation.
- Owner-approved battlemap package is visual reference, not doorway metadata.
- cabin-ashen-veil-edges.json contains 
34
 proposed older graph edges, but uses superseded scene IDs. Exact current-ID endpoint matching: 
0
.
- The current narrative retains story locks (Weathered Key basement; late vault; Sune undercroft). Bypassing those via unguarded teleports would be a progression error.
- EXT-01 Privy Approach is a real Region (CAV01R0000000007); EXT-04 Privy exists without a reciprocal Region. Its map has no verified entrance orientation or return landing target.
- Next implementation requires inspecting each accepted actual map or authoritative later handoff to identify source doorway, destination entrance and disjoint landing area before writing.
- Foyer/Great Room pair is installed, config verified; actual token traversal still not tested.
- No speculative route writes made in this pass.
