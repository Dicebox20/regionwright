import test from 'node:test';
import assert from 'node:assert/strict';
import{
 ITEM_ID,ITEM_UUID,FOLDER_ID,ORIGINAL_PLINTH_UUID,OWNER_AUTHORITY,
 ORIGINALS,DESCRIPTION,KEYS,makeKeystoneWorldTemplate,templateValid
}from'../modules/regionwright/scripts/studio-cav-late-original-keystone-item-source.js';
const m=makeKeystoneWorldTemplate();
test('owner approved source has deterministic 16-character unique Keystone Item',()=>{
 assert.equal(ITEM_ID,'CAVKEYSTONEITEM1');
 assert.equal(ITEM_ID.length,16);
 assert.equal(ITEM_UUID,'Item.CAVKEYSTONEITEM1');
 assert.equal(m._id,ITEM_ID);
 assert.equal(m.name,'Keystone');
 assert.equal(templateValid(),true);
});
test('canonical puzzle folder and all-FR Foundry world-Item loot schema',()=>{
 assert.equal(FOLDER_ID,'N6X80ycvxaPIszHg');
 assert.equal(m.folder,FOLDER_ID);
 assert.equal(m.type,'loot');
 assert.equal(m.system.quantity,1);
 assert.equal(m.system.identifier,'cav-vault-keystone');
 assert.equal(m.ownership.default,0);
 assert.equal(m.system.identified,true);
});
test('new source explicitly marked owner delegated, GM_LIBRARY_ONLY and never earned',()=>{
 const f=m.flags['dicebox-campaign-helper'];
 assert.equal(f.cabinPuzzleItem.status,'GM_LIBRARY_ONLY');
 assert.equal(f.cabinPuzzleItem.source,OWNER_AUTHORITY);
 assert.equal(f.cavKeystoneOriginalSource.approvedAsNewOriginal,true);
 assert.equal(f.cavKeystoneOriginalSource.claimStatus,'NOT_CLAIMED');
 assert.equal(f.cavKeystoneOriginalSource.nativeGameplayTested,false);
});
test('physical item from Vault plinth and not from Sune Bowl Bathhouse',()=>{
 assert.equal(ORIGINAL_PLINTH_UUID,'Scene.tjTpG2RVZNoCqRLh.Region.CAVB799A5357A114');
 const f=m.flags['dicebox-campaign-helper'].cavKeystoneOriginalSource;
 assert.equal(f.intendedVaultPlinthRegionUuid,ORIGINAL_PLINTH_UUID);
 assert.equal(f.intendedRecessRegionId,'CAVB67AABD1B35C6');
 assert.equal(f.separateStoneLeverRegionId,'CAVUNDLEVER00001');
 assert.equal(f.outerScryingBowlSubstituteForbidden,true);
});
test('reward distinct from four Vault components plus Bowl and Dust',()=>{
 assert.equal(ORIGINALS.length,6);
 assert.equal(new Set(ORIGINALS).size,6);
 assert.ok(!ORIGINALS.includes(ITEM_UUID));
 assert.ok(ORIGINALS.includes('Item.1n5LONw3nYIy61O9'));
 assert.ok(ORIGINALS.includes('Item.vbDWTbnAZg65ErSS'));
});
test('item description avoids imaginary teleport or arbitrary unlock',()=>{
 assert.match(DESCRIPTION,/palm-sized block/);
 assert.match(DESCRIPTION,/rose nested inside a ring of precise gear teeth/);
 assert.match(DESCRIPTION,/neither a door key nor a magical teleporter/);
 assert.match(DESCRIPTION,/operate something else/);
});
test('owner-approved original source icon was preverified HTTP 200',()=>{
 assert.equal(m.img,'icons/commodities/stone/geode-raw-grey.webp');
});
test('source-claim ledger names maintained separately',()=>{
 assert.equal(KEYS.originalSource,'cavKeystoneOriginalSource');
 assert.equal(KEYS.vaultMarker,'cavLateKeystonePlinthMarker');
 assert.equal(KEYS.vaultClaim,'cavLateKeystoneGrant');
});
test('tampered source is rejected',()=>{
 const forged=makeKeystoneWorldTemplate();
 forged.system.quantity=4;
 assert.equal(templateValid(forged),false);
});
test('no source mutation by multiple pure template constructions',()=>{
 assert.deepEqual(makeKeystoneWorldTemplate(),makeKeystoneWorldTemplate());
 assert.notStrictEqual(makeKeystoneWorldTemplate(),makeKeystoneWorldTemplate());
});