import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessCavCrankReconciliation,describeCavCrankReconciliationGM} from "../modules/regionwright/scripts/studio-cav-crank-reconciliation.js";
const source="Item.g3VYdgc1qkgkHGvn";
const box="Scene.CAVEXT03Scene001.Region.CAVEXT03BOXREG01",note="Scene.CAVHG05Scene0001.Region.CAVB3E32BD6B01BD";
const basic={boxUuid:box,noteUuid:note,sourceVerified:true};
const item=()=>({actorId:"PC1",id:"i123",sourceUuid:source,boxRegionUuid:box,noteUuid:note,name:"Sluice Crank",type:"loot",quantity:1});
const claim=status=>({status,actorId:"PC1",sourceUuid:source,embeddedItemId:"i123"});
const fit=status=>({version:1,status,actorId:"PC1",sourceUuid:source,actorItemId:"i123",consumedActorItemId:"i123",boxRegionUuid:box});
const init=()=>({version:1,status:"closed",pond:"full",bath:"full",stage:"initial",source:"cav-sluice-crank-install"});
const opened=()=>({version:1,status:"open",pond:"drained",bath:"drained",stage:"committed",source:"sluice"});
const txn=()=>({version:1,status:"done",operation:"open",committedState:"open",next:{status:"open",pond:"drained",bath:"drained"}});
const check=o=>assessCavCrankReconciliation({...basic,...o});
test("read-only GM diagnostic denies uninitialized/global world access",()=>{
 assert.deepEqual(describeCavCrankReconciliationGM(),{status:"denied",requiresGM:true});
});
test("no claim or Items means genuine not-claimed baseline",()=>{
 assert.deepEqual(check({}),{status:"not-claimed",requiresGM:false,detail:null});
});
test("reserved award with Item absent and Item visible are distinct manual reconciliation cases",()=>{
 assert.equal(check({claim:claim("reserved")}).status,"reserved-award-item-not-found");
 assert.equal(check({claim:claim("reserved"),items:[item()]}).status,"reserved-award-item-visible");
 assert.equal(check({claim:claim("reserved"),fitting:fit("done")}).status,"reserved-claim-with-downstream-state");
});
test("authentic original completed 587 claim with exactly one matching Item can fit, never auto repeats",()=>{
 assert.deepEqual(check({claim:claim("done"),items:[item()]}),{status:"claimed-crank-held",requiresGM:false,detail:null});
 assert.equal(check({claim:claim("done")}).status,"claimed-crank-item-not-found");
 assert.equal(check({claim:claim("done"),items:[{...item(),actorId:"PC2"}]}).status,"claimed-item-identity-conflict");
 assert.equal(check({claim:claim("done"),items:[{...item(),id:"other"}]}).status,"claimed-item-identity-conflict");
});
test("reserved fitting with original Item visible or consumed is always manual reconciliation",()=>{
 assert.equal(check({claim:claim("done"),fitting:fit("reserved"),items:[item()]}).status,"reserved-fit-item-visible");
 assert.equal(check({claim:claim("done"),fitting:fit("reserved")}).status,"reserved-fit-item-not-found");
 assert.equal(check({claim:claim("done"),fitting:{...fit("reserved"),actorItemId:"other"}}).status,"fit-reservation-provenance-conflict");
});
test("fitting DONE must consume exact granted Item and record real initial water",()=>{
 assert.equal(check({claim:claim("done"),fitting:fit("done")}).status,"fitted-water-receipt-unverified");
 assert.deepEqual(check({claim:claim("done"),fitting:fit("done"),water:init()}),{status:"fitted-initial-stage-consistent",requiresGM:false,detail:null});
 assert.equal(check({claim:claim("done"),fitting:fit("done"),water:init(),items:[item()]}).status,"fitted-crank-item-still-present");
 assert.equal(check({claim:claim("done"),fitting:{...fit("done"),consumedActorItemId:"wrong"},water:init()}).status,"fitted-crank-provenance-conflict");
});
test("completed transition requires committed, matching water-stage record",()=>{
 assert.equal(check({claim:claim("done"),fitting:fit("done"),water:opened(),transaction:txn()}).status,"fitted-committed-stage-consistent");
 assert.equal(check({claim:claim("done"),fitting:fit("done"),water:opened(),transaction:{...txn(),status:"reserved"}}).status,"fitted-water-receipt-unverified");
});
test("duplicate or foreign-provenance Items and unauthorized water fail closed",()=>{
 assert.equal(check({claim:claim("done"),items:[item(),{...item(),id:"two"}]}).status,"duplicate-tagged-cranks");
 assert.equal(check({claim:claim("done"),items:[{...item(),boxRegionUuid:"other"}]}).status,"item-provenance-conflict");
 assert.equal(check({items:[item()]}).status,"tagged-item-without-claim");
 assert.equal(check({water:init()}).status,"world-state-without-claim");
});
test("original GM campaign registry offers read-only diagnostic by API without any mutation calls",()=>{
 const c=readFileSync(new URL("../modules/regionwright/scripts/studio-campaign.js",import.meta.url),"utf8");
 const m=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-crank-reconciliation.js",import.meta.url),"utf8");
 assert.match(c,/crankReconciliation:\s*\{describe:describeCavCrankReconciliationGM\}/);
 assert.doesNotMatch(m,/\.(setFlag|createEmbeddedDocuments|deleteEmbeddedDocuments|updateEmbeddedDocuments|update)\s*\(/);
});
