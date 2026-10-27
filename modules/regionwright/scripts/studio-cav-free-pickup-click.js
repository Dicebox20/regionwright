// Cabin in the Ashen Veil: bounded GM-authoritative click-to-collect service for six freely available objects.
// DOES NOT change original movement-triggered Region pickup services or any puzzle prerequisite.
export const CAV_FREE_CLICK_PICKUPS=Object.freeze([
 {scene:'CAVEXT03Scene001',region:'TWKOyz83JjJu94E7',item:'CAVOARSPOND00001',itemName:'Wooden Oars',ledger:'cavOarsPickup',sourceFlag:'cavPickupSourceUuid',regionFlag:'cavPickupRegionUuid',idKey:'itemId',extra:{cavFirstActPickup:'donovans_shack_freely_available'}},
 {scene:'CAVEXT03Scene001',region:'CAVEXT03OILREG01',item:'CAVLAMPOIL000001',itemName:'Lamp Oil',ledger:'cavDonovanLampOilClaim',sourceFlag:'cavLampOilSourceUuid',regionFlag:'cavLampOilSourceRegionUuid',extra:{cavLampOilChainNode:'oil'}},
 {scene:'CAVHU04Scene0001',region:'CAVHU04COATREG01',item:'CAVOLDIRONKEY001',itemName:'Old Iron Key',ledger:'cavOldIronKeyClaim',sourceFlag:'cavOldIronKeySourceUuid',regionFlag:'cavOldIronKeySourceRegionUuid'},
 {scene:'KwpmPrYgEC7KQVCZ',region:'82gAoSwyIPu8EdQs',item:'JdxWT2pmO0aRrv3l',itemName:'Clockwork Winder',ledger:'cavAtticWinderClaim',sourceFlag:'cavAtticLootSourceUuid',regionFlag:'cavAtticLootRegionUuid',idKey:'embeddedItemId',extra:{cavAtticLootNode:'winder'},gate:'attic'},
 {scene:'nyF5EX0JiEu23C3p',region:'UtXhS68vd1czWfTG',item:'smvovibxtjJ9NW56',itemName:'Attic Clock Minute Hand',ledger:'cavAtticMinuteHandClaim',sourceFlag:'cavAtticLootSourceUuid',regionFlag:'cavAtticLootRegionUuid',idKey:'embeddedItemId',extra:{cavAtticLootNode:'minute'},gate:'attic'},
 {scene:'CAVHU05Scene0001',region:'CAVB0FDF8543F6D9',item:'mN1dk0qlr7hyfupk',itemName:'First Glass Eye',ledger:'cavSophiaBearEyeClaim',sourceFlag:'cavSophiaFirstEyeSourceUuid',regionFlag:'cavSophiaFirstEyeSourceRegionUuid',gate:'sophia'}
]);
export function isCavFreePickupNear({token,scene,region}={}){
 const shape=region?.shapes?.[0]?.toObject?.(),grid=scene?.grid?.size;
 if(shape?.type!=='rectangle'||![shape.x,shape.y,shape.width,shape.height,grid,
 token?.x,token?.y,token?.width,token?.height].every(Number.isFinite)||
 shape.width<=0||shape.height<=0||grid<=0||token.width<=0||token.height<=0)return false;
 return Math.hypot(token.x+token.width*grid/2-(shape.x+shape.width/2),
 token.y+token.height*grid/2-(shape.y+shape.height/2))<=400;
}
function originalGateOpen(kind){
 if(kind==='attic'){
  const hatch=game.scenes.get('gGgUHlHdI7RFrbUh')?.regions.get('UOudBnxOGVlAlPoa');
  const ret=game.scenes.get('UNEdA6iy6nk1Xuga')?.regions.get('iiUiIaQxybYR73lH');
  return hatch?.getFlag('dicebox-campaign-helper','cavAtticLadderLowered')?.status==='done'&&
   hatch.behaviors.get('u8olskrLpj6mnsdx')?.disabled===false&&
   ret?.behaviors.get('QvxlDnpZFq9APBSt')?.disabled===false;
 }
 if(kind==='sophia'){
  const door=game.scenes.get('gGgUHlHdI7RFrbUh')?.regions.get('UV4YAstBe0WCuLcM');
  return door?.getFlag('dicebox-campaign-helper','cavSophiaDoorUnlocked')?.status==='done'&&
   door.behaviors.get('CAVHU02SOPHTEL01')?.disabled===false;
 }
 return true;
}
export function installCabinFreePickupClickGMService(){
 if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)return false;
 const SLOT='__CAV_FREE_PICKUP_CLICK_GM_v001',NS='dicebox-campaign-helper';
 if(globalThis[SLOT]?.id)return true;
 const busy=new Set();
 const handler=async(message,opts,senderId)=>{
  try{
   if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||
    game.users.activeGM?.id!==game.user.id)return;
   const req=message.getFlag(NS,'cavFreePickupRequest');
   if(req?.version!==1||req.action!=='collect'||typeof req.tokenId!=='string')return;
   const policy=CAV_FREE_CLICK_PICKUPS.find(p=>p.scene===req.sceneId&&p.region===req.regionId);
   if(!policy)return;
   const player=game.users.get(senderId);
   if(!player||message.user?.id!==senderId||player.isGM||!player.active||
    player.viewedScene!==policy.scene)return;
   const scene=game.scenes.get(policy.scene),region=scene?.regions.get(policy.region);
   if(!scene||!region||!region.testUserPermission(player,'OBSERVER'))return;
   const token=scene.tokens.get(req.tokenId),actor=token?.actor;
   if(!token||token.hidden||actor?.type!=='character'||!actor.testUserPermission(player,'OWNER')||
    !isCavFreePickupNear({token,scene,region})||!originalGateOpen(policy.gate))return;
   const template=game.items.get(policy.item),sourceUuid='Item.'+policy.item;
   if(!template||template.uuid!==sourceUuid||
    (policy.itemName==='First Glass Eye'?!template.name.includes(policy.itemName):template.name!==policy.itemName))return;
   const claim=region.getFlag(NS,policy.ledger);
   if(claim?.status==='done'||claim?.status==='reserved'||busy.has(region.uuid))return;
   // Reject any actual item from the original template, including historic Yard Oars claims.
   if(game.actors.some(a=>a.items.some(i=>i.getFlag?.(NS,policy.sourceFlag)===sourceUuid)))return;
   busy.add(region.uuid);
   try{
    const isAttic=policy.gate==='attic';
    const ledger={status:'reserved',actorId:actor.id,tokenId:token.id,
      ...(isAttic?{itemUuid:sourceUuid}:{sourceUuid})};
    await region.setFlag(NS,policy.ledger,ledger);
    const item=template.toObject();delete item._id;
    item.flags={...item.flags,[NS]:{...item.flags?.[NS],
     [policy.sourceFlag]:sourceUuid,[policy.regionFlag]:region.uuid,...(policy.extra||{})}};
    const made=await actor.createEmbeddedDocuments('Item',[item]);
    if(made.length!==1)throw Error('Ambiguous clicked Item award; reserved claim retained');
    await region.setFlag(NS,policy.ledger,{...ledger,status:'done',[policy.idKey||'embeddedItemId']:made[0].id});
    try{await ChatMessage.create({speaker:{alias:'Discovered Item'},content:'<p>You carefully collect '+template.name+'.</p>',whisper:[player.id]});}
    catch(e){console.warn('[CAV free click] Item granted; whisper failed',e)}
   }catch(e){console.error('[CAV free click] reserved Item claim requires GM review',e)}
   finally{busy.delete(region.uuid)}
  }catch(e){console.error('[CAV free click] GM request rejected',e)}
 };
 const id=Hooks.on('createChatMessage',handler);
 globalThis[SLOT]={id,gmId:game.user.id,worldId:game.world.id};
 return true;
}