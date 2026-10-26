import test from "node:test";
import assert from "node:assert/strict";
import {INITIAL_CAV_WATER_STATE,normalizeCavWaterState,planCavWaterChange} from "../modules/regionwright/scripts/studio-cav-water-state.js";
const ready={crankInstalled:true,pondVisualApproved:true,bathVisualApproved:true,tokenPositionsSafe:true,returnRoutesSafe:true,originalRegionReady:true};
test("initial canonical shared water is closed and full in both scenes",()=>{
 assert.deepEqual(normalizeCavWaterState(),INITIAL_CAV_WATER_STATE);
});
test("sluice open and close modify both water levels together",()=>{
 const opened=planCavWaterChange({action:"open",...ready});
 assert.equal(opened.result,"ready");assert.deepEqual([opened.next.status,opened.next.pond,opened.next.bath],["open","drained","drained"]);
 const closed=planCavWaterChange({action:"close",current:opened.next,...ready});
 assert.equal(closed.result,"ready");assert.deepEqual([closed.next.status,closed.next.pond,closed.next.bath],["close","full","full"].map((v,i)=>i===0?"closed":v));
});
test("no original crank or unapproved Bath visual blocks change",()=>{
 assert.equal(planCavWaterChange({action:"open",...ready,crankInstalled:false}).result,"blocked-crank-or-region");
 assert.equal(planCavWaterChange({action:"open",...ready,bathVisualApproved:false}).result,"blocked-unapproved-visuals");
});
test("unsafe character placements/return routes retain previous stage",()=>{
 const pending=planCavWaterChange({action:"open",...ready,tokenPositionsSafe:false});
 assert.equal(pending.result,"pending-safety");assert.deepEqual(pending.current,INITIAL_CAV_WATER_STATE);assert.equal("next" in pending,false);
});
test("cannot invent discordant Pond/Bath or reopen already open gate",()=>{
 assert.throws(()=>normalizeCavWaterState({version:1,status:"open",pond:"drained",bath:"full"}),/Pond\/Bath/);
 const opened=planCavWaterChange({action:"open",...ready}).next;
 assert.equal(planCavWaterChange({action:"open",current:opened,...ready}).result,"already-at-target");
});

