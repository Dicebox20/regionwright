import test from 'node:test';
import assert from 'node:assert/strict';
import{STAGES,OWNER_LOCK,ORIGINAL_WALL,OUTER,REFUGE,planValid,behavior,rectOverlap}
 from '../modules/regionwright/scripts/studio-cav-late-inner-undercroft-native-staging.js';
test('original two approved native scenes and object roles',()=>{
 assert.equal(OUTER.sceneId,'CN5fkK2QLUELBGGR');
 assert.equal(REFUGE.sceneId,'ywpIpQDrkMLIgUP0');
 assert.equal(ORIGINAL_WALL,'CAVB67AABD1B35C6');
 assert.equal(STAGES.length,5);
});
test('all fixed physical Regions fit approved native maps and do not overlap',()=>{
 assert.equal(planValid(),true,JSON.stringify(STAGES.map(s=>({id:s.id,len:s.id.length,b:s.behaviorId,blen:s.behaviorId?.length}))));
});
test('different Keystone recess and explicit stone lever must remain separate',()=>{
 assert.notEqual(STAGES[0].id,STAGES[1].id);
 assert.equal(rectOverlap(STAGES[0].rect,STAGES[1].rect),false);
 assert.equal(OWNER_LOCK.originalKeystoneItemUuid,null);
 assert.equal(OWNER_LOCK.originalKeystoneVerified,false);
});
test('original existing physical Keystone wall Region reused rather than overwritten',()=>{
 assert.equal(STAGES[0].original,true);
 assert.equal(STAGES[0].id,ORIGINAL_WALL);
});
test('all four native puzzle/portal Behaviors installed disabled',()=>{
 for(const s of STAGES.filter(s=>s.behaviorId)){
  const b=behavior(s);
  assert.equal(b.disabled,true);
  assert.ok(['executeScript','teleportToken'].includes(b.type));
 }
});
test('passive Studio-like return avoids immediate back-teleport loop',()=>{
 const q=STAGES.find(s=>s.kind==='return-landing-und01');
 assert.ok(q&&!q.behaviorId);
 assert.equal(STAGES.find(s=>s.kind==='refuge-inner-return-threshold').destination,
  'Scene.CN5fkK2QLUELBGGR.Region.CAVUNDRETURN0001');
});
test('north door only aims into original passive UND02 western entry',()=>{
 const q=STAGES.find(s=>s.kind==='inner-stone-door-threshold');
 assert.deepEqual(behavior(q).system.destinations,
 ['Scene.ywpIpQDrkMLIgUP0.Region.CAVB74BDED08299D']);
});
test('no duplicate Keystone source Item or story progress synthesized',()=>{
 assert.equal(OWNER_LOCK.originalKeystoneItemUuid,null);
 for(const b of STAGES.filter(s=>s.behaviorId&&!s.destination).map(behavior)){
  const script=b.system.source;
  for(const dis of ['createEmbeddedDocuments','setFlag(','update(','teleportToken'])
   assert.equal(script.includes(dis),false,dis);
 }
});