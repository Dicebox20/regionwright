import { MODULE_ID } from "./constants.js";

export const BOSS_ENGINE_FLAG = "bossEngine";
export const BOSS_ENGINE_VERSION = 5;
export const BOSS_ENGINE_SOCKET = `module.${MODULE_ID}`;

export const PRIME_ARACHNID_NAME = "The Prime Arachnid";
export const PRIME_DIRECTIVE_NAME = "The Prime Directive";

const ROLES = Object.freeze({
  CORE: "core",
  PUZZLE_NODE: "puzzle-node",
  SHIELD_NODE: "shield-node",
  LINK_CONSOLE: "link-console",
  DIRECTIVE_ARENA: "directive-arena"
});

const PHASES = Object.freeze({
  SHIELDED: "shielded",
  REACTIVE_PLATING: "reactive-plating",
  WEAKNESS_EXPOSURE: "weakness-exposure",
  SEPARATION: "separation",
  FRENZY: "frenzy",
  OVERDRIVE: "overdrive",
  CRITICAL_FAILURE: "critical-failure",
  BREACH_OPEN: "breach-open",
  DESTROYED: "destroyed"
});

const PUZZLE_KINDS = Object.freeze({ REDIRECT: "redirect", TIMING: "timing" });
const WEAKNESS_PIN_DCS = Object.freeze([17, 18, 19, 20, 21, 22, 23, 24, 25]);

const SRD_ICONS = Object.freeze({
  shield: "systems/dnd5e/icons/svg/checked-shield.svg",
  weapon: "systems/dnd5e/icons/svg/items/weapon.svg",
  force: "systems/dnd5e/icons/svg/damage/force.svg",
  piercing: "systems/dnd5e/icons/svg/damage/piercing.svg",
  lightning: "systems/dnd5e/icons/svg/damage/lightning.svg",
  fire: "systems/dnd5e/icons/svg/damage/fire.svg",
  bludgeoning: "systems/dnd5e/icons/svg/damage/bludgeoning.svg",
  slashing: "systems/dnd5e/icons/svg/damage/slashing.svg",
  psychic: "systems/dnd5e/icons/svg/damage/psychic.svg",
  marked: "systems/dnd5e/icons/svg/statuses/marked.svg",
  restrained: "systems/dnd5e/icons/svg/statuses/restrained.svg",
  dexterity: "systems/dnd5e/icons/svg/abilities/dexterity.svg",
  flying: "systems/dnd5e/icons/svg/statuses/flying.svg",
  dodging: "systems/dnd5e/icons/svg/statuses/dodging.svg",
  cycling: "systems/dnd5e/icons/svg/facilities/change.svg",
  utility: "systems/dnd5e/icons/svg/activity/utility.svg"
});

const DEFAULT_CONFIG = Object.freeze({
  puzzleCount: 6,
  redirectPuzzleCount: 3,
  timingPuzzleCount: 3,
  initialShieldTempHp: 500,
  arachnidHp: 720,
  arachnidAc: 21,
  arachnidCr: 22,
  directiveHp: 360,
  directiveAc: 19,
  directiveCr: 16,
  linkLoadMax: 100,
  linkLoadPerRoundCap: 30,
  linkLoadPerConsoleEntry: 25,
  linkSaturationRounds: 1,
  vectorCharges: 3,
  anchorDC: 18,
  transmitterWindowRounds: 1,
  frenzyRounds: 1,
  finalOverdriveRounds: 3,
  structuralCollapseRounds: 3,
  dot: Object.freeze({ name: "Core Vent Burn", formula: "2d8", type: "fire" }),
  narration: Object.freeze({
    start: "The Prime Arachnid wakes. Six weapon systems unfold around a sealed, pulsing core.",
    shieldDown: "The Aegis shell ruptures. The machine is still standing, but its reactive plating has taken over.",
    platingDisabled: "All six puzzle locks fail at once. Reactive Plating is offline. The Lawson/Aleister weakness window is open.",
    separation: "CONVERGENCE PROTOCOL. The Prime Directive strikes Andrew McConaughey and throws him into a folding pocket dimension. Tactal follows through the closing tear.",
    linkSaturated: "CONVERGENCE LINK: SATURATED. The transmitter phases into physical space.",
    vectorSpent: "VECTOR EVASION: SPENT. The Prime Directive has committed to the duel.",
    anchor: "The Prime Directive stutters. Tactal's grip pins the suit's vector field in place.",
    transmitter: "The transmitter housing opens. One clean precision strike can sever the link.",
    frenzy: "CONVERGENCE LINK: SEVERED. REMOTE CONTROL: LOST. AUTONOMOUS COMBAT PROTOCOL: ACTIVE.",
    overdrive: "LOCAL PILOT CONTROL RESTORED. The Prime Directive reboards the Arachnid. Defensive governors remain offline.",
    criticalFailure: "PRIME ARACHNID — CRITICAL FAILURE. Weapons die. Emergency armor locks around the failing core.",
    breachOpen: "BREACH OPEN. Tactal tears the emergency armor apart and holds the core open.",
    destroyed: "The Prime Arachnid ruptures from the core outward. The Prime Directive tumbles from the explosion, armor broken and shattered, exposing the real person beneath."
  }),
  transitionDialogue: Object.freeze({
    [PHASES.SHIELDED]: Object.freeze([
      Object.freeze({ speaker: "The Prime Directive", text: "You're as stubborn as Thri-kreen." }),
      Object.freeze({ speaker: "The Prime Directive", text: "I'll simply need a bigger boot to stamp you out. Perhaps this one will be sufficient." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Do try to entertain me for a little while. After all, you've come all this way. I would hate for it to be a waste of my time." })
    ]),
    [PHASES.REACTIVE_PLATING]: Object.freeze([
      Object.freeze({ speaker: "Overhead Intercom", text: "Attention. Preliminary defenses have been breached. Activating primary measures." }),
      Object.freeze({ speaker: "Overhead Intercom", text: "Reactive plating activated. Primary defenses are now in place." }),
      Object.freeze({ speaker: "Overhead Intercom", text: "You may proceed with your death." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Would you look at that? I planned for you getting through my shield." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Go ahead. Hit me as hard as you can. I assure you, you'll enjoy the result." })
    ]),
    [PHASES.WEAKNESS_EXPOSURE]: Object.freeze([
      Object.freeze({ speaker: "The Prime Directive", text: "Come now, Lawson." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Surely even you understand that I would take countermeasures against your signature weapon." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Even an idiot would know to do that." })
    ]),
    [PHASES.SEPARATION]: Object.freeze([
      Object.freeze({ speaker: "The Prime Directive", text: "You think this is over, McConaughey? It's only just begun." })
    ]),
    [PHASES.FRENZY]: Object.freeze([
      Object.freeze({ speaker: "The Prime Directive", text: "Ha ha ha ha." })
    ]),
    [PHASES.OVERDRIVE]: Object.freeze([
      Object.freeze({ speaker: "The Prime Directive", text: "Ha ha ha ha." }),
      Object.freeze({ speaker: "The Prime Directive", text: "At the very least, you're self-aware idiots." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Let's make this a race. Either you kill me, or I kill you." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Good luck to us both." })
    ]),
    [PHASES.CRITICAL_FAILURE]: Object.freeze([]),
    [PHASES.BREACH_OPEN]: Object.freeze([]),
    [PHASES.DESTROYED]: Object.freeze([])
  }),
  transitionScrollingText: Object.freeze({
    [PHASES.SHIELDED]: Object.freeze([
      "The Prime Directive stands atop the massive metal arachnid, watching as the crew take their places. Her disdain is clear even through the machine's mechanical eyes.",
      "She lifts the hatch leading into the cockpit of the enormous mech and lowers herself into the tunnel below.",
      "The enormous arachnid blinks to life. Lights ignite across its frame like a marquee, gears begin to turn, chains pull taut, and massive mechanical legs rise on steam-powered pistons."
    ]),
    [PHASES.REACTIVE_PLATING]: Object.freeze([
      "With a dull hum, the protective shield surrounding the massive arachnid begins to dissipate. The shimmering field flickers several times before finally collapsing.",
      "Across the Prime Arachnid, hundreds of small hexagonal plates begin to hum. An unmistakable magical sheen spreads across them, one section at a time, until the entire machine glistens like light reflecting from the surface of water.",
      "Whatever has just activated, it is clearly dangerous."
    ]),
    [PHASES.WEAKNESS_EXPOSURE]: Object.freeze([
      "Once the final terminal is disabled, the magical sheen coating the Prime Arachnid begins to disappear.",
      "The reactive armor immediately starts rearranging itself to compensate for the sudden loss of protection. Plates slide, rotate, overlap, and reposition across the mech's enormous frame.",
      "For only a fraction of a second, an exposed section of circuitry appears between the shifting armor plates.",
      "A small armor plate snaps upward and intercepts the shot. The movement is so fast that it is nearly imperceptible.",
      "Every defensive plate is mobile. Gears twist, chains pull, hinges rotate, and mechanical sections constantly reposition themselves. The pins holding those mechanisms together are the key to opening a clean shot."
    ]),
    [PHASES.SEPARATION]: Object.freeze([
      "The final shot rings out. Matilda's corrosive ammunition strikes the exposed circuitry and the mechanism begins to dissolve.",
      "The entire Prime Arachnid shudders as though an enormous weight has slammed down upon it. Sparks explode between its joints, molten slag tumbles across the floor, and several armor plates hang loosely from their housings.",
      "The gears begin turning again. The machine is damaged, but it is still moving. For the first time, however, the Prime Arachnid is completely exposed.",
      "The hatch atop the Prime Arachnid suddenly opens. The metallic body of the Prime Directive rises into view. Something about her posture is different. Anger radiates from her.",
      "Energy erupts from the Prime Directive's jetpack. She launches at full speed as a portal tears open behind Andrew McConaughey.",
      "The Prime Directive strikes Andrew directly in the center of mass and carries both of them through the portal.",
      "Tactal leaps after them, but her strike misses. She tumbles through the closing portal behind them."
    ]),
    [PHASES.FRENZY]: Object.freeze([
      "The transmitter mounted to the back of the Prime Directive's helmet shatters. She screams as the Prime Arachnid violently shudders, its limbs locking and gears grinding to a halt.",
      "The enormous machine crashes to the ground, completely lifeless. A burst of energy erupts through the pocket dimension as the black space collapses.",
      "Andrew, Tactal, and the Prime Directive are violently ejected back into the main chamber and thrown across the floor. The crew rushes toward Andrew and Tactal.",
      "From somewhere behind them comes a familiar mechanical laugh."
    ]),
    [PHASES.OVERDRIVE]: Object.freeze([
      "The Prime Directive climbs back into the cockpit of the Prime Arachnid.",
      "The hatch slams shut. For several seconds, nothing happens. Then every light across the Prime Arachnid turns red.",
      "Its gears begin spinning faster. The mechanical hum rises into a piercing electrical whine, and the enormous eyes of the machine ignite with a blood-red glow.",
      "Every remaining weapon system locks onto the crew. The Prime Arachnid enters Final Overdrive."
    ]),
    [PHASES.CRITICAL_FAILURE]: Object.freeze([
      "The Prime Arachnid reaches critical failure. Weapons die as emergency armor locks around a core that is tearing itself apart."
    ]),
    [PHASES.BREACH_OPEN]: Object.freeze([
      "The emergency armor splits open. The failing core is exposed, unstable, and ready for one final strike."
    ]),
    [PHASES.DESTROYED]: Object.freeze([
      "The Prime Arachnid ruptures from the core outward. The Prime Directive tumbles from the explosion, her armor broken and shattered, exposing the real person beneath."
    ])
  }),
  eventDialogue: Object.freeze({
    receiverRevealed: Object.freeze([
      Object.freeze({ speaker: "The Prime Directive", text: "Ha. Ha. Ha. Ha. Ha." }),
      Object.freeze({ speaker: "The Prime Directive", text: "Why do you think I allied with the Illithid?" }),
      Object.freeze({ speaker: "The Prime Directive", text: "For fun?" }),
      Object.freeze({ speaker: "The Prime Directive", text: "You know what? Screw you, Sprocket." })
    ])
  })
});

const LAIR_ACTIONS = Object.freeze({
  relayArc: "Lair Relay Arc: one active puzzle room discharges. Resolve a DC 18 Dexterity save for creatures in the selected room; an offline puzzle room is harmless.",
  ventSteam: "Lair Vent Steam: creatures in a selected 15-foot zone resolve a DC 18 Constitution save or take 2d8 fire damage and Core Vent Burn at the start of their next turn.",
  containmentShift: "Lair Containment Shift: bulkheads and webbing reconfigure one route until the start of the next round. Add cover or force a detour; never remove a character from the encounter."
});

// These are the six Regions supplied by the GM. Their role is assigned by
// station number: 1–3 are Sprocket's Redirect stations; 4–6 are Dalton's
// Timing stations.
const KNOWN_PUZZLE_REGION_IDS = Object.freeze({
  NNLo6Bjqfusytowo: { index: 1, kind: PUZZLE_KINDS.REDIRECT, owner: "Sprocket" },
  JwmzKdyx3x5jNXcF: { index: 2, kind: PUZZLE_KINDS.REDIRECT, owner: "Sprocket" },
  UGi0eciKevUZQA57: { index: 3, kind: PUZZLE_KINDS.REDIRECT, owner: "Sprocket" },
  jsJysJkoA2iQBtmI: { index: 4, kind: PUZZLE_KINDS.TIMING, owner: "Dalton" },
  CaGvQBGXR0Xe6AGs: { index: 5, kind: PUZZLE_KINDS.TIMING, owner: "Dalton" },
  oXvK8e5rkGWerA5z: { index: 6, kind: PUZZLE_KINDS.TIMING, owner: "Dalton" }
});

const KNOWN_SPECIAL_REGION_IDS = Object.freeze({
  DAAcwdFDK4BppT77: { role: ROLES.DIRECTIVE_ARENA },
  "21M2oB7126UNEZQQ": { role: ROLES.LINK_CONSOLE }
});

const DEFAULT_REGION_LAYOUT = Object.freeze([
  { role: ROLES.PUZZLE_NODE, index: 1, kind: PUZZLE_KINDS.REDIRECT, owner: "Sprocket", name: "Prime Arachnid — Redirect Node 1", x: 975, y: 1350, width: 300, height: 250 },
  { role: ROLES.PUZZLE_NODE, index: 2, kind: PUZZLE_KINDS.REDIRECT, owner: "Sprocket", name: "Prime Arachnid — Redirect Node 2", x: 975, y: 2200, width: 300, height: 250 },
  { role: ROLES.PUZZLE_NODE, index: 3, kind: PUZZLE_KINDS.REDIRECT, owner: "Sprocket", name: "Prime Arachnid — Redirect Node 3", x: 1000, y: 3000, width: 350, height: 250 },
  { role: ROLES.PUZZLE_NODE, index: 4, kind: PUZZLE_KINDS.TIMING, owner: "Dalton", name: "Prime Arachnid — Timing Node 1", x: 3300, y: 1150, width: 350, height: 250 },
  { role: ROLES.PUZZLE_NODE, index: 5, kind: PUZZLE_KINDS.TIMING, owner: "Dalton", name: "Prime Arachnid — Timing Node 2", x: 3450, y: 1800, width: 300, height: 250 },
  { role: ROLES.PUZZLE_NODE, index: 6, kind: PUZZLE_KINDS.TIMING, owner: "Dalton", name: "Prime Arachnid — Timing Node 3", x: 3300, y: 2800, width: 350, height: 300 },
  { role: ROLES.LINK_CONSOLE, name: "Prime Arachnid — LINK Console", x: 2100, y: 1000, width: 600, height: 150 },
  { role: ROLES.DIRECTIVE_ARENA, name: "Prime Arachnid — Directive Arena", x: 1750, y: 1550, width: 1300, height: 1100 }
]);

const ACTOR_SPECS = Object.freeze({
  arachnid: Object.freeze({
    name: PRIME_ARACHNID_NAME,
    role: "prime-arachnid",
    img: "icons/svg/robot.svg",
    type: "npc",
    system: {
      abilities: { str: { value: 24 }, dex: { value: 16 }, con: { value: 24 }, int: { value: 18 }, wis: { value: 16 }, cha: { value: 14 } },
      attributes: { ac: { value: 21 }, hp: { value: 720, max: 720, temp: 500, tempmax: 500 }, init: { ability: "dex", bonus: 7 }, movement: { walk: 40, climb: 40 }, prof: 7 },
      resources: { legact: { max: 3, spent: 0 }, legres: { max: 0, spent: 0 }, lair: { value: true, initiative: 20, inside: true } },
      details: { cr: 22, alignment: "Lawful Evil", type: { value: "construct", subtype: "mech" } },
      traits: { size: "huge", di: { value: ["poison", "psychic"] }, dr: { value: ["force"] }, ci: { value: ["charmed", "frightened"] }, languages: { value: ["common"], custom: "Prime Directive uplink" } }
    },
    items: [
      { name: "Aegis Shell — 500 Temporary HP", img: SRD_ICONS.shield, description: "The Prime Arachnid begins with a 500 temporary-hit-point Aegis shell. Damage removes the shell normally. When it reaches 0, the Boss Engine automatically begins Reactive Plating and activates the six puzzle stations.", activation: "special" },
      { name: "Reactive Plating — Six Puzzle Locks", img: SRD_ICONS.shield, description: "While Reactive Plating is active, HP damage to the Arachnid is redirected. Three Redirect/Laser Grid locks belong to Sprocket and three Timing Dial locks belong to Dalton. When all six are solved, plating turns off and the weakness is exposed.", activation: "special" },
      { name: "Weakness — Lawson/Aleister Core Vent", img: SRD_ICONS.force, description: "After all six puzzle locks are solved, the Core Vent is exposed. Lawson and Aleister can pressure the exposed weakness during this window before Convergence begins.", activation: "special" },
      { name: "Six-System Weapons Platform", img: SRD_ICONS.weapon, description: "The Prime Arachnid has six weapon systems. The GM controls its actions, bonus actions, legendary actions, and movement. The Boss Engine controls phase rules, damage-over-time effects, countdowns, and objective listeners.", activation: "special" },
      { name: "Duelist Tracking Lance", img: SRD_ICONS.force, description: "Melee or ranged weapon attack: +14 to hit, 3d10 + 8 force damage. On a hit, the target cannot benefit from invisibility until the end of its next turn.", activation: "action", actionType: "mwak", activityType: "attack", attackAbility: "str", attackBonus: "14", attackRange: "melee", formula: "3d10 + 8", damageType: "force" },
      { name: "Predator Needle Array", img: SRD_ICONS.piercing, description: "Ranged weapon attack: +14 to hit, 4d8 + 8 piercing plus 2d8 necrotic damage. Speed is reduced by 10 feet until the end of the target's next turn.", activation: "action", actionType: "rsak", activityType: "attack", attackAbility: "dex", attackBonus: "14", attackRange: "ranged", damageParts: [{ formula: "4d8 + 8", type: "piercing" }, { formula: "2d8", type: "necrotic" }] },
      { name: "Antimatter Breach Cannon", img: SRD_ICONS.force, description: "Recharge 5–6. 120-foot line; DC 20 Dexterity save. Failure: 10d10 force damage and a 15-foot push. Success: half damage and no push.", activation: "action", actionType: "save", activityType: "save", saveAbility: "dex", saveDC: "20", formula: "10d10", damageType: "force" },
      { name: "Runebound Arc Projector", img: SRD_ICONS.lightning, description: "Ranged weapon attack: +14 to hit, 5d10 lightning damage. The target is marked; the next Core Vent Burn tick against it deals +1d8 fire damage.", activation: "action", actionType: "rsak", activityType: "attack", attackAbility: "int", attackBonus: "14", attackRange: "ranged", formula: "5d10", damageType: "lightning" },
      { name: "Forgeheart Incinerator", img: SRD_ICONS.fire, description: "Recharge 4–6. 30-foot cone; DC 20 Dexterity save. Failure: 8d10 fire damage and Core Vent Burn. Success: half damage.", activation: "action", actionType: "save", activityType: "save", saveAbility: "dex", saveDC: "20", formula: "8d10", damageType: "fire" },
      { name: "Hydraulic Siege Hammer", img: SRD_ICONS.bludgeoning, description: "Melee weapon attack: +14 to hit, 5d12 + 8 bludgeoning damage. On a hit, DC 20 Strength save or prone.", activation: "action", actionType: "mwak", activityType: "attack", attackAbility: "str", attackBonus: "14", attackRange: "melee", formula: "5d12 + 8", damageType: "bludgeoning" },
      { name: "Weapon System Cycling", img: SRD_ICONS.cycling, description: "Bonus Action: rotate the active weapon system. The next weapon attack can be described as originating from a different limb or firing port.", activation: "bonus" },
      { name: "Targeting Sweep", img: SRD_ICONS.marked, description: "Bonus Action: mark one visible creature. The next Arachnid attack against that creature this turn ignores half cover.", activation: "bonus" },
      { name: "Legendary — Needle Burst", img: SRD_ICONS.piercing, description: "Legendary Action (1): make one reduced Predator Needle Array attack for 2d8 + 8 piercing damage.", activation: "legendary", cost: 1 },
      { name: "Legendary — Arc Pulse", img: SRD_ICONS.lightning, description: "Legendary Action (1): one creature within 60 feet makes a DC 20 Dexterity save, taking 2d10 lightning damage on a failure or half on a success.", activation: "legendary", cost: 1 },
      { name: "Legendary — Servo Lock", img: SRD_ICONS.restrained, description: "Legendary Action (2): one creature within 30 feet makes a DC 20 Strength save or its speed becomes 0 until the start of its next turn.", activation: "legendary", cost: 2 },
      { name: "Lair Actions — The Spider's Web", img: SRD_ICONS.utility, description: "At initiative count 20, choose one lair action. These actions create pressure without restoring shields, HP, or plating.", activation: "special" },
      { name: "Lair — Relay Arc", img: SRD_ICONS.lightning, description: "Choose an active puzzle room. Creatures in a 15-foot radius make a DC 20 Dexterity save, taking 2d8 lightning damage on a failure or half on success.", activation: "lair", activityType: "save", saveAbility: "dex", saveDC: "20", formula: "2d8", damageType: "lightning" },
      { name: "Lair — Vent Steam", img: SRD_ICONS.fire, description: "Choose a 15-foot zone. Creatures there make a DC 20 Constitution save, taking 2d8 fire damage on a failure or half on success. A failed save applies Core Vent Burn.", activation: "lair", activityType: "save", saveAbility: "con", saveDC: "20", formula: "2d8", damageType: "fire" },
      { name: "Lair — Containment Shift", img: SRD_ICONS.utility, description: "Reconfigure one route, bulkhead, or webbed lane until the start of the next round. This deals no damage and cannot remove a character from the encounter.", activation: "lair", activityType: "utility" }
    ]
  }),
  directive: Object.freeze({
    name: PRIME_DIRECTIVE_NAME,
    role: "prime-directive",
    img: "icons/svg/target.svg",
    type: "npc",
    system: {
      abilities: { str: { value: 16 }, dex: { value: 20 }, con: { value: 18 }, int: { value: 20 }, wis: { value: 16 }, cha: { value: 18 } },
      attributes: { ac: { value: 19 }, hp: { value: 360, max: 360 }, init: { ability: "dex", bonus: 8 }, movement: { walk: 40, fly: 60, hover: true }, prof: 6 },
      details: { cr: 16, alignment: "Lawful Evil", type: { value: "construct", subtype: "armored intelligence" } },
      traits: { size: "med", dr: { value: ["force", "psychic"] }, ci: { value: ["charmed", "frightened"] }, languages: { value: ["common"], custom: "all languages through the uplink" } }
    },
    items: [
      { name: "Protocol Body — Convergence", img: SRD_ICONS.shield, description: "During Separation, the Prime Directive cannot be permanently defeated by HP damage. At 0 HP the Boss Engine restores it to 1 HP and keeps the Anchor/Sever objective active.", activation: "special" },
      { name: "Vector Evasion", img: SRD_ICONS.dexterity, description: "Three charges per encounter. Reaction: when Andrew or Tactal threatens the suit, spend one charge to reposition. Andrew must force this reaction before Tactal can Anchor the suit.", activation: "reaction" },
      { name: "Jet Pursuit", img: SRD_ICONS.flying, description: "Bonus Action: move up to 40 feet without provoking opportunity attacks while unanchored. Unavailable while Anchored.", activation: "bonus" },
      { name: "Predictive Defense", img: SRD_ICONS.dodging, description: "Reaction, once per round: reduce one visible hit from Andrew or Tactal by 2d8 + 5. Unavailable while Anchored.", activation: "reaction" },
      { name: "Weave Blade", img: SRD_ICONS.slashing, description: "Two attacks: +11 to hit, each 2d8 + 5 slashing plus 1d6 force damage.", activation: "action", actionType: "mwak", activityType: "attack", attackAbility: "dex", attackBonus: "11", attackRange: "melee", damageParts: [{ formula: "2d8 + 5", type: "slashing" }, { formula: "1d6", type: "force" }] },
      { name: "Psionic Repulsor", img: SRD_ICONS.psychic, description: "DC 18 Strength save. Failure: 4d8 psychic damage and push 20 feet. Success: half damage and no push.", activation: "action", actionType: "save", activityType: "save", saveAbility: "str", saveDC: "18", formula: "4d8", damageType: "psychic" },
      { name: "Vector Cascade", img: SRD_ICONS.force, description: "Recharge 5–6. Move up to 40 feet without provoking opportunity attacks, then make one Weave Blade attack against a creature passed during the movement.", activation: "bonus" },
      { name: "Transmitter — Exposed Objective", img: SRD_ICONS.utility, description: "When LINK is saturated, Vector Evasion has been spent, and Tactal has Anchored the suit, the transmitter is exposed for one round. Andrew must land a qualifying precision strike.", activation: "special" }
    ]
  })
});

let listenersInstalled = false;
let socketInstalled = false;
let controlsInstalled = false;
let openDialog = null;
let lastState = null;
let syncGuard = false;
let mutationQueue = Promise.resolve();
let reactiveSyncQueued = false;
let markerLayer = null;
let markerTicker = null;
const regionEventDebounce = new Set();

function clone(value) { return structuredClone(value ?? {}); }
function text(value, fallback = "") { const result = String(value ?? "").trim(); return result || fallback; }
function activeGM() { const gm = globalThis.game?.users?.activeGM; return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id)); }
function currentScene() { return globalThis.canvas?.scene ?? globalThis.game?.scenes?.active ?? null; }
function actorByRole(role) { return Array.from(globalThis.game?.actors ?? []).find(actor => actor?.getFlag?.(MODULE_ID, `${BOSS_ENGINE_FLAG}.role`) === role) ?? Array.from(globalThis.game?.actors ?? []).find(actor => role === "prime-arachnid" ? actor?.name === PRIME_ARACHNID_NAME : actor?.name === PRIME_DIRECTIVE_NAME) ?? null; }
function sceneState(scene = currentScene()) { return scene?.getFlag?.(MODULE_ID, BOSS_ENGINE_FLAG) ?? scene?.flags?.[MODULE_ID]?.[BOSS_ENGINE_FLAG] ?? null; }

function puzzleRecord(index, kind, owner) { return { index, kind, owner, completed: false, doorUuid: null, completedRound: null }; }
function puzzleDefaults() { return { 1: puzzleRecord(1, PUZZLE_KINDS.REDIRECT, "Sprocket"), 2: puzzleRecord(2, PUZZLE_KINDS.REDIRECT, "Sprocket"), 3: puzzleRecord(3, PUZZLE_KINDS.REDIRECT, "Sprocket"), 4: puzzleRecord(4, PUZZLE_KINDS.TIMING, "Dalton"), 5: puzzleRecord(5, PUZZLE_KINDS.TIMING, "Dalton"), 6: puzzleRecord(6, PUZZLE_KINDS.TIMING, "Dalton") }; }
function weaknessDefaults() { return { pins: WEAKNESS_PIN_DCS.map((dc, index) => ({ index: index + 1, dc, removed: false, shot: false })), pinsRemoved: 0, shotsLanded: 0 }; }

function stateDefaults(scene = currentScene()) {
  return {
    version: BOSS_ENGINE_VERSION, active: false, sceneUuid: scene?.uuid ?? null,
    phase: PHASES.SHIELDED, round: 0, phaseStartedRound: 0, roundsInPhase: 0,
    shieldTempHp: DEFAULT_CONFIG.initialShieldTempHp, shieldTempMax: DEFAULT_CONFIG.initialShieldTempHp,
    puzzles: puzzleDefaults(), puzzlesComplete: 0, redirectComplete: 0, timingComplete: 0,
    plating: { active: false, disabled: false }, weaknessExposed: false, weakness: weaknessDefaults(),
    linkLoad: 0, linkLoadMax: DEFAULT_CONFIG.linkLoadMax, linkLoadThisRound: 0, linkSaturated: false,
    linkSaturationEndsRound: null, vectorCharges: DEFAULT_CONFIG.vectorCharges, vectorEvasionSpent: false,
    anchor: { active: false, tokenUuid: null, untilRound: null }, transmitterExposed: false, transmitterWindowEndsRound: null,
    directiveHp: DEFAULT_CONFIG.directiveHp, directiveMaxHp: DEFAULT_CONFIG.directiveHp,
    arachnidHp: DEFAULT_CONFIG.arachnidHp, arachnidMaxHp: DEFAULT_CONFIG.arachnidHp,
    timers: { pocketCollapse: 0, frenzy: 0, overdrive: 0 }, overdriveLevel: 0,
    criticalFailure: false, pocketDimension: { active: false, andrewTokenUuid: null, tactalTokenUuid: null },
    puzzleDoors: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
    breach: { open: false, holderTokenUuid: null, collapse: 0 }, dotEffects: [], regions: {}, narration: [], lastEvent: null, updatedAt: Date.now()
  };
}

function normalizeState(value, scene = currentScene()) {
  const base = stateDefaults(scene);
  const source = value && typeof value === "object" ? value : {};
  const legacy = Number(source.version ?? 0) < BOSS_ENGINE_VERSION;
  const input = legacy ? { ...base, sceneUuid: source.sceneUuid ?? base.sceneUuid, regions: source.regions ?? {}, lastEvent: "Boss Engine v5 loaded. Reset the encounter before starting." } : source;
  const puzzles = { ...base.puzzles, ...(input.puzzles ?? {}) };
  for (const index of Object.keys(base.puzzles)) puzzles[index] = { ...base.puzzles[index], ...(puzzles[index] ?? {}) };
  const weakness = { ...base.weakness, ...(input.weakness ?? {}), pins: Array.isArray(input.weakness?.pins) && input.weakness.pins.length === WEAKNESS_PIN_DCS.length ? input.weakness.pins.map((pin, index) => ({ ...base.weakness.pins[index], ...pin, dc: WEAKNESS_PIN_DCS[index] })) : base.weakness.pins };
  return { ...base, ...clone(input), version: BOSS_ENGINE_VERSION, sceneUuid: input.sceneUuid ?? base.sceneUuid, puzzles, plating: { ...base.plating, ...(input.plating ?? {}) }, weakness, anchor: { ...base.anchor, ...(input.anchor ?? {}) }, timers: { ...base.timers, ...(input.timers ?? {}) }, pocketDimension: { ...base.pocketDimension, ...(input.pocketDimension ?? {}) }, breach: { ...base.breach, ...(input.breach ?? {}) }, puzzleDoors: { ...base.puzzleDoors, ...(input.puzzleDoors ?? {}) }, dotEffects: Array.isArray(input.dotEffects) ? input.dotEffects : [], regions: { ...base.regions, ...(input.regions ?? {}) }, narration: Array.isArray(input.narration) ? input.narration.slice(-16) : [] };
}

function escapeHTML(value) { return String(value ?? "").replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character]); }
function notify(message, { whisper = false } = {}) { const value = text(message); if (!value) return; if (globalThis.ChatMessage?.create) { const data = { content: `<p>${escapeHTML(value)}</p>` }; if (whisper) data.whisper = Array.from(globalThis.game?.users ?? []).filter(user => user?.isGM && user.active).map(user => user.id); void globalThis.ChatMessage.create(data); } else globalThis.ui?.notifications?.info?.(value); }
function directiveRegion() { return Array.from(currentScene()?.regions ?? []).find(region => regionConfig(region)?.role === ROLES.DIRECTIVE_ARENA || String(region?.id ?? "") === "DAAcwdFDK4BppT77") ?? null; }
function directiveRegionOrigin() {
  const regionOrigin = regionCenter(directiveRegion());
  if (regionOrigin) return regionOrigin;
  const token = Array.from(globalThis.canvas?.tokens?.placeables ?? []).find(placeable => (placeable?.actor?.name ?? placeable?.document?.actor?.name) === PRIME_DIRECTIVE_NAME);
  if (token) return { x: Number(token.center?.x ?? token.x ?? 0), y: Number(token.center?.y ?? token.y ?? 0) };
  return { x: Number(globalThis.canvas?.dimensions?.width ?? 0) / 2, y: Number(globalThis.canvas?.dimensions?.height ?? 0) / 2 };
}
function scrollingTextColor(phase) { return { [PHASES.SHIELDED]: "#ffffff", [PHASES.REACTIVE_PLATING]: "#33ccff", [PHASES.WEAKNESS_EXPOSURE]: "#d58cff", [PHASES.SEPARATION]: "#ff6688", [PHASES.FRENZY]: "#ff9944", [PHASES.OVERDRIVE]: "#ff3344", [PHASES.CRITICAL_FAILURE]: "#ffcc33", [PHASES.BREACH_OPEN]: "#ffffff", [PHASES.DESTROYED]: "#ffffff" }[phase] ?? "#ffffff"; }
async function showScrollingNarration(phase) { const lines = DEFAULT_CONFIG.transitionScrollingText[phase] ?? []; const interfaceLayer = globalThis.canvas?.interface; const renderer = interfaceLayer?.createScrollingText; const origin = directiveRegionOrigin(); const anchor = Number(globalThis.CONST?.TEXT_ANCHOR_POINTS?.CENTER ?? 0); const direction = Number(globalThis.CONST?.TEXT_ANCHOR_POINTS?.TOP ?? 2); for (const line of lines) { if (typeof renderer === "function") { try { await renderer.call(interfaceLayer, origin, line, { anchor, direction, distance: 100, duration: 4500, fontSize: 28, fill: scrollingTextColor(phase), stroke: "#000000", strokeThickness: 5 }); } catch (error) { console.warn("Regionwright scrolling narration fallback", error); globalThis.ui?.notifications?.info?.(line); } } else globalThis.ui?.notifications?.info?.(line); } }
async function notifyTransitionPresentation(phase) { await showScrollingNarration(phase); const lines = DEFAULT_CONFIG.transitionDialogue[phase] ?? []; if (globalThis.ChatMessage?.create) for (const line of lines) await globalThis.ChatMessage.create({ content: `<p><strong>${escapeHTML(line.speaker)}:</strong> ${escapeHTML(line.text)}</p>` }); else for (const line of lines) notify(`${line.speaker}: ${line.text}`); }
async function notifyStoryDialogue(event) { const lines = DEFAULT_CONFIG.eventDialogue[event] ?? []; if (globalThis.ChatMessage?.create) for (const line of lines) await globalThis.ChatMessage.create({ content: `<p><strong>${escapeHTML(line.speaker)}:</strong> ${escapeHTML(line.text)}</p>` }); else for (const line of lines) notify(`${line.speaker}: ${line.text}`); }

function recordNarration(state, phase, value) { state.narration.push({ at: Date.now(), phase, text: value }); state.narration = state.narration.slice(-16); }
function phaseTransition(state, phase, narration) { state.phase = phase; state.phaseStartedRound = state.round; state.roundsInPhase = 1; state.lastEvent = narration; recordNarration(state, phase, narration); }

function clearPuzzleMarkers() { if (markerTicker && globalThis.canvas?.app?.ticker) globalThis.canvas.app.ticker.remove(markerTicker); markerTicker = null; markerLayer?.destroy?.({ children: true }); markerLayer = null; }
function regionCenter(region) { const shape = Array.from(region?.shapes ?? [])[0]; if (!shape) return null; if (shape.type === "circle") return { x: Number(shape.x ?? 0), y: Number(shape.y ?? 0) }; return { x: Number(shape.x ?? 0) + Number(shape.width ?? 0) / 2, y: Number(shape.y ?? 0) + Number(shape.height ?? 0) / 2 }; }
function refreshPuzzleMarkers(state = getState()) {
  clearPuzzleMarkers();
  if (state.phase !== PHASES.REACTIVE_PLATING || !globalThis.PIXI || !globalThis.canvas?.interface) return;
  markerLayer = new globalThis.PIXI.Container(); markerLayer.zIndex = 9999;
  for (const region of Array.from(currentScene()?.regions ?? [])) {
    const config = regionConfig(region); if (!config || ![ROLES.PUZZLE_NODE, ROLES.SHIELD_NODE].includes(config.role)) continue;
    const puzzle = state.puzzles[String(config.index)]; if (!puzzle || puzzle.completed) continue;
    const center = regionCenter(region); if (!center) continue;
    const color = puzzle.kind === PUZZLE_KINDS.REDIRECT ? 0x33ccff : 0xffcc33;
    const arrow = new globalThis.PIXI.Graphics(); arrow.lineStyle?.(5, color, 1); arrow.beginFill?.(color, 0.9); arrow.drawPolygon?.([-18, -10, 18, -10, 0, 18]); arrow.endFill?.(); arrow.x = center.x; arrow.y = center.y - 55;
    const label = new globalThis.PIXI.Text(`${puzzle.owner}: ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? "REDIRECT" : "TIMING"} ${config.index <= 3 ? config.index : config.index - 3}`, { fontSize: 20, fill: 0xffffff, stroke: 0x000000, strokeThickness: 5, align: "center" }); label.anchor?.set?.(0.5, 0); label.x = center.x; label.y = center.y - 35;
    markerLayer.addChild(arrow, label);
  }
  globalThis.canvas.interface.addChild(markerLayer);
  const start = Date.now(); markerTicker = () => { const pulse = 0.75 + Math.sin((Date.now() - start) / 250) * 0.25; if (markerLayer) markerLayer.alpha = pulse; }; globalThis.canvas.app?.ticker?.add?.(markerTicker);
}

async function persistState(state, { announce = false } = {}) {
  if (!activeGM()) return state;
  const scene = currentScene(); if (!scene?.update) throw new Error("The active Scene is unavailable.");
  const previous = normalizeState(lastState ?? sceneState(), scene); const normalized = normalizeState({ ...state, updatedAt: Date.now() }, scene);
  const phaseChanged = normalized.active && (!previous.active || normalized.phase !== previous.phase);
  const receiverRevealed = normalized.active && normalized.phase === PHASES.SEPARATION && !previous.transmitterExposed && normalized.transmitterExposed;
  const dialogue = phaseChanged ? (DEFAULT_CONFIG.transitionDialogue[normalized.phase] ?? []) : [];
  if (dialogue.length) { normalized.narration.push(...dialogue.map(line => ({ at: Date.now(), phase: normalized.phase, speaker: line.speaker, text: line.text }))); normalized.narration = normalized.narration.slice(-16); }
  await scene.update({ [`flags.${MODULE_ID}.${BOSS_ENGINE_FLAG}`]: normalized }); lastState = normalized;
  if (phaseChanged) await notifyTransitionPresentation(normalized.phase);
  else if (receiverRevealed) await notifyStoryDialogue("receiverRevealed");
  else if (announce && normalized.lastEvent) notify(normalized.lastEvent);
  refreshPuzzleMarkers(normalized);
  globalThis.game?.socket?.emit?.(BOSS_ENGINE_SOCKET, { action: "state", sceneUuid: scene.uuid, state: normalized }); refreshDialog(); return normalized;
}
function enqueueMutation(operation) { const job = mutationQueue.then(operation, operation); mutationQueue = job.catch(() => undefined); return job; }
async function updateState(mutator, options = {}) { return enqueueMutation(async () => { if (!activeGM()) return getState(); const next = await (typeof mutator === "function" ? mutator(normalizeState(sceneState())) : { ...normalizeState(sceneState()), ...clone(mutator) }); return persistState(next, options); }); }
function getState() { lastState = normalizeState(sceneState()); return clone(lastState); }

function tokenUuidForActor(name) { const token = Array.from(globalThis.canvas?.tokens?.placeables ?? []).find(placeable => (placeable?.actor?.name ?? placeable?.document?.actor?.name) === name); return token?.document?.uuid ?? token?.uuid ?? null; }
function beginReactivePlating(state) { if (state.phase !== PHASES.SHIELDED) return; state.shieldTempHp = 0; state.plating.active = true; state.plating.disabled = false; phaseTransition(state, PHASES.REACTIVE_PLATING, DEFAULT_CONFIG.narration.shieldDown); recordNarration(state, state.phase, "REACTIVE PLATING: ONLINE. Sprocket has three Redirect/Laser Grid stations. Dalton has three Timing Dial stations. Two characters distract the Prime Directive while the puzzle teams work."); }
function beginSeparation(state) { phaseTransition(state, PHASES.SEPARATION, DEFAULT_CONFIG.narration.separation); state.vectorCharges = DEFAULT_CONFIG.vectorCharges; state.vectorEvasionSpent = false; state.linkLoad = 0; state.linkLoadThisRound = 0; state.linkSaturated = false; state.linkSaturationEndsRound = null; state.pocketDimension = { active: true, andrewTokenUuid: tokenUuidForActor("Andrew McConaughey"), tactalTokenUuid: tokenUuidForActor("Tactal") }; }
function maybeBeginSeparation(state) { if (state.phase === PHASES.WEAKNESS_EXPOSURE && state.roundsInPhase >= 1 && state.weakness?.pins?.every(pin => pin.shot)) { beginSeparation(state); return true; } return false; }

async function notifySeparationSetPiece() { if (globalThis.ChatMessage?.create) await globalThis.ChatMessage.create({ content: `<p><em>${escapeHTML("The Prime Directive lunges through the failing relay field, strikes Andrew McConaughey, and throws him into a folding pocket dimension. Tactal follows through the closing tear before the battlefield seals behind them.")}</em></p>` }); }

function actorData(spec) {
  const damagePart = part => ({ number: 0, denomination: 0, bonus: "", types: [part.type].filter(Boolean), custom: { enabled: true, formula: part.formula ?? "" }, scaling: { mode: "", number: 1, formula: "" } });
  const items = spec.items.map((item, index) => ({ name: item.name, type: "feat", img: item.img ?? "systems/dnd5e/icons/svg/items/feature.svg", system: { description: { value: item.description, chat: "" }, activation: { type: item.activation, cost: item.cost ?? 1 }, actionType: item.actionType ?? "other" }, flags: { [MODULE_ID]: { [BOSS_ENGINE_FLAG]: { index, mechanic: true } } } }));
  spec.items.forEach((item, index) => { if (item.activation === "special") return; const activityId = globalThis.foundry?.utils?.randomID?.() ?? `boss${index}`; const activity = { type: item.activityType ?? "utility", name: item.name, activation: { type: item.activation, value: item.cost ?? 1 }, description: { chatFlavor: "" }, roll: { formula: "", name: "", prompt: false, visible: false } }; const parts = item.damageParts ?? (item.formula ? [{ formula: item.formula, type: item.damageType }] : []); if (activity.type === "attack") { activity.attack = { ability: item.attackAbility ?? "str", bonus: String(item.attackBonus ?? ""), critical: { threshold: 20 }, flat: false, type: { value: item.attackRange ?? "melee", classification: "weapon" } }; activity.damage = { critical: { bonus: "" }, includeBase: true, parts: parts.map(damagePart) }; } else if (activity.type === "save") { activity.damage = { onSave: item.onSave ?? "half", parts: parts.map(damagePart) }; activity.save = { ability: [item.saveAbility ?? "dex"], dc: { calculation: "", formula: String(item.saveDC ?? "") } }; } items[index].system.activities = { [activityId]: activity }; });
  return { name: spec.name, type: spec.type, img: spec.img, system: clone(spec.system), items, flags: { [MODULE_ID]: { [BOSS_ENGINE_FLAG]: { role: spec.role, version: BOSS_ENGINE_VERSION } } } };
}
async function ensureActor(spec) { if (!activeGM()) throw new Error("Only the active GM can create boss actors."); let actor = actorByRole(spec.role); if (!actor) actor = Array.from(globalThis.game?.actors ?? []).find(entry => entry?.name === spec.name) ?? null; if (!actor) return globalThis.Actor.create(actorData(spec)); if (actor.type !== "npc") await actor.update({ type: "npc" }); const ids = Array.from(actor.items ?? []).map(item => item.id).filter(Boolean); if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids); await actor.update({ name: spec.name, img: spec.img, system: clone(spec.system), [`flags.${MODULE_ID}.${BOSS_ENGINE_FLAG}`]: { role: spec.role, version: BOSS_ENGINE_VERSION } }); await actor.createEmbeddedDocuments("Item", actorData(spec).items); return actor; }
export async function ensureBossActors() { return { arachnid: await ensureActor(ACTOR_SPECS.arachnid), directive: await ensureActor(ACTOR_SPECS.directive) }; }
async function resetActorHp(actor, value, temp = null) { if (!actor?.update) return; const update = { "system.attributes.hp.value": value, "system.attributes.hp.max": value }; if (temp !== null) { update["system.attributes.hp.temp"] = temp; update["system.attributes.hp.tempmax"] = temp; } await actor.update(update); }

export async function resetEncounter({ scene = currentScene() } = {}) { if (!activeGM()) throw new Error("Only the active GM can reset the Boss Engine."); const state = stateDefaults(scene); state.regions = configuredRegionState(scene); state.lastEvent = "Boss Engine reset. The encounter is ready to begin."; const arachnid = actorByRole("prime-arachnid"); const directive = actorByRole("prime-directive"); syncGuard = true; try { await resetActorHp(arachnid, DEFAULT_CONFIG.arachnidHp, DEFAULT_CONFIG.initialShieldTempHp); await resetActorHp(directive, DEFAULT_CONFIG.directiveHp); } finally { syncGuard = false; } await scene?.unsetFlag?.(MODULE_ID, BOSS_ENGINE_FLAG); return persistState(state, { announce: true }); }
export async function startEncounter() { if (!activeGM()) throw new Error("Only the active GM can start the Boss Engine."); await ensureBossActors(); await autoConfigureKnownRegions(currentScene()); const state = stateDefaults(); state.active = true; state.phase = PHASES.SHIELDED; state.round = 1; state.phaseStartedRound = 1; state.roundsInPhase = 1; state.shieldTempHp = DEFAULT_CONFIG.initialShieldTempHp; state.arachnidHp = DEFAULT_CONFIG.arachnidHp; state.lastEvent = DEFAULT_CONFIG.narration.start; const arachnid = actorByRole("prime-arachnid"); const directive = actorByRole("prime-directive"); syncGuard = true; try { await resetActorHp(arachnid, DEFAULT_CONFIG.arachnidHp, DEFAULT_CONFIG.initialShieldTempHp); await resetActorHp(directive, DEFAULT_CONFIG.directiveHp); } finally { syncGuard = false; } state.regions = configuredRegionState(currentScene()); return persistState(state, { announce: true }); }

function applyLinkLoad(state, amount) { if (state.phase !== PHASES.SEPARATION || state.linkSaturated) return; const available = Math.max(0, DEFAULT_CONFIG.linkLoadPerRoundCap - state.linkLoadThisRound); const applied = Math.min(Math.max(0, Number(amount) || 0), available, state.linkLoadMax - state.linkLoad); state.linkLoadThisRound += applied; state.linkLoad += applied; if (state.linkLoad >= state.linkLoadMax) { state.linkSaturated = true; state.linkSaturationEndsRound = state.round + DEFAULT_CONFIG.linkSaturationRounds; state.lastEvent = DEFAULT_CONFIG.narration.linkSaturated; recordNarration(state, state.phase, state.lastEvent); syncTransmitterExposure(state); } }
function syncTransmitterExposure(state) { if (state.phase !== PHASES.SEPARATION || !state.linkSaturated || !state.vectorEvasionSpent || !state.anchor.active) return; state.transmitterExposed = true; state.transmitterWindowEndsRound = state.round + DEFAULT_CONFIG.transmitterWindowRounds; state.lastEvent = DEFAULT_CONFIG.narration.transmitter; recordNarration(state, state.phase, state.lastEvent); }

export async function disableShield() { return updateState(state => { state.lastEvent = "The Aegis shell is not a Region objective. Reduce its temporary HP through normal attacks."; return state; }, { announce: true }); }
export async function addLinkLoad(amount = DEFAULT_CONFIG.linkLoadPerConsoleEntry) { return updateState(state => { if (state.phase !== PHASES.SEPARATION) return state; applyLinkLoad(state, amount); return state; }, { announce: true }); }
export async function spendVectorEvasion() { return updateState(state => { if (state.phase !== PHASES.SEPARATION || state.vectorEvasionSpent || state.vectorCharges <= 0) return state; state.vectorCharges -= 1; state.vectorEvasionSpent = true; state.lastEvent = DEFAULT_CONFIG.narration.vectorSpent; recordNarration(state, state.phase, state.lastEvent); syncTransmitterExposure(state); return state; }, { announce: true }); }
export async function setAnchor({ active = true, tokenUuid = null } = {}) { return updateState(state => { if (state.phase !== PHASES.SEPARATION || (active && !state.vectorEvasionSpent)) return state; state.anchor = { active: Boolean(active), tokenUuid: active ? tokenUuid : null, untilRound: active ? state.round + 1 : null }; state.lastEvent = active ? DEFAULT_CONFIG.narration.anchor : "The Prime Directive slips free of the anchor."; if (active) syncTransmitterExposure(state); return state; }, { announce: true }); }
export async function exposeTransmitter(exposed = true) { return updateState(state => { if (exposed && !(state.phase === PHASES.SEPARATION && state.linkSaturated && state.vectorEvasionSpent && state.anchor.active)) return state; state.transmitterExposed = Boolean(exposed); state.transmitterWindowEndsRound = exposed ? state.round + DEFAULT_CONFIG.transmitterWindowRounds : null; state.lastEvent = exposed ? DEFAULT_CONFIG.narration.transmitter : "The transmitter housing seals."; return state; }, { announce: true }); }
export async function severTransmitter() { return updateState(state => { if (state.phase !== PHASES.SEPARATION || !state.anchor.active || !state.linkSaturated || !state.transmitterExposed) return state; state.anchor = { active: false, tokenUuid: null, untilRound: null }; state.transmitterExposed = false; state.pocketDimension.active = false; state.timers.frenzy = DEFAULT_CONFIG.frenzyRounds; phaseTransition(state, PHASES.FRENZY, DEFAULT_CONFIG.narration.frenzy); recordNarration(state, state.phase, "POCKET DIMENSION COLLAPSE: Andrew and Tactal are thrown back into the Arachnid's arena. The Prime Directive reboards during the next phase."); return state; }, { announce: true }); }
export async function enterSeparation() { return updateState(state => { if (state.phase === PHASES.WEAKNESS_EXPOSURE && state.roundsInPhase >= 1) maybeBeginSeparation(state); else state.lastEvent = "Convergence is listener-driven: finish the current weakness window and advance the round."; return state; }, { announce: true }); }

export async function completePuzzle({ kind, index = null, doorUuid = null } = {}) {
  if (!activeGM()) { requestBossAction("completePuzzle", { kind, index, doorUuid }); return getState(); }
  return updateState(state => { if (!state.active || state.phase !== PHASES.REACTIVE_PLATING) return state; const normalized = puzzleKind(kind); let target = index != null ? state.puzzles[String(index)] : null; if (!target && doorUuid) target = Object.values(state.puzzles).find(puzzle => puzzle.doorUuid === doorUuid); if (!target && normalized) target = Object.values(state.puzzles).find(puzzle => puzzle.kind === normalized && !puzzle.completed); if (!target || (normalized && target.kind !== normalized) || target.completed) return state; target.completed = true; target.completedRound = state.round; state.puzzlesComplete = Object.values(state.puzzles).filter(puzzle => puzzle.completed).length; state.redirectComplete = Object.values(state.puzzles).filter(puzzle => puzzle.completed && puzzle.kind === PUZZLE_KINDS.REDIRECT).length; state.timingComplete = Object.values(state.puzzles).filter(puzzle => puzzle.completed && puzzle.kind === PUZZLE_KINDS.TIMING).length; state.lastEvent = `${target.owner}: ${target.kind === PUZZLE_KINDS.REDIRECT ? "REDIRECT" : "TIMING"} station ${target.kind === PUZZLE_KINDS.REDIRECT ? target.index : target.index - 3} complete (${state.puzzlesComplete}/6).`; recordNarration(state, state.phase, state.lastEvent); if (state.puzzlesComplete >= DEFAULT_CONFIG.puzzleCount) { state.plating.active = false; state.plating.disabled = true; state.weaknessExposed = true; phaseTransition(state, PHASES.WEAKNESS_EXPOSURE, DEFAULT_CONFIG.narration.platingDisabled); } return state; }, { announce: true }); }
export async function markPuzzleComplete(kindOrArgs, index = null) { return typeof kindOrArgs === "object" ? completePuzzle(kindOrArgs) : completePuzzle({ kind: kindOrArgs, index }); }

export async function removeWeaknessPin({ total = 0 } = {}) {
  if (!activeGM()) { requestBossAction("removeWeaknessPin", { total }); return getState(); }
  return updateState(state => {
    if (!state.active || state.phase !== PHASES.WEAKNESS_EXPOSURE || !state.weaknessExposed) return state;
    const pin = state.weakness.pins.find(entry => !entry.removed);
    if (!pin) return state;
    const result = Number(total) || 0;
    if (result >= pin.dc) { pin.removed = true; state.weakness.pinsRemoved = state.weakness.pins.filter(entry => entry.removed).length; state.lastEvent = `Aleister removes pin ${pin.index}/9. DC ${pin.dc} passed (${result}). Lawson may fire Matilda.`; }
    else state.lastEvent = `Aleister's Sleight of Hand fails on pin ${pin.index}/9. DC ${pin.dc} required (${result}).`;
    recordNarration(state, state.phase, state.lastEvent);
    return state;
  }, { announce: true });
}
export async function resolveWeaknessShot() {
  return updateState(state => {
    if (!state.active || state.phase !== PHASES.WEAKNESS_EXPOSURE) return state;
    const pin = state.weakness.pins.find(entry => entry.removed && !entry.shot);
    if (!pin) { state.lastEvent = "Matilda fires, but no Core Vent pin is open."; return state; }
    pin.shot = true;
    state.weakness.shotsLanded = state.weakness.pins.filter(entry => entry.shot).length;
    state.lastEvent = `Matilda strikes Core Vent pin ${pin.index}/9 (${state.weakness.shotsLanded}/9 weak spots hit).`;
    recordNarration(state, state.phase, state.lastEvent);
    return state;
  }, { announce: true });
}

function puzzleKind(value) { const normalized = text(value).toLowerCase().replaceAll("_", "-"); if (["redirect", "laser", "laser-grid", "lasergrid"].includes(normalized)) return PUZZLE_KINDS.REDIRECT; if (["timing", "timing-dial", "timingdial"].includes(normalized)) return PUZZLE_KINDS.TIMING; return null; }
async function resolvePuzzleDoor(doorUuid) { const door = globalThis.fromUuidSync?.(doorUuid) ?? await globalThis.fromUuid?.(doorUuid); if (!door || door.documentName !== "Wall" || Number(door.door ?? 0) <= 0) throw new Error("Choose a Door puzzle target."); return door; }
export async function bindPuzzleDoor({ kind, index = null, doorUuid } = {}) { if (!activeGM()) throw new Error("Only the active GM can bind Boss Engine puzzle Doors."); const normalized = puzzleKind(kind); if (!normalized) throw new Error("Choose Timing Dial or Redirect/Laser Grid."); const door = await resolvePuzzleDoor(doorUuid); const state = getState(); const target = index != null ? state.puzzles[String(index)] : Object.values(state.puzzles).find(puzzle => puzzle.kind === normalized && !puzzle.doorUuid); if (!target || target.kind !== normalized) throw new Error("Choose a matching unfinished puzzle station."); await door.update({ [`flags.${MODULE_ID}.bossEnginePuzzle`]: { kind: normalized, index: target.index } }); return updateState(next => { next.puzzles[String(target.index)].doorUuid = door.uuid; next.puzzleDoors[String(target.index)] = door.uuid; return next; }); }
function configuredPuzzleDoor(door, kind) { const flagName = kind === PUZZLE_KINDS.REDIRECT ? "laserGrid" : "timingDial"; const data = door?.getFlag?.(MODULE_ID, flagName) ?? door?.flags?.[MODULE_ID]?.[flagName]; return Boolean(data?.config && data?.persistent?.status === "locked"); }
function scenePuzzleDoors(kind) { const documents = [...Array.from(currentScene()?.walls ?? []), ...Array.from(globalThis.canvas?.walls?.placeables ?? []).map(placeable => placeable?.document ?? placeable)]; const seen = new Set(); return documents.filter(door => { if (!door?.uuid || seen.has(door.uuid) || Number(door.door ?? 0) <= 0 || !configuredPuzzleDoor(door, kind)) return false; seen.add(door.uuid); return true; }).sort((left, right) => left.uuid.localeCompare(right.uuid)); }
export async function bindConfiguredPuzzleDoors({ kind = null, index = null } = {}) { if (!activeGM()) throw new Error("Only the active GM can bind Boss Engine puzzle Doors."); const state = getState(); const targets = Object.values(state.puzzles).filter(puzzle => (!kind || puzzle.kind === puzzleKind(kind)) && (index == null || puzzle.index === Number(index))); if (!targets.length) throw new Error("Choose a valid Boss Engine puzzle station."); const used = new Set(); for (const target of targets) { const doors = scenePuzzleDoors(target.kind); const existing = doors.find(door => door.uuid === target.doorUuid); if (existing) { used.add(existing.uuid); continue; } const candidate = doors.find(door => !used.has(door.uuid)); if (!candidate) throw new Error(`No configured ${target.kind === PUZZLE_KINDS.REDIRECT ? "Redirect/Laser Grid" : "Timing Dial"} Door is available for ${target.owner}'s station ${target.kind === PUZZLE_KINDS.REDIRECT ? target.index : target.index - 3}.`); await bindPuzzleDoor({ kind: target.kind, index: target.index, doorUuid: candidate.uuid }); used.add(candidate.uuid); } return getState(); }
function controlledPuzzleDoor() { const doors = Array.from(globalThis.canvas?.walls?.controlled ?? []).map(placeable => placeable?.document ?? placeable).filter(door => Number(door?.door ?? 0) > 0); if (doors.length !== 1) throw new Error("Select exactly one Door before binding a puzzle objective."); return doors[0]; }
export async function bindSelectedPuzzleDoor(kind, index = null) { const door = controlledPuzzleDoor(); return bindPuzzleDoor({ kind, index, doorUuid: door.uuid }); }
export async function addDotEffect({ actorUuid, name = DEFAULT_CONFIG.dot.name, formula = DEFAULT_CONFIG.dot.formula, type = DEFAULT_CONFIG.dot.type, rounds = 1 } = {}) { return updateState(state => { if (actorUuid) state.dotEffects.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, actorUuid, name, formula, type, rounds: Math.max(1, Number(rounds) || 1) }); return state; }); }

async function tickDots(state) { const remaining = []; for (const effect of state.dotEffects) { const actor = await globalThis.fromUuid?.(effect.actorUuid); if (actor?.update) { const current = Number(actor.system?.attributes?.hp?.value ?? 0); const roll = await new globalThis.Roll(effect.formula).evaluate({ async: true }); const damage = Math.max(0, Number(roll.total) || 0); await actor.update({ "system.attributes.hp.value": Math.max(0, current - damage) }); notify(`${effect.name}: ${damage} ${effect.type} damage to ${actor.name}.`); } if (effect.rounds > 1) remaining.push({ ...effect, rounds: effect.rounds - 1 }); } state.dotEffects = remaining; }
export async function advanceRound() { return updateState(async state => { if (!state.active) return state; state.round += 1; state.roundsInPhase = Math.max(1, state.round - state.phaseStartedRound + 1); state.linkLoadThisRound = 0; await tickDots(state); if (state.phase === PHASES.WEAKNESS_EXPOSURE) maybeBeginSeparation(state); if (state.phase === PHASES.FRENZY) { state.timers.frenzy = Math.max(0, state.timers.frenzy - 1); if (state.timers.frenzy === 0) { phaseTransition(state, PHASES.OVERDRIVE, DEFAULT_CONFIG.narration.overdrive); state.overdriveLevel = 1; state.timers.overdrive = DEFAULT_CONFIG.finalOverdriveRounds; const arachnid = actorByRole("prime-arachnid"); syncGuard = true; try { await resetActorHp(arachnid, DEFAULT_CONFIG.arachnidHp, 0); } finally { syncGuard = false; } } } if (state.phase === PHASES.SEPARATION && state.linkSaturated && state.linkSaturationEndsRound < state.round) { state.linkSaturated = false; state.linkLoad = 0; state.linkSaturationEndsRound = null; state.transmitterExposed = false; state.transmitterWindowEndsRound = null; state.lastEvent = "CONVERGENCE LINK: SATURATION WINDOW CLOSED."; } if (state.anchor.active && state.anchor.untilRound < state.round) { state.anchor = { active: false, tokenUuid: null, untilRound: null }; state.transmitterExposed = false; } if (state.phase === PHASES.OVERDRIVE) { state.timers.overdrive = Math.max(0, DEFAULT_CONFIG.finalOverdriveRounds - state.roundsInPhase + 1); state.overdriveLevel = Math.min(3, Math.max(1, Math.ceil(state.roundsInPhase / DEFAULT_CONFIG.finalOverdriveRounds * 3))); if (state.roundsInPhase >= DEFAULT_CONFIG.finalOverdriveRounds && state.arachnidHp > 0) state.lastEvent = "FINAL OVERDRIVE: 3/3 — REACTOR INSTABILITY CRITICAL."; } if (state.transmitterExposed && state.transmitterWindowEndsRound < state.round) state.transmitterExposed = false; return state; }, { announce: true }); }
export async function enterCriticalFailure() { return updateState(state => { if (!state.active || ![PHASES.OVERDRIVE, PHASES.FRENZY].includes(state.phase)) return state; phaseTransition(state, PHASES.CRITICAL_FAILURE, DEFAULT_CONFIG.narration.criticalFailure); state.criticalFailure = true; state.arachnidHp = 0; return state; }, { announce: true }); }
export async function openBreach({ tokenUuid = null } = {}) { return updateState(state => { if (!state.active || state.phase !== PHASES.CRITICAL_FAILURE) return state; phaseTransition(state, PHASES.BREACH_OPEN, DEFAULT_CONFIG.narration.breachOpen); state.breach = { open: true, holderTokenUuid: tokenUuid, collapse: DEFAULT_CONFIG.structuralCollapseRounds }; return state; }, { announce: true }); }
export async function resolveFinalBreachRoll({ total = 0, ability = null, skill = null, tokenUuid = null } = {}) { if (!activeGM()) { requestBossAction("resolveFinalBreachRoll", { total, ability, skill, tokenUuid }); return getState(); } return updateState(state => { if (!state.active || state.phase !== PHASES.CRITICAL_FAILURE) return state; const result = Number(total) || 0; const check = text(skill).toLowerCase() === "ath" ? "Athletics" : "Strength"; if (result >= 22) { phaseTransition(state, PHASES.BREACH_OPEN, DEFAULT_CONFIG.narration.breachOpen); state.breach = { open: true, holderTokenUuid: tokenUuid, collapse: DEFAULT_CONFIG.structuralCollapseRounds }; state.lastEvent = `Tactal passes the ${check} check (${result} vs DC 22). The final plating is torn free. Andrew must fire Ghost now.`; } else { state.breach = { open: false, holderTokenUuid: null, collapse: 0 }; state.lastEvent = `Tactal fails the ${check} check (${result} vs DC 22). The plating locks back into place. Start the breach sequence again.`; } recordNarration(state, state.phase, state.lastEvent); return state; }, { announce: true }); }
export async function resetFinalBreachSequence({ reason = "The final breach sequence fails. Tactal must begin again." } = {}) { return updateState(state => { if (!state.active || ![PHASES.CRITICAL_FAILURE, PHASES.BREACH_OPEN].includes(state.phase)) return state; if (state.phase === PHASES.BREACH_OPEN) phaseTransition(state, PHASES.CRITICAL_FAILURE, DEFAULT_CONFIG.narration.criticalFailure); state.breach = { open: false, holderTokenUuid: null, collapse: 0 }; state.lastEvent = reason; recordNarration(state, state.phase, state.lastEvent); return state; }, { announce: true }); }
export async function strikeCore() { return updateState(state => { if (!state.active || state.phase !== PHASES.BREACH_OPEN || !state.breach.open) return state; state.active = false; phaseTransition(state, PHASES.DESTROYED, DEFAULT_CONFIG.narration.destroyed); state.arachnidHp = 0; state.directiveHp = 0; return state; }, { announce: true }); }
export async function destroyArachnid() { return strikeCore(); }
export async function useLairAction({ kind } = {}) { const action = LAIR_ACTIONS[kind]; if (!action) throw new Error("Choose a valid Prime Arachnid lair action."); return updateState(state => { if (!state.active || state.phase === PHASES.DESTROYED) throw new Error("The lair is not active."); state.lastEvent = action; recordNarration(state, state.phase, action); return state; }, { announce: true }); }

function regionConfig(region) { return region?.getFlag?.(MODULE_ID, `${BOSS_ENGINE_FLAG}.region`) ?? region?.flags?.[MODULE_ID]?.[BOSS_ENGINE_FLAG]?.region ?? null; }
function configuredRegionState(scene) { return Object.fromEntries(Array.from(scene?.regions ?? []).map(region => { const config = regionConfig(region); return config ? [region.id, clone(config)] : null; }).filter(Boolean)); }
function behaviorDataForConfig(config) { return { type: "executeScript", system: { events: ["tokenEnter"], source: `await game.modules.get("${MODULE_ID}")?.api?.boss?.handleRegionEvent(region, event);` }, flags: { [MODULE_ID]: { bossEngine: { region: config } } } }; }
function tokenDocument(tokenUuid) { return globalThis.fromUuidSync?.(tokenUuid) ?? null; }
function tokenActorName(tokenUuid) { const token = tokenDocument(tokenUuid); return text(token?.actor?.name ?? token?.document?.actor?.name ?? "").trim(); }
const BOSS_OWNER_ALIASES = Object.freeze({
  sprocket: ["sprocket", "orbil pindleflux whirington snapthrottle sprockenstein"],
  dalton: ["dalton", "dalton \"redbeard\" durston"]
});
function ownerMatchesToken(puzzle, tokenUuid) { const owner = String(puzzle?.owner ?? "").trim().toLowerCase(); const actor = tokenActorName(tokenUuid).toLowerCase(); const aliases = BOSS_OWNER_ALIASES[owner] ?? [owner]; return Boolean(owner && actor && aliases.some(alias => actor === alias || actor.startsWith(`${alias} `) || actor.startsWith(`${alias}\"`) || actor.includes(alias))); }
async function openFallbackBossPuzzle({ kind, index, owner } = {}) {
  const label = kind === PUZZLE_KINDS.REDIRECT ? "Redirect / Laser Grid" : "Timing Dial";
  const instructions = kind === PUZZLE_KINDS.REDIRECT
    ? "Route the beam through the grid and resolve the station. Then click Complete Station."
    : "Solve the timing sequence and resolve the station. Then click Complete Station.";
  const DialogClass = globalThis.Dialog;
  if (!DialogClass) {
    globalThis.ui?.notifications?.warn?.(`${owner ?? "Puzzle owner"}: ${label} station ${index} is ready. Complete it from the Boss Engine.`);
    return null;
  }
  return new DialogClass({
    title: `Reactive Plating — ${label} ${kind === PUZZLE_KINDS.TIMING ? Number(index) - 3 : index}`,
    content: `<p><strong>${owner ?? "Assigned operator"}</strong>, this station is active.</p><p>${instructions}</p><p class="notification warning">Fallback station card: no Regionwright Door is bound, so completion is recorded directly by the Boss Engine.</p>`,
    buttons: {
      complete: {
        label: "Complete Station",
        callback: () => requestBossAction("completePuzzle", { index: Number(index) })
      },
      cancel: { label: "Not Yet" }
    },
    default: "complete"
  }, { width: 460, classes: ["regionwright", "boss-puzzle-fallback"] }).render(true);
}
async function openBossPuzzle({ kind, doorUuid, index, owner } = {}) {
  const door = globalThis.fromUuidSync?.(doorUuid) ?? await globalThis.fromUuid?.(doorUuid);
  const puzzlesLocks = globalThis.game?.modules?.get?.("regionwright-puzzles-locks")?.api;
  const opener = kind === PUZZLE_KINDS.REDIRECT ? puzzlesLocks?.laserGrid?.open : kind === PUZZLE_KINDS.TIMING ? puzzlesLocks?.timingDial?.open : null;
  if (door && typeof opener === "function") return opener(door);
  return openFallbackBossPuzzle({ kind, index, owner });
}
function requestBossPuzzleOpen(userId, puzzle) {
  if (!userId || !puzzle) return false;
  const payload = { action: "open-boss-puzzle", recipientId: userId, kind: puzzle.kind, index: puzzle.index, owner: puzzle.owner, doorUuid: puzzle.doorUuid ?? null };
  if (!puzzle.doorUuid && activeGM()) {
    void openBossPuzzle(payload).catch(error => globalThis.ui?.notifications?.error?.(error.message ?? "Unable to open the fallback boss puzzle."));
    return true;
  }
  if (userId === globalThis.game?.user?.id) void openBossPuzzle(payload).catch(error => globalThis.ui?.notifications?.error?.(error.message ?? "Unable to open the boss puzzle."));
  else globalThis.game?.socket?.emit?.(BOSS_ENGINE_SOCKET, payload);
  return true;
}
function knownConfigForRegion(region) { const key = String(region?.id ?? ""); const puzzle = KNOWN_PUZZLE_REGION_IDS[key]; return puzzle ? { role: ROLES.PUZZLE_NODE, ...puzzle } : KNOWN_SPECIAL_REGION_IDS[key] ?? null; }
async function autoConfigureKnownRegions(scene = currentScene()) { if (!activeGM() || !scene) return; for (const region of Array.from(scene.regions ?? [])) { const known = knownConfigForRegion(region); const existing = regionConfig(region); if (!known && !existing) continue; const config = known ? { role: ROLES.PUZZLE_NODE, ...known } : { ...existing, role: [ROLES.SHIELD_NODE, ROLES.PUZZLE_NODE].includes(existing.role) ? ROLES.PUZZLE_NODE : existing.role }; if (config.role === ROLES.PUZZLE_NODE && !config.kind) { const index = Number(config.index); config.kind = index <= 3 ? PUZZLE_KINDS.REDIRECT : PUZZLE_KINDS.TIMING; config.owner = index <= 3 ? "Sprocket" : "Dalton"; } await region.update({ [`flags.${MODULE_ID}.${BOSS_ENGINE_FLAG}.region`]: clone(config) }); const existingBehavior = Array.from(region.behaviors ?? []).find(entry => entry?.flags?.[MODULE_ID]?.bossEngine?.region); if (existingBehavior) await region.updateEmbeddedDocuments("RegionBehavior", [{ _id: existingBehavior.id, ...behaviorDataForConfig(config) }]); else await region.createEmbeddedDocuments("RegionBehavior", [behaviorDataForConfig(config)]); } }
export async function configureRegion(region, config) { if (!activeGM()) throw new Error("Only the active GM can configure Boss Engine Regions."); if (!region?.update) throw new Error("Choose a Region first."); const normalized = { ...config }; if (normalized.role === ROLES.SHIELD_NODE) normalized.role = ROLES.PUZZLE_NODE; if (normalized.role === ROLES.PUZZLE_NODE) { normalized.kind = puzzleKind(normalized.kind) ?? (Number(normalized.index) <= 3 ? PUZZLE_KINDS.REDIRECT : PUZZLE_KINDS.TIMING); normalized.owner ??= Number(normalized.index) <= 3 ? "Sprocket" : "Dalton"; } await region.update({ name: normalized.name ?? region.name, [`flags.${MODULE_ID}.${BOSS_ENGINE_FLAG}.region`]: clone(normalized) }); const existing = Array.from(region.behaviors ?? []).find(entry => entry?.flags?.[MODULE_ID]?.bossEngine?.region); if (existing) await region.updateEmbeddedDocuments("RegionBehavior", [{ _id: existing.id, ...behaviorDataForConfig(normalized) }]); else await region.createEmbeddedDocuments("RegionBehavior", [behaviorDataForConfig(normalized)]); return region; }
function controlledRegion() { const regions = Array.from(globalThis.canvas?.regions?.controlled ?? []); if (regions.length !== 1) throw new Error("Select exactly one Region before assigning its Boss Engine role."); return regions[0]; }
export async function configureSelectedRegion(config) { const region = controlledRegion(); await configureRegion(region, config); notify(`Configured ${region.name || "selected Region"} as ${config.role}${config.index ? ` ${config.index}` : ""}.`); return region; }
export async function createEncounterRegions(scene = currentScene()) { if (!activeGM()) throw new Error("Only the active GM can create Boss Engine Regions."); if (!scene?.createEmbeddedDocuments) throw new Error("The active Scene is unavailable."); await autoConfigureKnownRegions(scene); const existing = Array.from(scene.regions ?? []); const hasConfig = entry => existing.some(region => { const config = regionConfig(region); return config?.role === entry.role && Number(config.index ?? 0) === Number(entry.index ?? 0); }); const missing = DEFAULT_REGION_LAYOUT.filter(entry => !hasConfig(entry)); if (!missing.length) return existing.filter(region => regionConfig(region)); const data = missing.map(entry => ({ name: entry.name, color: entry.role === ROLES.DIRECTIVE_ARENA ? "#ff3366" : entry.role === ROLES.LINK_CONSOLE ? "#33ccff" : entry.kind === PUZZLE_KINDS.REDIRECT ? "#33ccff" : "#ffcc33", shapes: [{ type: "rectangle", x: entry.x, y: entry.y, width: entry.width, height: entry.height, anchorX: 0, anchorY: 0, rotation: 0 }], elevation: { bottom: 0, top: null }, levels: [], restriction: { enabled: false, type: "move", priority: 0 }, attachment: { token: null }, behaviors: [behaviorDataForConfig(entry)], visibility: 0, highlightMode: "coverage", displayMeasurements: false, hidden: false, locked: false, flags: { [MODULE_ID]: { [BOSS_ENGINE_FLAG]: { region: entry } } } })); const created = await scene.createEmbeddedDocuments("Region", data); const state = normalizeState(sceneState(scene), scene); state.regions = configuredRegionState(scene); await persistState(state); notify(`Created ${created.length} Prime Arachnid encounter Regions.`); return created; }
export async function configureEncounterRegions(scene = currentScene()) { if (!activeGM()) throw new Error("Only the active GM can configure Boss Engine Regions."); await autoConfigureKnownRegions(scene); const state = normalizeState(sceneState(scene), scene); state.regions = configuredRegionState(scene); return persistState(state); }

async function handleRegionEventRequest({ regionUuid, event = {}, userId = null } = {}) { const region = globalThis.fromUuidSync?.(regionUuid) ?? await globalThis.fromUuid?.(regionUuid) ?? Array.from(currentScene()?.regions ?? []).find(entry => entry?.uuid === regionUuid); return region ? handleRegionEvent(region, { ...event, userId }) : null; }
export async function handleRegionEvent(region, event = {}) { if (!region) return null; const eventType = text(event.type ?? event.name ?? event.event, "tokenEnter"); const tokenUuid = event.token?.document?.uuid ?? event.token?.uuid ?? event.tokenUuid ?? null; if (!activeGM()) { globalThis.game?.socket?.emit?.(BOSS_ENGINE_SOCKET, { action: "request", request: { action: "region-event", args: { regionUuid: region.uuid, event: { type: eventType, tokenUuid } } }, userId: globalThis.game?.user?.id }); return null; } const config = regionConfig(region); if (!config) return null; const key = `${region.uuid}:${eventType}:${tokenUuid}:${Math.floor(Date.now() / 500)}`; if (regionEventDebounce.has(key)) return null; regionEventDebounce.add(key); setTimeout(() => regionEventDebounce.delete(key), 1000); if (!["tokenEnter", "enter"].includes(eventType)) return null; if ([ROLES.PUZZLE_NODE, ROLES.SHIELD_NODE].includes(config.role)) { const state = getState(); if (!state.active || state.phase !== PHASES.REACTIVE_PLATING) return { state }; const puzzle = state.puzzles[String(config.index)]; if (puzzle?.completed) return { state }; const ownerEntered = ownerMatchesToken(puzzle, tokenUuid); if (ownerEntered) notify(`${puzzle.owner}: ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? "Redirect/Laser Grid" : "Timing Dial"} station ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? puzzle.index : puzzle.index - 3} is active. Complete the puzzle, then its listener will mark it solved.`); else notify(`This looks like a ${puzzle.owner} problem.`); const recipientId = event.userId ?? (globalThis.game?.user?.isGM ? globalThis.game?.user?.id : null); if (puzzle && !puzzle.completed) requestBossPuzzleOpen(recipientId, puzzle); return { state }; } if (config.role === ROLES.LINK_CONSOLE && eventType === "tokenEnter") return { state: await addLinkLoad(DEFAULT_CONFIG.linkLoadPerConsoleEntry) }; if (config.role === ROLES.DIRECTIVE_ARENA && eventType === "tokenEnter") return { state: await setAnchor({ active: true, tokenUuid }) }; return null; }

function actorHpChange(changes) { const value = changes?.["system.attributes.hp.value"] ?? changes?.system?.attributes?.hp?.value ?? changes?.hp?.value; return Number.isFinite(Number(value)) ? Number(value) : null; }
function actorTempHpChange(changes) { const value = changes?.["system.attributes.hp.temp"] ?? changes?.system?.attributes?.hp?.temp ?? changes?.hp?.temp; return Number.isFinite(Number(value)) ? Number(value) : null; }
async function handleActorUpdate(actor, changes) { if (syncGuard || !activeGM()) return; const role = actor?.getFlag?.(MODULE_ID, `${BOSS_ENGINE_FLAG}.role`) ?? (actor?.name === PRIME_ARACHNID_NAME ? "prime-arachnid" : actor?.name === PRIME_DIRECTIVE_NAME ? "prime-directive" : null); if (!role) return; const hp = actorHpChange(changes); const tempHp = actorTempHpChange(changes) ?? (role === "prime-arachnid" ? Number(actor.system?.attributes?.hp?.temp) : null); if (hp === null && tempHp === null) return; return enqueueMutation(async () => { const state = getState(); if (!state.active) return; if (role === "prime-directive") { if (state.phase === PHASES.SEPARATION && hp !== null && hp <= 0) { syncGuard = true; try { await actor.update({ "system.attributes.hp.value": 1 }); } finally { syncGuard = false; } state.directiveHp = 1; state.lastEvent = "Protocol Body holds. The Prime Directive remains in the pocket dimension objective."; await persistState(state, { announce: true }); return; } if (hp !== null) { state.directiveHp = Math.max(1, hp); await persistState(state); } return; } if (tempHp !== null) { state.shieldTempHp = Math.max(0, tempHp); if (state.phase === PHASES.SHIELDED && tempHp <= 0) { beginReactivePlating(state); if (hp !== null && hp < state.arachnidHp) { syncGuard = true; try { await actor.update({ "system.attributes.hp.value": state.arachnidHp }); } finally { syncGuard = false; } } await persistState(state, { announce: true }); return; } } if (hp === null) { await persistState(state); return; } if ([PHASES.SHIELDED].includes(state.phase) && hp < state.arachnidHp) { syncGuard = true; try { await actor.update({ "system.attributes.hp.value": state.arachnidHp }); } finally { syncGuard = false; } notify("The Aegis shell absorbs the impact. The Prime Arachnid's chassis remains sealed."); return; } if (state.phase === PHASES.REACTIVE_PLATING && hp < state.arachnidHp) { syncGuard = true; try { await actor.update({ "system.attributes.hp.value": state.arachnidHp }); } finally { syncGuard = false; } notify("Reactive Plating redirects the impact. Finish all six puzzle stations."); return; } const damage = Math.max(0, state.arachnidHp - hp); state.arachnidHp = Math.max(0, hp); if (state.phase === PHASES.SEPARATION && damage > 0) applyLinkLoad(state, Math.max(1, Math.min(DEFAULT_CONFIG.linkLoadPerRoundCap, damage / 7))); if (state.phase === PHASES.OVERDRIVE) { state.overdriveLevel = Math.min(3, Math.max(1, Math.ceil(state.roundsInPhase / DEFAULT_CONFIG.finalOverdriveRounds * 3))); if (hp <= 0) { phaseTransition(state, PHASES.CRITICAL_FAILURE, DEFAULT_CONFIG.narration.criticalFailure); state.criticalFailure = true; } } await persistState(state, { announce: state.phase === PHASES.CRITICAL_FAILURE }); }); }

function activityActorName(activity) { return activity?.actor?.name ?? activity?.item?.actor?.name ?? ""; }
function isAndrewPrecisionStrike(activity) { if (activityActorName(activity) !== "Andrew McConaughey") return false; const item = activity?.item; const actionType = activity?.actionType ?? item?.system?.actionType; if (!["mwak", "rwak", "msak", "rsak"].includes(actionType)) return false; const name = text(item?.name ?? activity?.name).toLowerCase(); return Boolean(item?.system?.properties?.has?.("fin") || /ghost|judgement|precision|finesse/.test(name)); }
function isAndrewGhostStrike(activity) { if (activityActorName(activity) !== "Andrew McConaughey") return false; const actionType = activity?.actionType ?? activity?.item?.system?.actionType; return ["mwak", "rwak", "msak", "rsak"].includes(actionType) && /ghost/i.test(text(activity?.item?.name ?? activity?.name)); }
function isTactalBreach(activity) { return activityActorName(activity) === "Tactal" && /breach|hold open|armor/i.test(text(activity?.item?.name ?? activity?.name)); }
function isLawsonMatilda(activity) { return text(activityActorName(activity)).toLowerCase() === "lawson" && /matilda/i.test(text(activity?.item?.name ?? activity?.name)); }
function installActivityListeners() { if (!globalThis.Hooks) return; Hooks.on("dnd5e.rollSkill", (rolls, data = {}) => { const skill = text(data.skill).toLowerCase(); const actorName = text(data.subject?.name).toLowerCase(); const total = Number(rolls?.[0]?.total ?? rolls?.[0]?.result ?? 0); if (skill === "slt" && actorName === "aleister") void requestBossAction("removeWeaknessPin", { total }); if (skill === "ath" && actorName === "tactal") void requestBossAction("resolveFinalBreachRoll", { total, skill, tokenUuid: data.subject?.uuid ?? null }); }); Hooks.on("dnd5e.rollAbilityCheck", (rolls, data = {}) => { if (text(data.ability).toLowerCase() !== "str" || text(data.subject?.name).toLowerCase() !== "tactal") return; const total = Number(rolls?.[0]?.total ?? rolls?.[0]?.result ?? 0); void requestBossAction("resolveFinalBreachRoll", { total, ability: "str", tokenUuid: data.subject?.uuid ?? null }); }); Hooks.on("dnd5e.postUseActivity", (activity, _usageConfig, _results) => { if (isAndrewPrecisionStrike(activity)) { const state = getState(); if (state.active && state.phase === PHASES.SEPARATION && state.transmitterExposed) void requestBossAction("severTransmitter"); if (state.active && state.phase === PHASES.BREACH_OPEN) { if (isAndrewGhostStrike(activity)) void requestBossAction("strikeCore"); else void requestBossAction("resetFinalBreachSequence", { reason: "Andrew fires the wrong weapon. The final plating slams shut. Tactal must begin again." }); } } if (isTactalBreach(activity)) { const state = getState(); if (state.active && state.phase === PHASES.CRITICAL_FAILURE) notify("Tactal must pass a Strength or Athletics check to remove the final plating."); } if (isLawsonMatilda(activity)) { const state = getState(); if (state.active && state.phase === PHASES.WEAKNESS_EXPOSURE) void requestBossAction("resolveWeaknessShot"); } }); }
async function reconcileReactivePlating() { if (!activeGM()) return; const actor = actorByRole("prime-arachnid"); const tempHp = Number(actor?.system?.attributes?.hp?.temp); if (!Number.isFinite(tempHp)) return; return updateState(state => { state.shieldTempHp = Math.max(0, tempHp); if (state.active && state.phase === PHASES.SHIELDED && tempHp <= 0) beginReactivePlating(state); return state; }, { announce: true }); }

function renderDialogContentLegacy() {
  const state = getState();
  const disabled = !state.active;
  const puzzles = Object.values(state.puzzles);
  const plating = state.phase === PHASES.REACTIVE_PLATING ? `ONLINE · ${state.puzzlesComplete}/6` : state.plating.disabled ? "OFFLINE" : "STANDBY";
  const puzzleBindings = puzzles.map(puzzle => `<button type="button" class="boss-engine-node" data-action="bind-puzzle" data-kind="${puzzle.kind}" data-index="${puzzle.index}">Selected Door → ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? "Redirect" : "Timing"} ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? puzzle.index : puzzle.index - 3}</button>`).join("");
  return `<div class="boss-engine-panel"><div class="boss-engine-status"><strong>Phase:</strong> ${escapeHTML(state.phase)} <span><strong>Round:</strong> ${state.round}</span></div><div class="boss-engine-meters"><span>Aegis shell ${Math.max(0, state.shieldTempHp)}/${state.shieldTempMax}</span><span>Plating ${plating}</span><span>Weakness ${state.weaknessExposed ? "EXPOSED" : "COVERED"}</span><span>LINK ${state.linkLoad}/${state.linkLoadMax}${state.linkSaturated ? " SATURATED" : ""}</span><span>Directive ${state.directiveHp}/${state.directiveMaxHp}</span><span>Arachnid ${state.arachnidHp}/${state.arachnidMaxHp}</span></div><p class="boss-engine-event">${escapeHTML(state.lastEvent ?? "Ready.")}</p><h4>Region Setup</h4><small>The six supplied Regions are auto-configured when the encounter starts: stations 1–3 are Sprocket's Redirect/Laser Grid puzzles, stations 4–6 are Dalton's Timing Dial puzzles, with the LINK Console and Directive Arena remaining separate.</small><div class="boss-engine-node-grid"><button type="button" data-action="create-default-regions">Repair known Regions / create missing defaults</button></div><h4>Six Reactive Plating Puzzles</h4><small>Bind each puzzle Door to its station once. When the correct character enters a station during Reactive Plating, the matching puzzle opens automatically. Completion listeners mark the station solved.</small><div class="boss-engine-node-grid">${puzzleBindings}</div><div class="boss-engine-actions"><button type="button" data-action="start" ${state.active ? "disabled" : ""}>Start / Resume</button><button type="button" data-action="reset">Reset Encounter</button><button type="button" data-action="advance-round" ${disabled ? "disabled" : ""}>Advance Round</button><button type="button" data-action="open-breach" ${state.phase !== PHASES.CRITICAL_FAILURE ? "disabled" : ""}>Tactal: Breach Armor</button><button type="button" data-action="core-strike" ${state.phase !== PHASES.BREACH_OPEN ? "disabled" : ""}>Andrew: Strike Core</button></div><div class="boss-engine-actions"><button type="button" data-action="add-link" ${state.phase !== PHASES.SEPARATION ? "disabled" : ""}>+ LINK LOAD</button><button type="button" data-action="vector" ${state.phase !== PHASES.SEPARATION || state.vectorEvasionSpent ? "disabled" : ""}>Andrew: Spend Vector Evasion</button><button type="button" data-action="anchor" ${state.phase !== PHASES.SEPARATION || !state.vectorEvasionSpent ? "disabled" : ""}>Tactal: Anchor Directive</button><button type="button" data-action="expose" ${!(state.phase === PHASES.SEPARATION && state.linkSaturated && state.anchor.active) ? "disabled" : ""}>Expose Transmitter</button></div><h4>Lair Actions — Initiative 20</h4><small>Choose one per round. These create pressure and movement without restoring HP, shell, plating, or core progress.</small><div class="boss-engine-actions"><button type="button" data-action="lair" data-kind="relayArc" ${disabled ? "disabled" : ""}>Lair: Relay Arc</button><button type="button" data-action="lair" data-kind="ventSteam" ${disabled ? "disabled" : ""}>Lair: Vent Steam</button><button type="button" data-action="lair" data-kind="containmentShift" ${disabled ? "disabled" : ""}>Lair: Containment Shift</button></div><small>Normal boss actions, bonus actions, legendary actions, lair saves, and movement remain manual. The engine owns shell/plating listeners, puzzle counts, weakness exposure, LINK load, Vector/Anchor/Sever, DOT ticks, phase transitions, and final destruction.</small></div>`;
}
function renderDialogContent() {
  const state = getState();
  const disabled = !state.active;
  const puzzles = Object.values(state.puzzles);
  const plating = state.phase === PHASES.REACTIVE_PLATING ? `ONLINE ${state.puzzlesComplete}/6` : state.plating.disabled ? "OFFLINE" : "STANDBY";
  const puzzleBindings = puzzles.map(puzzle => `<button type="button" class="boss-engine-node" data-action="bind-puzzle" data-kind="${puzzle.kind}" data-index="${puzzle.index}">${puzzle.doorUuid ? "Rebind" : "Bind"} ${puzzle.owner}: ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? "Redirect" : "Timing"} ${puzzle.kind === PUZZLE_KINDS.REDIRECT ? puzzle.index : puzzle.index - 3}</button>`).join("");
  return `<div class="boss-engine-panel"><div class="boss-engine-status"><strong>Phase:</strong> ${escapeHTML(state.phase)} <span><strong>Round:</strong> ${state.round}</span></div><div class="boss-engine-meters"><span>Aegis shell ${Math.max(0, state.shieldTempHp)}/${state.shieldTempMax}</span><span>Plating ${plating}</span><span>Weakness ${state.weaknessExposed ? "EXPOSED" : "COVERED"}</span><span>LINK ${state.linkLoad}/${state.linkLoadMax}${state.linkSaturated ? " SATURATED" : ""}</span><span>Directive ${state.directiveHp}/${state.directiveMaxHp}</span><span>Arachnid ${state.arachnidHp}/${state.arachnidMaxHp}</span></div><p class="boss-engine-event">${escapeHTML(state.lastEvent ?? "Ready.")}</p><h4>Region Setup</h4><small>The six supplied Regions auto-configure when the encounter starts: Redirect stations 1-3 belong to Sprocket, Timing stations 4-6 belong to Dalton, and the LINK Console and Directive Arena remain separate.</small><div class="boss-engine-node-grid"><button type="button" data-action="create-default-regions">Repair known Regions / create missing defaults</button></div><h4>Six Reactive Plating Puzzles</h4><small>Each button automatically binds the next configured puzzle Door of the correct type to its assigned station. No Region or Door selection is required. The correct character's entry opens the puzzle automatically.</small><div class="boss-engine-node-grid">${puzzleBindings}</div><div class="boss-engine-actions"><button type="button" data-action="start" ${state.active ? "disabled" : ""}>Start / Resume</button><button type="button" data-action="reset">Reset Encounter</button><button type="button" data-action="advance-round" ${disabled ? "disabled" : ""}>Advance Round</button><button type="button" data-action="open-breach" ${state.phase !== PHASES.CRITICAL_FAILURE ? "disabled" : ""}>Tactal: Breach Armor</button><button type="button" data-action="core-strike" ${state.phase !== PHASES.BREACH_OPEN ? "disabled" : ""}>Andrew: Strike Core</button></div><div class="boss-engine-actions"><button type="button" data-action="add-link" ${state.phase !== PHASES.SEPARATION ? "disabled" : ""}>+ LINK LOAD</button><button type="button" data-action="vector" ${state.phase !== PHASES.SEPARATION || state.vectorEvasionSpent ? "disabled" : ""}>Andrew: Spend Vector Evasion</button><button type="button" data-action="anchor" ${state.phase !== PHASES.SEPARATION || !state.vectorEvasionSpent ? "disabled" : ""}>Tactal: Anchor Directive</button><button type="button" data-action="expose" ${!(state.phase === PHASES.SEPARATION && state.linkSaturated && state.anchor.active) ? "disabled" : ""}>Expose Transmitter</button></div><h4>Lair Actions - Initiative 20</h4><small>Choose one per round. These create pressure and movement without restoring HP, shell, plating, or core progress.</small><div class="boss-engine-actions"><button type="button" data-action="lair" data-kind="relayArc" ${disabled ? "disabled" : ""}>Lair: Relay Arc</button><button type="button" data-action="lair" data-kind="ventSteam" ${disabled ? "disabled" : ""}>Lair: Vent Steam</button><button type="button" data-action="lair" data-kind="containmentShift" ${disabled ? "disabled" : ""}>Lair: Containment Shift</button></div><small>Normal boss actions, bonus actions, legendary actions, lair saves, and movement remain manual. The engine owns shell/plating listeners, puzzle counts, weakness exposure, LINK load, Vector/Anchor/Sever, DOT ticks, phase transitions, and final destruction.</small></div>`;
}

function refreshDialog() { const root = openDialog?.element?.[0] ?? openDialog?.element; if (!root) return; const content = root.querySelector?.(".boss-engine-panel"); if (content) content.outerHTML = renderDialogContent(); bindDialog(root); }
function bindDialog(root) { root.querySelectorAll?.("[data-action]").forEach(button => { if (button.dataset.bound) return; button.dataset.bound = "true"; button.addEventListener("click", async event => { const action = event.currentTarget.dataset.action; try { if (action === "start") await startEncounter(); if (action === "reset") await resetEncounter(); if (action === "advance-round") await advanceRound(); if (action === "add-link") await addLinkLoad(); if (action === "vector") await spendVectorEvasion(); if (action === "anchor") await setAnchor({ active: true }); if (action === "expose") await exposeTransmitter(true); if (action === "open-breach") await openBreach(); if (action === "core-strike") await strikeCore(); if (action === "mark-puzzle") await completePuzzle({ index: Number(event.currentTarget.dataset.index) }); if (action === "lair") await useLairAction({ kind: event.currentTarget.dataset.kind }); if (action === "bind-puzzle") await bindConfiguredPuzzleDoors({ kind: event.currentTarget.dataset.kind, index: Number(event.currentTarget.dataset.index) }); if (action === "configure-selected") await configureSelectedRegion({ role: event.currentTarget.dataset.role, ...(event.currentTarget.dataset.index ? { index: Number(event.currentTarget.dataset.index) } : {}) }); if (action === "create-default-regions") await createEncounterRegions(); } catch (error) { globalThis.ui?.notifications?.error?.(error.message ?? "Boss Engine action failed."); } }); }); }
export function openBossEngine() { if (!globalThis.Dialog) throw new Error("Foundry Dialog is unavailable."); if (openDialog?.rendered) return openDialog.bringToTop?.(); openDialog = new globalThis.Dialog({ title: "Regionwright — Prime Arachnid Boss Engine", content: renderDialogContent(), buttons: { close: { label: "Close", callback: () => undefined } }, render: html => bindDialog(html?.[0] ?? html), close: () => { openDialog = null; } }, { width: 620, classes: ["regionwright", "boss-engine-dialog"] }); openDialog.render(true); return openDialog; }

async function handleSocket(payload, senderId) { if (!payload || typeof payload !== "object") return; if (payload.action === "open-boss-puzzle") { if (!payload.recipientId || payload.recipientId === globalThis.game?.user?.id) void openBossPuzzle(payload).catch(error => globalThis.ui?.notifications?.error?.(error.message ?? "Unable to open the boss puzzle.")); return; } if (payload.action === "state" && payload.sceneUuid === currentScene()?.uuid) { lastState = normalizeState(payload.state); refreshPuzzleMarkers(lastState); refreshDialog(); return; } if (payload.action !== "request" || !activeGM()) return; const methods = { start: startEncounter, reset: resetEncounter, advanceRound, disableShield, addLinkLoad, useLairAction, spendVectorEvasion, setAnchor, exposeTransmitter, severTransmitter, enterSeparation, enterCriticalFailure, openBreach, resolveFinalBreachRoll, resetFinalBreachSequence, strikeCore, destroyArachnid, bindPuzzleDoor, bindSelectedPuzzleDoor, bindConfiguredPuzzleDoors, completePuzzle, markPuzzleComplete, removeWeaknessPin, resolveWeaknessShot, "region-event": handleRegionEventRequest }; const method = methods[payload.request?.action]; if (!method) return; try { const args = payload.request?.action === "region-event" ? { ...(payload.request?.args ?? {}), userId: senderId } : (payload.request?.args ?? {}); await method(args); } catch (error) { globalThis.game?.socket?.emit?.(BOSS_ENGINE_SOCKET, { action: "error", recipientId: senderId, message: error.message }); } }
export function requestBossAction(action, args = {}) { const methods = { start: startEncounter, reset: resetEncounter, advanceRound, disableShield, addLinkLoad, useLairAction, spendVectorEvasion, setAnchor, exposeTransmitter, severTransmitter, enterSeparation, enterCriticalFailure, openBreach, resolveFinalBreachRoll, resetFinalBreachSequence, strikeCore, destroyArachnid, bindPuzzleDoor, bindSelectedPuzzleDoor, bindConfiguredPuzzleDoors, completePuzzle, markPuzzleComplete, removeWeaknessPin, resolveWeaknessShot, "region-event": handleRegionEventRequest }; if (activeGM()) return methods[action]?.(args); globalThis.game?.socket?.emit?.(BOSS_ENGINE_SOCKET, { action: "request", request: { action, args }, userId: globalThis.game?.user?.id }); return null; }

function installHooks() { if (listenersInstalled || !globalThis.Hooks) return; listenersInstalled = true; Hooks.on("updateActor", (actor, changes) => void handleActorUpdate(actor, changes)); installActivityListeners(); Hooks.on("updateCombat", (_combat, changes) => { if (Object.prototype.hasOwnProperty.call(changes ?? {}, "round") && activeGM()) void advanceRound(); }); Hooks.on("canvasReady", () => { lastState = null; refreshDialog(); void reconcileReactivePlating(); refreshPuzzleMarkers(); }); }
export function installBossEngineSocket() { if (socketInstalled || !globalThis.game?.socket?.on) return; socketInstalled = true; globalThis.game.socket.on(BOSS_ENGINE_SOCKET, (payload, senderId) => void handleSocket(payload, senderId)); }
export function installBossEngineControls() { if (controlsInstalled || !globalThis.Hooks) return; controlsInstalled = true; Hooks.on("getSceneControlButtons", controls => { const tool = { name: `${MODULE_ID}-boss-engine`, title: "Prime Arachnid Boss Engine", icon: "fa-solid fa-spider", button: true, visible: Boolean(globalThis.game?.user?.isGM), onChange: () => openBossEngine() }; if (Array.isArray(controls)) { const regions = controls.find(entry => ["region", "regions"].includes(entry?.name)); if (!regions) return; regions.tools ??= []; if (Array.isArray(regions.tools)) { if (!regions.tools.some(entry => entry?.name === tool.name)) regions.tools.push(tool); } else if (!regions.tools[tool.name]) regions.tools[tool.name] = tool; return; } const regions = controls.regions; if (regions?.tools && !regions.tools[tool.name]) regions.tools[tool.name] = tool; }); }
export function installBossEngine() { installHooks(); installBossEngineSocket(); }

// Kept separate from the public API so the state listeners can be exercised
// without booting a full Foundry client. These helpers are intentionally
// read-only references to the same runtime functions used above.
export const bossEngineTest = Object.freeze({
  defaults: () => clone(stateDefaults(null)),
  normalize: value => normalizeState(value, null),
  knownRegionConfig: region => knownConfigForRegion(region),
  handleActorUpdate,
  completePuzzle,
  advanceRound,
  beginReactivePlating: state => beginReactivePlating(state),
  beginSeparation: state => beginSeparation(state)
});

export const bossEngine = Object.freeze({ config: DEFAULT_CONFIG, phases: PHASES, roles: ROLES, ensureActors: ensureBossActors, state: getState, start: startEncounter, reset: resetEncounter, open: openBossEngine, disableShield, addLinkLoad, useLairAction, spendVectorEvasion, setAnchor, exposeTransmitter, severTransmitter, enterSeparation, enterCriticalFailure, openBreach, resolveFinalBreachRoll, resetFinalBreachSequence, strikeCore, advanceRound, addDotEffect, destroyArachnid, bindPuzzleDoor, bindSelectedPuzzleDoor, bindConfiguredPuzzleDoors, completePuzzle, markPuzzleComplete, removeWeaknessPin, resolveWeaknessShot, configureRegion, configureSelectedRegion, createEncounterRegions, configureEncounterRegions, handleRegionEvent, request: requestBossAction });
