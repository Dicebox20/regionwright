import test from "node:test";
import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
import{assessCavDrainedPickupWaterReady}from"../modules/regionwright/scripts/studio-cav-drained-pickups.js";
const c=()=>({version:1,status:"done",sourceUuid:"Item.g3VYdgc1qkgkHGvn",consumedActorItemId:"pc-item",boxRegionUuid:"Scene.CAVEXT03Scene001.Region.CAVEXT03BOXREG01"});
const w=()=>({version:1,status:"open",pond:"drained",bath:"drained",stage:"committed",source:"sluice"});
const tx=()=>({version:1,status:"done",operation:"open",committedState:"open",next:{status:"open",pond:"drained",bath:"drained"}});
const p=()=>({crank:c(),water:w(),transaction:tx(),
 pondBackground:"Maps/cabin-in-the-ashen-veil/ext-02_pond_drained_owner-approved.png",
 trailPortal:{id:"ZbrhX0nnaLvLA5Zh",type:"teleportToken",disabled:false,
 destinations:["Scene.8yLMRDvxyw58dydh.Region.R2Pg9eHODtb1C1Yk"]},dryBathLandingExists:true});
const judge=o=>assessCavDrainedPickupWaterReady({...p(),...o});
test("Both original Weathered Key and Screwdriver require truly committed two-body drain",()=>{
 assert.deepEqual(judge({}),{ready:true,reason:"original-committed-drained-stage"});
});
test("No original fitted Crank, missing water or missing prior transaction deny pickup",()=>{
 for(const args of [{crank:null},{water:null},{transaction:null},
  {crank:{...c(),status:"reserved"}},{crank:{...c(),sourceUuid:"Item.fake"}}])
 assert.equal(judge(args).ready,false);
});
test("Stale or reserved water transaction denies retrieval even when water claims open",()=>{
 for(const transaction of [{...tx(),status:"reserved"},{...tx(),operation:"close"},{...tx(),committedState:"closed"},
  {...tx(),next:{...tx().next,bath:"full"}}])
 assert.equal(judge({transaction}).ready,false);
});
test("Conflicting Pond/Bath, manually initial/open or reclosed water stages deny",()=>{
 for(const water of [{...w(),bath:"full"},{...w(),stage:"initial"},
  {...w(),source:"fake"},{...w(),status:"closed",pond:"full",bath:"full"}])
 assert.equal(judge({water}).ready,false);
});
test("Original drained Pond artwork must be active, not only world water flags",()=>{
 assert.equal(judge({pondBackground:"Maps/cabin-in-the-ashen-veil/ext-02_pond_full_owner-approved.png"}).ready,false);
 assert.equal(judge({pondBackground:null}).ready,false);
});
test("Exact original one-target enabled Trail to dry Bath route and landing are mandatory",()=>{
 const orig=p().trailPortal;
 for(const portal of [{...orig,disabled:true},{...orig,type:"executeScript"},
  {...orig,destinations:[...orig.destinations,"Scene.other"]},{...orig,destinations:[]},
  {...orig,destinations:["Scene.CAVBATHScene0001.Region.R2Pg9eHODtb1C1Yk"]}])
 assert.equal(judge({trailPortal:portal}).ready,false);
 assert.equal(judge({dryBathLandingExists:false}).ready,false);
});
test("Both player closeups and GM Item grants share same DRY guard before reward claims",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-drained-pickups.js",import.meta.url),"utf8");
 assert.match(src,/function DRY\(\)/);
 assert.match(src,/return assessCavDrainedPickupWaterReady\(\{/);
 assert.match(src,/if\(!DRY\(\)\)return "hidden"/);
 assert.match(src,/drainedPickupDecision\(DRY\(\)\?"open":"closed"/);
 assert.ok(src.indexOf('if(!DRY())return "hidden"')<src.indexOf('await region.setFlag(NS,CLAIM'));
});
