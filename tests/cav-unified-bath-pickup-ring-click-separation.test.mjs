import test from"node:test";import {readFileSync} from"node:fs";import assert from"node:assert/strict";
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


// Reproducible scene-coordinate contract from the elected GM's original
// owner-approved drained Bathhouse map, captured 2026-10-26.
// If an owner-approved Region shape moves later, revise this evidence deliberately.
const ORIGINAL_LIVE_SCREWDRIVER_RECT=Object.freeze({x:870,y:710,width:360,height:330});
const STAGED_ROSEWATER_RECT=Object.freeze({x:976,y:826,width:108,height:115});
const inRect=(rect,pt)=>pt.x>rect.x&&pt.x<rect.x+rect.width&&pt.y>rect.y&&pt.y<rect.y+rect.height;

test("Live Rosewater ring hit rectangle is entirely nested inside original broad Screwdriver area",()=>{
 const big=ORIGINAL_LIVE_SCREWDRIVER_RECT,small=STAGED_ROSEWATER_RECT;
 assert.ok(small.x>big.x&&small.y>big.y);
 assert.ok(small.x+small.width<big.x+big.width);
 assert.ok(small.y+small.height<big.y+big.height);
});

test("Actual staged Rosewater center is reserved for ring, not original Screwdriver click",()=>{
 const pt={x:1030,y:883};
 assert.equal(inRect(ORIGINAL_LIVE_SCREWDRIVER_RECT,pt),true);
 assert.equal(inRect(STAGED_ROSEWATER_RECT,pt),true);
 assert.equal(shouldHandleDrainedPickupClick({
  fixtureId:"CAVBATHSCRDRY001",
  insideFixture:inRect(ORIGINAL_LIVE_SCREWDRIVER_RECT,pt),
  insideRosewaterRing:inRect(STAGED_ROSEWATER_RECT,pt)}),false);
});

test("Four independent inside-Screwdriver outside-Rosewater clicks remain eligible",()=>{
 const points=[{x:900,y:750},{x:1200,y:750},{x:900,y:1000},{x:1200,y:1000}];
 for(const pt of points){
  assert.equal(inRect(ORIGINAL_LIVE_SCREWDRIVER_RECT,pt),true);
  assert.equal(inRect(STAGED_ROSEWATER_RECT,pt),false);
  assert.equal(shouldHandleDrainedPickupClick({
   fixtureId:"CAVBATHSCRDRY001",
   insideFixture:true,insideRosewaterRing:false}),true);
 }
});

test("Original runtime click handler resolves exact ring testPoint before requesting a Screwdriver pickup",()=>{
 const text=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-drained-pickups.js",import.meta.url),"utf8");
 const ring=text.indexOf('const ring=canvas.scene?.regions.get("CAVBROSEWATER001")');
 const inside=text.indexOf("const insideRosewaterRing=!!ring?.testPoint");
 const classify=text.indexOf("if(!shouldHandleDrainedPickupClick({fixtureId:region.id,insideFixture,insideRosewaterRing})");
 const request=text.indexOf("cavDrainedPickupRequest:{version:1");
 assert.ok(ring>=0&&inside>ring&&classify>inside&&request>classify);
 assert.ok(text.includes('insideFixture&&!(fixtureId==="CAVBATHSCRDRY001"&&insideRosewaterRing)'));
});