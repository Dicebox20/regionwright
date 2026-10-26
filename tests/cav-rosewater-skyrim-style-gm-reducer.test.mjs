import test from"node:test";import assert from"node:assert/strict";
import{planRosewaterGMAction,newRosewaterState,CAV_ROSEWATER_BEHAVIOR_ID}from"../modules/regionwright/scripts/studio-cav-rosewater-state.js";
test("Skyrim-style lock keeps three independent four-step rings and fixed canonical solution",()=>{
 let s=newRosewaterState();assert.equal(CAV_ROSEWATER_BEHAVIOR_ID.length,16);
 assert.equal(planRosewaterGMAction(s,{version:1,op:"submit",expectedRevision:0}).status,"incorrect");
 for(const [ring,step,n]of [["outer",1,1],["middle",-1,1],["inner",1,2]]){
  for(let k=0;k<n;k++){const a=planRosewaterGMAction(s,{version:1,op:"rotate",ring,direction:step,expectedRevision:s.revision});assert.equal(a.status,"ready");s=a.next}
 }
 assert.deepEqual(s.positions,[1,3,2]);
 assert.equal(planRosewaterGMAction(s,{version:1,op:"submit",expectedRevision:s.revision-1}).status,"stale-or-invalid");
 const x=planRosewaterGMAction(s,{version:1,op:"submit",expectedRevision:s.revision});
 assert.equal(x.status,"ready");assert.equal(x.next.status,"done");
 assert.equal(planRosewaterGMAction(x.next,{version:1,op:"reset",expectedRevision:x.next.revision}).status,"already-solved");
});
test("GM reducer rejects forged success, invalid ring, reserved and stale messages",()=>{
 const s=newRosewaterState();
 assert.equal(planRosewaterGMAction(s,{version:1,op:"rotate",ring:"sixth",direction:1,expectedRevision:0}).status,"denied");
 assert.equal(planRosewaterGMAction({...s,status:"reserved"},{version:1,op:"submit",expectedRevision:0}).status,"reconcile");
 assert.equal(planRosewaterGMAction(s,{version:1,op:"rotate",ring:"outer",direction:1,expectedRevision:0,success:true}).next.status,"unsolved");
 assert.equal(planRosewaterGMAction({...s,positions:[1,3,6]},{version:1,op:"submit",expectedRevision:0}).status,"reconcile");
 assert.equal(planRosewaterGMAction(s,{version:1,op:"rotate",ring:"outer",direction:0,expectedRevision:0}).status,"denied");
});
