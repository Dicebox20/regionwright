// Shared read-only player/GM proximity rule for the original Study 587 note and
// Donovan lockbox. Invalid native geometry cannot silently pass via NaN > 400.
export function isCav587CharacterNearRegion({token,scene,region}={}){
 const shape=region?.shapes?.[0]?.toObject?.(),grid=scene?.grid?.size;
 if(shape?.type!=="rectangle"||
    ![shape.x,shape.y,shape.width,shape.height].every(Number.isFinite)||
    shape.width<=0||shape.height<=0||!Number.isFinite(grid)||grid<=0||!token||
    ![token.x,token.y,token.width,token.height].every(Number.isFinite)||
    token.width<=0||token.height<=0)return false;
 const x=token.x+token.width*grid/2,y=token.y+token.height*grid/2;
 return Math.hypot(x-(shape.x+shape.width/2),y-(shape.y+shape.height/2))<=400;
}

// Owner-approved CAV Study/587 GM Macro preserved as audited source and registered at Studio ready.
// Do not open the original Macro and this service simultaneously; both use the exact same listener marker.
export function installCabin587GMService(){
 if (typeof game==="undefined" || !game?.ready || game.world?.id!=="cabin-in-the-ashen-veil") return false;
// Allen Study 587 note and Donovan Shack original Sluice Crank: GM session-only authenticated ChatMessage handler.
// Requires actual Study Brass Key door unlock and genuine player click via one owned nearby character.
if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Not the elected Cabin GM');
const NS='dicebox-campaign-helper',HOOK='__CAV_587_ELECTED_GM_SERVICE_v001',BUSY='__CAV_587_REWARD_BUSY_v001';
const STUDY='CAVHG05Scene0001',DESK='CAVB3E32BD6B01BD';
const SHACK='CAVEXT03Scene001',BOX='CAVEXT03BOXREG01';
const DOOR='CAV06R0000000003',PORTAL='CAVHG06STUDYT001',SOURCE='Item.g3VYdgc1qkgkHGvn';
if(globalThis[HOOK]?.id){console.log('[CAV 587] GM service already active, refusing duplicate');return;}
const lock=globalThis[BUSY]??(globalThis[BUSY]=new Set());
const handler=async(message,opts,senderId)=>{
 try{
  if(game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
  const request=message.getFlag(NS,'cav587Request');
  if(!request||request.version!==1||!['study-note-read','donovan-lockbox-try'].includes(request.action))return;
  const user=message.user,player=game.users.get(senderId);
  if(!user||user.id!==senderId||!player||!player.active||player.isGM)return;
  const isNote=request.action==='study-note-read',sceneId=isNote?STUDY:SHACK,regionId=isNote?DESK:BOX;
  if(request.sceneId!==sceneId||request.regionId!==regionId)return;
  const scene=game.scenes.get(sceneId),r=scene?.regions.get(regionId);
  if(!r||r.ownership.default<2)return;
  const token=scene.tokens.get(request.tokenId),actor=token?.actor;
  if(!token||token.hidden||!actor||actor.type!=='character'||!actor.testUserPermission(player,'OWNER'))return;
   if(!isCav587CharacterNearRegion({token,scene,region:r}))return;
  const studyDoor=game.scenes.get('CAVHG06GreatRoom')?.regions.get(DOOR);
  if(studyDoor?.getFlag(NS,'cavStudyDoorUnlocked')?.status!=='done'||studyDoor.behaviors.get(PORTAL)?.disabled!==false)return;
  const note=game.scenes.get(STUDY)?.regions.get(DESK);
  if(isNote){
   if(note?.getFlag(NS,'cavStudy587Learned')?.status==='done')return;
   if(lock.has('note'))return;lock.add('note');
   try{
    if(note.getFlag(NS,'cavStudy587Learned'))return;
    await note.setFlag(NS,'cavStudy587Learned',{status:'done',actorId:actor.id,tokenId:token.id,learnedFrom:'father-study-587-note',studyDoorRegion:studyDoor.uuid});
    try{await ChatMessage.create({speaker:{alias:'Allen\u2019s Desk'},content:'<p>The note records three digits: <strong>5 \u2014 8 \u2014 7</strong>.</p>',whisper:[player.id]});}catch(err){console.warn('[CAV 587] note learned, whisper failed',err);}
   }finally{lock.delete('note');}
   return;
  }
  if(note?.getFlag(NS,'cavStudy587Learned')?.status!=='done')return;
  const digits=request.digits;
  if(!Array.isArray(digits)||digits.length!==3||digits.some(d=>!Number.isInteger(d)||d<0||d>9))return;
  if(digits[0]!==5||digits[1]!==8||digits[2]!==7){
   try{await ChatMessage.create({speaker:{alias:'Donovan\u2019s Lockbox'},content:'<p>The tumblers resist. The lock does not open.</p>',whisper:[player.id]});}catch(err){console.warn('[CAV 587] wrong code whisper failed',err);}
   return;
  }
  const claim=r.getFlag(NS,'cavDonovan587LockboxClaim');
  if(claim?.status==='done'||claim?.status==='reserved'||lock.has('box'))return;
  const source=game.items.get('g3VYdgc1qkgkHGvn');
  if(!source||source.uuid!==SOURCE||source.name!=='Sluice Crank'||source.type!=='loot')return;
  if(game.actors.some(a=>a.items.some(i=>i.getFlag?.(NS,'cavDonovanCrankSourceUuid')===SOURCE&&i.getFlag?.(NS,'cavDonovanCrankRegionUuid')===r.uuid)))return;
  lock.add('box');
  try{
   await r.setFlag(NS,'cavDonovan587LockboxClaim',{status:'reserved',actorId:actor.id,tokenId:token.id,sourceUuid:SOURCE,noteRegion:note.uuid,code:'587'});
   const item=source.toObject();delete item._id;
   item.flags={...item.flags,[NS]:{...item.flags?.[NS],cavDonovanCrankSourceUuid:SOURCE,cavDonovanCrankRegionUuid:r.uuid,cavDonovanCrankStudyNoteUuid:note.uuid}};
   const created=await actor.createEmbeddedDocuments('Item',[item]);
   if(created.length!==1)throw Error('Crank create outcome ambiguous, reserved claim retained');
   await r.setFlag(NS,'cavDonovan587LockboxClaim',{status:'done',actorId:actor.id,tokenId:token.id,sourceUuid:SOURCE,embeddedItemId:created[0].id,code:'587'});
   try{await ChatMessage.create({speaker:{alias:'Donovan\u2019s Lockbox'},content:'<p>The last tumbler catches. Inside is a heavy iron crank made for waterworks.</p>',whisper:[player.id]});}catch(err){console.warn('[CAV 587] crank awarded but whisper failed',err);}
  }catch(err){console.error('[CAV 587] uncertain Crank award; reserved claim retained',err);}
  finally{lock.delete('box');}
 }catch(err){console.error('[CAV 587] GM service source error',err);}
};
const id=Hooks.on('createChatMessage',handler);
globalThis[HOOK]={id,gmId:game.user.id,worldId:game.world.id,armedAt:new Date().toISOString()};
console.log('[CAV 587] GM source listener armed',id);
 return true;
}
