import { openStandaloneThreeRingReliquaryPuzzle } from "./three-ring-reliquary.js";
import { openStandaloneWaterworksPressurePuzzle } from "./waterworks-pressure.js";
import { openStandaloneLockpickPuzzle } from "./lockpicking.js";
import { openStandaloneRotatingLockPuzzle } from "./rotating-lock.js";
import { openStandaloneLaserGridPuzzle } from "./laser-grid.js";
import { openStandaloneTimingDialPuzzle } from "./timing-dial.js";
import { openStandaloneIngredientMixingPuzzle } from "./ingredient-mixing.js";
import { openStandaloneSpineMosaicPuzzle } from "./spine-mosaic.js";
import { openStandaloneSlidingMosaicPuzzle } from "./sliding-mosaic.js";

const PREFIX = "regionwright:standalone:";

// Reuse the production Studio dialog classes. These sessions have no Scene
// target, never write a document, and only exercise the visual puzzle UI.
export const STANDALONE_PUZZLES = Object.freeze([
  Object.freeze({ id: `${PREFIX}lockpicking`, title: "Tumbler Lock" }),
  Object.freeze({ id: `${PREFIX}rotation-lock`, title: "Rotation Lock" }),
  Object.freeze({ id: `${PREFIX}laser-grid`, title: "Mirror Redirect (Laser Grid)", aliases: ["Mirror Redirect", "Laser Grid"] }),
  Object.freeze({ id: `${PREFIX}timing-dial`, title: "Timing Dial" }),
  Object.freeze({ id: `${PREFIX}ingredient-mixing`, title: "Ingredient Mixing" }),
  Object.freeze({ id: `${PREFIX}spine-mosaic`, title: "Spine Mosaic" }),
  Object.freeze({ id: `${PREFIX}sliding-mosaic`, title: "Sliding Mosaic" }),
  Object.freeze({ id: `${PREFIX}waterworks-pressure`, title: "Waterworks Pressure" }),
  Object.freeze({ id: `${PREFIX}boiler-pressure`, title: "Boiler Pressure (2 valves)" }),
  Object.freeze({ id: `${PREFIX}three-ring-reliquary`, title: "Rosewater Reliquary — Three Rings" })
]);

export const standalonePuzzleCatalog = () => Object.freeze(STANDALONE_PUZZLES.map(puzzle => ({ ...puzzle, targetRequired: false, executable: true, visual: true })));
export const isStandalonePuzzleId = id => STANDALONE_PUZZLES.some(puzzle => puzzle.id === id);

const OPENERS = Object.freeze({
  lockpicking: openStandaloneLockpickPuzzle,
  "rotation-lock": openStandaloneRotatingLockPuzzle,
  "laser-grid": openStandaloneLaserGridPuzzle,
  "timing-dial": openStandaloneTimingDialPuzzle,
  "ingredient-mixing": openStandaloneIngredientMixingPuzzle,
  "spine-mosaic": openStandaloneSpineMosaicPuzzle,
  "sliding-mosaic": openStandaloneSlidingMosaicPuzzle,
  "waterworks-pressure": openStandaloneWaterworksPressurePuzzle,
  "boiler-pressure": () => openStandaloneWaterworksPressurePuzzle({variant:"boiler"}),
  "three-ring-reliquary": openStandaloneThreeRingReliquaryPuzzle
});

export async function openStandalonePuzzle(puzzleId, { seed } = {}) {
  if (!isStandalonePuzzleId(puzzleId)) throw new Error("That standalone Regionwright puzzle is unavailable.");
  const opener = OPENERS[String(puzzleId).slice(PREFIX.length)];
  if (typeof opener !== "function") throw new Error("That visual Regionwright Studio puzzle is unavailable.");
  return opener({ seed });
}

