import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessCavAqueductCommissioningProof} from "../modules/regionwright/scripts/studio-cav-aqueduct-route-proof.js";
const G="Item.wDKqETOykWEdKF1Z",H="Item.nRVZJL9JOwEwfnLq",D="Item.CAVBATHSCREW0001";
const base=()=>({
 gearLedger:{status:"done",actorId:"hero",sourceUuid:G,consumedActorItemId:"g1"},
 handleLedger:{status:"done",actorId:"hero",sourceUuid:H,consumedActorItemId:"h1"},
 roofGearClaim:{status:"done",actorId:"hero",sourceUuid:G,embeddedItemId:"g1",correctTime:"12:00"},
 nightstandHandleClaim:{status:"done",actorId:"hero",sourceUuid:H,embeddedItemId:"h1"},
 nightstandRepair:{status:"done",actorId:"hero",toolSourceUuid:D},
 screwdriverClaim:{status:"done",actorId:"hero",sourceUuid:D,embeddedItemId:"s1"},
 mechanical:{version:1,status:"ready",portal:"CAVPONDAQPORT001",traversalEnabled:false},
 crank:{version:1,status:"done",sourceUuid:"Item.g3VYdgc1qkgkHGvn",consumedActorItemId:"crank1",boxRegionUuid:"Scene.CAVEXT03Scene001.Region.CAVEXT03BOXREG01"},
 water:{version:1,status:"open",pond:"drained",bath:"drained",source:"sluice",stage:"committed"},
 transaction:{version:1,status:"done",operation:"open",committedState:"open",next:{status:"open",pond:"drained",bath:"drained"}},
 pondBackground:"Maps/cabin-in-the-ashen-veil/ext-02_pond_drained_owner-approved.png",
 trailPortal:{id:"ZbrhX0nnaLvLA5Zh",type:"teleportToken",disabled:false,destinations:["Scene.8yLMRDvxyw58dydh.Region.R2Pg9eHODtb1C1Yk"]},
 dryBathLandingExists:true
});
const check=o=>assessCavAqueductCommissioningProof({...base(),...o});
test("Only complete original consumed Gear+Handle awards plus full committed drain qualify for later GM commissioning",()=>{
 assert.deepEqual(check({}),{ready:true,reason:"original-aqueduct-parts-and-drain-reconciled"});
});
test("Interrupted/recreated or transferred Roof Gear cannot commission chase route",()=>{
 for(const o of [{gearLedger:null},{gearLedger:{...base().gearLedger,status:"reserved"}},
  {roofGearClaim:{...base().roofGearClaim,status:"reserved"}},
  {gearLedger:{...base().gearLedger,consumedActorItemId:"other"}},
  {roofGearClaim:{...base().roofGearClaim,correctTime:"11:00"}},
  {gearLedger:{...base().gearLedger,actorId:"other"}}])assert.equal(check(o).ready,false);
});
test("Interrupted/mismatched Gate Handle or Nightstand award cannot commission route",()=>{
 for(const o of [{handleLedger:null},{handleLedger:{...base().handleLedger,status:"reserved"}},
  {nightstandHandleClaim:{...base().nightstandHandleClaim,status:"reserved"}},
  {handleLedger:{...base().handleLedger,consumedActorItemId:"another"}},
  {nightstandHandleClaim:{...base().nightstandHandleClaim,actorId:"other"}}])assert.equal(check(o).ready,false);
});
test("Unverified Screwdriver pickup and Nightstand repair deny Aqueduct route",()=>{
 for(const o of [{nightstandRepair:null},{screwdriverClaim:null},
  {nightstandRepair:{...base().nightstandRepair,status:"reserved"}},
  {nightstandRepair:{...base().nightstandRepair,actorId:"other"}},
  {screwdriverClaim:{...base().screwdriverClaim,embeddedItemId:null}}])
  assert.equal(check(o).ready,false);
});
test("Original mechanical ready record must retain expected blocked traversal",()=>{
 for(const mechanical of [null,{...base().mechanical,status:"reserved"},
  {...base().mechanical,traversalEnabled:true},{...base().mechanical,portal:"CAVBADPORT001"},
  {...base().mechanical,version:0}])assert.equal(check({mechanical}).ready,false);
});
test("Fake Water, missing Crank, stale close or half-drained Bath cannot commission chase",()=>{
 for(const o of [{crank:null},{water:{...base().water,stage:"initial"}},
  {water:{...base().water,bath:"full"}},{transaction:{...base().transaction,operation:"close"}},
  {transaction:{...base().transaction,status:"reserved"}},
  {pondBackground:"Maps/cabin-in-the-ashen-veil/ext-02_pond_full_owner-approved.png"}])
  assert.equal(check(o).ready,false);
});
test("Missing DRY Bath landing, extra Trail portal destinations, or disabled Trail deny",()=>{
 for(const o of [{dryBathLandingExists:false},
 {trailPortal:{...base().trailPortal,disabled:true}},
 {trailPortal:{...base().trailPortal,destinations:[...base().trailPortal.destinations,"Scene.fake"]}}])
  assert.equal(check(o).ready,false);
});
test("AQUEDUCT explicit commissioning checks original proof BEFORE any RESERVED route or enabling",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-aqueduct-routing.js",import.meta.url),"utf8");
 const helper=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-aqueduct-route-proof.js",import.meta.url),"utf8");
 assert.match(src,/assessCavAqueductCommissioningProof\(\{/);
 assert.match(src,/if\(!routeProof\.ready\)return\{status:routeProof\.reason\}/);
 assert.ok(src.indexOf("assessCavAqueductCommissioningProof({")<src.indexOf("await x.gate.setFlag(NS,ROUTE,reserve)"));
 assert.doesNotMatch(helper,/\.(setFlag|updateEmbeddedDocuments|createEmbeddedDocuments|deleteEmbeddedDocuments)\s*\(/);
});
