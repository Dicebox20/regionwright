// CAV Chat B T27. Authenticated original Sophia H-U05 bookcase source for Gond
// Emblem Half, downstream original Vault socket T26.
// Staged DISABLED until Regionwright six-book / real Crimson Veil producer
// emits a GM-verified current native completion, never a self-attested flag.
// No overlapping Region or fabricated H-U06 room. Existing bookcase zoom kept.
export const SCENE='CAVHU05Scene0001';
export const BOOKCASE='CAVB994894A7432F';
export const ORIGINAL_INSPECT='LRYrBIQNN92SCJai';
export const GOND_BEHAVIOR='CAVGONDREWARD001';
export const GOND_SOURCE='Item.o9G3UJjEe2QX1ZH0';
export const ORIGINAL_BOOKS=Object.freeze([
 'Item.Qplmy8JR7plDYLiY','Item.DLGIhHc0RDqh0YVt',
 'Item.TO69wBYN8sRJuxtH','Item.c3oKW8YkklE8slnX',
 'Item.HV7XjKmgqVITSEvW','Item.gmTsIOqc3qFBc3zA'
]);
export const TILE_ID='CAVHU05GONDTILE1';
export const TILE=Object.freeze({
 _id:TILE_ID,
 x:1000,y:177,width:66,height:66,rotation:0,
 hidden:true,locked:true,sort:50,
 texture:{src:'icons/equipment/neck/pendant-bronze-gem-blue.webp'},
 flags:{'dicebox-campaign-helper':{
  cavSophiaGondCompartmentVisual:{
   version:1,status:'hidden-original-bookcase',sceneId:SCENE,bookcaseRegionId:BOOKCASE,
   rewardUuid:GOND_SOURCE,requiresSpineOrder:true,
   requiresSixthVeilBook:true,actorRewardIssued:false,nonGmTested:false
  }
 }}
});
const SCRIPT=String.raw`
const NS='dicebox-campaign-helper',WORLD='cabin-in-the-ashen-veil';
const SCENE='CAVHU05Scene0001',RID='CAVB994894A7432F';
const SOURCE='Item.o9G3UJjEe2QX1ZH0',TILE='CAVHU05GONDTILE1';
const ORDER=['Item.Qplmy8JR7plDYLiY','Item.DLGIhHc0RDqh0YVt',
'Item.TO69wBYN8sRJuxtH','Item.c3oKW8YkklE8slnX',
'Item.HV7XjKmgqVITSEvW','Item.gmTsIOqc3qFBc3zA'];
const ITEM_PROVENANCE='cavLateVaultRewardProvenanceV1';
const ORIGIN_CLAIM='cavLateVaultRewardClaimV1';
if(!game?.ready||game.version!=='14.367'||game.world?.id!==WORLD||
 !game.user?.isGM||game.users?.activeGM?.id!==game.user.id||
 scene?.id!==SCENE||region?.id!==RID||
 !['tokenMoveIn','tokenMoveWithin'].includes(event?.name))return;
// Original close-up remains independent. Never infer story completion from Item label.
const zoom=region.behaviors.get('LRYrBIQNN92SCJai');
if(!zoom||zoom.type!=='executeScript'||zoom.disabled!==false)return;
const original=game.items.get(SOURCE.slice(5));
if(!original||original.uuid!==SOURCE||original.name!=='Gond Emblem Half'||
 original.type!=='loot'||original.getFlag(NS,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')return;
const worldBooks=ORDER.map(uuid=>game.items.get(uuid.slice(5)));
if(worldBooks.some((i,index)=>!i||i.uuid!==ORDER[index]||
 i.type!=='loot'||i.getFlag(NS,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'))return;
const bookSolve=region.getFlag(NS,'cavSpineMosaicNativeV1');
const compartment=region.getFlag(NS,'cavSpineCompartmentNativeV1');
const veil=region.getFlag(NS,'cavSophiaSixthBookCanonicalVeilV1');
// These GM-native source ledgers do not exist at staging time; install disabled.
if(bookSolve?.status!=='solved'||bookSolve.version!==1||
 bookSolve.regionUuid!==region.uuid||bookSolve.sourceOfTruth!=='original-regionwright-spine-mosaic'||
 bookSolve.electedGMVerified!==true||bookSolve.nativeOriginalBooksVerified!==true||
 bookSolve.sixthBookActualVeilPickupVerified!==true||
 !Array.isArray(bookSolve.originalOrder)||bookSolve.originalOrder.length!==6||
 bookSolve.originalOrder.some((uuid,index)=>uuid!==ORDER[index])||
 compartment?.status!=='revealed'||compartment.version!==1||
 compartment.inRoomBookcaseUuid!==region.uuid||
 compartment.revealedByOriginalSpineLedger!==true||
 veil?.status!=='active'||veil.canonicalCurrentVeilVerified!==true||
 veil.originalSixthItemUuid!==ORDER[5]||veil.originalSixthBookClaimStatus!=='done')return;
const tile=scene.tiles.get(TILE);
if(!tile||tile.getFlag(NS,'cavSophiaGondCompartmentVisual')?.rewardUuid!==SOURCE||
 tile.getFlag(NS,'cavSophiaGondCompartmentVisual')?.bookcaseRegionId!==RID)return;
if(tile.hidden!==false||compartment.originalGondTileId!==TILE)return;
if(region.getFlag(NS,ORIGIN_CLAIM))return; // reserved/done/partial fail closed
const raw=event.data?.token?.document??event.data?.token;
const token=scene.tokens.get(raw?.id??event.data?.tokenId);
if(!token||token.hidden||token.actor?.type!=='character')return;
const actor=token.actor;
const ownerUsers=game.users.contents.filter(u=>u.active&&!u.isGM&&actor.testUserPermission(u,'OWNER'));
const sender=event.userId??event.data?.userId??null;
const owner=sender?ownerUsers.find(u=>u.id===sender):ownerUsers.length===1?ownerUsers[0]:null;
if(!owner)return;
const mid={x:token.x+token.width*scene.grid.size/2,y:token.y+token.height*scene.grid.size/2,elevation:0};
if(!region.testPoint(mid))return;
if(bookSolve.actorId!==actor.id||bookSolve.tokenId!==token.id||
 compartment.actorId!==actor.id||veil.sourceActorId!==actor.id)return;
if(game.actors.contents.some(a=>a.items.some(i=>
 i.name==='Gond Emblem Half'||i.getFlag(NS,ITEM_PROVENANCE)?.sourceUuid===SOURCE)))return;
const busy='__CAV_HU05_GOND_ONCE_'+region.id;if(globalThis[busy])return;
globalThis[busy]=true;
try{
 const approved=await foundry.applications.api.DialogV2.confirm({
 window:{title:'Sophia’s Bookcase — Hidden Gond Half'},
 content:'<p>The original six storybooks are in the verified 1442–1447 order, the Veil-only sixth book has genuinely appeared and been recovered, and the in-room hidden compartment is open. Approve only if this character has deliberately taken the revealed Gond Emblem Half. This will award exactly one original source copy.</p>',
 yes:{label:'Approve explicit Gond pickup'},no:{label:'Cancel',callback:()=>false},
 rejectClose:false});
 if(!approved)return;
 const current=region.getFlag(NS,'cavSpineMosaicNativeV1');
 const currentComp=region.getFlag(NS,'cavSpineCompartmentNativeV1');
 if(region.getFlag(NS,ORIGIN_CLAIM)||
 JSON.stringify(current)!==JSON.stringify(bookSolve)||
 JSON.stringify(currentComp)!==JSON.stringify(compartment)||
 game.actors.contents.some(a=>a.items.some(i=>i.name==='Gond Emblem Half')))return;
 await region.setFlag(NS,ORIGIN_CLAIM,{
  status:'reserved',version:1,actorId:actor.id,tokenId:token.id,
  sourceUuid:SOURCE,regionUuid:region.uuid,
  origin:'original-HU05-bookcase-revealed-by-authentic-six-books',
  nativeSpineLedgerStatus:'solved'});
 const reserved=region.getFlag(NS,ORIGIN_CLAIM);
 if(reserved?.status!=='reserved'||reserved.actorId!==actor.id||
 reserved.sourceUuid!==SOURCE)throw Error('Uncertain original Gond source reservation; never auto retry');
 const d=original.toObject();delete d._id;
 d.flags={...d.flags,[NS]:{...d.flags?.[NS],
  [ITEM_PROVENANCE]:{
   version:1,sourceUuid:SOURCE,sourceSceneId:SCENE,
   sourceActorId:actor.id,sourceRegionUuid:region.uuid,
   sourceEmbeddedItemId:null,originalSourceReceiptStatus:'reserved',
   nativeOriginalAcquisitionVerified:true
  }}};
 const docs=await actor.createEmbeddedDocuments('Item',[d]);
 const embedded=docs?.length===1?actor.items.get(docs[0].id):null;
 if(!embedded||embedded.name!=='Gond Emblem Half'||
 embedded.getFlag(NS,ITEM_PROVENANCE)?.sourceUuid!==SOURCE)
  throw Error('Gond clone uncertain; source reserved, reconcile');
 await embedded.setFlag(NS,ITEM_PROVENANCE,{
  version:1,sourceUuid:SOURCE,sourceSceneId:SCENE,
  sourceActorId:actor.id,sourceRegionUuid:region.uuid,
  sourceEmbeddedItemId:embedded.id,originalSourceReceiptStatus:'done',
  nativeOriginalAcquisitionVerified:true});
 if(embedded.getFlag(NS,ITEM_PROVENANCE)?.sourceEmbeddedItemId!==embedded.id)
  throw Error('Gond embedded provenance uncertain; reconcile');
 await region.setFlag(NS,ORIGIN_CLAIM,{
  status:'done',version:1,actorId:actor.id,tokenId:token.id,
  embeddedItemId:embedded.id,sourceUuid:SOURCE,regionUuid:region.uuid,
  origin:'original-HU05-bookcase-revealed-by-authentic-six-books',
  nativeSpineLedgerStatus:'solved'});
 const done=region.getFlag(NS,ORIGIN_CLAIM);
 if(done?.status!=='done'||done.embeddedItemId!==embedded.id)
  throw Error('Gond finalization uncertain; stop and reconcile');
 try{await ChatMessage.create({speaker:{alias:'Sophia’s Bookcase'},
 whisper:[owner.id],content:'<p>You recover the original Gond Emblem Half from the opened hidden compartment. The rose-and-gear mechanism awaits its other pieces.</p>'});}
 catch(e){console.warn('[CAV T27] Gond delivered; private notice failed',e)}
}catch(e){console.error('[CAV T27] Partial Gond source award; reconcile before any retry',e)}
finally{globalThis[busy]=false}
`;
export function gondClaimSource(){return SCRIPT.trim();}
export function disabledGondClaim(){
 return{_id:GOND_BEHAVIOR,name:'Sophia in-room original Gond Half — DISABLED until authentic spine Veil',
 type:'executeScript',disabled:true,
 system:{events:['tokenMoveIn','tokenMoveWithin'],source:gondClaimSource()},
 flags:{'dicebox-campaign-helper':{cavSophiaOriginalGondSource:{
  version:1,status:'dormant-await-authentic-six-book-veil',
  rewardOriginalUuid:GOND_SOURCE,regionId:BOOKCASE,
  originalZoomPreserved:true,noSecondRoom:true,
  requiresNativeSpineProducer:true,nativePlayerTested:false}}}
 };
}