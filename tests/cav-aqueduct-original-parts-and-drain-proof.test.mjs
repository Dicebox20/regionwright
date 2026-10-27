import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessCavAqueductPartProof} from "../modules/regionwright/scripts/studio-cav-aqueduct-part-proof.js";
const gear="Item.wDKqETOykWEdKF1Z",handle="Item.nRVZJL9JOwEwfnLq";
const roof="Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001";
const parents="Scene.CAVHU04Scene0001.Region.CAVPARENTNIGHT01";
const screw="Item.CAVBATHSCREW0001";
const fixture=part=>{
 const source=part==="gear"?gear:handle,origin=part==="gear"?roof:parents,
 name=part==="gear"?"Replacement Gear":"Aqueduct Gate Handle",marker=part==="gear"?"chimney-clock-noon":"repaired-drawer",
 id=part==="gear"?"gear1":"handle1";
 return{part,actorId:"hero",regionUuid:origin,
  source:{uuid:source,name,type:"loot",quantity:1},
  claim:{status:"done",sourceUuid:source,actorId:"hero",embeddedItemId:id},
  items:[{actorId:"hero",id,name,type:"loot",quantity:1,sourceUuid:source,originUuid:origin,marker}],
  nightstandRepair:{status:"done",actorId:"repairer",toolSourceUuid:screw},
  screwdriverClaim:{status:"done",actorId:"repairer",sourceUuid:screw,embeddedItemId:"driver1"}};
};
const check=o=>assessCavAqueductPartProof(o);
test("Valid original Roof Clock noon Gear DONE award can be installed mechanically",()=>{
 assert.equal(check(fixture("gear")).ready,true);
});
test("Valid original repaired Parents Nightstand Handle DONE award can be installed",()=>{
 assert.equal(check(fixture("handle")).ready,true);
});
test("Reserved Roof Gear award cannot be consumed even with embedded Item visible",()=>{
 const p=fixture("gear");
 assert.equal(check({...p,claim:{...p.claim,status:"reserved"}}).ready,false);
 assert.equal(check({...p,claim:null}).ready,false);
});
test("Reserved Handle award, fake repair or missing original Screwdriver pickup prevent Handle consumption",()=>{
 const p=fixture("handle");
 for(const o of [{claim:{...p.claim,status:"reserved"}},{nightstandRepair:null},
  {screwdriverClaim:null},{nightstandRepair:{...p.nightstandRepair,status:"reserved"}},
  {screwdriverClaim:{...p.screwdriverClaim,actorId:"other"}}])
  assert.equal(check({...p,...o}).ready,false);
});
test("Duplicate or mismatched embedded Gear/Handle actor Item ID fails closed",()=>{
 for(const part of ["gear","handle"]){
  const p=fixture(part);
  for(const items of [[],[p.items[0],{...p.items[0],id:"copy"}],
    [{...p.items[0],id:"different"}],[{...p.items[0],actorId:"other"}],
    [{...p.items[0],sourceUuid:"Item.fake"}],[{...p.items[0],marker:"fake"}],
    [{...p.items[0],quantity:0}]])
   assert.equal(check({...p,items}).ready,false);
 }
});
test("Wrong original source template, matching Region and user Actor are required",()=>{
 for(const part of ["gear","handle"]){
  const p=fixture(part);
  for(const o of [{source:null},{source:{...p.source,type:"weapon"}},
   {source:{...p.source,quantity:2}},{actorId:"other"},
   {regionUuid:"Scene.fake"},{claim:{...p.claim,sourceUuid:"Item.fake"}}])
   assert.equal(check({...p,...o}).ready,false);
 }
});
test("Unknown part and incomplete original item evidence are denied",()=>{
 assert.equal(check({...fixture("gear"),part:"unknown"}).ready,false);
 assert.equal(check({...fixture("handle"),items:null}).ready,false);
});
test("Original source ties BOTH player and GM Aqueduct part paths to completed grants and committed drain",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-aqueduct-gate.js",import.meta.url),"utf8");
 assert.match(src,/assessCavAqueductPartProof\(\{/);
 assert.match(src,/assessCavDrainedPickupWaterReady\(\{/);
 assert.match(src,/function gateWaterDrained\(\)/);
 assert.match(src,/if\(!gateWaterDrained\(\)\)return "water"/);
 assert.match(src,/const water=gateWaterDrained\(\)/);
 assert.match(src,/sourceCopy\(actor,req\.part\)/);
 assert.match(src,/sourceCopy\(actor,"gear"\),!!sourceCopy\(actor,"handle"\)/);
 assert.ok(src.indexOf('if(!gateWaterDrained())return "water"')<src.indexOf('await r.setFlag(NS,ledger'));
 assert.ok(src.indexOf('const original=sourceCopy(actor,req.part)')<src.indexOf('await actor.deleteEmbeddedDocuments("Item"'));
});
