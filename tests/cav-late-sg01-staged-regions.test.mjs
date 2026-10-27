import test from "node:test";
import assert from "node:assert/strict";
import {SG01_SCENE,SG01_MAP,SG01_NW_WINDER,SG01_REGIONS,SG01_MISSING_PREREQS,
 SG01_SILVER_KEY_SOURCE,sourceForSG01} from "../modules/regionwright/scripts/studio-cav-late-sg01-staged-regions.js";
const AF=Object.getPrototypeOf(async function(){}).constructor;
test("true northwest scene not memorial SG05",()=>{
 assert.equal(SG01_SCENE,"CAVSG01Scene0001");
 assert.equal(SG01_NW_WINDER,"gksvZIqj8jWdqzn7");
 assert.ok(SG01_MAP.includes("sg-01_northwest"));
 assert.equal(SG01_SILVER_KEY_SOURCE,"Item.IY8fuUG5P0yWIZIh");
});
test("stage only two separate 16-char Region and Behavior fixed IDs",()=>{
 assert.equal(SG01_REGIONS.length,2);
 for(const p of SG01_REGIONS){
  assert.equal(p.id.length,16);
  assert.equal(p.behavior.length,16);
  assert.ok(p.rect.width>100&&p.rect.height>100);
  assert.doesNotThrow(()=>new AF("region","event",sourceForSG01(p.kind)));
 }
});
test("no overlap between chase staging Region and silver recovery marker",()=>{
 const [a,b]=SG01_REGIONS.map(x=>x.rect);
 assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||
  a.y+a.height<=b.y||b.y+b.height<=a.y);
});
test("neither staged marker intersects northwest Winder's known bounding extent",()=>{
 for(const p of SG01_REGIONS){
  const c=p.rect;
  assert.ok(c.x>=1860||c.x+c.width<=1290||c.y>=1410||c.y+c.height<=680);
 }
});
for(const item of SG01_REGIONS){
 test("disabled native source rejects forged world and incomplete real progression "+item.kind,()=>{
  const s=sourceForSG01(item.kind);
  for(const token of [
   'game?.world?.id!==WORLD','game.users?.activeGM?.id!==game.user.id',
   'firstChaseReceiptVerified!==true','waterworksRestoreNativeReadbackVerified!==true',
   'allenWarningReadNativeReceiptVerified!==true',
   'crookedManActorAndEncounterVerified!==true',
   'ownerStage?.status!=="armed-by-elected-gm"',
   '["escaped","captured"].includes(first?.status)'
  ])assert.ok(s.includes(token),"missing "+token);
  assert.ok(!s.includes('Item.createDocuments'));
  assert.ok(!s.includes('createEmbeddedDocuments'));
  assert.ok(!s.includes('game.socket.emit'));
  assert.ok(!s.includes('canvas.tokens.controlled'));
 });
}
test("missing prerequisites are explicit, no fake unlock",()=>{
 assert.deepEqual([...SG01_MISSING_PREREQS],
  ["first-chase","waterworks-restored","allen-warning","crooked-man"]);
});
test("cannot invent a third alternate SG01 mechanism",()=>{
 assert.throws(()=>sourceForSG01("memorial"));
});