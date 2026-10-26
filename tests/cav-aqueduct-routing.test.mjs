import test from "node:test";import assert from "node:assert/strict";
import {aqueductPortalsForWater,canCommissionAqueduct,canUnlockForestWell} from "../modules/regionwright/scripts/studio-cav-aqueduct-routing.js";
test("Pond and AQ native ports synchronize only after commissioning while FM Well is independent",()=>{
 assert.deepEqual(aqueductPortalsForWater(false,"open"),{entryEnabled:false,returnEnabled:false,wellReentryUnaffected:true});
 assert.deepEqual(aqueductPortalsForWater(true,"open"),{entryEnabled:true,returnEnabled:true,wellReentryUnaffected:true});
 assert.deepEqual(aqueductPortalsForWater(true,"closed"),{entryEnabled:false,returnEnabled:false,wellReentryUnaffected:true});
});
test("Never commission without both ORIGINAL parts and a real Crooked Man actor",()=>{
 const base={water:{status:"open",pond:"drained",bath:"drained"},gear:{status:"done"},handle:{status:"done"},mechanical:{status:"ready",traversalEnabled:false},allTransitDisabled:true,aqEmpty:true};
 assert.equal(canCommissionAqueduct(base),"crooked-man-actor-needed");
 assert.equal(canCommissionAqueduct({...base,actorReady:true}),"ready");
 assert.equal(canCommissionAqueduct({...base,actorReady:true,handle:null}),"parts-incomplete");
 assert.equal(canCommissionAqueduct({...base,actorReady:true,water:{status:"closed"}}),"water-not-drained");
 assert.equal(canCommissionAqueduct({...base,actorReady:true,existingTransaction:{status:"reserved"}}),"reconcile");
 assert.equal(canCommissionAqueduct({...base,actorReady:true,aqEmpty:false}),"route-unsafe");
});
test("Forest Well is never accessible until verified chase resolution and commissioning",()=>{
 assert.equal(canUnlockForestWell({route:{status:"done"},chase:null}),"chase-not-resolved");
 assert.equal(canUnlockForestWell({route:null,chase:{status:"escaped_pending_well_exit",successes:3}}),"route-not-commissioned");
 assert.equal(canUnlockForestWell({route:{status:"done"},chase:{status:"escaped_pending_well_exit",successes:3}}),"ready");
 assert.equal(canUnlockForestWell({route:{status:"done"},chase:{status:"capture_pending"}}),"chase-not-resolved");
 assert.equal(canUnlockForestWell({route:{status:"done"},chase:{status:"captured",captureCount:1}}),"ready");
 assert.equal(canUnlockForestWell({route:{status:"done"},chase:{status:"captured",captureCount:0}}),"chase-not-resolved");
});
