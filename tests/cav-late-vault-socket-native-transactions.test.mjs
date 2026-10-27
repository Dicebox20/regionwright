import test from 'node:test';
import assert from 'node:assert/strict';
import{WORKSHOP_SCENE,FOYER_SCENE,FOYER_BASEMENT,FOYER_PORTAL,SOCKETS,
 LEDGERS,MODE,nativeSocketTransactionSource,nativeSocketTransactionUpdate}
 from'../modules/regionwright/scripts/studio-cav-late-vault-socket-native-transactions.js';
const AF=Object.getPrototypeOf(async function(){}).constructor;
test('the canonical exact three independent original source Item UUIDs only',()=>{
 assert.deepEqual(Object.keys(SOCKETS),['charged-source','gond-half','sune-half']);
 assert.equal(SOCKETS['charged-source'].worldItem,'Item.pbmUZPfC3WnsBRgi');
 assert.equal(SOCKSUNE(),'Item.t9uCIpsKeSvtC31w');
 function SOCKSUNE(){return SOCKETS['sune-half'].worldItem}
 assert.equal(SOCKETS['gond-half'].worldItem,'Item.o9G3UJjEe2QX1ZH0');
});
test('original Scene and Weathered Key basement source gate exact',()=>{
 assert.equal(WORKSHOP_SCENE,'G6NMonfCwMvNzipL');
 assert.equal(FOYER_SCENE,'CAVHG02Scene0001');
 assert.equal(FOYER_BASEMENT,'CAVFOYERBASEDR01');
 assert.equal(FOYER_PORTAL,'CAVFOYERBASPORT1');
 for(const kind of Object.keys(SOCKETS)){
  const s=nativeSocketTransactionSource(kind);
  for(const piece of ['cavWeatheredBasementUnlocked','Item.CAVWEATHERKEY001',
   'Scene.G6NMonfCwMvNzipL.Region.CAVB9C0F653A2A6F',
   "foyerPortal?.disabled!==false"])assert.ok(s.includes(piece),kind+piece);
 }
});
test('native executeScript sources compile for all three socket kinds',()=>{
 for(const kind of Object.keys(SOCKETS)){
  const s=nativeSocketTransactionSource(kind);
  assert.doesNotThrow(()=>new AF('region','event',s),kind);
  assert.ok(!s.includes('__KIND__')&&!s.includes('__SOURCE__'));
 }
});
test('all three remain disabled pending genuine source producer bridge',()=>{
 assert.equal(MODE,'disabled-pending-original-source-provider-native-ledgers');
 for(const kind of Object.keys(SOCKETS)){
  const b=nativeSocketTransactionUpdate(kind);
  assert.equal(b.disabled,true);
  assert.equal(b._id,SOCKETS[kind].behaviorId);
  assert.deepEqual(b['system.events'],['tokenMoveIn','tokenMoveWithin']);
  assert.equal(b['system.source'],nativeSocketTransactionSource(kind));
 }
});
test('checks exact elected GM and PC ownership, no arbitrary inventory changes',()=>{
 for(const kind of Object.keys(SOCKETS)){
  const s=nativeSocketTransactionSource(kind);
  for(const part of ["game.version===VERSION","game.users?.activeGM?.id===game.user.id",
   "game.user?.isGM===true","token.actor?.type!=='character'",
   "actor.testUserPermission(u,'OWNER')","region.testPoint(mid)"])
   assert.ok(s.includes(part),kind+part);
 }
});
test('true source world item, embedded item, originating native Region receipt required',()=>{
 for(const kind of Object.keys(SOCKETS)){
  const s=nativeSocketTransactionSource(kind);
  for(const part of ["source.type!=='loot'",
   "source.getFlag(NS,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'",
   "cavLateVaultRewardProvenanceV1",
   "pf.sourceSceneId!==ORIGIN_SCENE",
   "pf.sourceActorId!==actor.id",
   "pf.sourceEmbeddedItemId!==held.id",
   "sourceRegionUuid.startsWith('Scene.'+ORIGIN_SCENE+'.Region.')",
   "const issue=srcRegion?.getFlag(NS,CLAIM)",
   "issue?.status!=='done'","issue.sourceUuid!==SOURCE"])
   assert.ok(s.includes(part),kind+part);
 }
});
test('Gondian source additionally verifies actual Aqueduct charge and Veil',()=>{
 const s=nativeSocketTransactionSource('charged-source');
 for(const part of ['cavLateVaultChargeProofV1',
  "ch?.status!=='charged'",
  "ch.chargerRegionUuid.startsWith('Scene.CAVAQ01Scene0001.Region.')",
  "cavLateVaultChargeReceiptV1","cavLateVaultCanonicalVeilV1",
  "veil?.status!=='active'","ch.chargedInOriginalAqueduct"])
 assert.ok(s.includes(part),part);
});
test('each socket prevents duplicated source Actor inventory and partially reserved replay',()=>{
 for(const kind of Object.keys(SOCKETS)){
  const s=nativeSocketTransactionSource(kind);
  for(const part of ['if(region.getFlag(NS,SOCKET_LEDGER))return',
  'instances.length!==1',
  "held.getFlag(NS,ITEM_LEDGER)",
  "if(claim&&(claim.status==='reserved'||claim.sourceUuid!==sourceUuid))return",
  "if(region.getFlag(NS,SOCKET_LEDGER)||actor.items.get(held.id)!==held"])assert.ok(s.includes(part),part);
 }
});
test('deliberate player action requires elected GM explicit approval',()=>{
 const s=nativeSocketTransactionSource('gond-half');
 assert.ok(s.includes('DialogV2.confirm'));
 assert.ok(s.includes('explicitly chosen to install their earned original'));
 assert.ok(s.includes("Approve the player-requested insertion"));
});
test('transaction keeps original embedded Item, marks it installed and does not clone or consume it',()=>{
 const s=nativeSocketTransactionSource('sune-half');
 const r=s.indexOf("status:'reserved'");
 const item=s.indexOf('await held.setFlag(NS,ITEM_LEDGER');
 const finish=s.indexOf("status:'done'");
 assert.ok(r>0&&item>r&&finish>item);
 for(const f of ["originalItemHeldInCustody:true","embeddedItemId:held.id",
  "originalEmbeddedItemId:held.id","rewardOriginRegionUuid:srcRegion.uuid",
  "itemPost?.status!=='installed'"])assert.ok(s.includes(f),f);
 for(const f of ["createEmbeddedDocuments","deleteEmbeddedDocuments",
  "Item.createDocuments","updateEmbeddedDocuments","worlds.update","actor.delete"])
 assert.ok(!s.includes(f),f);
});
test('no Vault turning, Keystone grant or wall or Crooked chase mutations',()=>{
 for(const kind of Object.keys(SOCKETS)){
  const s=nativeSocketTransactionSource(kind);
  for(const forbidden of ['CAVVTURNBEH00001','CAVVOUTTEL000001','CAVVBACKTEL00001',
  'CAVKEYSTONEITEM1','CAVSG01CHASETRG1','CAVAQCHASETRIG01',
  'RegionBehavior.update','Actor.create'])
   assert.ok(!s.includes(forbidden),kind+forbidden);
 }
});
test('the same exact unified Region and Item ledgers are used across all sources',()=>{
 assert.equal(LEDGERS.socket,'cavLateVaultSocketTransactionV1');
 assert.equal(LEDGERS.item,'cavLateVaultItemInstalledV1');
 assert.equal(LEDGERS.sourceNative,'cavLateVaultRewardClaimV1');
 assert.equal(LEDGERS.chargeNative,'cavLateVaultChargeReceiptV1');
 assert.equal(LEDGERS.veilNative,'cavLateVaultCanonicalVeilV1');
});
test('no invented source or default positive case',()=>{
 assert.throws(()=>nativeSocketTransactionSource('completed-emblem'));
 assert.throws(()=>nativeSocketTransactionUpdate('keystone'));
 assert.notEqual(SOCKETS['gond-half'].sourceSceneId,SOCKETS['sune-half'].sourceSceneId);
});