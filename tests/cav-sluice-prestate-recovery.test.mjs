import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateSluiceRecordedPrestate} from "../modules/regionwright/scripts/studio-cav-water-state.js";
const crank=()=>({version:1,status:"done",sourceUuid:"Item.g3VYdgc1qkgkHGvn",consumedActorItemId:"original-item-id",boxRegionUuid:"Scene.CAVEXT03Scene001.Region.CAVEXT03BOXREG01"});
const initial=()=>({version:1,status:"closed",pond:"full",bath:"full",stage:"initial",source:"cav-sluice-crank-install"});
const water=open=>({version:1,status:open?"open":"closed",pond:open?"drained":"full",bath:open?"drained":"full",stage:"committed",source:"sluice"});
const txn=open=>({version:1,status:"done",operation:open?"open":"close",committedState:open?"open":"closed",next:{status:open?"open":"closed",pond:open?"drained":"full",bath:open?"drained":"full"}});
test("original consumed Crank and recorded first closed/full stage permit authentic initial opening",()=>{
 assert.deepEqual(evaluateSluiceRecordedPrestate({crank:crank(),water:initial()}),{ready:true,reason:"initial-full-stage"});
});
test("interrupted Crank fit with no initial water receipt must fail closed",()=>{
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:null}).reason,"initial-water-receipt-missing");
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank()}).ready,false);
 for(const damaged of [{...crank(),status:"reserved"},{...crank(),consumedActorItemId:null},{...crank(),sourceUuid:"Item.other"},{...crank(),boxRegionUuid:null}])
  assert.equal(evaluateSluiceRecordedPrestate({crank:damaged,water:initial()}).ready,false);
});
test("initial full state must not coexist with previous completed/reserved/stale transitions",()=>{
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:initial(),transaction:txn(false)}).ready,false);
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:initial(),transaction:{status:"reserved"}}).ready,false);
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:{...initial(),source:"debug"}}).ready,false);
});
test("subsequent opened and reclosed states require matching completed GM transaction",()=>{
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:water(true),transaction:txn(true)}).ready,true);
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:water(false),transaction:txn(false)}).ready,true);
 for(const wrong of [null,{...txn(true),status:"reserved"},{...txn(true),operation:"close"},{...txn(true),committedState:"closed"},{...txn(true),next:{...txn(true).next,bath:"full"}}])
  assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:water(true),transaction:wrong}).ready,false);
});
test("conflicting or manually staged water must fail closed",()=>{
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:{...water(true),bath:"full"},transaction:txn(true)}).ready,false);
 assert.equal(evaluateSluiceRecordedPrestate({crank:crank(),water:{...water(true),stage:"water-transition"},transaction:txn(true)}).ready,false);
});
test("real elected-GM water service checks recorded prestate before reserving visuals and teleports",()=>{
 const code=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-water-controller.js",import.meta.url),"utf8");
 assert.match(code,/evaluateSluiceRecordedPrestate\(\{/);
 assert.ok(code.indexOf("evaluateSluiceRecordedPrestate({")<code.indexOf('await region.setFlag(NS,TRANSITION,'));
});
