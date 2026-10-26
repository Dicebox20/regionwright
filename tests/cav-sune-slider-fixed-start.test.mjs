import test from "node:test";
import assert from "node:assert/strict";
import {createSlidingMosaicConfig,shuffledSlidingOrder} from "../modules/regionwright-puzzles-locks/scripts/sliding-mosaic-engine.js";
import {createSuneSlidingConfig,SUNE_SLIDING_INITIAL_ORDER} from "../modules/regionwright-puzzles-locks/scripts/sune-sliding-preset.js";
test("Sune fixed canonical 3x3 start",()=>{
 const config=createSuneSlidingConfig();
 assert.equal(config.size,3);
 assert.deepEqual(config.initialOrder,[4,5,1,2,0,8,7,6,3]);
 assert.deepEqual(shuffledSlidingOrder(config,"random-seed"),SUNE_SLIDING_INITIAL_ORDER);
});
test("reject malformed and unsolvable fixed orders",()=>{
 assert.throws(()=>createSlidingMosaicConfig({image:"x",size:3,initialOrder:[1,2,3,4,5,6,8,7,0]}),/solvable/);
 assert.throws(()=>createSlidingMosaicConfig({image:"x",size:3,initialOrder:[1,2,3,4,5,6,7,7,0]}),/Invalid/);
});
test("existing puzzles still shuffle when unspecified",()=>{
 const c=createSlidingMosaicConfig({image:"x",size:4,seed:"test"});
 assert.equal("initialOrder" in c,false);
 assert.equal(shuffledSlidingOrder(c,"random").length,16);
});
