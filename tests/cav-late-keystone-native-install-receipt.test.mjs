import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{ITEM_UUID,OWNER_AUTHORITY,DESCRIPTION,ORIGINAL_PLINTH_UUID,
 makeKeystoneWorldTemplate}from'../modules/regionwright/scripts/studio-cav-late-original-keystone-item-source.js';
import{disabledPlinthBehavior,BEHAVIOR}from'../modules/regionwright/scripts/studio-cav-late-keystone-vault-plinth-native-stage.js';
const root=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-chat-b-turn24-original-keystone/',import.meta.url);
const j=n=>JSON.parse(readFileSync(new URL(n,root),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const pre=j('cav-chatb-t24-keystone-item-preflight.json');
const native=j('cav-chatb-t24-original-keystone-item-install.json');
const separate=j('cav-chatb-t24-keystone-item-independent-postread.json');
const plinth=j('cav-chatb-t24-keystone-plinth-native-install.json');
const final=j('cav-chatb-t24-keystone-item-plinth-independent-postread.json');
test('owner-approved 16-character source Item passed no-write original world preflight',()=>{
 assert.equal(pre.world,'cabin-in-the-ashen-veil');
 assert.equal(pre.gm,'Gamemaster 1');
 assert.equal(pre.existing.length,0);
 assert.equal(pre.actorCopies.length,0);
 assert.equal(pre.vault.uuid,'Scene.tjTpG2RVZNoCqRLh');
});
test('exact one Keystone GM-library original source installed not player reward',()=>{
 assert.equal(native.status,'original-keystone-owner-authored-world-source-installed-gm-library-only');
 assert.equal(native.installed.uuid,ITEM_UUID);
 assert.equal(native.installed.status,'GM_LIBRARY_ONLY');
 assert.equal(native.installed.claimStatus,'NOT_CLAIMED');
 assert.equal(native.installed.source,OWNER_AUTHORITY);
 assert.equal(native.noPlayerCopies,true);
 assert.equal(native.itemTemplateSHA256,sha(JSON.stringify(makeKeystoneWorldTemplate())));
});
test('item independently GM verified, original item source text and folder unchanged',()=>{
 assert.equal(separate.pass,true);
 assert.equal(separate.uuid,ITEM_UUID);
 assert.equal(separate.libraryOnly,'GM_LIBRARY_ONLY');
 assert.equal(separate.actorCopies,0);
 assert.equal(separate.worldKeystoneMatches,1);
 assert.equal(separate.vaultPlinth,ORIGINAL_PLINTH_UUID);
 assert.equal(separate.itemDescriptionSHA256,sha(DESCRIPTION));
});
test('original existing Vault plinth native behavior staged DISABLED',()=>{
 assert.equal(plinth.status,'one-disabled-original-keystone-vault-plinth-behavior-installed');
 assert.equal(plinth.v.currentVaultRegions,2);
 assert.equal(plinth.installed.uuid,ORIGINAL_PLINTH_UUID+'.RegionBehavior.'+BEHAVIOR);
 assert.equal(plinth.installed.disabled,true);
 assert.equal(plinth.installed.sourceUuid,ITEM_UUID);
});
test('final independent actual GM readback byte-exact plinth source and hidden reward',()=>{
 assert.equal(final.pass,true);
 assert.equal(final.plinthRegionUuid,ORIGINAL_PLINTH_UUID);
 assert.equal(final.scriptSHA256,sha(disabledPlinthBehavior().system.source));
 assert.equal(final.scriptSHA256,final.expectedScriptSHA256);
 assert.equal(final.behaviorDisabled,true);
 assert.equal(final.actorKeystoneCopies,0);
 assert.equal(final.worldKeystoneCount,1);
 assert.equal(final.sourceNewAuthority,OWNER_AUTHORITY);
});
test('four earlier inner puzzle Behaviors remain sealed and Crooked Man deferred',()=>{
 assert.equal(final.allInnerBehaviorsDisabled,true);
 assert.equal(final.originalCrookedChasesDeferred,true);
 assert.equal(final.sourceStatus,'GM_LIBRARY_ONLY');
});
test('a stage-only Item/Region receipt cannot certify a Vault pickup or inner-door lever',()=>{
 assert.equal(native.installed.claimStatus,'NOT_CLAIMED');
 assert.equal(final.behaviorDisabled,true);
 assert.equal(plinth.installed.disabled,true);
});