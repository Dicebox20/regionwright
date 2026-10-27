import test from 'node:test';
import assert from 'node:assert/strict';
import{VAULT,PLINTH,BEHAVIOR,KEYSTONE_SOURCE,disabledPlinthBehavior,plinthStageIsSafe}
 from'../modules/regionwright/scripts/studio-cav-late-keystone-vault-plinth-native-stage.js';
const x=disabledPlinthBehavior();
test('exact existing Vault plinth and original source identity',()=>{
 assert.equal(VAULT,'tjTpG2RVZNoCqRLh');
 assert.equal(PLINTH,'CAVB799A5357A114');
 assert.equal(KEYSTONE_SOURCE,'Item.CAVKEYSTONEITEM1');
 assert.equal(BEHAVIOR,'CAVVKEYPLINTH001');
 assert.equal(BEHAVIOR.length,16);
});
test('native dormant behavior does not mutate world Item or Vault progression',()=>{
 assert.equal(plinthStageIsSafe(),true);
 assert.equal(x.disabled,true);
 assert.equal(x.type,'executeScript');
 assert.equal(x.flags['dicebox-campaign-helper'].cavKeystonePlinthStage.nativeActorRewardEnabled,false);
});
test('stage source compilable in Foundry asynchronous Region context',()=>{
 const AF=Object.getPrototypeOf(async function(){}).constructor;
 assert.doesNotThrow(()=>new AF('region','event',x.system.source));
});
test('script is narrative only and cannot auto-open Vault',()=>{
 for(const f of ['createEmbeddedDocuments','setFlag(','deleteEmbeddedDocuments','teleportToken','enablePortal','actor.update('])
  assert.equal(x.system.source.includes(f),false,f);
 assert.match(x.system.source,/three original components/);
 assert.match(x.system.source,/has not been awarded/);
});
test('tampered enabled plinth is not safe contract stage',()=>{
 const tampered=disabledPlinthBehavior();
 tampered.disabled=false;
 assert.equal(plinthStageIsSafe(tampered),false);
});
test('original Vault Item source and ledgers remain distinguishable',()=>{
 assert.equal(x.flags['dicebox-campaign-helper'].cavKeystonePlinthStage.originalClaimLedger,'cavLateKeystoneGrant');
 assert.equal(x.flags['dicebox-campaign-helper'].cavKeystonePlinthStage.status,'dormant-vault-still-locked');
});