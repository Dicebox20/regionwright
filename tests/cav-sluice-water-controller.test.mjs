import test from "node:test";
import assert from "node:assert/strict";
import {evaluateSluicePositionSafety,sluiceGateRouteInterlock} from "../modules/regionwright/scripts/studio-cav-water-controller.js";
test("no tokens is safe",()=>assert.deepEqual(evaluateSluicePositionSafety(),{ok:true,reason:"clear"}));
test("Bathhouse occupancy prevents either stage",()=>{
 assert.equal(evaluateSluicePositionSafety({fullBathTokens:["pc1"]}).reason,"bathhouse-occupied");
 assert.equal(evaluateSluicePositionSafety({dryBathTokens:["pc2"]}).ok,false);
});
test("Pond token outside safe exterior control blocks open and close",()=>{
 assert.deepEqual(evaluateSluicePositionSafety({pondTokens:["a","b"],safePondTokenIds:["a"]}),{ok:false,reason:"pond-hazard"});
 assert.equal(evaluateSluicePositionSafety({pondTokens:["a"],safePondTokenIds:["a"]}).ok,true);
});


test("Aqueduct occupancy blocks unsafe sluice close even if Pond and baths empty",()=>{
 assert.equal(evaluateSluicePositionSafety({aqueductTokens:["pc1"]}).reason,"aqueduct-occupied");
 assert.equal(evaluateSluicePositionSafety({aqueductTokens:[]}).ok,true);
});

test("Live Aqueduct passage conservatively locks sluice stage pending route synchronization",()=>{
 assert.equal(sluiceGateRouteInterlock({traversalEnabled:true}),false);
 assert.equal(sluiceGateRouteInterlock({traversalEnabled:true},{status:"reserved"}),false);
 assert.equal(sluiceGateRouteInterlock({traversalEnabled:true},{status:"done"}),true);
 assert.equal(sluiceGateRouteInterlock({traversalEnabled:false}),true);
 assert.equal(sluiceGateRouteInterlock(null),true);
});
