import test from 'node:test';import assert from 'node:assert/strict';
import{PHASES,makeCatalog,buildProfiles,buildMacroCommand,FX_ID_P}from'../modules/regionwright/scripts/studio-cav-ambience-four-phase.js';
import{SCENE_NAMES}from'../modules/regionwright/scripts/studio-cav-owner-nonspoiler-scene-titles-20261027.js';
const scenes=makeCatalog();
const originals=Object.fromEntries(scenes.map(x=>[x.id,{name:x.name,darknessLevel:0,darkHue:.71}]));
const configs=buildProfiles(originals);
test('47 stable original scenes',()=>{assert.equal(scenes.length,47);assert.deepEqual(scenes.map(x=>x.id).sort(),SCENE_NAMES.map(x=>x.id).sort())});
test('four phase variants for all 47',()=>{
 assert.deepEqual(PHASES,['early','mid','late','crimson']);
 for(const x of scenes){const c=configs[x.id];
 assert.ok(c.early.darknessLevel<c.mid.darknessLevel);
 assert.ok(c.mid.darknessLevel<c.late.darknessLevel);
 assert.ok(c.late.darknessLevel<c.crimson.darknessLevel);
 assert.equal(c.crimson.darkHue,.98);}
});
test('existing live Carriage Yard rain and fog left alone',()=>{
 const x=configs.CAVEXT01Yard0001;assert.equal(x.early.darknessLevel,.15);
 assert.equal(x.early.weather,'fog');assert.equal(x.early.particle,null);
});
test('FXMaster stable managed IDs, 12 or more outdoor fog scenes',()=>{
 const ex=scenes.filter(x=>x.particle==='fog');
 assert.ok(ex.length>=12);assert.equal(FX_ID_P,'apiMacro_cavAmbience1_p');
 for(const x of ex){assert.equal(configs[x.id].early.particle.type,'fog');
 assert.equal(configs[x.id].early.particle.id,FX_ID_P);
 assert.equal(configs[x.id].early.weather,'');}
});
test('no blanket core fog inside enclosed rooms and source ambience from read-aloud',()=>{
 assert.ok(scenes.every(x=>x.tone.length>14));
 for(const x of scenes.filter(x=>x.type!=='exterior'))assert.equal(configs[x.id].early.weather,'');
});
test('self-contained macro parses, never changes lights/sounds/regions/puzzles/scene ids',()=>{
 const cmd=buildMacroCommand(configs,originals);
 assert.doesNotThrow(()=>new (Object.getPrototypeOf(async function(){}).constructor)('phase',cmd));
 assert.ok(cmd.includes('CAVAMBIENCEMACR1'));
 assert.ok(cmd.includes('FXMASTER.api.effects.play'));
 assert.ok(cmd.includes("getDocumentClass('Scene').updateDocuments(updates)"));
 for(const bad of ['createEmbeddedDocuments','deleteEmbeddedDocuments','updateEmbeddedDocuments',
 'tokenVision','globalLight.enabled','game.settings.set','canvas.scene.activate'])
  assert.equal(cmd.includes(bad),false,bad);
});
test('only verified GM can execute macro and unclear previous partial stage locks',()=>{
 const cmd=buildMacroCommand(configs,originals);
 assert.ok(cmd.includes('game.users?.activeGM?.id!==game.user.id'));
 assert.ok(cmd.includes('current.pending'));
 assert.ok(cmd.includes('sourceCount!==47'));
});