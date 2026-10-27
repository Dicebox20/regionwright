// Chat B T23 — puzzle-only physical native stage. Original Vault Keystone is NOT yet
// verified as an original world Item. Keep door, lever and both portal behaviors
// DISABLED until elected GM authentic source verification. Crooked Man deferred.
export const OUTER={sceneId:'CN5fkK2QLUELBGGR',name:'UND-01 - Undercroft Approach Keystone Door',
 art:'Maps/cabin-in-the-ashen-veil/und-01-undercroft-approach-keystone-door-approved-v002.png'};
export const REFUGE={sceneId:'ywpIpQDrkMLIgUP0',name:'UND-02 - Donovan Sophia Sealed Refuge',
 art:'Maps/cabin-in-the-ashen-veil/und-02-donovan-sophia-sealed-refuge-approved-v002.png'};
export const ORIGINAL_WALL='CAVB67AABD1B35C6';
export const ORIGINAL_STAIR='CAVBB3383706E610';
export const ORIGINAL_REFUGE_ENTRY='CAVB74BDED08299D';
export const ORIGINAL_REFUGE_OBSERVATION='CAVB49066EB37281';
export const STAGES=Object.freeze([
 {kind:'keystone-recess',sceneId:OUTER.sceneId,id:ORIGINAL_WALL,original:true,
  behaviorId:'CAVUNDKEYBEH0001',rect:{x:660,y:130,width:220,height:175}},
 {kind:'separate-stone-lever',sceneId:OUTER.sceneId,id:'CAVUNDLEVER00001',
  behaviorId:'CAVUNDLEVBEH0001',rect:{x:976,y:210,width:145,height:146}},
 {kind:'inner-stone-door-threshold',sceneId:OUTER.sceneId,id:'CAVUNDCROSS00001',
  behaviorId:'CAVUNDOUTTEL0001',rect:{x:645,y:342,width:248,height:132},
  destination:'Scene.ywpIpQDrkMLIgUP0.Region.CAVB74BDED08299D'},
 {kind:'return-landing-und01',sceneId:OUTER.sceneId,id:'CAVUNDRETURN0001',
  rect:{x:468,y:482,width:148,height:125}},
 {kind:'refuge-inner-return-threshold',sceneId:REFUGE.sceneId,id:'CAVREFRETURN0001',
  behaviorId:'CAVREFBACKTEL001',rect:{x:427,y:359,width:142,height:175},
  destination:'Scene.CN5fkK2QLUELBGGR.Region.CAVUNDRETURN0001'}
]);
export const OWNER_LOCK=Object.freeze({
 source:'LOCK-13',originalKeystoneItemUuid:null,originalKeystoneVerified:false,
 keyAction:'Insert genuine Keystone into chest-high carved recess',
 leverAction:'Separately press the stone lever after authentic Keystone insertion',
 doorAction:'Cross north physical door only after the lever permanently opens it',
 returnAction:'Paired separate Refuge return, never an automatic teleport on arrival',
 priorOuter:'Sune Bowl plus filled original 027 pellet opens OUTER approach only'
});
export const rectOverlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function planValid(){
 for(const s of STAGES){
  if(s.id.length!==16||s.behaviorId&&s.behaviorId.length!==16||
  s.rect.x<0||s.rect.y<0||s.rect.x+s.rect.width>1536||
  s.rect.y+s.rect.height>1024)return false;
  for(const other of STAGES)if(s!==other&&s.sceneId===other.sceneId&&rectOverlap(s.rect,other.rect))return false;
 }
 return STAGES.filter(s=>s.behaviorId).length===4&&
 STAGES.filter(s=>!s.behaviorId).length===1&&OWNER_LOCK.originalKeystoneItemUuid===null;
}
export function behavior(stage){
 if(!stage.behaviorId)throw Error('Passive');
 if(stage.destination){
  return{_id:stage.behaviorId,name:'SEALED original Keystone Refuge passage',
   type:'teleportToken',disabled:true,
   system:{events:['tokenExit'],destinations:[stage.destination],placement:'center',
   snap:false,choice:true,revealed:false,dialog:{revealed:'Use the open stone passage?',
   unrevealed:'Use the open stone passage?'},transition:{type:null,duration:1500}}};
 }
 // Stage source intentionally inert even if accidentally enabled. Owner workflow
 // must replace with authenticated elected-GM original Item/lever transaction.
 const source=String.raw`const NS='dicebox-campaign-helper';
if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
!game.user?.isGM||game.users.activeGM?.id!==game.user.id)return;
const state=region.getFlag(NS,'cavInnerUndercroftGate');
if(state?.status==='done')return;
// Physical fixture only; do not create Item, reserve progression or open portals.
return;`;
 return{_id:stage.behaviorId,name:'UND-01 original Keystone / lever — DORMANT pending source',
  type:'executeScript',disabled:true,
  system:{events:['tokenMoveIn','tokenMoveWithin'],source}};
}