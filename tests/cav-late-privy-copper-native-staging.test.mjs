import test from 'node:test';
import assert from 'node:assert/strict';
import {PRIVY_SCENE,PRIVY_MAP,PRIVY_RETURN,PRIVY_ARRIVAL,COPPER,GONDIAN,
 PRIVY_FIXED_DC,PRIVY_METHODS,PRIVY_STAGES,reviewCopperRetrieval,
 privyNativeReadOnlySource} from '../modules/regionwright/scripts/studio-cav-late-privy-copper-native-staging.js';
const AF=Object.getPrototypeOf(async function(){}).constructor;
test('authentic scene, item and immutable owner-approved fallback identities',()=>{
 assert.equal(PRIVY_SCENE,'xx1rWBiWMLxJPlrw');
 assert.ok(PRIVY_MAP.endsWith('ext-04-privy-approved-v001.png'));
 assert.equal(PRIVY_RETURN,'zVgVWvnpPetxlF5e');
 assert.equal(PRIVY_ARRIVAL,'663WrP9V8tPPOLvt');
 assert.equal(COPPER,'Item.D1LRRg4n7y7pRWvk');
 assert.equal(GONDIAN,'Item.pbmUZPfC3WnsBRgi');
 assert.equal(PRIVY_FIXED_DC,12);
 assert.deepEqual([...PRIVY_METHODS],['careful-tools','Sleight of Hand','Survival']);
});
test('two physical fixtures have fixed 16 char native Region and behavior ids',()=>{
 assert.equal(PRIVY_STAGES.length,2);
 assert.deepEqual(PRIVY_STAGES.map(x=>x.kind),['retrieval','key-marker']);
 for(const r of PRIVY_STAGES){assert.equal(r.regionId.length,16);assert.equal(r.behaviorId.length,16)}
});
function overlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y}
test('original owner-approved Privy rectangle fixtures disjoint from each other and portal Regions',()=>{
 const arrival={x:535,y:450,width:180,height:170};
 const leave={x:460,y:785,width:300,height:180};
 for(const r of PRIVY_STAGES){assert.ok(!overlap(r.rect,arrival));assert.ok(!overlap(r.rect,leave));}
 assert.ok(!overlap(PRIVY_STAGES[0].rect,PRIVY_STAGES[1].rect));
});
for(const k of ['retrieval','key-marker']){
 test(k+' native region body compiles',()=>assert.doesNotThrow(()=>new AF('region','event',privyNativeReadOnlySource(k))));
 test(k+' source is read-only, does not invent Veil authority or grant a key',()=>{
  const s=privyNativeReadOnlySource(k);
  assert.ok(s.includes("game?.world?.id!=='cabin-in-the-ashen-veil'"));
  assert.ok(s.includes("scene?.id!=='xx1rWBiWMLxJPlrw'"));
  assert.ok(s.includes("DialogV2.prompt"));
  assert.ok(!s.includes('setFlag('));
  assert.ok(!s.includes('createEmbeddedDocuments'));
  assert.ok(!s.includes('deleteEmbeddedDocuments'));
  assert.ok(!s.includes('teleportToken'));
  assert.ok(!s.includes('game.socket.emit'));
 });
}
const ready={
 worldId:'cabin-in-the-ashen-veil',activeElectedGMVerified:true,
 sceneId:PRIVY_SCENE,originalMapVerified:true,
 playerOwnsActorVerified:true,playerAtOriginalOpeningVerified:true,explicitPlayerAction:true,
 originalCopperSourceUuid:COPPER,originalWorldCopperLibraryStatus:'GM_LIBRARY_ONLY',
 currentCopperActorCopies:0,authenticatedCrimsonVeilStatus:'active',
 veilOnceOnlyTransitionCount:1,originalGondianSourceUuid:GONDIAN,
 verifiedOriginalGondianChargeReceipt:true,safeReturnPortalStillPresent:true,
 retrievalLedgerStatus:'none',method:'Sleight of Hand',DC:12,
 officialDnd5eRollVerified:true,rollTotal:12
};
test('denies if original active player evidence or authentic Veil is absent',()=>{
 for(const key of ['activeElectedGMVerified','originalMapVerified','playerOwnsActorVerified',
  'playerAtOriginalOpeningVerified','explicitPlayerAction','verifiedOriginalGondianChargeReceipt',
  'safeReturnPortalStillPresent']){
  assert.equal(reviewCopperRetrieval({...ready,[key]:false}).action,'deny',key)
 }
 assert.equal(reviewCopperRetrieval({...ready,authenticatedCrimsonVeilStatus:'dormant'}).action,'deny');
 assert.equal(reviewCopperRetrieval({...ready,veilOnceOnlyTransitionCount:2}).action,'deny');
});
test('blocks counterfeit copper item source and actor duplication',()=>{
 assert.equal(reviewCopperRetrieval({...ready,originalCopperSourceUuid:'Item.invented'}).action,'deny');
 assert.equal(reviewCopperRetrieval({...ready,currentCopperActorCopies:1}).action,'deny');
});
test('DC12 successful authentic sleight check is GM reviewed not auto granted',()=>{
 assert.deepEqual(reviewCopperRetrieval(ready),
 {action:'gm-review-resolve',reason:'successful-official-dc12'});
});
test('DC12 survival failure remains retryable, never consumes a unique key',()=>{
 assert.deepEqual(reviewCopperRetrieval({...ready,method:'Survival',rollTotal:11}),
 {action:'gm-review-retry',reason:'failed-official-dc12-no-permanent-loss'});
});
test('careful tools option succeeds with explicit elected-GM approval and NO roll',()=>{
 assert.equal(reviewCopperRetrieval({...ready,method:'careful-tools',
  reasonableToolsApprovedByGM:true,officialDnd5eRollVerified:false}).action,'gm-review-resolve');
 assert.equal(reviewCopperRetrieval({...ready,method:'careful-tools',
  reasonableToolsApprovedByGM:false}).action,'deny');
});
test('nonofficial skill check or wrong DC is fail-closed',()=>{
 assert.equal(reviewCopperRetrieval({...ready,officialDnd5eRollVerified:false}).action,'deny');
 assert.equal(reviewCopperRetrieval({...ready,DC:13}).action,'deny');
 assert.equal(reviewCopperRetrieval({...ready,method:'Acrobatics'}).action,'deny');
});
test('once-only ledger denies ambiguous state, reserves and completed are inert',()=>{
 assert.equal(reviewCopperRetrieval({...ready,retrievalLedgerStatus:'reserved'}).action,'gm-review');
 assert.equal(reviewCopperRetrieval({...ready,retrievalLedgerStatus:'resolved'}).action,'no-op');
 assert.equal(reviewCopperRetrieval({...ready,retrievalLedgerStatus:'broken'}).action,'deny');
});
test('unsupported stage source cannot silently create another item mechanism',()=>{
 assert.throws(()=>privyNativeReadOnlySource('fish'));
});