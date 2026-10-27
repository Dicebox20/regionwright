// T24: original H-B02 Vault Keystone plinth — one disabled, non-rewarding
// RegionBehavior in an EXISTING source Region. No Item duplicate or Vault opening.
// Later claimant must present real four-gate puzzle ledgers and explicit pickup.
export const VAULT='tjTpG2RVZNoCqRLh';
export const PLINTH='CAVB799A5357A114';
export const BEHAVIOR='CAVVKEYPLINTH001';
export const KEYSTONE_SOURCE='Item.CAVKEYSTONEITEM1';
export const GM_LIBRARY='GM_LIBRARY_ONLY';
const code=String.raw`
const NS='dicebox-campaign-helper';
if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
scene?.id!=='tjTpG2RVZNoCqRLh'||region?.id!=='CAVB799A5357A114')return;
const evt=event?.name,KEY='__CAV_VAULT_KEYSTONE_PLINTH_'+region.id;
if(['behaviorUnviewed','behaviorDeactivated'].includes(evt)){
 const a=globalThis[KEY];if(a?.handler&&canvas?.stage)canvas.stage.off('pointertap',a.handler);
 delete globalThis[KEY];return;
}
if(evt!=='behaviorViewed'||game.user?.isGM)return;
if(globalThis[KEY]?.handler&&canvas?.stage)canvas.stage.off('pointertap',globalThis[KEY].handler);
const handler=async e=>{
 if(!canvas?.ready||canvas.scene?.id!=='tjTpG2RVZNoCqRLh')return;
 const xy=canvas.stage.toLocal(e.global);
 if(!region.testPoint({x:xy.x,y:xy.y,elevation:0}))return;
 await foundry.applications.api.DialogV2.prompt({
 window:{title:'The Keystone Plinth'},
 content:'<p>On the stone dais lies a pale Keystone, carved with a rose nested inside precise gear teeth. The Vault\'s three original components and its separate turning mechanism must be completed before this item can be claimed. It has not been awarded.</p>',
 ok:{label:'Close',callback:()=>true},rejectClose:false});
};
if(canvas?.stage){canvas.stage.on('pointertap',handler);globalThis[KEY]={handler};}
`;
export function disabledPlinthBehavior(){
 return{
  _id:BEHAVIOR,name:'H-B02 original Keystone plinth — DORMANT until genuine Vault open',
  type:'executeScript',disabled:true,
  system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated'],
    source:code.trim()},
  flags:{'dicebox-campaign-helper':{
   cavKeystonePlinthStage:{
    version:1,status:'dormant-vault-still-locked',
    originalKeystoneSourceUuid:KEYSTONE_SOURCE,
    originalVaultSceneId:VAULT,
    originalPlinthRegionId:PLINTH,
    originalClaimLedger:'cavLateKeystoneGrant',
    nativeActorRewardEnabled:false,
    nativeGameplayTested:false,
    doesNotOpenDoor:true
   }
  }}
 };
}
export function plinthStageIsSafe(b=disabledPlinthBehavior()){
 const x=b?.flags?.['dicebox-campaign-helper']?.cavKeystonePlinthStage;
 return BEHAVIOR.length===16&&b?._id===BEHAVIOR&&b?.disabled===true&&
 b?.type==='executeScript'&&
 x?.status==='dormant-vault-still-locked'&&
 x?.originalKeystoneSourceUuid===KEYSTONE_SOURCE&&
 x?.nativeActorRewardEnabled===false&&
 b?.system?.source.includes('The Keystone Plinth')&&
 !b?.system?.source.includes('createEmbeddedDocuments')&&
 !b?.system?.source.includes('setFlag(')&&
 !b?.system?.source.includes('teleportToken');
}