import test from "node:test";import assert from "node:assert/strict";
import{FIRST_CHASE_DC,newFirstChaseState,advanceFirstChase,firstChaseCaptureDecision,finalizeFirstChaseCapture}from"../modules/regionwright/scripts/studio-cav-first-chase-state.js";
test("first chase uses exact DC13 and three successes",()=>{
 assert.equal(FIRST_CHASE_DC,13);
 let s=newFirstChaseState(["a","b"],"a");
 for(let i=0;i<3;i++){const r=advanceFirstChase(s,{actorId:i===1?"b":"a",tactic:i===0?"dash":i===1?"climb":"navigate",total:13,expectedRound:i});
  assert.equal(r.status,"recorded");s=r.next;}
 assert.equal(s.status,"escaped_pending_well_exit");assert.equal(s.successes,3);assert.equal(s.failures,0);
 assert.equal(advanceFirstChase(s,{actorId:"a",tactic:"hide",total:20,expectedRound:3}).status,"not-running");
});
test("two failures create a pending capture, never auto-move anyone",()=>{
 let s=newFirstChaseState(["a","b"],"a");
 s=advanceFirstChase(s,{actorId:"a",tactic:"dash",total:12,expectedRound:0}).next;
 s=advanceFirstChase(s,{actorId:"b",tactic:"hide",total:10,expectedRound:1}).next;
 assert.equal(s.status,"capture_pending");assert.equal(s.failures,2);
 assert.equal(s.captureCount,0);assert.equal(s.capturedActorId,null);
 assert.equal(firstChaseCaptureDecision(s,"a"),"gm-transfer-required");
 assert.equal(firstChaseCaptureDecision(s,"outsider"),"not-a-participant");
});
test("same actor cannot repeat the same tactic in successive personal rounds",()=>{
 let s=newFirstChaseState(["a","b"],"a");
 s=advanceFirstChase(s,{actorId:"a",tactic:"navigate",total:18,expectedRound:0}).next;
 s=advanceFirstChase(s,{actorId:"b",tactic:"dash",total:16,expectedRound:1}).next;
 assert.equal(advanceFirstChase(s,{actorId:"a",tactic:"navigate",total:18,expectedRound:2}).status,"repeat-tactic");
 assert.equal(advanceFirstChase(s,{actorId:"a",tactic:"climb",total:12,expectedRound:2}).status,"recorded");
});
test("reject stale, invalid tactic and unverified actor",()=>{
 const s=newFirstChaseState(["a"],"a");
 assert.equal(advanceFirstChase(s,{actorId:"a",tactic:"dash",total:19,expectedRound:1}).status,"stale-round");
 assert.equal(advanceFirstChase(s,{actorId:"b",tactic:"dash",total:19,expectedRound:0}).status,"unregistered-actor");
 assert.equal(advanceFirstChase(s,{actorId:"a",tactic:"invented",total:19,expectedRound:0}).status,"invalid-tactic");
});


test("Capture cannot be certified before a physical move to locked Sophia, and never twice",()=>{
 let s=newFirstChaseState(["a"],"a");
 s=advanceFirstChase(s,{actorId:"a",tactic:"dash",total:4,expectedRound:0}).next;
 s=advanceFirstChase(s,{actorId:"a",tactic:"hide",total:6,expectedRound:1}).next;
 assert.equal(finalizeFirstChaseCapture(s,{actorId:"a"}).status,"physical-safety-not-certified");
 const committed=finalizeFirstChaseCapture(s,{actorId:"a",physicallyInSophia:true,returnLocked:true,sourceAbsent:true});
 assert.equal(committed.status,"captured");assert.equal(committed.next.captureCount,1);
 assert.equal(finalizeFirstChaseCapture(committed.next,{actorId:"a",physicallyInSophia:true,returnLocked:true,sourceAbsent:true}).status,"blocked");
});
