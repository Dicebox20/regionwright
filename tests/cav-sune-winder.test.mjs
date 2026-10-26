import test from "node:test";
import assert from "node:assert/strict";
import {CANON_ORDER,evaluateSuneAttempt} from "../modules/regionwright/scripts/studio-cav-sune.js";
test("approved order",()=>assert.deepEqual(CANON_ORDER,["sw","ne","nw","se"]));
test("valid step advances",()=>{
 for(const [done,key,index] of [[[false,false,false,false],"sw",0],[[true,false,false,false],"ne",1],[[true,true,false,false],"nw",2],[[true,true,true,false],"se",3]])
 assert.deepEqual(evaluateSuneAttempt(done,key),{kind:"advance",next:index});
});
test("wrong order resets including repeats",()=>{
 assert.deepEqual(evaluateSuneAttempt([false,false,false,false],"ne"),{kind:"reset",next:0});
 assert.deepEqual(evaluateSuneAttempt([true,false,false,false],"sw"),{kind:"reset",next:0});
 assert.deepEqual(evaluateSuneAttempt([true,true,false,false],"se"),{kind:"reset",next:0});
});
test("completed and noncontiguous state fail closed",()=>{
 assert.deepEqual(evaluateSuneAttempt([true,true,true,true],"sw"),{kind:"already",next:4});
 assert.deepEqual(evaluateSuneAttempt([true,false,true,false],"ne"),{kind:"reconcile"});
 assert.deepEqual(evaluateSuneAttempt([false,false,false,false],"bogus"),{kind:"deny"});
});

