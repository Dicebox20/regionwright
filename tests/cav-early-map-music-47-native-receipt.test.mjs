import test from 'node:test';import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{catalog,macroCommand,GROVE_PERIMETER,REQUESTED_TRACK,YARD}from'../modules/regionwright/scripts/studio-cav-early-map-music-47.js';
const base=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-cav-independent-scene-music/',import.meta.url);
const j=n=>JSON.parse(readFileSync(new URL(n,base),'utf8'));
const before=j('cav-early-map-music-47-native-originals-preflight.json');
const after=j('cav-map-music-47-independent-gm-postread.json');
const patch=j('cav-music-macro-restore-guard-update-receipt.json');
const matrix=j('47-SCENE-MUSIC-MATRIX.json');
test('elected GM preflight found original 47 Scenes, eleven sound emitters',()=>{
 assert.equal(Object.keys(before.originals).length,47);
 assert.equal(before.allSounds,11);assert.equal(before.world,'cabin-in-the-ashen-veil');
 assert.equal(before.willAdd,46);assert.equal(before.willAdoptExistingYard,1);
});
test('47 current independent GM Sound Layer readbacks pass after real save',()=>{
 assert.equal(after.pass,true);assert.equal(after.sceneCount,47);
 assert.equal(after.verifiedCount,47);assert.deepEqual(after.mismatches,[]);
 assert.equal(after.actualNativeAmbientSoundCount,57);
});
test('exact eight exterior Grove maps share owner-provided file, central distinct',()=>{
 assert.equal(GROVE_PERIMETER.length,8);
 assert.deepEqual(after.exactGroveEight.slice().sort(),GROVE_PERIMETER.slice().sort());
 assert.equal(catalog().filter(x=>x.file===REQUESTED_TRACK).length,8);
 assert.notEqual(after.centralGrooveUsesDifferentTrack,catalog().find(x=>x.id==='CAVSG01Scene0001').path);
});
test('looping sound matches full image radius and equal-volume regardless of walls',()=>{
 assert.equal(after.allUniformVolume,true);
 for(const row of after.allScenes){
 assert.equal(row.pass,true);assert.ok(row.pixelCoverage>row.cornerPixels+120);
 assert.equal(row.ownedCount,1);assert.ok(row.volume<=.22);assert.ok(row.volume>=.14);
 }
});
test('original ten atmosphere files remain exactly byte-equivalent in document settings',()=>{
 assert.equal(after.previousAtmosphereSourcesPreserved,10);
 assert.ok(after.allScenes.every(x=>x.oldOtherSoundsPreserved));
 assert.equal(after.actualNativeAmbientSoundCount,57);
});
test('Yard reused original Elwynn music without second playlist/scene music object',()=>{
 const yard=after.allScenes.find(x=>x.id===YARD);
 assert.equal(yard.soundId,'VycoO0Tl8O20uL8L');
 assert.equal(yard.currentSoundCount,1);
 assert.equal(yard.originalSoundCount,1);
 assert.equal(yard.actualPath,'Music/Elwynn%20Forest-Music.mp3');
});
test('original GM macro remains installed with restore, pending clean and correct hash',()=>{
 assert.equal(after.macro.flag.status,'installed');assert.equal(after.macro.flag.pending,null);
 assert.equal(after.macro.flag.lastVerified,47);
 assert.equal(after.macro.ownershipDefault,0);
 assert.equal(patch.status,'installed');assert.equal(patch.sceneSoundCount,57);
 assert.equal(patch.newSHA,matrix.macroSourceSHA256);
 const command=macroCommand(before.entries,before.originals);
 assert.equal(createHash('sha256').update(command).digest('hex'),patch.newSHA);
 assert.ok(command.includes('await sc.sounds.get(row.soundId).unsetFlag(ns,key);'));
});
test('current matrix contains 47 independent map tracks and no false player audible acceptance',()=>{
 assert.equal(matrix.scenes.length,47);
 assert.equal(matrix.currentAmbientSoundTotal,57);
 assert.equal(matrix.originalCeremonialPerimeterCount,8);
 assert.equal(matrix.independentGmVerified,true);
 assert.equal(matrix.nonGmClientAudiblyVerified,false);
 assert.equal(after.nonGMPlayerAudioVerified,false);
});