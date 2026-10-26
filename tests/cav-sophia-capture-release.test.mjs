import test from "node:test";import assert from "node:assert/strict";
import {SOPHIA_EMERGENCY_MIN_MS,sophiaCapturePreparation,sophiaCaptureConfirmation,sophiaReleaseDecision} from "../modules/regionwright/scripts/studio-cav-sophia-state.js";
const chase={status:"capture_pending",captureCount:0,participants:["pc1","pc2"]};
test("Confinement only while capture pending and bedroom empty with native return originally enabled",()=>{
 assert.equal(sophiaCapturePreparation(chase,null,0,true,true),"ready");
 assert.equal(sophiaCapturePreparation(chase,null,1,true,true),"bedroom-occupied");
 assert.equal(sophiaCapturePreparation(chase,null,0,true,false),"exit-not-baseline");
 assert.equal(sophiaCapturePreparation(chase,{status:"reserved"},0,true,true),"reconcile");
});
test("Confirm physical move only with exact one captive and absent original",()=>{
 const session={status:"prepared",actorId:"pc1"};
 assert.equal(sophiaCaptureConfirmation(chase,session,["pc1"],false),"ready");
 assert.equal(sophiaCaptureConfirmation(chase,session,["pc2"],false),"capture-position-unsafe");
 assert.equal(sophiaCaptureConfirmation(chase,session,["pc1"],true),"source-still-present");
});
test("Original key release and GM 20-minute manual fallback are distinct",()=>{
 const state={status:"captured"},session={status:"captured",capturedAtMs:100000};
 assert.equal(sophiaReleaseDecision(state,session,"key",{hasOriginalKey:false}),"missing-original-key");
 assert.equal(sophiaReleaseDecision(state,session,"key",{hasOriginalKey:true}),"ready");
 assert.equal(sophiaReleaseDecision(state,session,"emergency",{nowMs:100000+SOPHIA_EMERGENCY_MIN_MS-1}),"waiting");
 assert.equal(sophiaReleaseDecision(state,session,"emergency",{nowMs:100000+SOPHIA_EMERGENCY_MIN_MS}),"ready");
 assert.equal(sophiaReleaseDecision(state,session,"emergency",{nowMs:100001,allowEmergency:true}),"ready");
 assert.equal(sophiaReleaseDecision(state,{status:"released",capturedAtMs:100000},"emergency",{nowMs:100000+SOPHIA_EMERGENCY_MIN_MS}),"not-captured");
});

test("Missing capture timestamp cannot bypass emergency clock",()=>{assert.equal(sophiaReleaseDecision({status:"captured"},{status:"captured"},"emergency",{nowMs:100000000}),"waiting")});
