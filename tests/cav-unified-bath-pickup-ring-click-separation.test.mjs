import test from"node:test";import assert from"node:assert/strict";
import{shouldHandleDrainedPickupClick,drainedPickupDecision}from"../modules/regionwright/scripts/studio-cav-drained-pickups.js";
test("Existing screwdriver remains clickable anywhere outside the smaller Rosewater ring",()=>{
 assert.equal(shouldHandleDrainedPickupClick({fixtureId:"CAVBATHSCRDRY001",insideFixture:true,insideRosewaterRing:false}),true);
 assert.equal(shouldHandleDrainedPickupClick({fixtureId:"CAVBATHSCRDRY001",insideFixture:true,insideRosewaterRing:true}),false);
 assert.equal(shouldHandleDrainedPickupClick({fixtureId:"CAVBATHSCRDRY001",insideFixture:false}),false);
});
test("Weathered Key pickup retains independent click behavior and old pickup decisions",()=>{
 assert.equal(shouldHandleDrainedPickupClick({fixtureId:"CAVPONDWEATHER01",insideFixture:true,insideRosewaterRing:true}),true);
 assert.equal(drainedPickupDecision("open",null),"ready");
 assert.equal(drainedPickupDecision("open",{status:"done"}),"already");
});
