import test from"node:test";import assert from"node:assert/strict";
import{rosewaterHatchDecision,rosewaterRefillDecision,rosewaterBowlPickupDecision,rosewaterWaterVariantRoute}from"../modules/regionwright/scripts/studio-cav-rosewater-safety.js";
const drained={status:"open",pond:"drained",bath:"drained"},full={status:"closed",pond:"full",bath:"full"};
test("Hatch never opens underwater or without exact solved rings and approved dry route",()=>{
 assert.equal(rosewaterHatchDecision({water:full,ringSolved:true,drainedBathSceneVerified:true,dryBoilerExitVerified:true}),"requires-drained-bath");
 assert.equal(rosewaterHatchDecision({water:drained,ringSolved:false,drainedBathSceneVerified:true,dryBoilerExitVerified:true}),"rings-unsolved");
 assert.equal(rosewaterHatchDecision({water:drained,ringSolved:true,drainedBathSceneVerified:true,dryBoilerExitVerified:false}),"missing-safe-boiler-exit");
 assert.equal(rosewaterHatchDecision({water:drained,ringSolved:true,drainedBathSceneVerified:true,dryBoilerExitVerified:true}),"ready");
});
test("Refill rejects occupied unknown rooms but accepts certified dry escape irrespective of pressure",()=>{
 assert.equal(rosewaterRefillDecision({reliquaryTokenIds:["pc1"]}),"unsafe-occupied-underground");
 assert.equal(rosewaterRefillDecision({reliquaryTokenIds:["pc1"],boilerTokenIds:["pc2"],dryServiceDoorBidirectional:true,dryRoomDestinationsVerified:true,boilerIndependentOfPressure:true}),"safe-via-dry-boiler-exit");
 assert.equal(rosewaterRefillDecision({reliquaryTokenIds:["pc1"],dryServiceDoorBidirectional:true,dryRoomDestinationsVerified:true,boilerIndependentOfPressure:false}),"unsafe-occupied-underground");
 assert.equal(rosewaterRefillDecision({reliquaryTokenIds:["pc1"],pendingTransition:true}),"reconcile");
});
test("Unique Bowl pickup prevents duplicate and unverified world templates",()=>{
 assert.equal(rosewaterBowlPickupDecision({hatchOpen:true,actorInReliquary:true,authenticBowlSource:true}),"ready");
 assert.equal(rosewaterBowlPickupDecision({hatchOpen:true,actorInReliquary:true,authenticBowlSource:false}),"missing-canonical-source");
 assert.equal(rosewaterBowlPickupDecision({claim:{status:"reserved"}}),"reconcile");
 assert.equal(rosewaterBowlPickupDecision({claim:{status:"done"}}),"already-claimed");
});
test("Full water closes pool hatch while existing certified dry Boiler door persists",()=>{
 assert.deepEqual(rosewaterWaterVariantRoute({water:drained,wellDryExitVerified:true}),{poolHatchEnabled:true,dryBoilerExitPersistent:true});
 assert.deepEqual(rosewaterWaterVariantRoute({water:full,wellDryExitVerified:true}),{poolHatchEnabled:false,dryBoilerExitPersistent:true});
 assert.deepEqual(rosewaterWaterVariantRoute({water:drained,wellDryExitVerified:false}),{poolHatchEnabled:false,dryBoilerExitPersistent:false});
});
