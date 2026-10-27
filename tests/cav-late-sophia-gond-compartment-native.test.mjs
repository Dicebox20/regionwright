import test from 'node:test';
import assert from 'node:assert/strict';
import{SCENE,BOOKCASE,ORIGINAL_INSPECT,GOND_BEHAVIOR,GOND_SOURCE,
 ORIGINAL_BOOKS,TILE_ID,TILE,gondClaimSource,disabledGondClaim}from
 '../modules/regionwright/scripts/studio-cav-late-sophia-gond-compartment-native.js';
const s=gondClaimSource(),b=disabledGondClaim();
const AF=Object.getPrototypeOf(async function(){}).constructor;
test('uses exact original H-U05 in-room bookcase, no superseded extra H-U06',()=>{
 assert.equal(SCENE,'CAVHU05Scene0001');
 assert.equal(BOOKCASE,'CAVB994894A7432F');
 assert.equal(ORIGINAL_INSPECT,'LRYrBIQNN92SCJai');
 assert.equal(GOND_BEHAVIOR.length,16);
 assert.equal(TILE_ID.length,16);
 assert.ok(!s.includes('CAVHU06Scene'));
});
test('exact original Gond half with six authentic original year-ordered books',()=>{
 assert.equal(GOND_SOURCE,'Item.o9G3UJjEe2QX1ZH0');
 assert.deepEqual(ORIGINAL_BOOKS,[
  'Item.Qplmy8JR7plDYLiY','Item.DLGIhHc0RDqh0YVt',
  'Item.TO69wBYN8sRJuxtH','Item.c3oKW8YkklE8slnX',
  'Item.HV7XjKmgqVITSEvW','Item.gmTsIOqc3qFBc3zA']);
 assert.equal(new Set(ORIGINAL_BOOKS).size,6);
});
test('original Tile visual stays HIDDEN and inside bookcase region',()=>{
 assert.equal(TILE.hidden,true);
 assert.equal(TILE.locked,true);
 assert.equal(TILE.texture.src,'icons/equipment/neck/pendant-bronze-gem-blue.webp');
 assert.equal(TILE.x>=930&&TILE.y>=135&&TILE.x+TILE.width<=1150&&TILE.y+TILE.height<=305,true);
});
test('native source compiles under Foundry async Region context',()=>{
 assert.doesNotThrow(()=>new AF('region','event',s));
 assert.equal(b.disabled,true);
 assert.equal(b.type,'executeScript');
 assert.deepEqual(b.system.events,['tokenMoveIn','tokenMoveWithin']);
});
test('exact elected GM, original source item and current six GM-library Items required',()=>{
 for(const v of ["game.version!=='14.367'","game.users?.activeGM?.id!==game.user.id",
  "original.type!=='loot'","original.getFlag(NS,'cabinPuzzleItem')",
  "worldBooks.some","i.type!=='loot'"])
 assert.ok(s.includes(v),v);
});
test('sixth book and native original-order proof mandatory, not owner self-attested',()=>{
 for(const v of ["cavSpineMosaicNativeV1","cavSpineCompartmentNativeV1",
  "cavSophiaSixthBookCanonicalVeilV1",
  "sourceOfTruth!=='original-regionwright-spine-mosaic'",
  "bookSolve.sixthBookActualVeilPickupVerified",
  "veil.originalSixthBookClaimStatus!=='done'",
  "bookSolve.originalOrder.some((uuid,index)=>uuid!==ORDER[index])"])
 assert.ok(s.includes(v),v);
});
test('cannot claim until actual original bookcase compartment visual is revealed',()=>{
 assert.ok(s.includes('if(tile.hidden!==false'));
 assert.ok(s.includes("compartment.originalGondTileId!==TILE"));
 assert.ok(s.includes("region.getFlag(NS,ORIGIN_CLAIM)"));
});
test('GM checks real owner controlled PC token inside original active bookcase',()=>{
 for(const v of ["token.actor?.type!=='character'",
 "actor.testUserPermission(u,'OWNER')","region.testPoint(mid)",
 "bookSolve.actorId!==actor.id","bookSolve.tokenId!==token.id",
 "compartment.actorId!==actor.id"])assert.ok(s.includes(v),v);
});
test('native claim uses explicit elected GM confirmation after player elected pickup',()=>{
 assert.ok(s.includes('DialogV2.confirm'));
 assert.ok(s.includes('Approve only if this character has deliberately taken'));
 assert.ok(s.includes("yes:{label:'Approve explicit Gond pickup'}"));
});
test('exactly one original Item copied and provenance links true origin native claim',()=>{
 const reserve=s.indexOf("status:'reserved'"),create=s.indexOf("actor.createEmbeddedDocuments('Item'"),done=s.lastIndexOf("status:'done'");
 assert.ok(reserve>0&&create>reserve&&done>create);
 for(const v of ["sourceSceneId:SCENE","sourceRegionUuid:region.uuid",
  "sourceActorId:actor.id","sourceEmbeddedItemId:embedded.id",
  "originalSourceReceiptStatus:'done'","embeddedItemId:embedded.id",
  "originalSourceReceiptStatus:'reserved'",
  "getFlag(NS,ORIGIN_CLAIM)"])
 assert.ok(s.includes(v),v);
});
test('not a chase, portal unlock, silent award or duplicate world item source',()=>{
 for(const v of ["Item.createDocuments","deleteEmbeddedDocuments",
  "CAVSG01CHASETRG1","CAVVOUTTEL000001","CAVVTURNBEH00001",
  "Scene.create","updateEmbeddedDocuments"])
 assert.equal(s.includes(v),false,v);
});
test('native source remains disabled until original book UI producer is installed',()=>{
 assert.equal(b.flags['dicebox-campaign-helper'].cavSophiaOriginalGondSource.status,
  'dormant-await-authentic-six-book-veil');
 assert.equal(b.flags['dicebox-campaign-helper'].cavSophiaOriginalGondSource.requiresNativeSpineProducer,true);
});