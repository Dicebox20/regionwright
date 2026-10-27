import test from "node:test";
import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
import {assessCavStudyDoorUnlock} from "../modules/regionwright/scripts/studio-cav-study-door-preflight.js";
const key="Item.CAVSTUDYBRASS001",grove="Scene.CAVSG05Scene0001.Region.L15BdSqcbCOLPnIN",target="Scene.CAVHG05Scene0001.Region.CAVB9AA3D7BE9560";
const fresh=()=>({actorId:"actor1",tokenId:"token1",
 source:{uuid:key,name:"Brass Key",type:"loot",quantity:1},
 goldClaim:{status:"done",actorId:"actor1"},
 keyClaim:{status:"done",sourceUuid:key,actorId:"actor1",embeddedItemId:"item1"},
 keys:[{actorId:"actor1",id:"item1",name:"Brass Key",type:"loot",quantity:1,sourceUuid:key,sourceRegionUuid:grove,reliefSourceUuid:key,reliefRegionUuid:grove,reward:"key"}],
 doorLedger:null,landingExists:true,
 portal:{id:"CAVHG06STUDYT001",type:"teleportToken",disabled:true,destinations:[target]}});
const judge=p=>assessCavStudyDoorUnlock({...fresh(),...p});
test("genuine completed original Sune key award with one matching Item and original locked portal passes",()=>{
 assert.deepEqual(judge({}),{ready:true,reason:"original-award-and-locked-study-portal-verified"});
});
test("Unclaimed or reserved Brass Key award cannot unlock even with an embedded Item present",()=>{
 for(const keyClaim of [null,{...fresh().keyClaim,status:"reserved"},{...fresh().keyClaim,status:"other"}])
  assert.equal(judge({keyClaim}).ready,false);
 assert.equal(judge({goldClaim:null}).reason,"original-sune-gold-not-complete");
});
test("Interrupted Study Door reserved ledger, done ledger, or unknown stage never auto repairs",()=>{
 for(const status of ["reserved","done","failed"])assert.equal(judge({doorLedger:{status}}).reason,"study-door-ledger-needs-reconciliation");
});
test("Wrong source key, duplicate provenance Items, missing or mismatched original claimed Item fail closed",()=>{
 assert.equal(judge({keys:[]}).ready,false);
 assert.equal(judge({keys:[fresh().keys[0],fresh().keys[0]]}).reason,"key-item-count-uncertain");
 assert.equal(judge({keyClaim:{...fresh().keyClaim,embeddedItemId:"other"}}).ready,false);
 assert.equal(judge({keys:[{...fresh().keys[0],actorId:"other"}]}).ready,false);
 assert.equal(judge({keys:[{...fresh().keys[0],reward:"gold"}]}).ready,false);
 assert.equal(judge({source:{...fresh().source,type:"weapon"}}).ready,false);
});
test("Original locked Study portal must have exactly one canonical destination and verified landing",()=>{
 assert.equal(judge({landingExists:false}).ready,false);
 for(const portal of [null,{...fresh().portal,disabled:false},{...fresh().portal,destinations:[target,"Scene.MALICIOUS"]},
  {...fresh().portal,destinations:[]},{...fresh().portal,destinations:["Scene.OTHER"]},{...fresh().portal,type:"executeScript"}])
  assert.equal(judge({portal}).ready,false);
});
test("Unverified actor/token ID, nonfinite key quantity and wrong claim identity fail closed",()=>{
 for(const bad of [{actorId:null},{tokenId:null},{source:{...fresh().source,quantity:NaN}},
   {keys:[{...fresh().keys[0],quantity:0}]},{keyClaim:{...fresh().keyClaim,actorId:"other"}}])
  assert.equal(judge(bad).ready,false);
});
test("Native Stage door gate proof is before any reserved unlock ledger write",()=>{
 const m=JSON.parse(readFileSync(new URL("../docs/cabin-ashen-veil/study-door-original-gate-source-2026-10-26.json",import.meta.url),"utf8"));
 const src=m.patchedSource;
 assert.match(src,/assessCavStudyDoorUnlock\(\{/);
 assert.match(src,/if\(!assessment\.ready\)return/);
 assert.ok(src.indexOf("assessCavStudyDoorUnlock({")<src.indexOf("await region.setFlag(NS,LEDGER"));
 assert.match(src,/if\(ledger\?\.status==='reserved'\|\|ledger\?\.status==='done'\)return/);
});
