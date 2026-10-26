import { PUZZLE_API_VERSION } from "./constants.js";
import { LOCKPICK_DIFFICULTIES, clearLockpickDoor, configureLockpickDoor, createLockpickConfig, evaluateLockpickAttempt, openLockpickPuzzle, requestLockpickAttempt, validateLockpickConfig } from "./lockpicking.js";
import { clearRotatingLockDoor, configureRotatingLockDoor, createRotatingLockConfig, openRotatingLockPuzzle, previewRotatingLock } from "./rotating-lock.js";
import { clearLaserGridDoor, configureLaserGridDoor, createLaserGridPuzzleConfig, openLaserGridPuzzle, previewLaserGrid } from "./laser-grid.js";
import { clearTimingDialDoor, configureTimingDialDoor, createTimingDialPuzzleConfig, openTimingDialPuzzle, previewTimingDial } from "./timing-dial.js";
import { clearIngredientMixing, configureIngredientMixing, createIngredientMixingPuzzleConfig, handleRegionEvent as handleIngredientMixingRegionEvent, openIngredientMixingPuzzle, previewIngredientMixing } from "./ingredient-mixing.js";
import { clearSpineMosaic, configureSpineMosaic, createSpineMosaicPuzzleConfig, handleSpineMosaicRegionEvent, openSpineMosaicPuzzle, previewSpineMosaic } from "./spine-mosaic.js";
import { clearSlidingMosaic, configureSlidingMosaic, createSlidingMosaicPuzzleConfig, handleSlidingMosaicRegionEvent, openSlidingMosaicPuzzle, previewSlidingMosaic } from "./sliding-mosaic.js";
import { openStandalonePuzzle, standalonePuzzleCatalog } from "./standalone-puzzles.js";
import {createRosewaterCampaignConfig,evaluateRosewaterCampaignSolution,rotateRosewaterRing,resetRosewaterRings,ROSEWATER_RING_ANGLES_DEGREES} from "./rosewater-campaign-preset.js";
import {createCavBoilerConfig,evaluateCavBoiler,adjustCavBoiler,resetCavBoiler} from "./cav-boiler-campaign-preset.js";
import { puzzleSetupCatalog, openPuzzleSetup } from "./puzzle-hub.js";
import { puzzleHUD } from "./puzzle-hud.js";

export function createPuzzleAPI({ openPuzzleHub }) {
  return Object.freeze({
    version: PUZZLE_API_VERSION,
    catalog: standalonePuzzleCatalog,
    setupCatalog: puzzleSetupCatalog,
    openHub: openPuzzleHub,
    openSetup: openPuzzleSetup,
    openStandalone: openStandalonePuzzle,
    puzzleHUD,
    boilerCampaign: Object.freeze({
      createConfig:createCavBoilerConfig,
      evaluate:evaluateCavBoiler,
      adjust:adjustCavBoiler,
      reset:resetCavBoiler
    }),
    rosewater: Object.freeze({
      createCampaignConfig:createRosewaterCampaignConfig,
      evaluateCampaignSolution:evaluateRosewaterCampaignSolution,
      rotateCampaignRing:rotateRosewaterRing,
      resetCampaignRings:resetRosewaterRings,
      canonicalAnglesDegrees:ROSEWATER_RING_ANGLES_DEGREES
    }),
    lockpicking: Object.freeze({ difficulties: LOCKPICK_DIFFICULTIES, createConfig: createLockpickConfig, validateConfig: validateLockpickConfig, evaluate: evaluateLockpickAttempt, configureDoor: configureLockpickDoor, clearDoor: clearLockpickDoor, open: openLockpickPuzzle, request: requestLockpickAttempt }),
    rotatingLock: Object.freeze({ createConfig: createRotatingLockConfig, configureDoor: configureRotatingLockDoor, clearDoor: clearRotatingLockDoor, open: openRotatingLockPuzzle, preview: previewRotatingLock }),
    laserGrid: Object.freeze({ createConfig: createLaserGridPuzzleConfig, configureDoor: configureLaserGridDoor, clearDoor: clearLaserGridDoor, open: openLaserGridPuzzle, preview: previewLaserGrid }),
    timingDial: Object.freeze({ createConfig: createTimingDialPuzzleConfig, configureDoor: configureTimingDialDoor, clearDoor: clearTimingDialDoor, open: openTimingDialPuzzle, preview: previewTimingDial }),
    ingredientMixing: Object.freeze({ createConfig: createIngredientMixingPuzzleConfig, configure: configureIngredientMixing, clear: clearIngredientMixing, open: openIngredientMixingPuzzle, preview: previewIngredientMixing, handleRegionEvent: handleIngredientMixingRegionEvent }),
    spineMosaic: Object.freeze({ createConfig: createSpineMosaicPuzzleConfig, configure: configureSpineMosaic, clear: clearSpineMosaic, open: openSpineMosaicPuzzle, preview: previewSpineMosaic, handleRegionEvent: handleSpineMosaicRegionEvent }),
    slidingMosaic: Object.freeze({ createConfig: createSlidingMosaicPuzzleConfig, configure: configureSlidingMosaic, clear: clearSlidingMosaic, open: openSlidingMosaicPuzzle, preview: previewSlidingMosaic, handleRegionEvent: handleSlidingMosaicRegionEvent })
  });
}
