import test from"node:test";import assert from"node:assert/strict";
import{getCavRosewaterApprovedSymbols}from"../modules/regionwright/scripts/studio-cav-rosewater-rings.js";
const r=obj=>({getFlag:(ns,key)=>key==="cavRosewaterApprovedSymbols"?obj:null});
test("Provisional Skyrim symbols are NOT mistaken for owner-approved installed canon",()=>{
 assert.equal(getCavRosewaterApprovedSymbols(r(null)),null);
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"DRAFT",approvalSource:"owner",symbols:["a","b","c","d"]})),null);
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",symbols:["a","b","c","d"]})),null);
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",approvalSource:"owner",symbols:["a","b","c"]})),null);
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",approvalSource:"owner",symbols:["a","b","c","d"]})),null);
 assert.deepEqual(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",approvalSource:"owner",symbols:["rose","sun","moth","thorn"]})),["rose","sun","moth","thorn"]);
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",approvalSource:"owner",symbols:["rose","sun","thorn","moth"]})),null);
});
test("Duplicate or unsuitable approved labels do not commission",()=>{
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",approvalSource:"owner",symbols:["a","b","b","d"]})),null);
 assert.equal(getCavRosewaterApprovedSymbols(r({status:"OWNER_APPROVED",approvalSource:"owner",symbols:["bear","<script>","owl","rose"]})),null);
});
