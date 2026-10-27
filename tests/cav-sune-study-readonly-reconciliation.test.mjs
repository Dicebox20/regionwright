import test from "node:test";
import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
import{assessCavSuneStudyReconciliation,describeCavSuneStudyReconciliationGM}from"../modules/regionwright/scripts/studio-cav-sune-study-reconciliation.js";
const grove="Scene.CAVSG05Scene0001.Region.L15BdSqcbCOLPnIN",door="Scene.CAVHG06GreatRoom.Region.CAV06R0000000003";
const gold="Item.CAVSUNEGPBAG0001",key="Item.CAVSTUDYBRASS001",landing="Scene.CAVHG05Scene0001.Region.CAVB9AA3D7BE9560";
const gi=()=>({id:"g1",actorId:"a1",sourceUuid:gold,regionUuid:grove,reward:"gold",name:"Sune's Cloth Bag (1,000 gp)",type:"container",gp:1000});
const ki=()=>({id:"k1",actorId:"a1",sourceUuid:key,regionUuid:grove,reward:"key",name:"Brass Key",type:"loot",quantity:1,keySource:key,keyRegion:grove});
const gc=status=>({status,actorId:"a1",sourceUuid:gold,embeddedItemId:"g1"});
const kc=status=>({status,actorId:"a1",sourceUuid:key,embeddedItemId:"k1"});
const dl=status=>({status,actorId:"a1",tokenId:"t1",keySource:key,portal:"CAVHG06STUDYT001"});
const base=()=>({groveUuid:grove,doorUuid:door,goldSource:{uuid:gold,name:"Sune's Cloth Bag (1,000 gp)",type:"container",gp:1000},
 keySource:{uuid:key,name:"Brass Key",type:"loot",quantity:1},items:[],
 portal:{id:"CAVHG06STUDYT001",type:"teleportToken",disabled:true,destinations:[landing]},landingExists:true});
const check=o=>assessCavSuneStudyReconciliation({...base(),...o});
test("GM-only adapter denies uninitialized non-GM context",()=>{
 assert.deepEqual(describeCavSuneStudyReconciliationGM(),{status:"denied",requiresGM:true});
});
test("authentic initial unclaimed Sune and locked Study stage",()=>{
 const x=check({});
 assert.equal(x.status,"not-started");assert.equal(x.requiresGM,false);
 assert.equal(x.gold.status,"gold-unclaimed");assert.equal(x.key.status,"key-unclaimed");
 assert.equal(x.door.status,"study-door-locked");
});
test("reserved Gold claim with and without created embedded Item remains uncertain",()=>{
 assert.equal(check({goldClaim:gc("reserved")}).gold.status,"gold-reserved-item-not-found");
 assert.equal(check({goldClaim:gc("reserved"),items:[gi()]}).gold.status,"gold-reserved-item-visible");
 assert.equal(check({goldClaim:gc("reserved"),items:[gi()]}).requiresGM,true);
});
test("reserved Brass Study Key with and without embedded Item remains uncertain",()=>{
 const p={goldClaim:gc("done"),keyClaim:kc("reserved")};
 assert.equal(check({...p,items:[gi()]}).key.status,"key-reserved-item-not-found");
 assert.equal(check({...p,items:[gi(),ki()]}).key.status,"key-reserved-item-visible");
});
test("legitimate completed Gold and Key award with exact owner/item IDs and locked door passes",()=>{
 const x=check({goldClaim:gc("done"),keyClaim:kc("done"),items:[gi(),ki()]});
 assert.equal(x.status,"key-awarded-door-locked");assert.equal(x.requiresGM,false);
 assert.equal(x.gold.status,"gold-award-consistent");assert.equal(x.key.status,"key-award-consistent");
});
test("duplicate tagged keys, wrong claimant actor, wrong receipt ID fail closed",()=>{
 const p={goldClaim:gc("done"),keyClaim:kc("done")};
 for(const items of [[gi(),ki(),{...ki(),id:"k2"}],
  [gi(),{...ki(),actorId:"another"}],[gi(),{...ki(),keySource:"foreign"}],
  [gi(),{...ki(),id:"different"}],[gi()]])
  assert.equal(check({...p,items}).requiresGM,true);
});
test("orphan source-tagged Item and key before completed Gold award fail closed",()=>{
 assert.equal(check({items:[gi()]}).gold.status,"gold-item-without-ledger");
 assert.equal(check({items:[{...ki(),reward:"unknown"}]}).evidence.unexpectedTaggedItems,1);
 assert.equal(check({keyClaim:kc("done"),items:[ki()]}).evidence.stageOrderConflict,true);
});
test("door unlock reserved with portal locked versus enabled are distinct reconciliation branches",()=>{
 assert.equal(check({doorLedger:dl("reserved")}).door.status,"study-unlock-reserved-portal-locked");
 assert.equal(check({doorLedger:dl("reserved"),portal:{...base().portal,disabled:false}}).door.status,
  "study-unlock-reserved-portal-enabled");
});
test("enabled portal without done ledger and done ledger with locked portal fail closed",()=>{
 assert.equal(check({portal:{...base().portal,disabled:false}}).door.status,"study-portal-enabled-without-ledger");
 assert.equal(check({doorLedger:dl("done")}).door.status,"study-done-but-portal-locked");
});
test("authentic unlocked Study door DONE matching original key award is consistent",()=>{
 const p={goldClaim:gc("done"),keyClaim:kc("done"),items:[gi(),ki()],
  doorLedger:dl("done"),portal:{...base().portal,disabled:false}};
 assert.equal(check(p).status,"study-door-unlocked");
 assert.equal(check({...p,doorLedger:{...dl("done"),actorId:"other"}}).requiresGM,true);
});
test("unapproved extra destination or missing original landing cannot be treated as valid",()=>{
 for(const o of [{landingExists:false},{groveUuid:"fake"},{keySource:null},
  {portal:{...base().portal,destinations:[landing,"Scene.other"]}},
  {portal:{...base().portal,type:"executeScript"}}])
  assert.equal(check(o).requiresGM,true);
});
test("read-only GM public API registered with no native mutation calls",()=>{
 const root=new URL("../modules/regionwright/scripts/",import.meta.url);
 const registry=readFileSync(new URL("studio-campaign.js",root),"utf8");
 const module=readFileSync(new URL("studio-cav-sune-study-reconciliation.js",root),"utf8");
 assert.match(registry,/suneStudyReconciliation:\s*\{describe:describeCavSuneStudyReconciliationGM\}/);
 assert.doesNotMatch(module,/\.(setFlag|unsetFlag|updateEmbeddedDocuments|createEmbeddedDocuments|deleteEmbeddedDocuments|create|update|delete)\s*\(/);
});
