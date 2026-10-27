import test from 'node:test';
import assert from 'node:assert/strict';
import{SCENE_NAMES,validateNames}from
 '../modules/regionwright/scripts/studio-cav-owner-nonspoiler-scene-titles-20261027.js';
test('exact complete 47 pre-existing Scene IDs, unique original and new player-visible names',()=>{
 assert.equal(SCENE_NAMES.length,47);
 assert.equal(validateNames(),true);
 assert.equal(new Set(SCENE_NAMES.map(x=>x.id)).size,47);
 assert.equal(new Set(SCENE_NAMES.map(x=>x.prior)).size,47);
 assert.equal(new Set(SCENE_NAMES.map(x=>x.newName)).size,47);
});
test('house first floor and second floor F1 / F2 labels replace H-G / H-U',()=>{
 const first=SCENE_NAMES.filter(x=>/^H-G/.test(x.prior));
 const second=SCENE_NAMES.filter(x=>/^H-U/.test(x.prior));
 assert.equal(first.length,7);
 assert.equal(second.length,7);
 assert.ok(first.every(x=>x.newName.startsWith('F1 — ')));
 assert.ok(second.every(x=>x.newName.startsWith('F2 — ')));
});
test('non-spoiler Scene names do not show campaign puzzle or historical internal scene codes',()=>{
 for(const m of SCENE_NAMES){
  assert.doesNotMatch(m.newName,/(keystone|ritual|sune|sophia|donovan|voss|refuge|crimson|gond|H-U|H-G|H-B|UND-[0-9]|SG-[0-9]|EXT-[0-9]|AQ-[0-9])/i);
  assert.ok(m.newName.length<55);
 }
});
test('underlying Scene IDs remain exactly stable, no duplicate names',()=>{
 assert.equal(SCENE_NAMES.find(x=>x.id==='CAVHU05Scene0001').newName,'F2 — Small Bedroom');
 assert.equal(SCENE_NAMES.find(x=>x.id==='tjTpG2RVZNoCqRLh').newName,'Basement — Inner Room');
 assert.equal(SCENE_NAMES.find(x=>x.id==='hLU4DzVctEGdsuaz').newName,'Underground — Deep Chamber');
});
test('originals provide a collision and rollback comparison before any update',()=>{
 assert.ok(SCENE_NAMES.every(x=>x.prior!==x.newName&&x.prior.length>8));
});