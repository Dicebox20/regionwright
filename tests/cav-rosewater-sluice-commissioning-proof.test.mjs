import test from"node:test";import assert from"node:assert/strict";
import{evaluateRosewaterSluiceProof}from"../modules/regionwright/scripts/studio-cav-rosewater-state.js";
const complete=()=>({water:{version:1,status:"open",pond:"drained",bath:"drained",stage:"committed",source:"sluice"},
 transition:{version:1,status:"done",operation:"open",committedState:"open"},
 crank:{status:"done",sourceUuid:"Item.g3VYdgc1qkgkHGvn"},controller:{drainEnabled:true}});
test("Rosewater commissioned water proof requires actual crank and completed synchronized sluice transaction",()=>{
 assert.deepEqual(evaluateRosewaterSluiceProof(complete()),{ready:true,blockers:[]});
 const missing=evaluateRosewaterSluiceProof();
 assert.equal(missing.ready,false);assert.equal(missing.blockers.length,4);
});
test("Forged drained stage without real receipt never unlocks Rosewater",()=>{
 for(const key of ["transition","crank","controller"]){const x=complete();x[key]=null;assert.equal(evaluateRosewaterSluiceProof(x).ready,false,key)}
 let x=complete();x.water.stage="initial";assert.equal(evaluateRosewaterSluiceProof(x).ready,false);
 x=complete();x.water.source="debug";assert.equal(evaluateRosewaterSluiceProof(x).ready,false);
 x=complete();x.transition.committedState="closed";assert.equal(evaluateRosewaterSluiceProof(x).ready,false);
});
test("Reserved, stale or reclosed water stage must not reopen ring",()=>{
 let x=complete();x.transition.status="reserved";assert.deepEqual(evaluateRosewaterSluiceProof(x).blockers.includes("sluice-transaction-reserved"),true);
 x=complete();x.water.status="closed";x.water.pond="full";x.water.bath="full";x.transition.operation="close";assert.equal(evaluateRosewaterSluiceProof(x).ready,false);
 x=complete();x.crank.sourceUuid="Item.any-other";assert.equal(evaluateRosewaterSluiceProof(x).ready,false);
});
