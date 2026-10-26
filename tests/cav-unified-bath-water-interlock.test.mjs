import test from "node:test";import assert from "node:assert/strict";
import{assessUnifiedBathFixtures,UNIFIED_BATH_SHARED_FIXTURE_IDS,UNIFIED_BATH_ROSEWATER_ID}from"../modules/regionwright/scripts/studio-cav-unified-bath-interlock.js";
const shape=[{type:"rectangle",x:10,y:20,width:100,height:80}];
const rec=(id,extra={})=>({id,fixtureKey:id,phase:"PASSIVE_GM_REVIEW",shapes:shape,...extra});
const good=()=>({filled:{id:"CAVBATHScene0001",width:2160,height:1440,regions:UNIFIED_BATH_SHARED_FIXTURE_IDS.map(id=>rec(id))},
drained:{id:"8yLMRDvxyw58dydh",width:2160,height:1440,regions:[...UNIFIED_BATH_SHARED_FIXTURE_IDS.map(id=>rec(id)),rec(UNIFIED_BATH_ROSEWATER_ID,{fixtureKey:"rosewater-ring-main-drain"})]}});
test("Valid unified Bathhouse pair permits water-stage inspection",()=>assert.equal(assessUnifiedBathFixtures(good()).ok,true));
test("Missing/duplicate fixture or wrong variant does not silently reuse old underground-scene plan",()=>{
 let x=good();x.drained.regions.pop();assert.equal(assessUnifiedBathFixtures(x).reason,"drained-ring-missing");
 x=good();x.filled.regions[0].shapes=[{...shape[0],x:999}];assert.equal(assessUnifiedBathFixtures(x).reason,"unified-fixture-mismatch");
 x=good();x.filled.regions.push(rec(UNIFIED_BATH_ROSEWATER_ID));assert.equal(assessUnifiedBathFixtures(x).reason,"ring-present-on-filled-map");
 x=good();x.drained.regions.splice(1,1);assert.equal(assessUnifiedBathFixtures(x).reason,"unified-fixture-mismatch");
});
test("Staged or uncertain ring session blocks water transitions; solved state never overrides occupied-token check",()=>{
 let x=good();x.drained.regions.at(-1).sessionStatus="reserved";assert.equal(assessUnifiedBathFixtures(x).reason,"rosewater-session-pending");
 x=good();x.drained.regions.at(-1).sessionStatus="done";assert.equal(assessUnifiedBathFixtures(x).ok,true);
});
