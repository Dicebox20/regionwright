import test from"node:test";import assert from"node:assert/strict";
import{initialCavBoilerState,planCavBoilerAction}from"../modules/regionwright/scripts/studio-cav-boiler-state.js";
test("Initial Boiler state is unsolved and cannot self certify",()=>{
 const p=planCavBoilerAction(null,{version:1,op:"submit",expectedRevision:0});
 assert.equal(p.status,"incorrect");assert.deepEqual(initialCavBoilerState().positions,{left:0,right:0});
});
test("GM reducer advances only validated [left2,right1] and is exactly once",()=>{
 let x=initialCavBoilerState();
 for(const[op,valve]of [["adjust","left"],["adjust","left"],["adjust","right"]]){
  const a=planCavBoilerAction(x,{version:1,op,valve,direction:1,expectedRevision:x.revision});
  assert.equal(a.status,"ready");x=a.next;
 }
 assert.deepEqual(x.positions,{left:2,right:1});
 assert.equal(planCavBoilerAction(x,{version:1,op:"submit",expectedRevision:2}).status,"stale-or-invalid");
 const done=planCavBoilerAction(x,{version:1,op:"submit",expectedRevision:3});
 assert.equal(done.status,"ready");assert.equal(done.next.status,"done");
 assert.equal(planCavBoilerAction(done.next,{version:1,op:"reset",expectedRevision:4}).status,"already-solved");
});
test("Tampered positions, invalid valve, forged solved flag and reserved ledger rejected",()=>{
 assert.equal(planCavBoilerAction({status:"reserved",revision:0,positions:{left:2,right:1}},{version:1,op:"submit",expectedRevision:0}).status,"reconcile");
 assert.equal(planCavBoilerAction({status:"done",revision:1,positions:{left:2,right:1}},{version:1,op:"submit",expectedRevision:1}).status,"already-solved");
 assert.equal(planCavBoilerAction(null,{version:1,op:"adjust",valve:"pressure",direction:1,expectedRevision:0}).status,"denied");
 assert.equal(planCavBoilerAction(null,{version:1,op:"adjust",valve:"left",direction:1,expectedRevision:0,success:true}).next.status,"unsolved");
 assert.equal(planCavBoilerAction({status:"unsolved",revision:0,positions:{left:2,right:4}},{version:1,op:"submit",expectedRevision:0}).status,"incorrect");
});
