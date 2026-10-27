import test from "node:test";
import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
import{unlockForestWellFromNorthGM,handleForestWellNorthRegionEvent}from"../modules/regionwright/scripts/studio-cav-aqueduct-routing.js";
const N="dicebox-campaign-helper",A="CAVAQ01Scene0001",P="CAVEXT02Scene001",F="CAVFM01Scene0001";
const travel=(id,dest,disabled)=>({id,type:"teleportToken",disabled,system:{destinations:new Set([dest]),events:new Set(["tokenExit"])}});
const region=(id,bs,flags={},log=[])=>{
 const r={id,behaviors:new Map(bs.map(b=>[b.id,b])),flags:{...flags},
 getFlag(_ns,k){return this.flags[k]??null},
 async setFlag(_ns,k,v){log.push("flag:"+id+":"+k+":"+v.status);this.flags[k]=structuredClone(v);return v},
 async updateEmbeddedDocuments(type,updates){assert.equal(type,"RegionBehavior");for(const update of updates){
  const b=this.behaviors.get(update._id);assert.ok(b);b.disabled=update.disabled;log.push("port:"+b.id+":enabled")};return updates},
 testPoint(pt){return pt.x>=2630&&pt.x<3030&&pt.y>=160&&pt.y<510}
 };
 return r;
};
function fixture({route=true,authorized=true,atNorth=true,firstChaseDisabled=true,oldWell=null,returnDisabled=true,outboundDisabled=true}={}){
 const log=[],originalRoute={version:1,status:"done",source:"original-aqueduct-gear-handle-sluice"};
 const gate=region("CAVPONDAQGATE001",[travel("CAVPONDAQPORT001","Scene."+A+".Region.woZ98KXx0RsWIPpl",false)],{
  cavAqueductRouteTransaction:route?originalRoute:null,cavAqueductGateMechanicalReady:{status:"ready",traversalEnabled:true}},log);
 const entrance=region("woZ98KXx0RsWIPpl",[{id:"CAVAQCHASETRIG01",type:"executeScript",disabled:firstChaseDisabled,system:{events:new Set(["tokenMoveIn","tokenMoveWithin"])}}],{},log);
 const north=region("CAVAQWELLNORTH01",[travel("CAVAQWELLPORT001","Scene."+F+".Region.CAVFMWELLARRV001",outboundDisabled)],oldWell?{cavForestWellUnlockTransaction:oldWell}:{},log);
 const mouth=region("CAVFMWELLPORT001",[travel("CAVFMWELLREENT01","Scene."+A+".Region.CAVAQWELLARRV001",returnDisabled)],{},log);
 const aqReturn=region("CAVAQ01RETURN001",[travel("CAVAQ01RETBEH001","Scene."+P+".Region.CAVPONDAQARRV001",false)],{},log);
 const actor={id:"PC",type:"character",testUserPermission:()=>authorized};
 const token={id:"TOKEN",actor,x:atNorth?2700:100,y:atNorth?170:100,width:1,height:1,hidden:false};
 const aq={id:A,grid:{size:100},regions:new Map([[entrance.id,entrance],[north.id,north],[aqReturn.id,aqReturn]]),tokens:new Map([[token.id,token]])};
 const pond={id:P,regions:new Map([[gate.id,gate],["CAVEXT02SLUICE01",region("CAVEXT02SLUICE01",[])]])};
 const fm={id:F,regions:new Map([[mouth.id,mouth]])};
 const player={id:"USER",active:true,isGM:false};
 return{log,gate,entrance,north,mouth,token,game:{
  ready:true,world:{id:"cabin-in-the-ashen-veil"},user:{id:"GM",isGM:true},
  users:new Map([["USER",player]]),scenes:new Map([[A,aq],[P,pond],[F,fm]])
 }};
}
async function withFixture(options,action){
 const old=globalThis.game;const f=fixture(options);
 f.game.users.activeGM={id:"GM"};
 globalThis.game=f.game;
 try{return await action(f)}finally{if(old===undefined)delete globalThis.game;else globalThis.game=old}
}
test("Actual elected GM requires genuine physical player North Aqueduct visit and opens safe return FIRST",async()=>{
 await withFixture({},async f=>{
  const result=await unlockForestWellFromNorthGM({tokenId:"TOKEN",userId:"USER"});
  assert.deepEqual(result,{status:"unlocked",forestWellReentryPersistsAfterRefill:true});
  assert.deepEqual(f.log,[
   "flag:CAVAQWELLNORTH01:cavForestWellUnlockTransaction:reserved",
   "port:CAVFMWELLREENT01:enabled","port:CAVAQWELLPORT001:enabled",
   "flag:CAVAQWELLNORTH01:cavForestWellUnlockTransaction:done"]);
  const claim=f.north.getFlag(N,"cavForestWellUnlockTransaction");
  assert.equal(claim.status,"done");
  assert.equal(claim.source,"north-aqueduct-physical-arrival");
  assert.equal(claim.actorId,"PC");assert.equal(claim.tokenId,"TOKEN");
  assert.equal(f.entrance.behaviors.get("CAVAQCHASETRIG01").disabled,true);
  assert.equal(f.mouth.behaviors.get("CAVFMWELLREENT01").disabled,false);
 });
});
test("No synthetic chase or source flag allows a well unlock without a completed real route",async()=>{
 for(const config of [{route:false},{authorized:false},{atNorth:false},{firstChaseDisabled:false}]){
 await withFixture(config,async f=>{
  const r=await unlockForestWellFromNorthGM({tokenId:"TOKEN",userId:"USER"});
  assert.notEqual(r.status,"unlocked");assert.deepEqual(f.log,[]);
  assert.equal(f.north.getFlag(N,"cavForestWellUnlockTransaction"),null);
 });
 }
});
test("Reserved/unknown or inconsistent completed claims fail closed and never issue a duplicate write",async()=>{
 for(const oldWell of [{status:"reserved"},{status:"other"},{status:"done",version:1}]){
 await withFixture({oldWell},async f=>{
  const result=await unlockForestWellFromNorthGM({tokenId:"TOKEN",userId:"USER"});
  assert.equal(result.status,"reconcile");assert.deepEqual(f.log,[]);
 });
 }
});
test("Correct completed well and opened return/outbound stays idempotent",async()=>{
 await withFixture({oldWell:{status:"done"},outboundDisabled:false,returnDisabled:false},async f=>{
  const result=await unlockForestWellFromNorthGM({tokenId:"TOKEN",userId:"USER"});
  assert.equal(result.status,"already");assert.deepEqual(f.log,[]);
 });
});
test("Native token movement invokes independent Forest Well handler; no chase completion is read",async()=>{
 await withFixture({},async f=>{
  const ev={name:"tokenMoveIn",userId:"USER",data:{token:{document:f.token}}};
  const result=await handleForestWellNorthRegionEvent({id:f.north.id,parent:{id:A}},ev);
  assert.equal(result.status,"unlocked");
 });
});
test("Untrusted event/user or wrong north region cannot start well setup",async()=>{
 await withFixture({},async f=>{
  assert.equal(await handleForestWellNorthRegionEvent({id:"WRONG",parent:{id:A}},
   {name:"tokenMoveIn",userId:"USER",data:{token:{document:f.token}}}),undefined);
  const r=await handleForestWellNorthRegionEvent({id:f.north.id,parent:{id:A}},
   {name:"tokenMoveIn",userId:"GM",data:{token:{document:f.token}}});
  assert.notEqual(r.status,"unlocked");assert.deepEqual(f.log,[]);
 });
});
test("Gate original parts commission independent travel, never silently enable first chase",()=>{
 const route=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-aqueduct-routing.js",import.meta.url),"utf8");
 const gate=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-aqueduct-gate.js",import.meta.url),"utf8");
 const chase=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-first-chase.js",import.meta.url),"utf8");
 const studio=readFileSync(new URL("../modules/regionwright/scripts/studio-campaign.js",import.meta.url),"utf8");
 assert.ok(route.includes('source:"original-aqueduct-gear-handle-sluice"'));
 assert.ok(route.includes('if(x.trigger.disabled!==true)throw Error("Haunt trigger must remain disabled")'));
 assert.ok(!route.includes('await alter(x.south,CHASE_TRIGGER,false)'));
 assert.ok(!route.includes('crookedManActorId'));
 assert.ok(gate.includes('await commissionAqueductForGameplay({gmConfirmed:true})'));
 assert.ok(!chase.includes("unlockForestWellAfterChaseGM"));
 assert.ok(studio.includes("handleForestWellNorthRegionEvent"));
 assert.ok(studio.includes("unlockWellAfterNorthArrival:unlockForestWellFromNorthGM"));
});