import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{SCENE,BOOKCASE,ORIGINAL_BOOKS,GOND_SOURCE,TILE_ID,gondClaimSource}from
 '../modules/regionwright/scripts/studio-cav-late-sophia-gond-compartment-native.js';
const root=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-chat-b-turn27-sophia-gond/',import.meta.url);
const j=n=>JSON.parse(readFileSync(new URL(n,root),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const baseline=j('cav-chatb-t27-bookcase-current-native.json');
const census=j('cav-chatb-t27-hu05-hu07-native-census.json');
const install=j('cav-chatb-t27-sophia-gond-dormant-native-install.json');
const proof=j('cav-chatb-t27-sophia-gond-independent-postread.json');
test('original live bookcase source present and ENABLED before owner-approved write',()=>{
 assert.equal(baseline.behaviorDisabled,false);
 assert.equal(baseline.regionBehaviors,1);
 assert.match(baseline.source,/Sophia bookcase: owner-approved zoom/);
 assert.equal(census.scenes.find(s=>s.id===SCENE).regions.length,4);
});
test('six true storybooks and reward source all from original GM library',()=>{
 assert.deepEqual(install.summary.originalSixBooks,ORIGINAL_BOOKS);
 assert.equal(install.summary.originalGondSource,GOND_SOURCE);
 assert.ok(proof.originalSourceItems.every(i=>i.status==='GM_LIBRARY_ONLY'));
});
test('one-time installer wrote only hidden visual and disabled original bookcase issuer',()=>{
 assert.equal(install.status,'Sophia-original-bookcase-hidden-Gond-tile-and-disabled-native-issuer-installed');
 assert.equal(install.addedTile.hidden,true);
 assert.equal(install.addedBehavior.disabled,true);
 assert.equal(install.originalCloseupStillEnabled,true);
 assert.equal(install.originalReturnStillEnabled,true);
 assert.equal(install.noPlayerGondReward,true);
});
test('separate elected GM independent readback of exact source SHA succeeds',()=>{
 assert.equal(proof.pass,true);
 assert.equal(proof.newBehaviorSourceSHA256,sha(gondClaimSource()));
 assert.equal(proof.newBehaviorSourceSHA256,proof.expectedBehaviorSourceSHA256);
 assert.equal(proof.originalBookcaseSourceSHA256,sha(baseline.source));
 assert.equal(proof.originalCloseupUnchanged,true);
});
test('hidden Gond visual remains inside H-U05 bookcase and non-clickable',()=>{
 assert.equal(proof.tile.uuid,'Scene.'+SCENE+'.Tile.'+TILE_ID);
 assert.equal(proof.tile.hidden,true);
 assert.equal(proof.tile.locked,true);
 assert.equal(proof.tile.flag.rewardUuid,GOND_SOURCE);
 assert.equal(proof.tile.flag.status,'hidden-original-bookcase');
});
test('original bookcase extra Behavior disabled and region unchanged',()=>{
 assert.equal(proof.disabled,true);
 assert.equal(proof.behaviorUuid,'Scene.'+SCENE+'.Region.'+BOOKCASE+'.RegionBehavior.CAVGONDREWARD001');
 assert.equal(proof.originalReturnActive,true);
});
test('no fabricated order, Veil, compartment, Gond Item or vault socket enabled',()=>{
 assert.equal(proof.rewardLedger,null);
 assert.equal(proof.spineLedger,null);
 assert.equal(proof.compartmentLedger,null);
 assert.equal(proof.actorGondCopies,0);
 assert.equal(proof.vaultSocketDisabled,true);
 assert.equal(proof.originalGond.status,'GM_LIBRARY_ONLY');
});