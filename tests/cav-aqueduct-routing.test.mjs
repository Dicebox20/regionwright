import test from "node:test";import assert from "node:assert/strict";
import {aqueductPortalsForWater,canCommissionAqueduct,canUnlockForestWell} from "../modules/regionwright/scripts/studio-cav-aqueduct-routing.js";
test("Pond and AQ travel synchronize with water; Forest Well reentry remains independently open",()=>{
 assert.deepEqual(aqueductPortalsForWater(false,"open"),{entryEnabled:false,returnEnabled:false,wellReentryUnaffected:true});
 assert.deepEqual(aqueductPortalsForWater(true,"open"),{entryEnabled:true,returnEnabled:true,wellReentryUnaffected:true});
 assert.deepEqual(aqueductPortalsForWater(true,"closed"),{entryEnabled:false,returnEnabled:false,wellReentryUnaffected:true});
});
test("Original physical Gear and Handle plus true drained water commission without Crooked Man Actor",()=>{
 const base={water:{status:"open",pond:"drained",bath:"drained"},gear:{status:"done"},handle:{status:"done"},
  mechanical:{status:"ready",traversalEnabled:false},allTransitDisabled:true,aqEmpty:true};
 assert.equal(canCommissionAqueduct(base),"ready");
 assert.equal(canCommissionAqueduct({...base,actorReady:false}),"ready");
 assert.equal(canCommissionAqueduct({...base,handle:null}),"parts-incomplete");
 assert.equal(canCommissionAqueduct({...base,gear:{status:"reserved"}}),"parts-incomplete");
 assert.equal(canCommissionAqueduct({...base,water:{status:"closed"}}),"water-not-drained");
 assert.equal(canCommissionAqueduct({...base,existingTransaction:{status:"reserved"}}),"reconcile");
 assert.equal(canCommissionAqueduct({...base,aqEmpty:false}),"route-unsafe");
 assert.equal(canCommissionAqueduct({...base,allTransitDisabled:false}),"route-unsafe");
});
test("Original Forest Well unlock depends on physical Northern Aqueduct arrival, not Crooked Man",()=>{
 const route={version:1,status:"done",source:"original-aqueduct-gear-handle-sluice"};
 assert.equal(canUnlockForestWell({route,northReached:false}),"north-aqueduct-not-reached");
 assert.equal(canUnlockForestWell({route,northReached:true}),"ready");
 assert.equal(canUnlockForestWell({route,northReached:true,chase:null}),"ready");
 assert.equal(canUnlockForestWell({route:null,northReached:true}),"route-not-commissioned");
 assert.equal(canUnlockForestWell({route:{...route,status:"reserved"},northReached:true}),"route-not-commissioned");
 assert.equal(canUnlockForestWell({route:{...route,source:"crooked-man-chase"},northReached:true}),"route-not-commissioned");
 assert.equal(canUnlockForestWell({route:{...route,version:2},northReached:true}),"route-not-commissioned");
 assert.equal(canUnlockForestWell({route,alreadyUnlocked:true,northReached:false}),"already");
});