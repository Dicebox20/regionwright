import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessCavSuccessorPickup,assessCavNightstandRepairProof} from "../modules/regionwright/scripts/studio-cav-successor-pickup-proof.js";
const ns="dicebox-campaign-helper";
const W="Item.CAVWEATHERKEY001",D="Item.CAVBATHSCREW0001";
const W_ORIGIN="Scene.CAVEXT02Scene001.Region.CAVPONDWEATHER01";
const D_ORIGIN="Scene.8yLMRDvxyw58dydh.Region.CAVBATHSCRDRY001";
const configs={
 weather:{source:W,origin:W_ORIGIN,name:"Weathered Key",itemId:"weather-item"},
 screwdriver:{source:D,origin:D_ORIGIN,name:"Screwdriver",itemId:"driver-item"}
};
const fixture=kind=>{
 const v=configs[kind];
 return {kind,actorId:"hero",regionUuid:v.origin,
 source:{uuid:v.source,name:v.name,type:"loot",quantity:1},
 claim:{status:"done",sourceUuid:v.source,actorId:"hero",embeddedItemId:v.itemId},
 items:[{actorId:"hero",id:v.itemId,name:v.name,type:"loot",quantity:1,
 sourceUuid:v.source,originUuid:v.origin,markerUuid:v.source}]};
};
test("Authentic original Weathered Key completed pickup unlocks basement prerequisite",()=>{
 assert.deepEqual(assessCavSuccessorPickup(fixture("weather")),{ready:true,reason:"original-once-only-pickup-receipt-verified",itemId:"weather-item"});
});
test("Authentic original Screwdriver completed pickup repairs Parents Nightstand prerequisite",()=>{
 assert.equal(assessCavSuccessorPickup(fixture("screwdriver")).ready,true);
});
test("An Item created while pickup claim remains reserved cannot be used in either downstream action",()=>{
 for(const kind of Object.keys(configs)){
  const p=fixture(kind);
  for(const claim of [null,{...p.claim,status:"reserved"},{...p.claim,status:"unknown"}])
   assert.equal(assessCavSuccessorPickup({...p,claim}).ready,false);
 }
});
test("Claim marked DONE without original embedded Item is not proof, even if actor owns untagged Item",()=>{
 for(const kind of Object.keys(configs)){
  const p=fixture(kind);
  assert.equal(assessCavSuccessorPickup({...p,items:[]}).ready,false);
  assert.equal(assessCavSuccessorPickup({...p,items:[{...p.items[0],markerUuid:null}]}).ready,false);
  assert.equal(assessCavSuccessorPickup({...p,claim:{...p.claim,embeddedItemId:"another"}}).ready,false);
 }
});
test("Duplicate original tagged Items fail closed across all Actors",()=>{
 for(const kind of Object.keys(configs)){
  const p=fixture(kind);
  assert.equal(assessCavSuccessorPickup({...p,items:[p.items[0],{...p.items[0],actorId:"other",id:"copy"}]}).reason,"duplicate-original-pickup-items");
 }
});
test("Different Actor, transferred Item ID and corrupted pickup origin require manual reconciliation",()=>{
 for(const kind of Object.keys(configs)){
  const p=fixture(kind);
  for(const wrong of [
   {actorId:"other"}, {items:[{...p.items[0],actorId:"other"}]},
   {items:[{...p.items[0],originUuid:"Scene.fake"}]},
   {regionUuid:"Scene.other"}, {items:[{...p.items[0],quantity:0}]}])
   assert.equal(assessCavSuccessorPickup({...p,...wrong}).ready,false);
 }
});
test("Wrong world Item template, type, name and quantity do not grant downstream access",()=>{
 for(const kind of Object.keys(configs)){
  const p=fixture(kind);
  for(const source of [null,{...p.source,uuid:"Item.forged"},{...p.source,name:"Other Key"},
   {...p.source,type:"weapon"},{...p.source,quantity:0}])
   assert.equal(assessCavSuccessorPickup({...p,source}).ready,false);
 }
});
test("Handle claim requires actual original completed Screwdriver pickup and original completed repair",()=>{
 const p={repair:{status:"done",actorId:"hero",toolSourceUuid:D},
  screwdriverClaim:fixture("screwdriver").claim};
 assert.deepEqual(assessCavNightstandRepairProof(p),{ready:true,reason:"original-screwdriver-and-repair-completed"});
 for(const overrides of [{repair:null},{repair:{...p.repair,status:"reserved"}},{repair:{...p.repair,toolSourceUuid:"Item.other"}},
  {screwdriverClaim:null},{screwdriverClaim:{...p.screwdriverClaim,status:"reserved"}},
  {screwdriverClaim:{...p.screwdriverClaim,actorId:"other"}}])
 assert.equal(assessCavNightstandRepairProof({...p,...overrides}).ready,false);
});
test("GM Basement Weathered Key and Nightstand Screwdriver checks both call the same pure preflight",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-basement-nightstand.js",import.meta.url),"utf8");
 assert.match(src,/assessCavSuccessorPickup\(\{/);
 assert.match(src,/assessCavNightstandRepairProof\(\{repair,screwdriverClaim:driverPickup\}\)/);
 assert.match(src,/exactItem\(c.actor,WEATHER,"Weathered Key"/);
 assert.match(src,/exactItem\(c.actor,DRIVER,"Screwdriver"/);
 assert.match(src,/cavDrainedPickupClaim/);
 assert.ok(src.indexOf("assessCavSuccessorPickup({")<src.indexOf('await c.region.setFlag(NS,KEY_FLAG'));
 assert.ok(src.indexOf("assessCavNightstandRepairProof({repair,screwdriverClaim:driverPickup})")<src.indexOf('await c.region.setFlag(NS,CLAIM'));
});
test("Client Basement / Nightstand click eligibility also reuses the same validated pickup item",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-basement-nightstand.js",import.meta.url),"utf8");
 assert.match(src,/basementDecision\(region.getFlag\(NS,KEY_FLAG\),!!c&&!!exactItem/);
 assert.match(src,/if\(c&&stage==="repair"&&exactItem\(c.actor,DRIVER/);
 assert.match(src,/cavBasementNightstandRequest/);
});
