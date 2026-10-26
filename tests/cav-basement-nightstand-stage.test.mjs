import test from "node:test";import assert from "node:assert/strict";
import {basementDecision,nightstandStage} from "../modules/regionwright/scripts/studio-cav-basement-nightstand.js";
test("basement requires authenticated key unless permanently unlocked",()=>{
 assert.equal(basementDecision(null,false),"locked");
 assert.equal(basementDecision(null,true),"ready");
 assert.equal(basementDecision({status:"reserved"},true),"reconcile");
 assert.equal(basementDecision({status:"done"},false),"unlocked");
});
test("Nightstand repair and pickup are independent, once-only stages",()=>{
 assert.equal(nightstandStage(null,null),"repair");
 assert.equal(nightstandStage({status:"reserved"},null),"reconcile");
 assert.equal(nightstandStage({status:"done"},null),"handle");
 assert.equal(nightstandStage({status:"done"},{status:"reserved"}),"reconcile");
 assert.equal(nightstandStage({status:"done"},{status:"done"}),"empty");
});
