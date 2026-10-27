import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
const source=new URL("../docs/cabin-ashen-veil/study587-original-native-click-sources-2026-10-26.json",import.meta.url);
const {world,entries}=JSON.parse(readFileSync(source,"utf8"));
const hash=s=>crypto.createHash("sha256").update(s,"utf8").digest("hex").toUpperCase();
test("Only original two owner-approved 587 Behaviors targeted, no duplicate Regions",()=>{
 assert.equal(world,"cabin-in-the-ashen-veil");
 assert.deepEqual(entries.map(x=>[x.kind,x.regionId,x.behaviorId]),[
 ["note","CAVB3E32BD6B01BD","CAVHG05NOTE00001"],
 ["box","CAVEXT03BOXREG01","CAVEXT03BOXBEH01"]]);
});
test("Both native interaction scripts stay syntax-valid and preserve GM-only Item handling",()=>{
 for(const x of entries){
  assert.equal(hash(x.originalSource),x.beforeSha256);
  assert.equal(hash(x.patchedSource),x.afterSha256);
  assert.doesNotThrow(()=>new vm.Script("async function cav587Bound(){\n"+x.patchedSource+"\n}"));
  assert.match(x.patchedSource,/cav587Request:/);
  assert.match(x.patchedSource,/await ChatMessage\.create\(/);
  assert.doesNotMatch(x.patchedSource,/\.setFlag\s*\(|\.createEmbeddedDocuments\s*\(|\.deleteEmbeddedDocuments\s*\(/);
 }
});
test("Player image/scene/event/selection/UI source survives patch exactly; only distance gating added",()=>{
 for(const x of entries){
  assert.match(x.patchedSource,/Owner-approved map-object player inspection/);
  assert.match(x.patchedSource,/behaviorViewed/);
  assert.match(x.patchedSource,/behaviorUnviewed/);
  assert.match(x.patchedSource,/behaviorDeactivated/);
  assert.match(x.patchedSource,/Select exactly one owned character near this item to interact/);
  assert.match(x.patchedSource,/isCav587CharacterNearRegion\(\{token,scene:canvas\.scene,region\}\)/);
  assert.match(x.patchedSource,/if\(!near\|\|done\)return true/);
  assert.ok(x.patchedSource.includes('image')&&x.patchedSource.includes('CONFIG.scene'));
 }
});
test("Action UI for lockbox requires same valid selected near token as elected GM",()=>{
 const box=entries.find(x=>x.kind==="box");
 assert.match(box.patchedSource,/CONFIG\.kind==='box'&&!done&&near\?/);
 assert.match(box.patchedSource,/digits=\[0,1,2\]\.map/);
 assert.match(box.patchedSource,/return true;\s*\}\},rejectClose:false/);
});
