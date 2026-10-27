import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessOriginalCavBowlReward} from "../modules/regionwright/scripts/studio-cav-rosewater-bowl.js";
import {shouldHandleDrainedPickupClick} from "../modules/regionwright/scripts/studio-cav-drained-pickups.js";
const scene="8yLMRDvxyw58dydh",region="CAVROSEBOWLREG01",id="Scene."+scene+".Region."+region;
const bowl={x:977,y:375,width:108,height:88},ring={x:976,y:826,width:108,height:115};
const screw={x:870,y:710,width:360,height:330};
const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const approval={version:1,status:"OWNER_APPROVED",approvalSource:"owner",
 approvalBasis:"Owner delegated Cabin creative and technical decisions to coordinator in conversation 2026-10-26",
 sceneId:scene,regionId:region,regionUuid:id,placementName:"Northern Ceremonial Rug"};
const sourceItem={id:"1n5LONw3nYIy61O9",type:"loot",name:"Sune’s Scrying Bowl",system:{quantity:1},
 flags:{"dicebox-campaign-helper":{cabinPuzzleItem:{source:"2026-10-24-approved-puzzle-chain",status:"GM_LIBRARY_ONLY"}}}};
const done={version:1,status:"done",revision:3,positions:[1,3,2],lastMessageId:"actual-request-msg",requesterId:"player",actorId:"hero"};
const base={approval,sceneId:scene,fixtureRegionId:region,fixtureRegionUuid:id,nativeReady:true,ringNativeReady:true,
 ringReceipt:done,symbols:["rose","sun","moth","thorn"],sluiceProof:{ready:true},actorAuthorized:true,
 actorInFixture:true,sourceItem,claim:null,alreadyAwarded:false};

test("Delegated approved location is a physically separate chapel rug, not Rosewater or Screwdriver",()=>{
 assert.equal(intersects(bowl,ring),false);
 assert.equal(intersects(bowl,screw),false);
 assert.equal(bowl.x+bowl.width<=2160,true);
 assert.equal(bowl.y+bowl.height<=1440,true);
 assert.equal(bowl.x>0&&bowl.y>0,true);
});
test("Stable new native Bowl Region and Behavior identifiers have Foundry-safe lengths",()=>{
 assert.equal(region.length,16);
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-rosewater-bowl.js",import.meta.url),"utf8");
 assert.ok(src.includes('const BEHAVIOR="CAVROSEBOWLPICK1"'));
 assert.equal("CAVROSEBOWLPICK1".length,16);
});
test("Original Bowl grant remains fail closed even with owner fixture approval until real ring and water completion",()=>{
 assert.deepEqual(assessOriginalCavBowlReward(base),{ready:true,reason:"original-bowl-claim-ready"});
 for(const patch of [
 {ringNativeReady:false},{ringReceipt:null},{sluiceProof:{ready:false}},
 {actorAuthorized:false},{actorInFixture:false},{nativeReady:false},
 {claim:{status:"reserved"}},{claim:{status:"done"}},{alreadyAwarded:true}
 ])assert.equal(assessOriginalCavBowlReward({...base,...patch}).ready,false);
});
test("Original Screwdriver mask remains independent of the Bowl reward and Rosewater",()=>{
 assert.equal(shouldHandleDrainedPickupClick({fixtureId:"CAVBATHSCRDRY001",insideFixture:true,insideRosewaterRing:true}),false);
 assert.equal(shouldHandleDrainedPickupClick({fixtureId:"CAVBATHSCRDRY001",insideFixture:true,insideRosewaterRing:false}),true);
});
