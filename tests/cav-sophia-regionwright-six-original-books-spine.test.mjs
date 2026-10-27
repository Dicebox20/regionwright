import test from 'node:test';
import assert from 'node:assert/strict';
import{createSpineMosaicConfig,evaluateSpineOrder,validateSpineMosaicConfig}from
 '../modules/regionwright-puzzles-locks/scripts/spine-mosaic-engine.js';
import{BOOKS,UUID,SCENE_ID,BOOKCASE_ID,OWNER_NAME,SEED,
 PROTECTED_BEHAVIORS,SOURCE_REWARD,SOURCE_REWARD_TILE,
 proposedSpineConfig,expectedBooks,sourceBoundFlag}
 from '../modules/regionwright/scripts/studio-cav-late-sophia-spine-regionwright-install-contract.js';
const api={createConfig:createSpineMosaicConfig};
const config=proposedSpineConfig(api);
test('targets owner-correct exact existing Sophia bookcase Region',()=>{
 assert.equal(UUID,'Scene.CAVHU05Scene0001.Region.CAVB994894A7432F');
 assert.equal(SCENE_ID,'CAVHU05Scene0001');
 assert.equal(BOOKCASE_ID,'CAVB994894A7432F');
 assert.equal(OWNER_NAME,"Sophia's Bookcase — Six Storybooks");
});
test('uses six canonical original 1442-1447 Item sources in the correct years',()=>{
 assert.equal(BOOKS.length,6);
 assert.deepEqual(BOOKS.map(x=>x.year),[1442,1443,1444,1445,1446,1447]);
 assert.deepEqual(BOOKS.map(x=>x.uuid),[
  'Item.Qplmy8JR7plDYLiY','Item.DLGIhHc0RDqh0YVt',
  'Item.TO69wBYN8sRJuxtH','Item.c3oKW8YkklE8slnX',
  'Item.HV7XjKmgqVITSEvW','Item.gmTsIOqc3qFBc3zA'
 ]);
 assert.equal(new Set(BOOKS.map(x=>x.uuid)).size,6);
});
test('Regionwright API creates six real image-backed spines, no demo filler',()=>{
 assert.equal(config.version,1);
 assert.equal(config.seed,SEED);
 assert.equal(config.books.length,6);
 assert.ok(config.books.every(x=>x.image.startsWith('worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/')));
 assert.deepEqual(config.books.map(x=>x.id),['book-1','book-2','book-3','book-4','book-5','book-6']);
 assert.ok(config.books.every((x,i)=>x.title===BOOKS[i].title.slice(0,28)));
 assert.equal(expectedBooks().length,6);
});
test('engine solution and shuffled wrong order evaluate canonically',()=>{
 assert.equal(evaluateSpineOrder(config,config.solution).success,true);
 assert.equal(evaluateSpineOrder(config,[...config.solution].reverse()).success,false);
 assert.deepEqual(validateSpineMosaicConfig(config).solution,config.solution);
});
test('metadata maps module book-1 through 6 to original world Item UUIDs and publication years',()=>{
 const f=sourceBoundFlag(config);
 assert.deepEqual(f.originalItemIds,BOOKS.map(b=>b.uuid));
 assert.deepEqual(f.originalPublicationYears,[1442,1443,1444,1445,1446,1447]);
 assert.equal(f.configBookToOriginalUuid['book-6'],'Item.gmTsIOqc3qFBc3zA');
 assert.equal(f.configBookToOriginalUuid['book-1'],'Item.Qplmy8JR7plDYLiY');
});
test('original zoom, Gond issuer and original hidden reward tile preserved',()=>{
 assert.equal(PROTECTED_BEHAVIORS.closeup,'LRYrBIQNN92SCJai');
 assert.equal(PROTECTED_BEHAVIORS.gondReward,'CAVGONDREWARD001');
 assert.equal(SOURCE_REWARD,'Item.o9G3UJjEe2QX1ZH0');
 assert.equal(SOURCE_REWARD_TILE,'CAVHU05GONDTILE1');
 const f=sourceBoundFlag(config);
 assert.equal(f.originalCloseupBehaviorId,PROTECTED_BEHAVIORS.closeup);
 assert.equal(f.originalGondRewardBehaviorId,PROTECTED_BEHAVIORS.gondReward);
});
test('registered native puzzle is explicitly source configured but not commissioned or awarded',()=>{
 const f=sourceBoundFlag(config);
 assert.equal(f.status,'configured-disabled-await-authentic-sixth-veil');
 assert.equal(f.nativeSpineCompletionVerified,false);
 assert.equal(f.nativeVeilSixthPickupVerified,false);
 assert.equal(f.rewardGranted,false);
 assert.equal(f.nativePlayerTested,false);
 assert.equal(f.originalRegionwrightApiUsed,true);
});
test('nonstandard Regionwright puzzle API/config is rejected without write',()=>{
 assert.throws(()=>proposedSpineConfig({}),/Missing standard/);
 assert.throws(()=>proposedSpineConfig({createConfig:()=>({})}),/native config drift/);
});