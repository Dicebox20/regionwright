import test from 'node:test';
import assert from 'node:assert/strict';
import{PARENTS,HOPE_REGION,BEHAVIOR_ID,ORIGINAL_SILVER,
 ORIGINAL_BOX,ORIGINAL_PRAYER,ORIGINAL_JOURNAL,CLAIM_LEDGER,
 ORIGINAL_PROVENANCE,musicBoxPrayerNativeSource}from
 '../modules/regionwright/scripts/studio-cav-late-original-music-box-prayer-native.js';
const source=musicBoxPrayerNativeSource();
const AF=Object.getPrototypeOf(async function(){}).constructor;
test('exact original world Item, journal, scene and fixed native behavior IDs',()=>{
 assert.equal(PARENTS,'CAVHU04Scene0001');
 assert.equal(HOPE_REGION,'CAVHU04HOPECHST1');
 assert.equal(BEHAVIOR_ID,'CAVPRAYERBOXBEH1');
 assert.equal(BEHAVIOR_ID.length,16);
 assert.equal(ORIGINAL_SILVER,'Item.IY8fuUG5P0yWIZIh');
 assert.equal(ORIGINAL_BOX,'Item.YaKs6z2AWlEAlyzx');
 assert.equal(ORIGINAL_PRAYER,'Item.5jwy75XyFezukf3b');
 assert.equal(ORIGINAL_JOURNAL,'JournalEntry.CAVPRAYERPROTECT');
});
test('script compiles as Foundry native async Region executeScript code',()=>{
 assert.doesNotThrow(()=>new AF('region','event',source));
});
test('exact elected GM world and original Region guard, not client bypass',()=>{
 for(const p of ['game.version!==\'14.367\'','game.world?.id!==\'cabin-in-the-ashen-veil\'',
  'game.users?.activeGM?.id!==game.user.id',
  'scene?.id!==\'CAVHU04Scene0001\'',
  'region?.id!==\'CAVHU04HOPECHST1\''])
 assert.ok(source.includes(p),p);
});
test('original owner character token, source action and GM approval required',()=>{
 for(const p of ['token.actor?.type!==\'character\'',
  'actor.testUserPermission(u,\'OWNER\')','region.testPoint(center)',
  'DialogV2.confirm','Approve deliberate box opening',
  'Approve ONLY after the player deliberately chose this action'])
 assert.ok(source.includes(p),p);
});
test('registered existing original Silver claim proof cannot be substituted',()=>{
 for(const p of ['cavLateSilverKeySourceUuid',
  'cavLateSilverKeyDropSceneId','CAVSG01Scene0001',
  'cavLateSilverKeyDropRegionUuid',
  'cavLateSecondChaseSilverKeyClaim',
  'silverClaim?.status!==\'done\'',
  'silverClaim.actorId!==actor.id','silverClaim.sourceUuid!==silver'])
 assert.ok(source.includes(p),p);
});
test('existing original chest unlock AND one original Music Box claim both must be done',()=>{
 for(const p of ['cavLateHopeChestUnlock','cavLateMusicBoxClaim',
  'oldStatus(\'cavLateMusicBoxClaim\')!==\'done\'',
  'boxClaim?.actorId!==actor.id',
  'boxClaim?.sourceUuid!==boxSource',
  'boxClaim.embeddedItemId'])
 assert.ok(source.includes(p),p);
});
test('actual claimed actor-embedded Music Box provenance and original chest Region required',()=>{
 for(const p of ['actor.items.get(boxClaim.embeddedItemId)',
  'cavLateMusicBoxSourceUuid','cavLateBatch1SourceRegionUuid',
  'cavLateBatch1PickupOrigin','original-hope-chest',
  'box.getFlag(NS,\'cavLateBatch1SourceRegionUuid\')!==region.uuid'])
 assert.ok(source.includes(p),p);
});
test('full owner-authored readable GM Journal and world Item source must be installed',()=>{
 for(const p of ['game.items.get(\'5jwy75XyFezukf3b\')',
  'game.journal.get(\'CAVPRAYERPROTECT\')',
  'cavFullPrayerJournalUuid',
  'JournalEntry.CAVPRAYERPROTECT',
  'cavFullPrayerOriginalSourceUuid',
  'GM_LIBRARY_ONLY','Lady of the Rose'])
 assert.ok(source.includes(p),p);
});
test('single unique player Item grant reserved BEFORE native Item clone; exact reread then done',()=>{
 const reserved=source.indexOf("status:'reserved'");
 const create=source.indexOf("actor.createEmbeddedDocuments('Item'");
 const done=source.indexOf("status:'done'");
 assert.ok(reserved>0&&create>reserved&&done>create);
 for(const p of ['game.actors.contents.some','if(state||',
  "copy.flags={...copy.flags", "cavLatePrayerProtectionSourceUuid",
  "cavLatePrayerMusicBoxEmbeddedId","embeddedItemId:embedded.id",
  'Uncertain Prayer claim reservation','Partial original Prayer reward'])
 assert.ok(source.includes(p),p);
 assert.ok(!source.includes("new Item("));
});
test('never consume key, box, source prayer or invent Journal or teleporter',()=>{
 for(const forbidden of ['deleteEmbeddedDocuments','game.socket.emit',
  'JournalEntry.create','teleportToken','original.update('])
 assert.ok(!source.includes(forbidden),forbidden);
 assert.equal(source.includes('silverItem.id'),true);
 assert.equal(source.includes('box.id'),true);
});
test('original source provenance ledger names are fixed to owner approved chain',()=>{
 assert.equal(CLAIM_LEDGER,'cavLatePrayerProtectionClaim');
 assert.equal(ORIGINAL_PROVENANCE.unlock,'cavLateHopeChestUnlock');
 assert.equal(ORIGINAL_PROVENANCE.boxClaim,'cavLateMusicBoxClaim');
 assert.equal(ORIGINAL_PROVENANCE.prayerClaim,CLAIM_LEDGER);
 assert.equal(ORIGINAL_PROVENANCE.silverClaim,'cavLateSecondChaseSilverKeyClaim');
 assert.equal(ORIGINAL_PROVENANCE.originalBoxRegion,
   'Scene.CAVHU04Scene0001.Region.CAVHU04HOPECHST1');
});