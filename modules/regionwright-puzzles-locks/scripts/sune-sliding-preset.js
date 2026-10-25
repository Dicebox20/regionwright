import { createSlidingMosaicConfig, shuffledSlidingOrder, evaluateSlidingOrder } from './sliding-mosaic-engine.js';
export const SUNE_SLIDING_IMAGE='modules/regionwright-puzzles-locks/assets/sune-sliding-portrait-master.png';
export const SUNE_SLIDING_SIZE=3;
export function createSuneSlidingConfig(seed='sune-portrait-v1'){return createSlidingMosaicConfig({image:SUNE_SLIDING_IMAGE,size:SUNE_SLIDING_SIZE,seed});}
export function startSuneSlidingGame(seed='sune-portrait-player'){return shuffledSlidingOrder(createSuneSlidingConfig(),seed);}
export function checkSuneSlidingGame(order){return evaluateSlidingOrder(createSuneSlidingConfig(),order);}
