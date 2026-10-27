import test from "node:test";
import assert from "node:assert/strict";
import {nativeBatch1Fixtures,nativeBatch1Script,BATCH1_NATIVE_VERSION}
 from "../modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js";
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const all=nativeBatch1Fixtures();
test("native source version and exact three commissioned late fixtures",()=>{
 assert.equal(BATCH1_NATIVE_VERSION,1);
 assert.deepEqual(all.map(x=>x.kind),["hope","wick","lantern"]);
 assert.deepEqual(all.map(x=>x.region),
  ["CAVHU04HOPECHST1","CAVBE5639AEC2179","CAVEXT05LANTERN1"]);
});
for(const fixture of all){
 test(fixture.kind+" body compiles as Foundry Region async script",()=>{
  const s=nativeBatch1Script(fixture.kind);
  assert.doesNotThrow(()=>new AsyncFunction("region","event",s));
  assert.ok(s.includes('game?.world?.id!==WORLD'));
  assert.ok(s.includes('game.version!=="14.367"'));
  assert.ok(s.includes(fixture.scene));
  assert.ok(s.includes(fixture.region));
  assert.ok(s.includes("game.users?.activeGM?.id===game.user.id"));
  assert.ok(s.includes("actor.testUserPermission"));
  assert.ok(s.includes('region.testPoint(cpt)'));
 });
 test(fixture.kind+" exposes original player inspection without item mutation",()=>{
  const s=nativeBatch1Script(fixture.kind);
  assert.ok(s.includes('evt==="behaviorViewed"&&!game.user?.isGM'));
  assert.ok(s.includes('if(!["tokenMoveIn","tokenMoveWithin"].includes(evt)||!elected())return'));
  assert.ok(s.includes("DialogV2.prompt"));
  assert.ok(s.includes("DialogV2.confirm"));
 });
 test(fixture.kind+" reserves before any reward transaction",()=>{
  const s=nativeBatch1Script(fixture.kind);
  assert.ok(s.indexOf('status:"reserved"') < s.lastIndexOf('status:"done"'));
  assert.ok(s.includes("throw Error"));
 });
}
test("Hope Chest never accepts generic or World-library-only Silver Key",()=>{
 const s=nativeBatch1Script("hope");
 assert.ok(s.includes('i.getFlag(NS,"cavLateSilverKeySourceUuid")===keySource'));
 assert.ok(s.includes('cavLateSilverKeyDropRegionUuid'));
 assert.ok(s.includes('cavLateSecondChaseSilverKeyClaim'));
 assert.ok(s.includes('proof.actorId!==actor.id'));
 assert.ok(s.includes('proof.sourceUuid!==keySource'));
 assert.ok(s.includes("Item.IY8fuUG5P0yWIZIh"));
 assert.ok(s.includes("Item.YaKs6z2AWlEAlyzx"));
 assert.ok(s.includes('cavLateHopeChestUnlock'));
 assert.ok(s.includes('cavLateMusicBoxClaim'));
});
test("Prayer placeholder cannot issue Prayer claim or auto-open Workshop",()=>{
 const s=nativeBatch1Script("hope");
 assert.ok(s.includes("Prayer of Protection requires a complete owner-approved readable Journal"));
 assert.ok(!s.includes("cavLatePrayerProtectionClaim"));
});
test("Wick requires independently certified original Studio Prayer passage",()=>{
 const s=nativeBatch1Script("wick");
 assert.ok(s.includes("Item.5jwy75XyFezukf3b"));
 assert.ok(s.includes('originalPrayerReadReceiptVerified===true'));
 assert.ok(s.includes('verifiedWorkshopSceneId==="CAVHU08Scene0001"'));
 assert.ok(s.includes("Item.o0g8PyGRIbdwVM3m"));
 assert.ok(s.includes('cavLateWickClaim'));
});
test("Lantern preserves each of two original materials and separate ignite stage",()=>{
 const s=nativeBatch1Script("lantern");
 assert.ok(s.includes("Item.CAVLAMPOIL000001"));
 assert.ok(s.includes("Item.o0g8PyGRIbdwVM3m"));
 assert.ok(s.includes("cavLampOilSourceRegionUuid"));
 assert.ok(s.includes("cavLateWickSourceRegionUuid")===false);
 assert.ok(s.includes('cavLateBatch1SourceRegionUuid'));
 assert.ok(s.includes("cavLateGazeboOil"));
 assert.ok(s.includes("cavLateGazeboWick"));
 assert.ok(s.includes('actor.deleteEmbeddedDocuments("Item"'));
 assert.ok(s.includes("Cobweb removal/eye #2 marker/ignite intentionally NOT attempted"));
 assert.ok(!s.includes("await Item.createDocuments"));
});
test("unsupported native fixture is rejected",()=>{
 assert.throws(()=>nativeBatch1Script("rufus"));
});