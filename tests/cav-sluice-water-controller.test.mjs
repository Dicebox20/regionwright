import test from "node:test";
import assert from "node:assert/strict";
import {evaluateSluicePositionSafety} from "../modules/regionwright/scripts/studio-cav-water-controller.js";
test("no tokens is safe",()=>assert.deepEqual(evaluateSluicePositionSafety(),{ok:true,reason:"clear"}));
test("Bathhouse occupancy prevents either stage",()=>{
 assert.equal(evaluateSluicePositionSafety({fullBathTokens:["pc1"]}).reason,"bathhouse-occupied");
 assert.equal(evaluateSluicePositionSafety({dryBathTokens:["pc2"]}).ok,false);
});
test("Pond token outside safe exterior control blocks open and close",()=>{
 assert.deepEqual(evaluateSluicePositionSafety({pondTokens:["a","b"],safePondTokenIds:["a"]}),{ok:false,reason:"pond-hazard"});
 assert.equal(evaluateSluicePositionSafety({pondTokens:["a"],safePondTokenIds:["a"]}).ok,true);
});

