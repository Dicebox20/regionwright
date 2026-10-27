// OWNER-AUTHORIZED Chat B source for disjoint late-game native Region behaviors.
// Scripts are self-contained, reload-persistent as Region executeScript documents.
// NO imports from shared Studio registry. Only native Game/elected GM readbacks.
// UI is a read-only close-up pending full approved image assets.
// Actual native rewards require owner-controlled source custody AND active GM confirmation.
export const BATCH1_NATIVE_VERSION=1;
const configs=Object.freeze({
 hope:{scene:"CAVHU04Scene0001",region:"CAVHU04HOPECHST1",title:"Parents' Hope Chest",name:"hope"},
 wick:{scene:"CAVHU08Scene0001",region:"CAVBE5639AEC2179",title:"Candle Workshop Shelves",name:"wick"},
 lantern:{scene:"CAVEXT05Scene001",region:"CAVEXT05LANTERN1",title:"The Forgotten Gazebo Lantern",name:"lantern"}
});
const common=String.raw`
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil",TYPE=__TYPE__;
const SCENE=__SCENE__,RID=__RID__,TITLE=__TITLE__;
const KEY="__CAV_CHATB_LATE_BATCH1_INSPECT_"+RID;
if(game?.world?.id!==WORLD||game.version!=="14.367"||scene?.id!==SCENE||region?.id!==RID)return;
const evt=event?.name,old=globalThis[KEY];
const elected=()=>game.ready&&game.user?.isGM&&game.users?.activeGM?.id===game.user.id;
const oldStatus=(key)=>region.getFlag(NS,key)?.status??"none";
const exact=(actor,source,name,flag,originFlag,origin)=>actor.items.find(i=>
 i.name===name&&i.type==="loot"&&i.getFlag(NS,flag)===source&&
 (!originFlag||i.getFlag(NS,originFlag)===origin));
if(evt==="behaviorUnviewed"||evt==="behaviorDeactivated"){
 if(old?.handler&&canvas?.stage)canvas.stage.off("pointertap",old.handler);
 delete globalThis[KEY];return;
}
if(evt==="behaviorViewed"&&!game.user?.isGM){
 if(old?.handler&&canvas?.stage)canvas.stage.off("pointertap",old.handler);
 const handler=async e=>{
  if(!canvas?.ready||canvas.scene?.id!==SCENE||game.user?.isGM||
     (e.button!==undefined&&e.button!==0))return;
  const pt=canvas.stage.toLocal(e.global);
  if(!region.testPoint({x:pt.x,y:pt.y,elevation:0})||globalThis[KEY+"_BUSY"])return;
  globalThis[KEY+"_BUSY"]=true;
  try{
   let body="";
   if(TYPE==="hope"){
     body=oldStatus("cavLateHopeChestUnlock")==="done"?
       "The silver lock has opened. A delicate music box rests within.":
       "A silver lock clasps the old family chest. Only its proper tiny key will turn.";
     if(oldStatus("cavLateMusicBoxClaim")==="done")body="The unlocked chest is empty. The music box has been taken.";
   }else if(TYPE==="wick"){
     body=oldStatus("cavLateWickClaim")==="done"?
       "The useful candle wick has been collected. The shelf is bare.":
       "A single spare candle wick lies among old supplies. The concealed workshop must be reached legitimately.";
   }else{
     const o=oldStatus("cavLateGazeboOil"),w=oldStatus("cavLateGazeboWick");
     body="A weathered lantern hangs amid thick cobwebs. Oil: "+(o==="done"?"installed":"missing")+
       ". Wick: "+(w==="done"?"installed":"missing")+".";
     if(o==="done"&&w==="done")body+=" It is prepared, but the ignition and eye-reveal mechanism have not yet been commissioned.";
   }
   await foundry.applications.api.DialogV2.prompt({window:{title:TITLE},
     content:"<p>"+body+"</p>",ok:{label:"Close",callback:()=>true},rejectClose:false});
  }catch(err){console.error("[CAV late fixture] Inspect unavailable",err);}
  finally{globalThis[KEY+"_BUSY"]=false;}
 };
 if(canvas?.stage){canvas.stage.on("pointertap",handler);globalThis[KEY]={handler};}
 return;
}
if(!["tokenMoveIn","tokenMoveWithin"].includes(evt)||!elected())return;
const raw=event.data?.token?.document??event.data?.token;
const token=scene.tokens.get(raw?.id??event.data?.tokenId);
if(!token||token.hidden||!token.actorId||token.actor?.type!=="character")return;
const actor=token.actor,owners=game.users.contents.filter(u=>u.active&&!u.isGM&&actor.testUserPermission(u,"OWNER"));
const sender=event.userId??event.data?.userId??null;
const player=sender?owners.find(u=>u.id===sender):owners.length===1?owners[0]:null;
if(!player)return;
const cpt={x:token.x+token.width*scene.grid.size/2,y:token.y+token.height*scene.grid.size/2,elevation:0};
if(!region.testPoint(cpt))return;
const busy=KEY+"_GM_BUSY";if(globalThis[busy])return;
globalThis[busy]=true;
try{
 const confirm=async(message)=>await foundry.applications.api.DialogV2.confirm({
   window:{title:TITLE+" — GM confirmation"},
   content:"<p>"+message+"</p><p>Approve only after the player deliberately chooses this action.</p>",
   yes:{label:"Approve player action"},no:{label:"Cancel",callback:()=>false},
   rejectClose:false});
 const grant=async(source,sourceName,ledger,flag,origin)=>{
   const item=game.items.get(source.split(".")[1]);
   if(!item||item.uuid!==source||item.name!==sourceName||item.type!=="loot"||
      item.getFlag(NS,"cabinPuzzleItem")?.status!=="GM_LIBRARY_ONLY")return;
   if(game.actors.some(a=>a.items.some(i=>i.getFlag(NS,flag)===source)))return;
   if(region.getFlag(NS,ledger))return;
   await region.setFlag(NS,ledger,{status:"reserved",actorId:actor.id,tokenId:token.id,sourceUuid:source});
   const copy=item.toObject();delete copy._id;
   copy.flags={...copy.flags,[NS]:{...copy.flags?.[NS],
       [flag]:source,cavLateBatch1SourceRegionUuid:region.uuid,cavLateBatch1PickupOrigin:origin}};
   const made=await actor.createEmbeddedDocuments("Item",[copy]);
   if(made.length!==1||!actor.items.get(made[0].id)||
      actor.items.get(made[0].id).getFlag(NS,flag)!==source)
      throw Error("Partial original Item grant: reconcile reserved source");
   await region.setFlag(NS,ledger,{status:"done",actorId:actor.id,sourceUuid:source,embeddedItemId:made[0].id});
   try{await ChatMessage.create({speaker:{alias:TITLE},whisper:[player.id],
     content:"<p>You recover "+sourceName+".</p>"});}catch(err){console.warn("[CAV Batch1] Grant complete, whisper failed",err);}
 };
 if(TYPE==="hope"){
   const keySource="Item.IY8fuUG5P0yWIZIh";
   const stage=oldStatus("cavLateHopeChestUnlock");
   if(stage==="reserved"||oldStatus("cavLateMusicBoxClaim")==="reserved")return;
   if(stage!=="done"){
     if(stage!=="none")return;
     const key=actor.items.find(i=>i.name==="Silver Tiny Key"&&i.type==="loot"&&
       i.getFlag(NS,"cavLateSilverKeySourceUuid")===keySource&&
       i.getFlag(NS,"cavLateSilverKeyDropSceneId")==="CAVSG01Scene0001"&&
       typeof i.getFlag(NS,"cavLateSilverKeyDropRegionUuid")==="string");
     const drop=key&&game.scenes.get("CAVSG01Scene0001")?.regions.get(key.getFlag(NS,"cavLateSilverKeyDropRegionUuid"));
     const proof=drop?.getFlag(NS,"cavLateSecondChaseSilverKeyClaim");
     if(!key||!drop||proof?.status!=="done"||proof.actorId!==actor.id||
        proof.sourceUuid!==keySource)return;
     if(!await confirm("Use the original Silver Tiny Key to unlock the Parents' Hope Chest? The key remains with the character."))return;
     await region.setFlag(NS,"cavLateHopeChestUnlock",{status:"reserved",actorId:actor.id,keySource});
     await region.setFlag(NS,"cavLateHopeChestUnlock",{status:"done",actorId:actor.id,keySource});
     return;
   }
   if(oldStatus("cavLateMusicBoxClaim")!=="none"||!region.getFlag(NS,"cavLateHopeChestUnlock")?.keySource)return;
   if(!await confirm("Take the one original Ornate Music Box from the unlocked chest?"))return;
   await grant("Item.YaKs6z2AWlEAlyzx","Ornate Music Box","cavLateMusicBoxClaim",
     "cavLateMusicBoxSourceUuid","original-hope-chest");
   // Prayer of Protection requires a complete owner-approved readable Journal, NOT available yet.
 }else if(TYPE==="wick"){
   if(oldStatus("cavLateWickClaim")!=="none")return;
   // Future Studio protection altar adapter must write a genuine certified open source ledger.
   const studio=game.scenes.contents.find(s=>/Art Studio/i.test(s.name));
   const passages=Array.from(studio?.regions??[]).filter(r=>{
     const state=r.getFlag(NS,"cavStudioProtectionPassage");
     return state?.status==="open"&&state?.originalPrayerSourceUuid==="Item.5jwy75XyFezukf3b"&&
      state?.verifiedWorkshopSceneId==="CAVHU08Scene0001"&&state?.originalPrayerReadReceiptVerified===true;
   });
   if(passages.length!==1)return;
   if(!await confirm("Take the single original Wick from the Workshop shelves?"))return;
   await grant("Item.o0g8PyGRIbdwVM3m","Wick","cavLateWickClaim",
     "cavLateWickSourceUuid","original-concealed-workshop");
 }else{
   // A shared, owner-authored Lantern Oil original exists in the Shack world library.
   // Oil and Wick can be inserted in either order, never fabricated or auto-awarded.
   const oilSource="Item.CAVLAMPOIL000001",wickSource="Item.o0g8PyGRIbdwVM3m";
   let source=null,embedded=null,ledger=null;
   if(oldStatus("cavLateGazeboOil")==="none"){
     const i=exact(actor,oilSource,"Lamp Oil","cavLampOilSourceUuid",
       "cavLampOilSourceRegionUuid","Scene.CAVEXT03Scene001.Region.CAVEXT03OILREG01");
     const origin=game.scenes.get("CAVEXT03Scene001")?.regions.get("CAVEXT03OILREG01")?.getFlag(NS,"cavDonovanLampOilClaim");
     if(i&&origin?.status==="done"&&origin.actorId===actor.id){source=oilSource;embedded=i;ledger="cavLateGazeboOil";}
   }
   if(!source&&oldStatus("cavLateGazeboWick")==="none"){
     const i=exact(actor,wickSource,"Wick","cavLateWickSourceUuid",
       "cavLateBatch1SourceRegionUuid","Scene.CAVHU08Scene0001.Region.CAVBE5639AEC2179");
     const origin=game.scenes.get("CAVHU08Scene0001")?.regions.get("CAVBE5639AEC2179")?.getFlag(NS,"cavLateWickClaim");
     if(i&&origin?.status==="done"&&origin.actorId===actor.id){source=wickSource;embedded=i;ledger="cavLateGazeboWick";}
   }
   if(!source||!embedded||!ledger)return;
   if(!await confirm("Install "+(source===oilSource?"Lamp Oil":"the Wick")+" into the old gazebo lantern? The original supplied material will be used."))return;
   await region.setFlag(NS,ledger,{status:"reserved",actorId:actor.id,
      sourceUuid:source,originalEmbeddedId:embedded.id});
   await actor.deleteEmbeddedDocuments("Item",[embedded.id]);
   if(actor.items.get(embedded.id))throw Error("Material delete uncertain; reserved ledger");
   await region.setFlag(NS,ledger,{status:"done",actorId:actor.id,sourceUuid:source});
   // Cobweb removal/eye #2 marker/ignite intentionally NOT attempted without approved FX and pickup Region.
 }
}catch(err){console.error("[CAV Chat B Batch1] Uncertain native action; reserved ledger retained",err)}
finally{globalThis[busy]=false;}
`;
export function nativeBatch1Script(kind){
 const c=configs[kind];if(!c)throw Error("Unsupported original Batch 1 fixture");
 return common.replace("__TYPE__",JSON.stringify(kind))
   .replace("__SCENE__",JSON.stringify(c.scene))
   .replace("__RID__",JSON.stringify(c.region))
   .replace("__TITLE__",JSON.stringify(c.title));
}
export function nativeBatch1Fixtures(){return Object.entries(configs).map(([kind,c])=>({kind,...c}));}