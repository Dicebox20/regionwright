// Chat B T22 original chest -> original Ornate Music Box -> original Protection prayer.
// No original Music Box source or Prayer Item clone except a single GM-verified
// character-embedded original Item copy after original source receipts.
// This is a NATIVE elected-GM assisted action, not a client-authenticated click.
// Requires external deliberate player request AND separate GM confirmation.
export const PARENTS='CAVHU04Scene0001';
export const HOPE_REGION='CAVHU04HOPECHST1';
export const BEHAVIOR_ID='CAVPRAYERBOXBEH1';
export const ORIGINAL_SILVER='Item.IY8fuUG5P0yWIZIh';
export const ORIGINAL_BOX='Item.YaKs6z2AWlEAlyzx';
export const ORIGINAL_PRAYER='Item.5jwy75XyFezukf3b';
export const ORIGINAL_JOURNAL='JournalEntry.CAVPRAYERPROTECT';
export const CLAIM_LEDGER='cavLatePrayerProtectionClaim';
const script=String.raw`
const NS='dicebox-campaign-helper',SOURCE='Item.5jwy75XyFezukf3b';
if(!game?.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 scene?.id!=='CAVHU04Scene0001'||region?.id!=='CAVHU04HOPECHST1')return;
const oldStatus=name=>region.getFlag(NS,name)?.status??'none';
const evt=event?.name,KEY='__CAV_T22_ORIGINAL_BOX_PRAYER_'+region.id;
if(['behaviorUnviewed','behaviorDeactivated'].includes(evt)){
 const old=globalThis[KEY];if(old?.handler&&canvas?.stage)canvas.stage.off('pointertap',old.handler);
 delete globalThis[KEY];return;
}
if(evt==='behaviorViewed'&&!game.user?.isGM){
 if(globalThis[KEY]?.handler&&canvas?.stage)canvas.stage.off('pointertap',globalThis[KEY].handler);
 const handler=async e=>{
  if(!canvas?.ready||canvas.scene?.id!=='CAVHU04Scene0001'||game.user.isGM)return;
  const pt=canvas.stage.toLocal(e.global);
  if(!region.testPoint({x:pt.x,y:pt.y,elevation:0}))return;
  const body=oldStatus('cavLatePrayerProtectionClaim')==='done'?
   'The opened music box is silent now. The Prayer of Protection has been recovered.':
   oldStatus('cavLateMusicBoxClaim')==='done'?
   'The original Ornate Music Box can be opened deliberately by the character who recovered it; ask the GM to confirm that action.':
   'The old chest is not yet ready to reveal the Ornate Music Box.';
  await foundry.applications.api.DialogV2.prompt({window:{title:'The Ornate Music Box'},
   content:'<p>'+body+'</p>',ok:{label:'Close',callback:()=>true},rejectClose:false});
 };
 if(canvas?.stage){canvas.stage.on('pointertap',handler);globalThis[KEY]={handler};}
 return;
}
if(!['tokenMoveIn','tokenMoveWithin'].includes(evt))return;
if(!game.user?.isGM||game.users?.activeGM?.id!==game.user.id)return;
const tokenRaw=event.data?.token?.document??event.data?.token;
const token=scene.tokens.get(tokenRaw?.id??event.data?.tokenId);
if(!token||token.hidden||!token.actorId||token.actor?.type!=='character')return;
const actor=token.actor;
const owners=game.users.contents.filter(u=>u.active&&!u.isGM&&actor.testUserPermission(u,'OWNER'));
const sender=event.userId??event.data?.userId??null;
const player=sender?owners.find(u=>u.id===sender):owners.length===1?owners[0]:null;
if(!player)return;
const center={x:token.x+token.width*scene.grid.size/2,
 y:token.y+token.height*scene.grid.size/2,elevation:0};
if(!region.testPoint(center))return;
const BUSY=KEY+'_GM_BUSY';if(globalThis[BUSY])return;
globalThis[BUSY]=true;
try{
 const state=region.getFlag(NS,'cavLatePrayerProtectionClaim');
 if(state||oldStatus('cavLateHopeChestUnlock')!=='done'||
  oldStatus('cavLateMusicBoxClaim')!=='done')return;
 const chest=region.getFlag(NS,'cavLateHopeChestUnlock');
 const boxClaim=region.getFlag(NS,'cavLateMusicBoxClaim');
 const silver='Item.IY8fuUG5P0yWIZIh',boxSource='Item.YaKs6z2AWlEAlyzx';
 if(chest?.actorId!==actor.id||chest?.keySource!==silver||
  boxClaim?.actorId!==actor.id||boxClaim?.sourceUuid!==boxSource||
  typeof boxClaim.embeddedItemId!=='string')return;
 const silverItem=actor.items.find(i=>i.name==='Silver Tiny Key'&&i.type==='loot'&&
  i.getFlag(NS,'cavLateSilverKeySourceUuid')===silver&&
  i.getFlag(NS,'cavLateSilverKeyDropSceneId')==='CAVSG01Scene0001');
 const dropId=silverItem?.getFlag(NS,'cavLateSilverKeyDropRegionUuid');
 const silverDrop=game.scenes.get('CAVSG01Scene0001')?.regions.get(dropId);
 const silverClaim=silverDrop?.getFlag(NS,'cavLateSecondChaseSilverKeyClaim');
 if(!silverItem||silverClaim?.status!=='done'||silverClaim.actorId!==actor.id||
  silverClaim.sourceUuid!==silver||silverClaim.embeddedItemId!==silverItem.id)return;
 const box=actor.items.get(boxClaim.embeddedItemId);
 if(!box||box.name!=='Ornate Music Box'||box.type!=='loot'||
  box.getFlag(NS,'cavLateMusicBoxSourceUuid')!==boxSource||
  box.getFlag(NS,'cavLateBatch1SourceRegionUuid')!==region.uuid||
  box.getFlag(NS,'cavLateBatch1PickupOrigin')!=='original-hope-chest')return;
 const original=game.items.get('5jwy75XyFezukf3b');
 const journal=game.journal.get('CAVPRAYERPROTECT');
 const page=journal?.pages.contents[0];
 if(!original||original.uuid!==SOURCE||original.name!=='Prayer of Protection'||
  original.type!=='loot'||original.getFlag(NS,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'||
  original.getFlag(NS,'cavFullPrayerJournalUuid')!=='JournalEntry.CAVPRAYERPROTECT'||
  journal?.uuid!=='JournalEntry.CAVPRAYERPROTECT'||journal.pages.size!==1||
  !page?.text?.content?.includes('Lady of the Rose, let beauty be a shelter')||
  journal.getFlag(NS,'cavFullPrayerOriginalSourceUuid')!==SOURCE)return;
 if(game.actors.contents.some(a=>a.items.some(i=>i.name==='Prayer of Protection'||
  i.getFlag(NS,'cavLatePrayerProtectionSourceUuid')===SOURCE)))return;
 const ok=await foundry.applications.api.DialogV2.confirm({
  window:{title:'Open Original Ornate Music Box — GM review'},
  content:'<p>Has the character owner explicitly requested to open their original Ornate Music Box now? Confirm original Silver Key, Hope Chest and Music Box custody, then award the single Prayer of Protection. Approve ONLY after the player deliberately chose this action.</p>',
  yes:{label:'Approve deliberate box opening'},no:{label:'Cancel',callback:()=>false},
  rejectClose:false});
 if(!ok)return;
 // Recheck independent state after the asynchronous GM confirmation.
 if(region.getFlag(NS,'cavLatePrayerProtectionClaim')||
  actor.items.get(box.id)!==box||
  game.actors.contents.some(a=>a.items.some(i=>i.name==='Prayer of Protection')))return;
 await region.setFlag(NS,'cavLatePrayerProtectionClaim',{
  status:'reserved',actorId:actor.id,tokenId:token.id,
  originalBoxEmbeddedId:box.id,originalBoxSourceUuid:boxSource,
  originalSilverEmbeddedId:silverItem.id,originalPrayerSourceUuid:SOURCE,
  originalPrayerJournalUuid:journal.uuid});
 const reserved=region.getFlag(NS,'cavLatePrayerProtectionClaim');
 if(reserved?.status!=='reserved'||reserved.actorId!==actor.id||
   reserved.originalBoxEmbeddedId!==box.id)
    throw Error('Uncertain Prayer claim reservation; stop and reconcile');
 const copy=original.toObject();delete copy._id;
 copy.flags={...copy.flags,[NS]:{...copy.flags?.[NS],
  cavLatePrayerProtectionSourceUuid:SOURCE,
  cavLatePrayerProtectionJournalUuid:journal.uuid,
  cavLatePrayerMusicBoxEmbeddedId:box.id,
  cavLatePrayerOriginalBoxSourceUuid:boxSource,
  cavLatePrayerHopeRegionUuid:region.uuid,
  cavLatePrayerPickupOrigin:'original-ornate-music-box'}};
 const made=await actor.createEmbeddedDocuments('Item',[copy]);
 const embedded=made?.length===1?actor.items.get(made[0].id):null;
 if(!embedded||embedded.getFlag(NS,'cavLatePrayerProtectionSourceUuid')!==SOURCE||
  embedded.getFlag(NS,'cavLatePrayerMusicBoxEmbeddedId')!==box.id)
   throw Error('Partial original Prayer reward. Ledger reserved; no automatic retry');
 await region.setFlag(NS,'cavLatePrayerProtectionClaim',{
  status:'done',actorId:actor.id,tokenId:token.id,
  originalBoxEmbeddedId:box.id,originalBoxSourceUuid:boxSource,
  originalSilverEmbeddedId:silverItem.id,originalPrayerSourceUuid:SOURCE,
  originalPrayerJournalUuid:journal.uuid,embeddedItemId:embedded.id,
  originalMusicBoxOpened:true});
 const final=region.getFlag(NS,'cavLatePrayerProtectionClaim');
 if(final?.status!=='done'||final.embeddedItemId!==embedded.id)
  throw Error('Partial Prayer completion after Item creation. Stop; reconcile source');
 try{await ChatMessage.create({speaker:{alias:'The Ornate Music Box'},
  whisper:[player.id],content:'<p>You open the Ornate Music Box and recover the Prayer of Protection. Its complete words are now in your inventory.</p>'});}
 catch(e){console.warn('[CAV T22 prayer] Grant complete, private notice failed',e);}
}catch(e){console.error('[CAV T22 Music Box Prayer] Uncertain source action; preserve any reserved ledger',e);}
finally{globalThis[BUSY]=false;}
`;
export function musicBoxPrayerNativeSource(){return script.trim();}
export const ORIGINAL_PROVENANCE=Object.freeze({
 silverScene:'CAVSG01Scene0001',silverClaim:'cavLateSecondChaseSilverKeyClaim',
 unlock:'cavLateHopeChestUnlock',boxClaim:'cavLateMusicBoxClaim',
 prayerClaim:CLAIM_LEDGER,originalBoxRegion:'Scene.CAVHU04Scene0001.Region.CAVHU04HOPECHST1',
 prayerPickupFlag:'cavLatePrayerProtectionSourceUuid'
});