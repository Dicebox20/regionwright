import test from"node:test";import assert from"node:assert/strict";
import{rosewaterHatchDecision,rosewaterRefillDecision,rosewaterBowlPickupDecision,rosewaterWaterVariantRoute,validateRosewaterOriginalBowlTemplate,ORIGINAL_SCRYING_BOWL_ITEM_UUID}from"../modules/regionwright/scripts/studio-cav-rosewater-safety.js";
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
const originalBowl=Object.freeze({id:"1n5LONw3nYIy61O9",name:"Sune's Scrying Bowl",
 type:"loot",system:{quantity:1},flags:{"dicebox-campaign-helper":{cabinPuzzleItem:{
 source:"2026-10-24-approved-puzzle-chain",status:"GM_LIBRARY_ONLY"}}}});
test("Unique Bowl pickup only accepts EXACT offline-verified original world UUID and provenance",()=>{
 assert.equal(ORIGINAL_SCRYING_BOWL_ITEM_UUID,"Item.1n5LONw3nYIy61O9");
 assert.equal(validateRosewaterOriginalBowlTemplate(originalBowl),"verified");
 assert.equal(rosewaterBowlPickupDecision({hatchOpen:true,actorInReliquary:true,bowlTemplate:originalBowl}),"ready");
 assert.equal(rosewaterBowlPickupDecision({hatchOpen:true,actorInReliquary:true,authenticBowlSource:true}),"missing-canonical-source");
 assert.equal(rosewaterBowlPickupDecision({hatchOpen:true,actorInReliquary:true,bowlTemplate:{...originalBowl,id:"OtherBowl00001"}}),"missing-canonical-source");
 assert.equal(rosewaterBowlPickupDecision({hatchOpen:true,actorInReliquary:true,bowlTemplate:{...originalBowl,system:{quantity:2}}}),"missing-canonical-source");
 assert.equal(rosewaterBowlPickupDecision({claim:{status:"reserved"}}),"reconcile");
 assert.equal(rosewaterBowlPickupDecision({claim:{status:"done"}}),"already-claimed");
});
test("Full water closes pool hatch while existing certified dry Boiler door persists",()=>{
 assert.deepEqual(rosewaterWaterVariantRoute({water:drained,wellDryExitVerified:true}),{poolHatchEnabled:true,dryBoilerExitPersistent:true});
 assert.deepEqual(rosewaterWaterVariantRoute({water:full,wellDryExitVerified:true}),{poolHatchEnabled:false,dryBoilerExitPersistent:true});
 assert.deepEqual(rosewaterWaterVariantRoute({water:drained,wellDryExitVerified:false}),{poolHatchEnabled:false,dryBoilerExitPersistent:false});
});
