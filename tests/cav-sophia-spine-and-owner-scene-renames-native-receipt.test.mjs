import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{SCENE_NAMES,validateNames}from
 '../modules/regionwright/scripts/studio-cav-owner-nonspoiler-scene-titles-20261027.js';
import{BOOKS,UUID,OWNER_NAME}from
 '../modules/regionwright/scripts/studio-cav-late-sophia-spine-regionwright-install-contract.js';
const root=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-chat-b-turn28-sophia-spine-scene-titles/',import.meta.url);
const j=n=>JSON.parse(readFileSync(new URL(n,root),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const configured=j('cav-sophia-original-spine-native-api-install.json');
const names=j('cav-owner-47-spoilerfree-scene-renames-native.json');
const proof=j('cav-sophia-and-47-renames-independent-postread.json');
test('exact current original Sophia bookcase had no native puzzle before standard install',()=>{
 assert.equal(configured.status,'Sophia-original-bookcase-native-Regionwright-six-book-registered-and-gated');
 assert.equal(configured.baseline.originalRegionUuid,UUID);
 assert.equal(configured.baseline.originalBehaviorCount,2);
 assert.equal(configured.baseline.originalPuzzleSetting,false);
 assert.equal(configured.baseline.originalRegionSetting,false);
});
test('actual authoritative module Regionwright configure wrote a locked six-book puzzle, no Item reward',()=>{
 assert.equal(configured.registered.nativePersistentStatus,'locked');
 assert.equal(configured.registered.behaviorDisabled,true);
 assert.equal(configured.registered.nativeConfig.books.length,6);
 assert.equal(configured.registered.noItemGranted,undefined);
 assert.equal(configured.noItemGranted,true);
 assert.equal(configured.noVeilCompletionCreated,true);
});
test('source images remain approved but installed live Regionwright module predates image support',()=>{
 assert.ok(BOOKS.every(x=>x.image.startsWith('worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/')));
 assert.equal(configured.baseline.installedModuleImagesSupported,false);
 assert.equal(proof.sophia.liveModuleArtSupport,false);
 assert.deepEqual(proof.sophia.originalArtworkAssetPathsInStage,BOOKS.map(x=>x.image));
});
test('native one-time Scene rename changed exactly 47 titles without IDs, backgrounds, destinations',()=>{
 assert.equal(names.status,'owner-approved-47-spoilerfree-scene-titles-installed-no-ids-changed');
 assert.equal(names.changes,47);
 assert.equal(names.pre.originals.length,47);
 assert.equal(names.post.length,47);
 assert.equal(validateNames(),true);
 for(const m of SCENE_NAMES){
  const p=names.post.find(x=>x.id===m.id);
  assert.equal(p?.oldName,m.prior);
  assert.equal(p?.newName,m.newName);
 }
});
test('independent second GM audit confirms 47 current spoiler-safe labels F1/F2 and original ID count',()=>{
 assert.equal(proof.pass,true);
 assert.equal(proof.scenesCorrect,47);
 assert.equal(proof.sceneCount,47);
 assert.deepEqual(proof.mismatch,[]);
 assert.equal(proof.sophia.sceneName,'F2 — Small Bedroom');
 assert.equal(proof.sophia.regionUuid,UUID);
 assert.equal(proof.sophia.regionName,OWNER_NAME);
});
test('original zoom and Gond source stayed intact, puzzle disabled, no false Veil/Item or solve',()=>{
 assert.equal(proof.sophia.originalCloseupEnabled,true);
 assert.equal(proof.sophia.originalRegionwrightBehaviorDisabled,true);
 assert.equal(proof.sophia.originalRewardDisabled,true);
 assert.equal(proof.sophia.originalGondTileHidden,true);
 assert.equal(proof.sophia.noFakeClaims,true);
 assert.equal(proof.sophia.zeroActorBookCopies,true);
 assert.equal(proof.sophia.zeroActorGond,true);
 assert.equal(proof.sophia.sourceLocked,'locked');
});
test('global module write settings restored and legacy GM install macros disclosed',()=>{
 assert.equal(proof.restoredWriteSettings.puzzleWrites,false);
 assert.equal(proof.restoredWriteSettings.regionWrites,false);
 assert.equal(proof.historicalOldMacroTitleReferences,2);
 assert.equal(proof.playerPlaytested,false);
});
test('external concurrent change is disclosed and not attributed to name update',()=>{
 assert.deepEqual(proof.concurrentRegionAdditionObserved,{
  sceneId:'CAVEXT03Scene001',oldRegionCount:5,newRegionCount:6,
  originUnknown:true,notPartOfThisNameOnlyInstall:true
 });
});
test('full literal new names hide sensitive puzzle and campaign context',()=>{
 for(const m of SCENE_NAMES)
  assert.doesNotMatch(m.newName,/Ritual|Keystone|Voss|Donovan|Sune|Sophia|Gond|Refuge|Crimson|Veil|\bH-[A-Z]\b|UND-0/i);
});