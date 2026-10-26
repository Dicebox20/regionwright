import test from "node:test";
import assert from "node:assert/strict";
import {sluiceInstallDecision} from "../modules/regionwright/scripts/studio-cav-sluice.js";
test("no premature installation without donor chain and original crank",()=>{
 assert.equal(sluiceInstallDecision(null,true,false),"blocked");
 assert.equal(sluiceInstallDecision(null,false,true),"missing-crank");
});
test("original crank and completed chain prepare one irreversible fitting",()=>{
 assert.equal(sluiceInstallDecision(null,true,true),"ready");
});
test("idempotent installed state and recoverable reserved state",()=>{
 assert.equal(sluiceInstallDecision({status:"done"},false,false),"installed");
 assert.equal(sluiceInstallDecision({status:"reserved"},true,true),"reconcile");
 assert.equal(sluiceInstallDecision({status:"other"},true,true),"reconcile");
});

