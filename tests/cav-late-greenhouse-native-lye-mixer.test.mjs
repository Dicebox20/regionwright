import test from "node:test";
import assert from "node:assert/strict";
import {
 GREENHOUSE_SCENE,GREENHOUSE_APPROVED_ART,GREENHOUSE_CONTROLS_REGION,
 GREENHOUSE_MIX_BEHAVIOR,ORIGINAL_QUEST_LYE,ORIGINAL_PLANT_KILLER,
 ORIGINAL_WATERWORKS_REGION,AUTHORIZED_SOAP_SCENES,greenhouseNativeSource
} from "../modules/regionwright/scripts/studio-cav-late-greenhouse-native-lye-mixer.js";
const AF=Object.getPrototypeOf(async function(){}).constructor;
test("matches real original EXT06 region and approved art",()=>{
 assert.equal(GREENHOUSE_SCENE,"CAVEXT06Scene001");
 assert.equal(GREENHOUSE_CONTROLS_REGION,"CAVB6E433D528867");
 assert.equal(GREENHOUSE_MIX_BEHAVIOR,"CAVEXT06LYEMIX01");
 assert.equal(GREENHOUSE_MIX_BEHAVIOR.length,16);
 assert.ok(GREENHOUSE_APPROVED_ART.endsWith("ext-06_greenhouse-interior_owner-approved.png"));
});
test("original lye plant killer source IDs verified",()=>{
 assert.equal(ORIGINAL_QUEST_LYE,"Item.vDR4cJU35iODR6gh");
 assert.equal(ORIGINAL_PLANT_KILLER,"Item.YNWpGEGB17mqDFWe");
 assert.equal(ORIGINAL_WATERWORKS_REGION,"Scene.CAVAQ01Scene0001.Region.kmPmr5ijLCEOJNk3");
 assert.deepEqual([...AUTHORIZED_SOAP_SCENES],["CAVBATHScene0001","8yLMRDvxyw58dydh"]);
});
test("native Foundry Region executeScript body compiles",()=>{
 assert.doesNotThrow(()=>new AF("region","event",greenhouseNativeSource()));
});
test("native source checks exact elected GM, world, scene and region",()=>{
 let s=greenhouseNativeSource();
 for(let x of ['game.users?.activeGM?.id===game.user.id',
   'game.version!=="14.367"','game.world?.id!=="cabin-in-the-ashen-veil"',
   'scene?.id!=="CAVEXT06Scene001"','region?.id!=="CAVB6E433D528867"'])
 assert.ok(s.includes(x),"missing "+x);
});
test("only proper player-owned token at original Region and explicit GM confirmation",()=>{
 let s=greenhouseNativeSource();
 for(let x of ['actor.testUserPermission(u,"OWNER")',
   'region.testPoint(center)','event.data?.token',
   'DialogV2.confirm','if(!ok)return'])assert.ok(s.includes(x),"missing "+x);
});
test("Waterworks Annex ledger must prove separate restored Waterworks not Pond bath sluice",()=>{
 const s=greenhouseNativeSource();
 for(let x of ['regions.get("kmPmr5ijLCEOJNk3")','"cavWaterworksRestore"',
  'restored?.status!=="done"','reverifiedFromOriginalWaterworks!==true',
  'greenhouseSprinklerFlowRestored!==true'])
  assert.ok(s.includes(x),"missing "+x);
 assert.ok(!s.includes("cavPondBathWaterState"));
});
test("authentic Soap Case origin and original actor Lye custody required",()=>{
 let s=greenhouseNativeSource();
 for(let x of ['"cavLateLyeSourceUuid"','"cavLateLyeOriginRegionUuid"',
  '"cavLateSoapCase"','"cavLateSoapLyeClaim"',
  'soap?.status!=="unlocked"','soap?.canonCode!=="BATH-02"',
  'award?.actorId!==actor.id','award?.embeddedItemId!==lyeInstance.id',
  '"CAVBATHScene0001"','"8yLMRDvxyw58dydh"'])
 assert.ok(s.includes(x),"missing "+x);
});
test("unique Plant Killer production reserve, confirmed grant, readback then permanent claim",()=>{
 let s=greenhouseNativeSource();
 for(let x of ['game.actors.contents.some','i.name===result.name',
  'status:"reserved"','actor.createEmbeddedDocuments("Item"',
  'cavLatePlantKillerSourceUuid','status:"done"',
  'embedded.getFlag(NS,"cavLatePlantKillerSourceUuid")',
  'Partial Greenhouse source transaction'])
 assert.ok(s.includes(x),"missing "+x);
});
test("Lye never consumed or transformed without separate owner decision",()=>{
 let s=greenhouseNativeSource();
 assert.ok(s.includes("lyeConsumed:false"));
 assert.ok(!s.includes('deleteEmbeddedDocuments("Item"'));
 assert.ok(!s.includes('lyeInstance.update('));
 assert.ok(!s.includes("new Item("));
});
test("no intermediate fake Waterworks flags and no plugin socket writes",()=>{
 let s=greenhouseNativeSource();
 assert.ok(!s.includes('game.socket.emit'));
 assert.ok(!s.includes('from "'));
 assert.ok(!s.includes("evaluateGreenhouseLyeUse"));
 assert.ok(!s.includes("use random"));
});
test("read-only player inspection is separate from game-state grant",()=>{
 let s=greenhouseNativeSource();
 assert.ok(s.includes('event?.name==="behaviorViewed"&&!game.user?.isGM'));
 assert.ok(s.includes("DialogV2.prompt"));
 assert.ok(s.includes('["tokenMoveIn","tokenMoveWithin"].includes(event?.name)'));
});