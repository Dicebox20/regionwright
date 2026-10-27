// Chat B T26: owner-authorized, source-verified THREE socket transaction handlers.
// Every native script intentionally installed DISABLED until real upstream reward
// source Regions/GM claim receipts exist. This file does not create those receipts.
// The elected GM must bind actual original source producers to this read-only
// provenance shape after inspecting their original event ledgers. Never synthesize
// story progression from a matching Item label, self-attested receipt or party flag.
export const WORKSHOP_SCENE='G6NMonfCwMvNzipL';
export const FOYER_SCENE='CAVHG02Scene0001';
export const FOYER_BASEMENT='CAVFOYERBASEDR01';
export const FOYER_PORTAL='CAVFOYERBASPORT1';
export const SOCKETS=Object.freeze({
 'charged-source':Object.freeze({
  regionId:'CAVVAULTPOWER001',behaviorId:'CAVVPOWERBEH0001',
  worldItem:'Item.pbmUZPfC3WnsBRgi',name:'Uncharged Gondian Power Source',
  sourceSceneId:'CAVHG05Scene0001'}),
 'gond-half':Object.freeze({
  regionId:'CAVVAULTGOND0001',behaviorId:'CAVVGONDBEH00001',
  worldItem:'Item.o9G3UJjEe2QX1ZH0',name:'Gond Emblem Half',
  sourceSceneId:'CAVHU05Scene0001'}),
 'sune-half':Object.freeze({
  regionId:'CAVVAULTSUNE0001',behaviorId:'CAVVSUNEBEH00001',
  worldItem:'Item.t9uCIpsKeSvtC31w',name:'Sune Emblem Half',
  sourceSceneId:'CAVHU07Scene0001'})
});
export const LEDGERS=Object.freeze({
 socket:'cavLateVaultSocketTransactionV1',
 item:'cavLateVaultItemInstalledV1',
 sourceBridge:'cavLateVaultRewardProvenanceV1',
 sourceNative:'cavLateVaultRewardClaimV1',
 chargeBridge:'cavLateVaultChargeProofV1',
 chargeNative:'cavLateVaultChargeReceiptV1',
 veilNative:'cavLateVaultCanonicalVeilV1'
});
export const MODE='disabled-pending-original-source-provider-native-ledgers';
const native=String.raw`
const NS='dicebox-campaign-helper',WORLD='cabin-in-the-ashen-veil',VERSION='14.367';
const SCENE='G6NMonfCwMvNzipL',FOYER='CAVHG02Scene0001',BASEMENT='CAVFOYERBASEDR01';
const PORTAL='CAVFOYERBASPORT1',ORIGINAL='__KIND__',
 SOURCE='__SOURCE__',ITEM_NAME='__NAME__',ORIGIN_SCENE='__ORIGIN__';
const REGION='__REGION__',SOCKET_LEDGER='cavLateVaultSocketTransactionV1';
const ITEM_LEDGER='cavLateVaultItemInstalledV1',CLAIM='cavLateVaultRewardClaimV1';
const isGM=()=>game?.ready===true&&game.version===VERSION&&game.world?.id===WORLD&&
 game.user?.isGM===true&&game.users?.activeGM?.id===game.user.id;
if(!isGM()||scene?.id!==SCENE||region?.id!==REGION||
 !['tokenMoveIn','tokenMoveWithin'].includes(event?.name))return;
const foyerRegion=game.scenes.get(FOYER)?.regions.get(BASEMENT);
const foyerPortal=foyerRegion?.behaviors.get(PORTAL);
const basement=foyerRegion?.getFlag(NS,'cavWeatheredBasementUnlocked');
if(basement?.status!=='done'||basement.keySource!=='Item.CAVWEATHERKEY001'||
 foyerPortal?.disabled!==false||foyerPortal?.type!=='teleportToken'||
 !foyerPortal.system?.destinations?.has('Scene.G6NMonfCwMvNzipL.Region.CAVB9C0F653A2A6F'))
 return;
const source=game.items.get(SOURCE.slice(5));
if(!source||source.uuid!==SOURCE||source.name!==ITEM_NAME||
 source.type!=='loot'||source.getFlag(NS,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')return;
const actorToken=event.data?.token?.document??event.data?.token;
const token=scene.tokens.get(actorToken?.id??event.data?.tokenId);
if(!token||token.hidden||token.actor?.type!=='character')return;
const actor=token.actor;
const ownerUsers=game.users.contents.filter(u=>u.active&&!u.isGM&&actor.testUserPermission(u,'OWNER'));
const sender=event.userId??event.data?.userId??null;
const owner=sender?ownerUsers.find(u=>u.id===sender):ownerUsers.length===1?ownerUsers[0]:null;
if(!owner)return;
const mid={x:token.x+token.width*scene.grid.size/2,y:token.y+token.height*scene.grid.size/2,elevation:0};
if(!region.testPoint(mid))return;
if(region.getFlag(NS,SOCKET_LEDGER))return; // reserved/done/unknown means reconcile; no retry
const allKinds=[
 ['charged-source','CAVVAULTPOWER001','Item.pbmUZPfC3WnsBRgi'],
 ['gond-half','CAVVAULTGOND0001','Item.o9G3UJjEe2QX1ZH0'],
 ['sune-half','CAVVAULTSUNE0001','Item.t9uCIpsKeSvtC31w']
];
for(const [kind,id,sourceUuid] of allKinds){
 const socket=scene.regions.get(id);
 if(!socket||socket.behaviors.size!==1||
  socket.getFlag(NS,'cavLateVaultWorkshopFixture')?.status!=='dormant-uncommissioned')return;
 const claim=socket.getFlag(NS,SOCKET_LEDGER);
 if(claim&&(claim.status==='reserved'||claim.sourceUuid!==sourceUuid))return;
 if(kind===ORIGINAL&&claim)return;
}
const owned=actor.items.contents.filter(i=>
 i.name===ITEM_NAME&&i.type==='loot'&&
 i.getFlag(NS,'cavLateVaultRewardProvenanceV1')?.sourceUuid===SOURCE);
if(owned.length!==1)return;
const held=owned[0],pf=held.getFlag(NS,'cavLateVaultRewardProvenanceV1');
if(pf?.version!==1||pf.sourceSceneId!==ORIGIN_SCENE||
 pf.sourceActorId!==actor.id||pf.sourceEmbeddedItemId!==held.id||
 typeof pf.sourceRegionUuid!=='string'||
 !pf.sourceRegionUuid.startsWith('Scene.'+ORIGIN_SCENE+'.Region.')||
 pf.originalSourceReceiptStatus!=='done')return;
const originId=pf.sourceRegionUuid.split('.').at(-1);
const srcRegion=game.scenes.get(ORIGIN_SCENE)?.regions.get(originId);
const issue=srcRegion?.getFlag(NS,CLAIM);
if(srcRegion?.uuid!==pf.sourceRegionUuid||issue?.status!=='done'||
 issue.actorId!==actor.id||issue.embeddedItemId!==held.id||
 issue.sourceUuid!==SOURCE||issue.regionUuid!==srcRegion.uuid)return;
const instances=game.actors.contents.flatMap(a=>a.items.contents.flatMap(i=>
 i.getFlag(NS,'cavLateVaultRewardProvenanceV1')?.sourceUuid===SOURCE||
 i.getFlag(NS,ITEM_LEDGER)?.sourceUuid===SOURCE?[{actorId:a.id,itemId:i.id}]:[]));
if(instances.length!==1||instances[0].actorId!==actor.id||instances[0].itemId!==held.id||
 held.getFlag(NS,ITEM_LEDGER))return;
if(ORIGINAL==='charged-source'){
 const ch=held.getFlag(NS,'cavLateVaultChargeProofV1');
 if(ch?.status!=='charged'||ch.sourceUuid!==SOURCE||
    ch.actorId!==actor.id||ch.embeddedItemId!==held.id||
    !ch.chargedInOriginalAqueduct||
    typeof ch.chargerRegionUuid!=='string'||
    !ch.chargerRegionUuid.startsWith('Scene.CAVAQ01Scene0001.Region.'))return;
 const cr=game.scenes.get('CAVAQ01Scene0001')?.regions.get(ch.chargerRegionUuid.split('.').at(-1));
 const charge=cr?.getFlag(NS,'cavLateVaultChargeReceiptV1');
 const veil=cr?.getFlag(NS,'cavLateVaultCanonicalVeilV1');
 if(cr?.uuid!==ch.chargerRegionUuid||
    charge?.status!=='done'||charge.sourceUuid!==SOURCE||
    charge.actorId!==actor.id||charge.embeddedItemId!==held.id||
    veil?.status!=='active'||veil.sourceUuid!==SOURCE)return;
}
const lock='__CAV_T26_SOCKET_'+REGION;
if(globalThis[lock])return;
globalThis[lock]=true;
try{
const ok=await foundry.applications.api.DialogV2.confirm({
 window:{title:'Install authentic Vault component — GM verification'},
 content:'<p>The acting character must have explicitly chosen to install their earned original '+ITEM_NAME+
 '. Confirm their source and progression ledger evidence before approving. This action reserves the socket, records the SAME embedded Item as installed without making another copy, and never opens the Vault. Do not approve by presence alone.</p>',
 yes:{label:'Approve the player-requested insertion'},no:{label:'Cancel',callback:()=>false},rejectClose:false
});
if(!ok)return;
if(region.getFlag(NS,SOCKET_LEDGER)||actor.items.get(held.id)!==held||
 actor.items.get(held.id)?.getFlag(NS,ITEM_LEDGER))return;
const latest=srcRegion.getFlag(NS,CLAIM);
if(JSON.stringify(latest)!==JSON.stringify(issue))return;
await region.setFlag(NS,SOCKET_LEDGER,{
 version:1,status:'reserved',sourceUuid:SOURCE,socketKind:ORIGINAL,
 actorId:actor.id,tokenId:token.id,embeddedItemId:held.id,
 rewardOriginRegionUuid:srcRegion.uuid,ownerGMId:game.user.id
});
const reserved=region.getFlag(NS,SOCKET_LEDGER);
if(reserved?.status!=='reserved'||reserved.actorId!==actor.id||
 reserved.embeddedItemId!==held.id||reserved.sourceUuid!==SOURCE)
 throw Error('Original socket reservation uncertain; stop and reconcile');
await held.setFlag(NS,ITEM_LEDGER,{
 version:1,status:'installed',sourceUuid:SOURCE,socketKind:ORIGINAL,
 socketRegionUuid:region.uuid,originalActorId:actor.id,originalEmbeddedItemId:held.id,
 nativeGMAuthorized:true
});
const itemPost=actor.items.get(held.id)?.getFlag(NS,ITEM_LEDGER);
if(itemPost?.status!=='installed'||itemPost.sourceUuid!==SOURCE||
 itemPost.socketRegionUuid!==region.uuid)throw Error('Item binding uncertain; preserve reserved socket');
await region.setFlag(NS,SOCKET_LEDGER,{
 version:1,status:'done',sourceUuid:SOURCE,socketKind:ORIGINAL,
 actorId:actor.id,tokenId:token.id,embeddedItemId:held.id,
 rewardOriginRegionUuid:srcRegion.uuid,ownerGMId:game.user.id,
 originalItemHeldInCustody:true
});
const complete=region.getFlag(NS,SOCKET_LEDGER);
if(complete?.status!=='done'||complete.embeddedItemId!==held.id||
 complete.sourceUuid!==SOURCE)throw Error('Socket commit uncertain; reconcile without replay');
try{await ChatMessage.create({
 speaker:{alias:'Vault Mechanism'},whisper:[owner.id],
 content:'<p>The original '+ITEM_NAME+' settles into the mechanism. No additional Item was created, and the Vault remains sealed until all three slots are installed and the joined emblem is turned.</p>'});
}catch(e){console.warn('[CAV T26] Item installed, player notice failed',e);}
}catch(e){console.error('[CAV T26] Socket partial transaction; preserve ledger',e)}
finally{globalThis[lock]=false}
`;
export function nativeSocketTransactionSource(kind){
 const c=SOCKETS[kind];
 if(!c)throw Error('Unsupported original Vault socket');
 return native.replaceAll('__KIND__',kind).replaceAll('__SOURCE__',c.worldItem)
 .replaceAll('__NAME__',c.name).replaceAll('__ORIGIN__',c.sourceSceneId)
 .replaceAll('__REGION__',c.regionId).trim();
}
export function nativeSocketTransactionUpdate(kind){
 const c=SOCKETS[kind];if(!c)throw Error('Unknown source');
 return{_id:c.behaviorId,name:'Vault '+kind+' — GM-guarded exact-once source installer (DISABLED pending provider)',
  disabled:true,
  'system.events':['tokenMoveIn','tokenMoveWithin'],
  'system.source':nativeSocketTransactionSource(kind)};
}