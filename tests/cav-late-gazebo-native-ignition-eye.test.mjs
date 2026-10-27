import test from "node:test";
import assert from "node:assert/strict";
import {
 GAZEBO_SCENE,GAZEBO_LANTERN_REGION,GAZEBO_EYE_REGION,
 GAZEBO_EYE_TILE,GAZEBO_IGNITION_BEHAVIOR,GAZEBO_EYE_BEHAVIOR,
 GAZEBO_EYE_SOURCE,GAZEBO_WICK_SOURCE,GAZEBO_OIL_SOURCE,
 GAZEBO_APPROVED_MAP,GAZEBO_MARKER_RECT,GAZEBO_EYE_VISUAL,
 gazeboNativeBehaviorSource
} from "../modules/regionwright/scripts/studio-cav-late-gazebo-native-ignition-eye.js";
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
test("original scene source IDs and owner-approved visual",()=>{
 assert.equal(GAZEBO_SCENE,"CAVEXT05Scene001");
 assert.equal(GAZEBO_LANTERN_REGION,"CAVEXT05LANTERN1");
 assert.equal(GAZEBO_EYE_REGION,"CAVEXT05EYE2MARK");
 assert.equal(GAZEBO_EYE_TILE,"CAVEXT05EYE2TILE");
 assert.equal(GAZEBO_EYE_SOURCE,"Item.QIH1ugEWGOO1U6LN");
 assert.equal(GAZEBO_OIL_SOURCE,"Item.CAVLAMPOIL000001");
 assert.equal(GAZEBO_WICK_SOURCE,"Item.o0g8PyGRIbdwVM3m");
 assert.ok(GAZEBO_APPROVED_MAP.endsWith("ext-05_forgotten-gazebo_owner-approved.png"));
 assert.equal(GAZEBO_IGNITION_BEHAVIOR.length,16);
 assert.equal(GAZEBO_EYE_BEHAVIOR.length,16);
});
test("marker center and visual are inside approved original interior and isolated from lantern",()=>{
 const c=GAZEBO_MARKER_RECT,e=GAZEBO_EYE_VISUAL;
 assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=1920&&c.y+c.height<=1440);
 assert.ok(e.x>=c.x&&e.y>=c.y&&e.x+e.width<=c.x+c.width&&e.y+e.height<=c.y+c.height);
 assert.ok(c.x+c.width<=920||c.x>=1025||c.y+c.height<=375||c.y>=510);
 assert.ok(c.x+c.width<=770||c.y+c.height<=600);
});
for(const kind of ["ignite","claim"]){
 test(kind+" native Foundry Region script is syntactically executable",()=>{
  const src=gazeboNativeBehaviorSource(kind);
  assert.doesNotThrow(()=>new AsyncFunction("region","event",src));
  assert.ok(src.includes('game.users?.activeGM?.id!==game.user.id'));
  assert.ok(src.includes('actor.testUserPermission(u,"OWNER")'));
  assert.ok(src.includes("region.testPoint(center)"));
  assert.ok(src.includes('["tokenMoveIn","tokenMoveWithin"]'));
  assert.ok(src.includes("DialogV2.confirm"));
  assert.ok(src.includes("owner"));
  assert.ok(src.includes("cavLateEyeTwoMarker"));
  assert.ok(src.includes("Item.QIH1ugEWGOO1U6LN"));
 });
 test(kind+" reserves state and never grants reward on entry",()=>{
  const src=gazeboNativeBehaviorSource(kind);
  assert.ok(src.includes('status:"reserved"'));
  assert.ok(src.includes('if(!await confirm('));
  assert.ok(src.includes('status:"done"'));
  assert.ok(src.includes("globalThis[key]=true"));
  assert.ok(src.includes("Partial native transaction"));
 });
}
test("ignition requires BOTH separate original part installs and exact source",()=>{
 const s=gazeboNativeBehaviorSource("ignite");
 for(const x of ['cavLateGazeboOil','cavLateGazeboWick',
  'oil?.status!=="done"','wick?.status!=="done"',
  'oil.sourceUuid!=="Item.CAVLAMPOIL000001"',
  'wick.sourceUuid!=="Item.o0g8PyGRIbdwVM3m"',
  'oil.actorId!==actor.id','wick.actorId!==actor.id',
  'cavLateGazeboIgnition','tile.update({hidden:false})',
  'status:"visible"'])
  assert.ok(s.includes(x),"missing "+x);
});
test("ignition does not automatically award or move a character",()=>{
 const s=gazeboNativeBehaviorSource("ignite");
 assert.ok(s.includes('"ignite"==="claim"'));
 assert.ok(s.includes('if("ignite"==="ignite")'));
 assert.ok(!s.includes("teleportToken"));
});
test("eye pickup requires visibly lit lantern and separate confirmation",()=>{
 const s=gazeboNativeBehaviorSource("claim");
 for(const x of ['light?.status!=="done"','state?.status!=="visible"',
 'status:"reserved"','actor.createEmbeddedDocuments("Item"',
 'cavLateGazeboEye2SourceUuid','tile.update({hidden:true})',
 'status:"claimed"'])assert.ok(s.includes(x),"missing "+x);
});
test("no duplicated second eye reward in any actor",()=>{
 const s=gazeboNativeBehaviorSource("claim");
 assert.ok(s.includes("game.actors.contents.some"));
 assert.ok(s.includes('i.name===original.name'));
 assert.ok(s.includes("dup()"));
});
test("wrong stage is rejected by source factory",()=>{
 assert.throws(()=>gazeboNativeBehaviorSource("fire"));
});