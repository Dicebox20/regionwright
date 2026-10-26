import test from "node:test";import assert from "node:assert/strict";import{drainedPickupDecision}from"../modules/regionwright/scripts/studio-cav-drained-pickups.js";
test("reward is hidden until water drained",()=>assert.equal(drainedPickupDecision("closed"),"hidden"));
test("once only + reserved reconciliation",()=>{
 assert.equal(drainedPickupDecision("open",undefined),"ready");
 assert.equal(drainedPickupDecision("open",{status:"done"}),"already");
 assert.equal(drainedPickupDecision("open",{status:"reserved"}),"reconcile");
});
