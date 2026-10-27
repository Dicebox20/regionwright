import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const manifest=JSON.parse(readFileSync(new URL("../docs/cabin-ashen-veil/player-facing-puzzle-nonspoiler-text-audit-manifest-2026-10-27.json",import.meta.url),"utf8"));
const scriptPath=name=>new URL("../modules/regionwright/scripts/"+name,import.meta.url);
test("Owner's puzzle QA rule records separate player sensory prose versus GM mechanics",()=>{
 assert.equal(manifest.schema,"dicebox.cav.player-puzzle-nonspoiler-prose/v1");
 assert.equal(manifest.styleRules.length,6);
 assert.ok(manifest.styleRules.some(x=>x.includes("combination")));
 assert.ok(manifest.styleRules.some(x=>x.includes("GM-only")));
 assert.ok(manifest.styleRules.some(x=>x.includes("consequences")));
});
test("Every recorded Regionwright player-facing UI/spoiler sentence has been replaced in actual sources",()=>{
 assert.equal(manifest.moduleChanges.length,8);
 let replacements=0;
 for(const module of manifest.moduleChanges){
  const source=readFileSync(scriptPath(module.file),"utf8");
  for(const [before,after]of module.pairs){
   assert.notEqual(before,after,module.file);
   assert.ok(!source.includes(before),module.file+" still exposes old player guidance: "+before.slice(0,55));
   assert.ok(source.includes(after),module.file+" lacks approved sensory replacement: "+after.slice(0,55));
   replacements++;
  }
 }
 assert.equal(replacements,39);
});
test("Exactly eleven native RegionBehavior source revisions are catalogued and avoid replay",()=>{
 const src=manifest.nativeBehaviorChanges;
 assert.equal(src.length,11);
 assert.equal(new Set(src.map(x=>x.uuid)).size,11);
 assert.equal(new Set(src.map(x=>x.id)).size,11);
 let count=0;
 for(const s of src){
  assert.equal(s.id,s.uuid.split(".").at(-1));
  assert.match(s.originalSha256,/^[0-9a-f]{64}$/);
  assert.match(s.revisedSha256,/^[0-9a-f]{64}$/);
  assert.notEqual(s.originalSha256,s.revisedSha256);
  for(const [before,after] of s.pairs){
   assert.notEqual(before,after);
   assert.ok(after.length>15);
   count++;
  }
 }
 assert.equal(count,30);
});
test("All 69 wording edits retain original reward/claim/GM controls, no narrative test counts as player acceptance",()=>{
 assert.equal(manifest.scope.totalQuotedPassagesChanged,70);
 assert.equal(manifest.scope.scenes,47);
 assert.equal(manifest.scope.regions,250);
 assert.equal(manifest.scope.executableNativeScriptsAudited,60);
 assert.equal(manifest.scope.journalPagesEnumerated,331);
 assert.ok(manifest.auditNotes.some(s=>s.includes("coordinated reload")));
 assert.ok(manifest.auditNotes.some(s=>s.includes("not claimed")));
});
test("Original First Chest player-facing macro removes the prompt instruction without disclosing its solution",()=>{
 const m=manifest.macroChanges;
 assert.equal(m.length,1);
 assert.equal(m[0].uuid,"Macro.CAVCHEST024MAC01");
 assert.match(m[0].beforeSha256,/^[0-9a-f]{64}$/);
 assert.match(m[0].afterSha256,/^[0-9a-f]{64}$/);
 assert.notEqual(m[0].beforeSha256,m[0].afterSha256);
 assert.equal(m[0].replacements.length,1);
 const [before,after]=m[0].replacements[0];
 assert.ok(before.includes("Enter the combination"));
 assert.ok(!after.includes("combination"));
 assert.ok(after.includes("numbered tumblers"));
 assert.equal(manifest.scope.GMmacrosChanged,1);
});