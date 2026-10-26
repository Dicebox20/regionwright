import test from"node:test";import assert from"node:assert/strict";
import {assessUnifiedRosewaterActivation,assessUnifiedBathBowlClaim} from "../modules/regionwright/scripts/studio-cav-rosewater-safety.js";
const water={status:"open",pond:"drained",bath:"drained"};
const common={water,filledSceneVerified:true,drainedSceneVerified:true,ringRegionVerified:true,
 approvedFourSymbols:true,screwdriverClickSeparationVerified:true};
test("Unified Rosewater may not activate without owner symbols, click separation and drained state",()=>{
 assert.equal(assessUnifiedRosewaterActivation(common),"ready");
 assert.equal(assessUnifiedRosewaterActivation({...common,approvedFourSymbols:false}),"awaiting-approved-regionwright-symbols");
 assert.equal(assessUnifiedRosewaterActivation({...common,screwdriverClickSeparationVerified:false}),"screwdriver-hit-zone-unverified");
 assert.equal(assessUnifiedRosewaterActivation({...common,water:null}),"requires-drained-bath");
 assert.equal(assessUnifiedRosewaterActivation({...common,ringRegionVerified:false}),"missing-unified-bath-fixture");
 assert.equal(assessUnifiedRosewaterActivation({...common,existingRingSession:{status:"reserved"}}),"reconcile");
});
test("Original Bowl cannot be granted without owner-approved on-map pickup location",()=>{
 assert.equal(assessUnifiedBathBowlClaim(),"owner-pickup-fixture-undecided");
 assert.equal(assessUnifiedBathBowlClaim({approvedPickupRegionId:"R",clickedRegionId:"else"}),"not-at-approved-bowl-fixture");
 assert.equal(assessUnifiedBathBowlClaim({approvedPickupRegionId:"R",clickedRegionId:"R",actorAtRegion:true,claim:{status:"done"}}),"already-claimed");
});
