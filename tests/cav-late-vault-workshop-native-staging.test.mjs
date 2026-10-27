import test from 'node:test';
import assert from 'node:assert/strict';
import{WORKSHOP,VAULT,FIXTURES,AUTHENTIC_ITEM_SOCKETS,OTHER_NOT_SOCKETS,
 EXISTING_BENCH,EXISTING_VAULT_ENTRY,EXISTING_VAULT_PLINTH,
 ORIGINAL_WORKSHOP_REGIONS,ORIGINAL_VAULT_REGIONS,
 overlapping,validFixturePlan,nativeBehavior}from
 '../modules/regionwright/scripts/studio-cav-late-vault-workshop-native-staging.js';
const AF=Object.getPrototypeOf(async function(){}).constructor;
test('approved Workshop and Vault original scenes and owner artwork',()=>{
 assert.equal(WORKSHOP.id,'G6NMonfCwMvNzipL');
 assert.equal(VAULT.id,'tjTpG2RVZNoCqRLh');
 assert.match(WORKSHOP.art,/h-b01-allens-basement-workshop-approved-v002/);
 assert.match(VAULT.art,/h-b02-secured-keystone-vault-approved-v003/);
 assert.deepEqual(ORIGINAL_WORKSHOP_REGIONS,
 ['CAVB9C0F653A2A6F','CAVBABA9513F73A3','CAVBASEMENTRET01']);
 assert.deepEqual(ORIGINAL_VAULT_REGIONS,['CAVB1F6B8321128A','CAVB799A5357A114']);
});
test('exact three inventory sources, not completed emblem or Vault reward Item',()=>{
 assert.deepEqual(AUTHENTIC_ITEM_SOCKETS,{
 'charged-source':'Item.pbmUZPfC3WnsBRgi',
 'gond-half':'Item.o9G3UJjEe2QX1ZH0',
 'sune-half':'Item.t9uCIpsKeSvtC31w'
 });
 assert.equal(Object.keys(AUTHENTIC_ITEM_SOCKETS).length,3);
 assert.ok(OTHER_NOT_SOCKETS.includes('Item.CAVKEYSTONEITEM1'));
 assert.ok(OTHER_NOT_SOCKETS.includes('Item.vbDWTbnAZg65ErSS'));
});
test('exactly seven physical roles; valid native ids; no new Region overlap',()=>{
 assert.equal(FIXTURES.length,7);
 assert.equal(validFixturePlan(),true,JSON.stringify(FIXTURES.map(f=>({
  kind:f.kind,id:f.id,len:f.id.length,beh:f.behaviorId,blen:f.behaviorId?.length}))));
});
test('original bench used for separate turn control rather than fourth socket',()=>{
 const turn=FIXTURES.find(f=>f.kind==='turn-joined-emblem');
 assert.equal(turn.id,EXISTING_BENCH);
 assert.equal(turn.original,true);
 assert.equal(FIXTURES.filter(f=>Object.hasOwn(AUTHENTIC_ITEM_SOCKETS,f.kind)).length,3);
});
test('new socket regions lie outside original passive bench and stage safe return',()=>{
 const b={x:770,y:315,width:220,height:185};
 for(const f of FIXTURES.filter(f=>Object.hasOwn(AUTHENTIC_ITEM_SOCKETS,f.kind)))
  assert.equal(overlapping(b,f.rect),false,f.kind);
 const r=FIXTURES.find(f=>f.kind==='return-landing-workshop');
 assert.equal(r.behaviorId,undefined);
 assert.equal(r.sceneId,WORKSHOP.id);
});
test('all six source-only behaviors remain intentionally disabled',()=>{
 const active=FIXTURES.filter(f=>f.behaviorId).map(nativeBehavior);
 assert.equal(active.length,6);
 assert.ok(active.every(x=>x.disabled===true));
 assert.equal(active.filter(x=>x.type==='executeScript').length,4);
 assert.equal(active.filter(x=>x.type==='teleportToken').length,2);
});
test('native ordinary source scripts compile as async Foundry Region handlers',()=>{
 for(const f of FIXTURES.filter(f=>f.behaviorId&&!f.destination)){
  const x=nativeBehavior(f);
  assert.doesNotThrow(()=>new AF('region','event',x.system.source),f.kind);
 }
});
test('source fixtures contain no player Item claims, flags, native writes or portal opening',()=>{
 for(const f of FIXTURES.filter(f=>f.behaviorId&&!f.destination)){
  const x=nativeBehavior(f);
  for(const forbidden of ['createEmbeddedDocuments','setFlag(','deleteEmbeddedDocuments','actor.update(',
  'Item.createDocuments','teleportToken','game.socket.emit'])
   assert.ok(!x.system.source.includes(forbidden),f.kind+' '+forbidden);
 }
});
test('paired Vault route safe: Workshop departure aims original passive entry',()=>{
 const outbound=FIXTURES.find(f=>f.kind==='workshop-to-vault-sealed');
 const t=nativeBehavior(outbound);
 assert.equal(t.disabled,true);
 assert.deepEqual(t.system.destinations,['Scene.tjTpG2RVZNoCqRLh.Region.CAVB1F6B8321128A']);
 assert.equal(t.system.placement,'center');
});
test('Vault return aims separate passive Workshop landing (no two-way auto-loop)',()=>{
 const back=FIXTURES.find(f=>f.kind==='vault-to-workshop-return');
 const t=nativeBehavior(back);
 assert.equal(t.disabled,true);
 assert.deepEqual(t.system.destinations,['Scene.G6NMonfCwMvNzipL.Region.CAVVAULTLAND0001']);
 assert.notEqual(back.id,EXISTING_VAULT_ENTRY);
});
test('passive arrival is not a departure behavior',()=>{
 assert.throws(()=>nativeBehavior(FIXTURES.find(f=>f.kind==='return-landing-workshop')));
});