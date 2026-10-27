import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{SOCKETS,nativeSocketTransactionSource}from
 '../modules/regionwright/scripts/studio-cav-late-vault-socket-native-transactions.js';
const root=new URL('../docs/cabin-ashen-veil/native-install-evidence/2026-10-27-chat-b-turn26-vault-socket-transactions/',import.meta.url);
const j=n=>JSON.parse(readFileSync(new URL(n,root),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const census=j('cav-chatb-t26-original-reward-nodes-readonly.json');
const preflight=j('cav-chatb-t26-vault-three-transaction-sources-install.json');
const verified=j('cav-chatb-t26-vault-three-transaction-sources-independent-postread.json');
const recon=j('cav-chatb-t26-installer-postwrite-exception-reconciliation.json');
test('original reward source providers are not present: no false success receipt',()=>{
 assert.equal(census.world,'cabin-in-the-ashen-veil');
 for(const sceneId of ['CAVHG05Scene0001','CAVHU05Scene0001','CAVHU07Scene0001']){
 const s=census.scenes.find(x=>x.id===sceneId);
 assert.ok(s,sceneId);
 assert.equal(s.regions.some(r=>r.flags.includes('cavLateVaultRewardClaimV1')),false,sceneId);
 }
});
test('real GM no-write preflight exact three original sockets, all sources GM-library',()=>{
 assert.equal(preflight.status,'original-three-socket-native-source-upgrade-preflight-no-writes-pass');
 assert.equal(preflight.original.sockets.length,3);
 assert.equal(preflight.original.allThreeSourceProvidersMissing,true);
 assert.equal(preflight.original.basementLocked,true);
 assert.equal(preflight.original.workshopRegions,8);
 assert.equal(preflight.original.vaultRegions,3);
 assert.equal(preflight.original.allOriginalRewardsStillInGMLibrary,true);
});
test('failed installer correctly documented without replay or claim of successful end-to-end completion',()=>{
 assert.equal(recon.attemptedInstallerExitCode,1);
 assert.match(recon.attemptedInstallerError,/ReferenceError: v is not defined/);
 assert.equal(recon.installerReplayed,false);
 assert.equal(recon.independentCurrentElectedGMCheckPass,true);
 assert.equal(recon.actualDisabledNativeSourceUpdates,3);
 assert.equal(recon.newItemsOrProgression,0);
});
test('independent authenticated GM postread passes despite postwrite validation bug',()=>{
 assert.equal(verified.pass,true);
 assert.equal(verified.results.length,3);
 assert.equal(verified.workshopRegions,8);
 assert.equal(verified.vaultRegions,3);
 assert.equal(verified.actorItemCopies.length,0);
 assert.ok(verified.results.every(x=>x.verified===true));
});
test('each native executeScript current actual source hash exactly matches authored source',()=>{
 for(const [kind,socket]of Object.entries(SOCKETS)){
  const receipt=verified.results.find(x=>x.kind===kind);
  assert.equal(receipt.region,'Scene.G6NMonfCwMvNzipL.Region.'+socket.regionId);
  assert.equal(receipt.behavior,receipt.region+'.RegionBehavior.'+socket.behaviorId);
  assert.equal(receipt.sourceSha256,sha(nativeSocketTransactionSource(kind)));
  assert.equal(receipt.sourceSha256,receipt.expectedSha256);
  assert.equal(receipt.stage.itemSourceUuid,socket.worldItem);
  assert.equal(receipt.stage.sourceSceneId,socket.sourceSceneId);
 }
});
test('native source code stays disabled/without transaction state for all 3 sockets',()=>{
 assert.ok(verified.results.every(r=>r.disabled===true));
 assert.ok(verified.results.every(r=>r.regionStage==='dormant-uncommissioned'));
 assert.ok(verified.results.every(r=>r.stage.status==='source-installed-disabled-pending-original-producer'));
 assert.ok(verified.results.every(r=>r.ledger===null));
 assert.equal(verified.actorItemCopies.length,0);
});
test('Vault turn/portals/Keystone and original chases remain unchanged',()=>{
 for(const k of ['turn','outbound','return','keystonePlinth','foyerReturn','firstChase','secondChase'])
  assert.equal(verified.unchanged[k],true,k);
 assert.deepEqual(verified.originalItems.map(x=>x.status),
  Array(4).fill('GM_LIBRARY_ONLY'));
});