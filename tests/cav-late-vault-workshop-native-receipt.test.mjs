import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{FIXTURES,nativeBehavior,AUTHENTIC_ITEM_SOCKETS,
 WORKSHOP,VAULT}from'../modules/regionwright/scripts/studio-cav-late-vault-workshop-native-staging.js';
const root=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-chat-b-turn25-vault-workshop/',import.meta.url);
const j=n=>JSON.parse(readFileSync(new URL(n,root),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const initial=j('cav-chatb-t25-workshop-vault-census.json');
const install=j('cav-chatb-t25-vault-workshop-native-install.json');
const proof=j('cav-chatb-t25-vault-workshop-independent-postread.json');
test('real GM original maps and source regions confirmed BEFORE native write',()=>{
 assert.equal(initial.scenes[0].id,WORKSHOP.id);
 assert.equal(initial.scenes[0].map,WORKSHOP.art);
 assert.equal(initial.scenes[0].regions.length,3);
 assert.equal(initial.scenes[1].id,VAULT.id);
 assert.equal(initial.scenes[1].map,VAULT.art);
 assert.equal(initial.scenes[1].regions.length,2);
});
test('genuine original components all GM_LIBRARY_ONLY and no Actor copies',()=>{
 assert.equal(initial.actorCopies.length,0);
 assert.deepEqual(initial.originals.slice(0,3).map(x=>x.uuid),
  Object.values(AUTHENTIC_ITEM_SOCKETS));
 assert.equal(initial.originals[4].uuid,'Item.CAVKEYSTONEITEM1');
 assert.ok(initial.originals.every(x=>x.status==='GM_LIBRARY_ONLY'));
});
test('single owner-only native live installation: six new Regions, six disabled behaviors',()=>{
 assert.equal(install.status,'vault-workshop-three-physical-sockets-joined-turn-and-two-way-sealed-native-installed');
 assert.equal(install.created.length,6);
 assert.equal(install.preview.intendedNewRegions,6);
 assert.equal(install.preview.intendedDisabledBehaviors,6);
 assert.equal(install.originalBenchTurn.disabled,true);
 assert.equal(install.workshopNewRegionCount,8);
 assert.equal(install.vaultNewRegionCount,3);
 assert.equal(install.noItemsGranted,true);
 assert.equal(install.noDoorOpened,true);
});
test('independent current GM readback verifies each exact fixture and installed disabled state',()=>{
 assert.equal(proof.pass,true);
 assert.equal(proof.rows.length,FIXTURES.length);
 assert.equal(proof.disabledNativeBehaviors,6);
 assert.ok(proof.rows.every(x=>x.verified===true));
 for(let i=0;i<FIXTURES.length;i++){
  const f=FIXTURES[i],p=proof.rows[i];
  assert.equal(p.kind,f.kind);
  assert.equal(p.uuid,'Scene.'+f.sceneId+'.Region.'+f.id);
  if(f.behaviorId)assert.equal(p.disabled,true);
 }
});
test('native review code source hashes exactly match the independent readback',()=>{
 for(let i=0;i<FIXTURES.length;i++){
  const f=FIXTURES[i],z=proof.rows[i];
  if(f.behaviorId&&!f.destination)
   assert.equal(z.sourceSHA256,sha(nativeBehavior(f).system.source));
 }
});
test('both native paired destinations point to passive actual Regions, not each other',()=>{
 assert.deepEqual(proof.rows.find(x=>x.kind==='workshop-to-vault-sealed').destinations,
  ['Scene.tjTpG2RVZNoCqRLh.Region.CAVB1F6B8321128A']);
 assert.deepEqual(proof.rows.find(x=>x.kind==='vault-to-workshop-return').destinations,
  ['Scene.G6NMonfCwMvNzipL.Region.CAVVAULTLAND0001']);
 assert.equal(proof.currentOriginals.vaultEntry,true);
});
test('original stair, foyer return, Keystone plinth and Crooked owner deferment preserved',()=>{
 assert.equal(proof.currentOriginals.stair,true);
 assert.equal(proof.currentOriginals.foyerReturn,true);
 assert.equal(proof.currentOriginals.keystoneDais,true);
 assert.equal(proof.currentOriginals.chasesDeferred,true);
 assert.equal(proof.actorQuestCopies,0);
});
test('does not claim puzzle completion, enable native portal or grant Vault Keystone',()=>{
 assert.equal(proof.items[3].uuid,'Item.CAVKEYSTONEITEM1');
 assert.equal(proof.items[3].status,'GM_LIBRARY_ONLY');
 assert.ok(proof.rows.filter(r=>r.disabled!==null).every(r=>r.disabled===true));
});