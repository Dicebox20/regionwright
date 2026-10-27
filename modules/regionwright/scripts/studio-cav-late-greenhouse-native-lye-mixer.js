// Chat B Turn 17 — isolated native EXT-06 greenhouse mixing control, source v1.
// Exact owner-approved rule: LYE ALONE, after real WATERWORKS restoration.
// No simulation of real-world caustic chemistry; no consume-on-use: owner undecided.
// This fixture is fail-closed until original BATH-02 Soap Case and Waterworks ledgers
// are native-installed, authenticated and read from their original scene Regions.
export const GREENHOUSE_SCENE="CAVEXT06Scene001";
export const GREENHOUSE_APPROVED_ART="Maps/cabin-in-the-ashen-veil/ext-06_greenhouse-interior_owner-approved.png";
export const GREENHOUSE_CONTROLS_REGION="CAVB6E433D528867";
export const GREENHOUSE_MIX_BEHAVIOR="CAVEXT06LYEMIX01";
export const ORIGINAL_QUEST_LYE="Item.vDR4cJU35iODR6gh";
export const ORIGINAL_PLANT_KILLER="Item.YNWpGEGB17mqDFWe";
export const ORIGINAL_WATERWORKS_REGION="Scene.CAVAQ01Scene0001.Region.kmPmr5ijLCEOJNk3";
export const AUTHORIZED_SOAP_SCENES=Object.freeze(["CAVBATHScene0001","8yLMRDvxyw58dydh"]);
const source=String.raw`
const NS="dicebox-campaign-helper";
if(!game?.ready||game.world?.id!=="cabin-in-the-ashen-veil"||
 game.version!=="14.367"||scene?.id!=="CAVEXT06Scene001"||
 region?.id!=="CAVB6E433D528867")return;
const flag=k=>region.getFlag(NS,k);
const state=flag("cavLateGreenhouseMix")?.status??"none";
if(event?.name==="behaviorViewed"&&!game.user?.isGM){
  const key="__CAV_B17_GREENHOUSE_"+region.id;
  if(globalThis[key]?.handler&&canvas?.stage)canvas.stage.off("pointertap",globalThis[key].handler);
  const handler=async e=>{
    if(!canvas?.ready||canvas.scene?.id!=="CAVEXT06Scene001"||game.user?.isGM)return;
    const pt=canvas.stage.toLocal(e.global);
    if(!region.testPoint({x:pt.x,y:pt.y,elevation:0})||globalThis[key+"_OPEN"])return;
    globalThis[key+"_OPEN"]=true;
    try{
      const description=state==="done"?
       "The Greenhouse workstation has already produced its original Plant Killer flask.":
       "The old Greenhouse controls connect to the restored Waterworks. The original quest Lye is the only required ingredient. The machine will not operate without genuine Waterworks and Soap Case provenance.";
      await foundry.applications.api.DialogV2.prompt({
        window:{title:"Greenhouse — mixing controls"},content:"<p>"+description+"</p>",
        ok:{label:"Close",callback:()=>true},rejectClose:false});
    }finally{globalThis[key+"_OPEN"]=false;}
  };
  if(canvas?.stage){canvas.stage.on("pointertap",handler);globalThis[key]={handler};}
  return;
}
if(["behaviorUnviewed","behaviorDeactivated"].includes(event?.name)){
  const key="__CAV_B17_GREENHOUSE_"+region.id;
  if(globalThis[key]?.handler&&canvas?.stage)canvas.stage.off("pointertap",globalThis[key].handler);
  delete globalThis[key];return;
}
if(!["tokenMoveIn","tokenMoveWithin"].includes(event?.name)||!
 (game.user?.isGM&&game.users?.activeGM?.id===game.user.id))return;
const datum=event.data?.token?.document??event.data?.token;
const token=scene.tokens.get(datum?.id??event.data?.tokenId);
if(!token||token.hidden||!token.actor||token.actor.type!=="character")return;
const actor=token.actor;
const owners=game.users.contents.filter(u=>u.active&&!u.isGM&&actor.testUserPermission(u,"OWNER"));
const sender=event.userId??event.data?.userId??null;
const player=sender?owners.find(u=>u.id===sender):(owners.length===1?owners[0]:null);
if(!player)return;
const center={x:token.x+token.width*scene.grid.size/2,y:token.y+token.height*scene.grid.size/2,elevation:0};
if(!region.testPoint(center))return;
if(state!=="none"||flag("cavLatePlantKillerClaim"))return;
const lye=game.items.get("vDR4cJU35iODR6gh"),
      result=game.items.get("YNWpGEGB17mqDFWe");
if(!lye||lye.uuid!=="Item.vDR4cJU35iODR6gh"||lye.name!=="Lye"||
 lye.type!=="loot"||lye.getFlag(NS,"cabinPuzzleItem")?.status!=="GM_LIBRARY_ONLY"||
 !result||result.uuid!=="Item.YNWpGEGB17mqDFWe"||
 result.name!=="Plant Killer"||result.type!=="loot"||
 result.getFlag(NS,"cabinPuzzleItem")?.status!=="GM_LIBRARY_ONLY")return;
if(game.actors.contents.some(a=>a.items.some(i=>i.name===result.name||
 i.getFlag(NS,"cavLatePlantKillerSourceUuid")===result.uuid)))return;
// WATERWORKS, not Pond/Bath Sluice, is required. The actual native authority
// remains in the original Aqueduct Waterworks Annex's OWN ledger.
const annex=game.scenes.get("CAVAQ01Scene0001")?.regions.get("kmPmr5ijLCEOJNk3");
const restored=annex?.getFlag(NS,"cavWaterworksRestore");
if(restored?.status!=="done"||restored?.reverifiedFromOriginalWaterworks!==true||
 restored?.greenhouseSprinklerFlowRestored!==true||
 restored?.originalAqueductSceneId!=="CAVAQ01Scene0001")return;
// Lye needs a legitimate claim from the original Bathhouse BATH-02 Soap Case,
// rather than a generic item of the same type.
const lyeInstance=actor.items.find(i=>i.name==="Lye"&&i.type==="loot"&&
 i.getFlag(NS,"cavLateLyeSourceUuid")==="Item.vDR4cJU35iODR6gh"&&
 Number(i.system?.quantity??0)>0);
if(!lyeInstance)return;
const originUuid=lyeInstance.getFlag(NS,"cavLateLyeOriginRegionUuid");
if(typeof originUuid!=="string")return;
const root=/^Scene\.([^.]+)\.Region\.([^.]+)$/.exec(originUuid);
if(!root||!["CAVBATHScene0001","8yLMRDvxyw58dydh"].includes(root[1]))return;
const soapScene=game.scenes.get(root[1]),soapRegion=soapScene?.regions.get(root[2]);
const soap=soapRegion?.getFlag(NS,"cavLateSoapCase");
const award=soapRegion?.getFlag(NS,"cavLateSoapLyeClaim");
if(!soapScene||!soapRegion||soap?.status!=="unlocked"||
 soap?.canonCode!=="BATH-02"||award?.status!=="done"||
 award?.actorId!==actor.id||award?.originalLyeSourceUuid!==lye.uuid||
 award?.embeddedItemId!==lyeInstance.id)return;
const gate="__CAV_B17_MIXBUSY_"+region.id;if(globalThis[gate])return;
globalThis[gate]=true;
try{
 const ok=await foundry.applications.api.DialogV2.confirm({
  window:{title:"Greenhouse — original Plant Killer"},
  content:"<p>The original Waterworks has been restored, and the character carries authenticated Lye from the Bathhouse Soap Case. Produce the one original Plant Killer flask?</p><p>No other reagent is required. Lye will NOT be consumed until the owner settles that rule. Confirm only after the player's deliberate action.</p>",
  yes:{label:"Approve production"},no:{label:"Cancel",callback:()=>false},rejectClose:false});
 if(!ok)return;
 // Recheck state after the asynchronous dialog. Do not race with other GM events.
 if(flag("cavLateGreenhouseMix")||flag("cavLatePlantKillerClaim"))return;
 await region.setFlag(NS,"cavLateGreenhouseMix",{status:"reserved",actorId:actor.id,
   originalLyeUuid:lye.uuid,originalWaterworksRegionUuid:annex.uuid,
   originalSoapCaseRegionUuid:soapRegion.uuid});
 if(region.getFlag(NS,"cavLateGreenhouseMix")?.status!=="reserved")throw Error("Reservation uncertain");
 const fresh=result.toObject();delete fresh._id;
 fresh.flags={...fresh.flags,[NS]:{...fresh.flags?.[NS],
   cavLatePlantKillerSourceUuid:result.uuid,
   cavLatePlantKillerOriginRegionUuid:region.uuid}};
 const made=await actor.createEmbeddedDocuments("Item",[fresh]);
 const embedded=made?.[0]&&actor.items.get(made[0].id);
 if(made?.length!==1||!embedded||
   embedded.getFlag(NS,"cavLatePlantKillerSourceUuid")!==result.uuid)
     throw Error("Original Plant Killer grant uncertain; reserved state retained");
 await region.setFlag(NS,"cavLatePlantKillerClaim",{status:"done",sourceUuid:result.uuid,
   actorId:actor.id,embeddedItemId:embedded.id});
 await region.setFlag(NS,"cavLateGreenhouseMix",{status:"done",actorId:actor.id,
   sourceUuid:result.uuid,lyeConsumed:false});
 try{await ChatMessage.create({speaker:{alias:"Greenhouse Workstation"},
  whisper:[player.id],content:"<p>You have produced the original Plant Killer flask.</p>"})}
 catch(e){console.warn("[CAV B17] Greenhouse grant committed; whisper failed",e);}
}catch(err){console.error("[CAV B17] Partial Greenhouse source transaction; RECONCILE; no replay",err)}
finally{globalThis[gate]=false}
`;
export function greenhouseNativeSource(){return source.trim();}