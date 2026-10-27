import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessOriginalCavBowlReward} from "../modules/regionwright/scripts/studio-cav-rosewater-bowl.js";

const S="8yLMRDvxyw58dydh",R="CAVROSEBOWLAPPROVED1",U="Scene."+S+".Region."+R;
const approval=()=>({status:"OWNER_APPROVED",approvalSource:"owner",sceneId:S,regionId:R,regionUuid:U});
const item=()=>({id:"1n5LONw3nYIy61O9",type:"loot",name:"Sune’s Scrying Bowl",
 system:{quantity:1},flags:{"dicebox-campaign-helper":{cabinPuzzleItem:{
  source:"2026-10-24-approved-puzzle-chain",status:"GM_LIBRARY_ONLY"}}}});
const originalDone=()=>({version:1,status:"done",revision:6,positions:[1,3,2],lastMessageId:"authentic-msg",requesterId:"player",actorId:"hero"});
const valid=()=>({approval:approval(),sceneId:S,fixtureRegionId:R,fixtureRegionUuid:U,nativeReady:true,
 ringNativeReady:true,ringReceipt:originalDone(),symbols:["rose","sun","moth","thorn"],sluiceProof:{ready:true,blockers:[]},
 actorAuthorized:true,actorInFixture:true,sourceItem:item(),claim:null,alreadyAwarded:false});
const check=(patch={})=>assessOriginalCavBowlReward({...valid(),...patch});
test("Canonical original Bowl source and owner-approved fixture succeed only together",()=>{
 assert.deepEqual(check(),{ready:true,reason:"original-bowl-claim-ready"});
});
test("Unapproved fixture cannot claim, even with ring done and authorized user",()=>{
 for(const change of [
  null,{}, {status:"STAGED_DISABLED"},{status:"OWNER_APPROVED",approvalSource:"assistant",sceneId:S,regionId:R,regionUuid:U},
  {...approval(),regionId:"other"}, {...approval(),regionUuid:"Scene.fake"},
  {...approval(),sceneId:"CAVBATHScene0001"}]){
 assert.equal(check({approval:change}).reason,"owner-fixture-approval-missing");
 }
});
test("Wrong exact scene, region and UUID cannot inherit owner approval",()=>{
 for(const patch of [
 {sceneId:"CAVBATHScene0001"},{fixtureRegionId:"different"},{fixtureRegionId:""},
 {fixtureRegionUuid:"Scene.fake"},{fixtureRegionUuid:null}]){
 assert.equal(check(patch).ready,false);
 }
});
test("Native original region binding not attached: no permission to award",()=>{
 assert.equal(check({nativeReady:false}).reason,"original-pickup-behavior-not-installed");
});
test("Original ring native commissioning is required",()=>{
 assert.equal(check({ringNativeReady:false}).reason,"original-ring-not-commissioned");
});
test("Genuine complete Rosewater GM DONE receipt required, not a hand-set status",()=>{
 for(const state of [null,{}, {status:"done"}, {status:"reserved"}, {status:"unsolved"},
   {...originalDone(),revision:0},{...originalDone(),version:2},
   {...originalDone(),positions:[0,0,0]}, {...originalDone(),positions:[1,3,2,0]},
   {...originalDone(),lastMessageId:""},{...originalDone(),actorId:""},
   {...originalDone(),requesterId:""}]) {
  assert.equal(check({ringReceipt:state}).reason,"original-rosewater-rings-not-solved");
 }
 assert.equal(check().ready,true);
});
test("Four glyph identifiers require established owner-approved exact order",()=>{
 for(const symbols of [null,[],["sun","rose","moth","thorn"],["rose","sun","moth","moth"],["rose","sun","moth","thorn","extra"]])
  assert.equal(check({symbols}).reason,"original-ring-symbols-unapproved");
});
test("Uncommitted Crank+Pond+Bath proof fails closed",()=>{
 for(const sluiceProof of [null,{}, {ready:false}, {ready:false,blockers:["original-crank-not-installed"]}])
 assert.equal(check({sluiceProof}).reason,"original-sluice-not-drained");
});
test("Unauthorized actor or off-fixture token cannot collect original relic",()=>{
 assert.equal(check({actorAuthorized:false}).reason,"original-player-or-location-unauthorized");
 assert.equal(check({actorInFixture:false}).reason,"original-player-or-location-unauthorized");
});
test("Source Bowl template must have original UUID, type, quantity, name and provenance",()=>{
 const samples=[
  null,{...item(),id:"other"},{...item(),type:"equipment"},
  {...item(),name:"Fake Bowl"},{...item(),system:{quantity:2}},
  {...item(),flags:{"dicebox-campaign-helper":{cabinPuzzleItem:{source:"invented",status:"GM_LIBRARY_ONLY"}}}}
 ];
 for(const sourceItem of samples)assert.equal(check({sourceItem}).reason,"missing-canonical-source");
});
test("Reserved or interrupted claim must reconcile, never retry",()=>{
 for(const claim of [{status:"reserved"},{status:"failed"},{status:"pending"}])
 assert.equal(check({claim}).reason,"reconcile");
});
test("Existing completed claim denies duplicate reward",()=>{
 assert.equal(check({claim:{status:"done"}}).reason,"already-claimed");
 assert.equal(check({alreadyAwarded:true}).reason,"original-bowl-global-copy-already-awarded");
});
test("Approved source code maintains original unique World Item and contains no second template",()=>{
 const source=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 assert.ok(source.includes('const ORIGINAL="Item.1n5LONw3nYIy61O9"'));
 assert.ok(source.includes('game.items.get("1n5LONw3nYIy61O9")'));
 assert.ok(source.includes('delete obj._id'));
});
test("GM runtime requires explicit Player request, ownership and viewed dry Scene",()=>{
 const s=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 for(const fragment of [
  "game.users.activeGM?.id===game.user.id",
  'req.action!=="pickup"',
  "user.viewedScene===SCENE",
  'actor?.type==="character"',
  'actor.testUserPermission(user,"OWNER")',
  "c.fixture.testPoint(center(token,c.s))",
  'msg.user?.id!==author',
  'region?.behaviors?.get(BEHAVIOR)?.disabled!==false'])
 assert.ok(s.includes(fragment),fragment);
});
test("GM runtime verifies original native Behavior and event set before release",()=>{
 const s=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 for(const fragment of ["fixture.uuid===approval.regionUuid","fixture.id!==ring.id","fixture.behaviors.size===1",
  'behavior?.type==="executeScript"',"behavior.system?.source===SCRIPT","behavior.system.events.size===EVENTS.length",
  "EVENTS.every(e=>behavior.system.events.has(e))"])
 assert.ok(s.includes(fragment),fragment);
});
test("Single original reward grant reserves first, then embeds once and commits only afterward",()=>{
 const s=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 const a=s.indexOf("await c.fixture.setFlag(NS,CLAIM,reserve)"),
 b=s.indexOf('actor.createEmbeddedDocuments("Item",[obj])'),c=s.indexOf("await c.fixture.setFlag(NS,CLAIM,done)");
 assert.ok(a>=0&&b>a&&c>b);
 assert.ok(s.includes("if(made.length!==1"));
 assert.ok(s.includes("Original Scrying Bowl done receipt uncertain"));
 assert.ok(s.includes('i.getFlag(NS,"cavRosewaterBowlSourceUuid")===ORIGINAL'));
});
test("Explicit Bowl fixture approval cannot be synthesized by module API",()=>{
 const s=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 assert.ok(!s.includes("setFlag(NS,APPROVAL"));
 assert.ok(!s.includes('game.scenes.create'));
 assert.ok(!s.includes('createEmbeddedDocuments("Region"'));
});
test("Studio service API exposed but original Scene still awaits native approved fixture binding",()=>{
 const c=readFileSync(new URL("../modules/regionwright/scripts/studio-campaign.js",import.meta.url),"utf8");
 assert.ok(c.includes("installCavRosewaterBowlGMService()"));
 assert.ok(c.includes("rosewaterBowl: {handleRegionEvent:handleCavRosewaterBowlRegionEvent,describe:describeOriginalCavBowlPickupGM}"));
});

test("Bowl runtime verifies commissioned ring identity, events and full DONE receipt",()=>{
 const s=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 for(const required of ['ringBinding?.status==="ENABLED"','ringBinding?.puzzleKind==="rosewater-rings"',
   '"cavUnifiedBathFixtureKey"','ring?.behaviors.size===1','ringBehavior?.disabled===false',
   'ringBehavior.system?.events.size===3','CAV_ROSEWATER_SESSION',
   'ringReceipt?.status!=="done"','ringReceipt?.version!==1',
   'JSON.stringify(ringReceipt.positions)!=="[1,3,2]"',
   'typeof ringReceipt.lastMessageId!=="string"'])assert.ok(s.includes(required),required);
});

test("GM Bowl describe returns owner-fixture-approval-missing, not a null dereference",async()=>{
 const module=await import("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js");
 const saved=globalThis.game;
 let writes=0;
 const ring={id:"CAVBROSEWATER001",behaviors:new Map([["CAVROSEWATERSCR1",{disabled:true,type:"executeScript"}]]),
  getFlag(_ns,key){if(key==="cavUnifiedBathPuzzleBinding")return{status:"STAGED_DISABLED"};return null},
  setFlag(){writes++;throw Error("Read-only test must not write")}};
 const bowl=item();
 const sluice={getFlag(){return null}};
 const scene={regions:new Map([["CAVBROSEWATER001",ring]])};
 try{
  globalThis.game={ready:true,world:{id:"cabin-in-the-ashen-veil"},
   user:{id:"GM",isGM:true},users:{activeGM:{id:"GM"}},
   scenes:new Map([[S,scene],["CAVEXT02Scene001",{regions:new Map([["CAVEXT02SLUICE01",sluice]])}]]),
   items:new Map([["1n5LONw3nYIy61O9",bowl]])};
  const result=module.describeOriginalCavBowlPickupGM();
  assert.equal(result.status,"owner-fixture-approval-missing");
  assert.equal(result.nativeReady,false);
  assert.equal(result.ringNativeReady,false);
  assert.equal(result.approvedFixture,false);
  assert.equal(result.claimStatus,null);
  assert.equal(result.sluiceReady,false);
  assert.equal(writes,0);
  ring.getFlag=(_ns,key)=>key==="cavRosewaterBowlPickupApproval"?
   {status:"OWNER_APPROVED",approvalSource:"owner",sceneId:S,
    regionId:"UNINSTALLED_OWNER_FIXTURE",regionUuid:"Scene."+S+".Region.UNINSTALLED_OWNER_FIXTURE"}:
   key==="cavUnifiedBathPuzzleBinding"?{status:"STAGED_DISABLED"}:null;
  const notInstalled=module.describeOriginalCavBowlPickupGM();
  assert.equal(notInstalled.status,"owner-fixture-approval-missing");
  assert.equal(notInstalled.nativeReady,false);
  assert.equal(writes,0);
 }finally{
  if(saved===undefined)delete globalThis.game;
  else globalThis.game=saved;
 }
});

test("Missing fixture source must explicitly guard null before comparing undefined UUIDs",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 assert.ok(src.includes("const nativeReady=!!fixture&&!!approval&&!!ring&&"),"Absent owner fixture must fail closed");
 assert.ok(!src.includes("fixture?.uuid===approval?.regionUuid&&fixture.id"),"Original unsafe equality must be removed");
});
