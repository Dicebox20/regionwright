import test from 'node:test';import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{makeCatalog,PHASES,FX_ID_P}from'../modules/regionwright/scripts/studio-cav-ambience-four-phase.js';
const root=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-cav-four-phase-ambience/',import.meta.url);
const read=n=>JSON.parse(readFileSync(new URL(n,root),'utf8'));
const before=read('cav-ambience-four-phase-originals-and-preflight.json');
const created=read('cav-ambience-four-phase-gm-macro-install.json');
const proof=read('cav-ambience-four-phase-early-independent-postread.json');
const matrix=read('SCENE-PHASE-MATRIX.json');
const fx=read('cav-ambience-fxmaster-api-probe.json');
test('59 original owner room read-aloud entries scanned, all 47 mapped',()=>{
 assert.equal(before.readAloudPages.length,59);assert.equal(matrix.originalReadaloudPageCount,59);
 assert.equal(matrix.scenes.length,47);assert.ok(matrix.scenes.every(x=>x.linkedReadaloud));
});
test('one time originally pristine world 47 exact Scene originals, macros GM only',()=>{
 assert.equal(before.sceneCount,47);assert.equal(Object.keys(before.originals).length,47);
 assert.equal(created.id,'CAVAMBIENCEMACR1');
 assert.equal(created.created,true);assert.equal(created.phase,'original');
 assert.equal(created.sourceSHA256,before.macroCommandSHA256);
 assert.equal(proof.macro.gmOnly,true);
});
test('current elected GM independent readback validates all 47 native scene settings',()=>{
 assert.equal(proof.pass,true);assert.equal(proof.sceneVerified,47);
 assert.equal(proof.sceneCount,47);assert.deepEqual(proof.mismatches,[]);
 assert.equal(proof.original47SceneNamesPreserved,true);
});
test('native walls, regions, lights, sounds, token vision and global light preserved',()=>{
 assert.equal(proof.regionsPreserved,true);assert.equal(proof.nativeSoundsPreserved,true);
 assert.equal(proof.nativeLightsPreserved,true);
 assert.ok(proof.allScenes.every(x=>x.pass&&x.originalFXPreserved&&x.lightsPreserved&&x.soundPreserved));
});
test('FXMaster 8.3.6 documented managed row was tested on unoccupied Grove',()=>{
 assert.equal(fx.success,true);
 assert.deepEqual(fx.created.particles,['apiMacro_cavAmbienceProbe_p']);
 assert.equal(fx.scene,'CAVSG06Scene0001');
 assert.equal(proof.selectedFXScenes,15);
 assert.equal(proof.originalEffectsPreserved,true);
 assert.ok(proof.allScenes.filter(x=>x.fx.length).every(x=>x.fx[0]===FX_ID_P));
});
test('original rain in occupied Carriage Yard preserved and never duplicated',()=>{
 assert.ok(before.originals.CAVEXT01Yard0001.fxmasterBefore.effects.core_rain);
 const yard=proof.allScenes.find(x=>x.id==='CAVEXT01Yard0001');
 assert.equal(yard.darkness,.15);assert.equal(yard.weather,'fog');
 assert.deepEqual(yard.fx,[]);
});
test('Only Early is applied, all four separate stages saved, no automation',()=>{
 assert.equal(proof.earlyPhaseOnly,true);
 assert.equal(proof.macro.flag.phase,'early');
 assert.equal(proof.macro.flag.pending,null);
 assert.deepEqual(proof.macro.flag.profiles,PHASES);
 assert.equal(proof.macro.flag.lastVerifiedCount,47);
 assert.equal(matrix.phaseActive,'early');
});
test('different phases are genuine room-specific atmosphere values',()=>{
 assert.deepEqual(makeCatalog().map(x=>x.id).sort(),matrix.scenes.map(x=>x.id).sort());
 for(const s of matrix.scenes)assert.ok(s.early<s.mid&&s.mid<s.late&&s.late<s.crimson);
});