# Prime Arachnid Boss Engine

## Start-up

1. Open **The Ascendency - The Spider's Web** in the Ballad of Chauser Bill world.
2. As GM, open **Region Controls → Prime Arachnid Boss Engine**.
3. For a fresh run, press **Reset Encounter**, then **Start / Resume**.
4. Keep the panel open. The GM still chooses the Arachnid's actions, bonus actions, legendary actions, lair actions, and movement. The engine owns objective state, listeners, damage-over-time effects, countdowns, dialogue, and phase changes.

If the six supplied Regions are present, starting the encounter automatically recognizes them by ID. If any are missing, use **Create missing default Regions**, then select a Region and assign its station button in the panel.

## Balance target

The actors are tuned as a high-end, multi-stage set piece rather than as two ordinary monsters placed beside six characters:

- **Prime Arachnid:** CR 22 label, AC 21, 720 chassis HP, and 500 Aegis temporary HP.
- **Prime Directive:** CR 16 label, AC 19, 360 HP. She is a control-and-defense duelist, not a second full raid boss; Protocol Body prevents a premature kill during Convergence.
- **Final Overdrive:** one 720-HP burn with three escalating rounds, followed by Critical Failure, Breach, and Strike Core. There is no six-segment HP reset loop.

The 500-point shell is deliberately a short opening breach. At the party's observed 210-damage nova, it takes roughly two to three strong rounds to break before hit chance, movement, saves, and defensive play. The six-station puzzle phase supplies the encounter's meaningful objective time rather than another invisible HP wall. The 720-point final burn is intended to last about three strong rounds for this group.

Official 2014 encounter guidance treats CR as a rough comparison to four characters of the same level and gives six level-14 characters a **Deadly** threshold of 34,200 XP. The same table places a CR 21 monster at 33,000 XP and a CR 22 monster at 41,000 XP. This encounter exceeds a normal single-monster fight through objectives, lair pressure, and a second controlled antagonist, so the engine uses phase gates and listener safeguards instead of multiplying every damage number. See [D&D Beyond's encounter-building rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/building-combat-encounters).

## Region layout and puzzle ownership

There are eight encounter Regions:

- **Puzzle Regions 1–3:** Redirect/Laser Grid stations for Sprocket.
- **Puzzle Regions 4–6:** Timing Dial stations for Dalton.
- **LINK Console:** a correction and saturation station during Convergence.
- **Directive Arena:** the area used to record Tactal's Anchor.

The supplied IDs map as follows:

- Directive Arena: `DAAcwdFDK4BppT77`
- LINK Console: `21M2oB7126UNEZQQ`
- Redirect 1–3: `NNLo6Bjqfusytowo`, `JwmzKdyx3x5jNXcF`, `UGi0eciKevUZQA57`
- Timing 1–3: `jsJysJkoA2iQBtmI`, `CaGvQBGXR0Xe6AGs`, `oXvK8e5rkGWerA5z`

The six supplied puzzle Region IDs are preserved. During Reactive Plating, the engine draws pulsing cyan arrows for Redirect stations and gold arrows for Timing stations. A Region entry announces the active station and its assigned player, but does not falsely mark a puzzle complete. The actual Laser Grid and Timing Dial success listeners call `completePuzzle` with the matching Door.

To bind the puzzles:

1. Select one configured Laser Grid Door.
2. In the panel, press **Selected Door → Redirect 1**, then repeat for Redirect 2 and Redirect 3.
3. Select one configured Timing Dial Door.
4. Bind it to **Timing 1**, then repeat for Timing 2 and Timing 3.

The manual station buttons are a GM correction/test path. They do not run during normal player play unless the GM deliberately uses them.

## Phase flow

### 1. Shielded — Aegis shell

The Arachnid starts with 500 temporary HP. The party attacks normally. The engine mirrors the shell's temporary HP and prevents accidental chassis damage while the shell is still active. When temporary HP reaches 0, the listener immediately starts Phase 2, posts the Prime Directive's mechanic directions, and displays the six pulsing station arrows.

### 2. Reactive Plating — six simultaneous objectives

The party splits into the intended groups:

- Two characters distract the Prime Directive.
- Sprocket and one ally complete the three Redirect/Laser Grid stations.
- Dalton and one ally complete the three Timing Dial stations.

While plating is online, Arachnid HP damage is restored automatically. Each successful puzzle marks exactly one station. Duplicate puzzle callbacks are ignored. After all six stations are complete, plating turns off and the Lawson/Aleister Core Vent weakness is exposed immediately.

### 3. Weakness Exposure — Lawson/Aleister window

The exposed weakness is a short, explicit attack window. The engine keeps it open for the current round, posts the mechanic direction, and automatically begins Convergence on the next combat-round advance. This gives Lawson and Aleister the promised moment without adding a hidden ten-round gate.

### 4. Separation / Convergence — Andrew and Tactal 2v1

The Prime Directive strikes Andrew and throws him into a pocket dimension; Tactal follows. The remaining four characters pressure the Arachnid while the two-player duel proceeds.

1. Arachnid damage contributes LINK LOAD, capped at 30 per round.
2. Andrew forces **Vector Evasion** to be spent.
3. Tactal uses **Anchor Directive**.
4. LINK saturation plus Vector Evasion plus Anchor exposes the transmitter for one round.
5. Andrew's qualifying precision/finesse activity automatically severs the transmitter.

The LINK Console and **+ LINK LOAD** control remain available as GM correction tools. The engine does not require repeated transmitter HP stages.

### 5. Frenzy → Final Overdrive

Severing the transmitter immediately collapses the pocket and starts a one-round autonomous Frenzy. On the next round, the Prime Directive reboards, remote convergence is permanently offline, and the Arachnid enters a three-round Final Overdrive. No plating returns, no shields are restored, and no thermal segment reset occurs.

The Arachnid's 720 chassis HP is fully vulnerable. Round 1/3, 2/3, and 3/3 are announced in the panel; the GM continues running its normal combat turn.

### 6. Critical Failure → Breach → Destroyed

When the Arachnid reaches 0 HP in Overdrive, the actor listener automatically starts Critical Failure. Tactal's Breach activity listener opens the core and starts the structural-collapse clock. Andrew's qualifying precision activity listener then performs the final Strike Core transition.

The last engine narration is the Prime Arachnid's destruction and the Prime Directive tumbling from the explosion, armor broken and shattered, exposing the person beneath. No post-fight Tessa dialogue is generated.

## Actor controls

The Prime Arachnid sheet is divided into the requested categories:

- **Actions:** six named weapons.
- **Bonus Actions:** Weapon System Cycling and Targeting Sweep.
- **Legendary Actions:** Needle Burst (1), Arc Pulse (1), and Servo Lock (2), with three points.
- **Lair Actions:** Relay Arc, Vent Steam, and Containment Shift, selected once per initiative-20 turn.

The Prime Directive has Actions, Bonus Actions, Reactions, and passive objective features, but no legendary-action economy. Her threat comes from mobility, predictive defense, Vector Evasion, and the Anchor/Sever objective.

## Automated safeguards

- Temporary-HP depletion activates Reactive Plating exactly once.
- Player-side Region and puzzle callbacks route to the active GM over the Boss Engine socket; players never write Scene state directly.
- Shielded and Reactive Plating damage cannot leak into chassis HP.
- Each puzzle station can complete only once; six callbacks cannot overcount.
- Puzzle success exposes the weakness automatically after the sixth station.
- Weakness advances to Convergence on the next round without a stale 8-round gate.
- LINK load has a per-round cap and a one-round saturation window.
- Anchor expires if the window passes; transmitter exposure is not permanent.
- Protocol Body prevents a Convergence HP kill of the Prime Directive.
- Andrew's qualifying precision activity automatically severs the transmitter or strikes the core in the correct phase.
- Tactal's breach activity automatically opens the final core objective.
- Registered DOT effects tick on round advancement.
- Lair actions never restore HP, shell, plating, or final progress.
- All state is stored on the active Scene under `regionwright.bossEngine`.

## Reset procedure

Press **Reset Encounter** before each new attempt. It restores both actors, clears the six puzzle completions, removes phase timers and pocket state, and returns the Arachnid to its 500 temporary-HP shell. Then press **Start / Resume**.
