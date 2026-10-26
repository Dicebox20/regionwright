const NS="dicebox-campaign-helper",W="cabin-in-the-ashen-veil",P="CAVEXT02Scene001",G="CAVEXT02SLUICE01",D="8yLMRDvxyw58dydh";
const F={
 CAVPONDWEATHER01:{scene:P,item:"CAVWEATHERKEY001",name:"Weathered Key",art:"cav-pond-drained-weathered-stairs-crop-20261026.png"},
 CAVBATHSCRDRY001:{scene:D,item:"CAVBATHSCREW0001",name:"Screwdriver",art:"cav-bath-drained-floor-screwdriver-crop-20261026.png"}
};
const HOOK="__CAV_DRAINED_PICKUPS_GM_SERVICE_v001",LOCK="__CAV_DRAINED_PICKUPS_BUSY_v001",CLAIM="cavDrainedPickupClaim";
const READY=()=>game?.ready&&game.world?.id===W;
const GM=()=>READY()&&game.user.isGM&&game.users.activeGM?.id===game.user.id;
const CENTER=(t,s)=>({x:t.x+t.width*s.grid.size/2,y:t.y+t.height*s.grid.size/2,elevation:0});
export const drainedPickupDecision=(stage,flag)=>stage!=="open"?"hidden":flag?.status==="done"?"already":flag?"reconcile":"ready";
function DRY(){
 const p=game.scenes.get(P),g=p?.regions.get(G),t=game.scenes.get("CAVTRAILScene001")?.regions.get("13g6uK1QrR9PFOzA")?.behaviors.get("ZbrhX0nnaLvLA5Zh");
 return g?.getFlag(NS,"cavSluiceStageTransaction")?.status==="done"&&g.getFlag(NS,"cavPondBathWaterState")?.status==="open"&&g.getFlag(NS,"cavPondBathWaterState")?.bath==="drained"&&
 p.background.src==="Maps/cabin-in-the-ashen-veil/ext-02_pond_drained_owner-approved.png"&&
 t?.system.destinations.has("Scene."+D+".Region.R2Pg9eHODtb1C1Yk");
}
async function CLAIM_ITEM(req,author){
 if(!GM()||req?.version!==1||req.action!=="pickup")return "denied";
 const fixture=F[req.regionId];
 if(!fixture||req.sceneId!==fixture.scene)return "denied";
 const scene=game.scenes.get(fixture.scene),region=scene?.regions.get(req.regionId),user=game.users.get(author),token=scene?.tokens.get(req.tokenId),actor=token?.actor;
 if(!user?.active||user.isGM||!region||!token||token.hidden||actor?.type!=="character"||!actor.testUserPermission(user,"OWNER")||!region.testPoint(CENTER(token,scene)))return "denied";
 if(!DRY())return "hidden";
 const status=drainedPickupDecision("open",region.getFlag(NS,CLAIM));if(status!=="ready")return status;
 const source=game.items.get(fixture.item);
 if(source?.uuid!=="Item."+fixture.item||source.name!==fixture.name||source.type!=="loot")return "reconcile";
 if(game.actors.some(a=>a.items.some(i=>i.getFlag(NS,"cavDrainedPickupSourceUuid")===source.uuid&&i.getFlag(NS,"cavDrainedPickupRegionUuid")===region.uuid)))return "reconcile";
 await region.setFlag(NS,CLAIM,{status:"reserved",sourceUuid:source.uuid,actorId:actor.id});
 const item=source.toObject();delete item._id;
 item.flags={...item.flags,[NS]:{...item.flags?.[NS],cavDrainedPickupSourceUuid:source.uuid,cavDrainedPickupRegionUuid:region.uuid, ...(fixture.item==="CAVWEATHERKEY001"?{cavWeatheredKeySourceUuid:source.uuid}:{cavBathScrewdriverSourceUuid:source.uuid})}};
 const created=await actor.createEmbeddedDocuments("Item",[item]);
 if(created.length!==1)throw Error("Ambiguous item grant; reserved receipt left");
 await region.setFlag(NS,CLAIM,{status:"done",sourceUuid:source.uuid,actorId:actor.id,embeddedItemId:created[0].id});
 return "done";
}
export function installCabinDrainedPickupsGMService(){
 if(typeof Hooks==="undefined"||typeof game==="undefined"||game.world?.id!==W)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const h=async(message,opts,author)=>{
  if(!GM())return;const req=message.getFlag(NS,"cavDrainedPickupRequest");
  const u=message.user;if(!req||!u||u.id!==author||u.isGM||!u.active||globalThis[LOCK])return;
  globalThis[LOCK]=true;let status;
  try{status=await CLAIM_ITEM(req,author);}catch(e){console.error("[CAV Drained] item claim uncertain",e);status="reconcile"}finally{globalThis[LOCK]=false}
  const feedback={done:"You recover the "+(F[req.regionId]?.name||"item")+".",hidden:"The object remains submerged.",already:"That item has already been taken.",reconcile:"Ask the GM to reconcile this claim.",denied:"Your character must approach the fixture."};
  try{await ChatMessage.create({speaker:{alias:"Drained Waterway"},whisper:[author],content:"<p>"+(feedback[status]||"Nothing happens.")+"</p>"});}catch(e){}
 };
 globalThis[HOOK]={version:1,hookId:Hooks.on("createChatMessage",h)};return true;
}
export async function handleCabinDrainedPickupRegionEvent(region,event){
 const f=F[region?.id];if(!READY()||game.user?.isGM||!canvas?.ready||!f||region.parent?.id!==f.scene)return;
 const key="__CAV_DRAINED_PICKUP_POINTER_"+region.id;
 const old=globalThis[key];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){if(old?.handler)canvas.stage.off("pointertap",old.handler);delete globalThis[key];return}
 if(event?.name!=="behaviorViewed")return;
 if(old?.handler)canvas.stage.off("pointertap",old.handler);
 const handler=async e=>{
  if(!canvas?.ready||canvas.scene?.id!==f.scene||(e.button!==undefined&&e.button!==0))return;
  const pos=canvas.stage.toLocal(e.global);if(!region.testPoint({x:pos.x,y:pos.y,elevation:0})||globalThis[key+"_busy"])return;
  globalThis[key+"_busy"]=true;
  try{
   const controlled=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&t.actor.testUserPermission(game.user,"OWNER"));
   const token=controlled.length===1?controlled[0].document:null;
   const close=!!token&&region.testPoint(CENTER(token,canvas.scene));
   const stage=drainedPickupDecision(DRY()?"open":"closed",region.getFlag(NS,CLAIM));
   const eligible=close&&stage==="ready";
   const message=stage==="hidden"?"This fixture is still underwater.":stage==="already"?"There is nothing left to take.":stage==="reconcile"?"A Gamemaster must inspect this fixture.":"A "+f.name+" lies on the exposed floor.";
   const art="worlds/cabin-in-the-ashen-veil/assets/puzzle-closeups/"+f.art;
   await foundry.applications.api.DialogV2.prompt({window:{title:f.name},content:'<figure style="max-width:600px;margin:auto"><img alt="Approved map close-up" src="'+art+'" style="max-width:100%;display:block"><figcaption>'+message+"</figcaption></figure>",
    ok:{label:eligible?"Take "+f.name:"Close",callback:async()=>{
     if(!eligible)return true;
     const gm=game.users.activeGM;if(!gm?.active)return false;
     await ChatMessage.create({content:"<p>You collect an item.</p>",whisper:[gm.id,game.user.id],flags:{[NS]:{cavDrainedPickupRequest:{version:1,action:"pickup",regionId:region.id,sceneId:f.scene,tokenId:token.id}}}});
     return true;
    }},rejectClose:false});
  }catch(err){console.error("[CAV Drained] click failed",err)}finally{globalThis[key+"_busy"]=false}
 };
 canvas.stage.on("pointertap",handler);globalThis[key]={handler};
}

