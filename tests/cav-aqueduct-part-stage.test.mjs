import test from "node:test";import assert from "node:assert/strict";import{aqueductGearStage,nextAqueductPart}from"../modules/regionwright/scripts/studio-cav-aqueduct-gate.js";
test("Gear and Handle independent staging",()=>{
 assert.equal(aqueductGearStage(null,null),"either");
 assert.equal(aqueductGearStage({status:"done"},null),"handle");
 assert.equal(aqueductGearStage(null,{status:"done"}),"gear");
 assert.equal(aqueductGearStage({status:"done"},{status:"done"}),"both");
 assert.equal(aqueductGearStage({status:"reserved"},null),"reconcile");
});

test("Only missing Aqueduct part is offered",()=>{
 assert.equal(nextAqueductPart("gear",true,true),"handle");
 assert.equal(nextAqueductPart("handle",true,true),"gear");
 assert.equal(nextAqueductPart("gear",true,false),null);
 assert.equal(nextAqueductPart("handle",false,true),null);
 assert.equal(nextAqueductPart("either",false,true),"handle");
 assert.equal(nextAqueductPart("both",true,true),null);
});
