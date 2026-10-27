import {assessCavRoofClockHandsGM} from "./studio-cav-roof-hands-proof.js";
// Approved Roof Clock GM Macro migrated unmodified from Foundry Macro rEo3v6pIjbAzxVw1.
// Original active GM marker prevents duplicate listeners. No gameplay state changed on import.
export function installCabinRoofClockGMService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!=="cabin-in-the-ashen-veil")return false;
// Roof Clock persistent GM-session listener v001, install as GM-only script Macro; arm once per GM login.
// Authenticated ChatMessage.user sender (server-assigned), NEVER flags.sender or a player self-assertion.
if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw new Error('Wrong world or not elected GM');
const NS='dicebox-campaign-helper',S='LhtyO17QenuCExsb',RID='CAVROOFCLOCKR001';
const LEDGER='cavRoofClockClaim',MARKER='__CAV_ROOFCLOCK_GM_SERVICE_v001',HOUR='Item.HVZnNaV2SxNWck6H',MINUTE='Item.smvovibxtjJ9NW56',GEAR='Item.wDKqETOykWEdKF1Z';
if(globalThis[MARKER]?.id){console.log('[CAV Roof Clock] GM service already armed; no duplicate Hook');return;}
const pending=new Set();
const fn=async(message,options,authorId)=>{
 try{
  if(game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
  const req=message.getFlag(NS,'cavRoofClockAttempt');
  if(!req||req.action!=='roof-clock-attempt'||req.version!==1||req.sceneId!==S||req.regionId!==RID)return;
  const author=message.user,player=game.users.get(authorId);
  if(!author||author.id!==authorId||!player||!player.active||player.isGM)return;
  const scene=game.scenes.get(S),region=scene?.regions.get(RID);
  if(!region||region.behaviors.size!==1||region.ownership.default<2)return;
  const doc=scene.tokens.get(req.tokenId),actor=doc?.actor;
  if(!doc||doc.hidden||!actor||actor.type!=='character'||!actor.testUserPermission(player,'OWNER'))return;
  const bx=doc.x+doc.width*scene.grid.size/2,by=doc.y+doc.height*scene.grid.size/2;
  const rect=region.shapes[0],cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  if(!Number.isFinite(bx)||!Number.isFinite(by)||Math.hypot(bx-cx,by-cy)>400)return;
  if(!Number.isInteger(req.hour)||!Number.isInteger(req.minute)||req.hour<1||req.hour>12||req.minute<0||req.minute>55||req.minute%5!==0)return;
  // Trust only the original DONE Grandfather and Attic Item receipts.
  if(!assessCavRoofClockHandsGM(actor).ready)return;
  const existing=region.getFlag(NS,LEDGER);
  if(existing?.status==='done'||existing?.status==='reserved'||pending.has(RID))return;
  if(req.hour!==12||req.minute!==0){
   try{await ChatMessage.create({speaker:{alias:'Roof Clock'},content:'<p>The hands settle, but the mechanism does not catch. Somewhere behind the face, a gear ticks once and falls still.</p>',whisper:[player.id]});}catch(e){console.warn('[CAV Roof Clock] wrong-time whisper failed',e);}
   return;
  }
  const source=game.items.get(GEAR.slice(5));
  if(!source||source.uuid!==GEAR||source.name!=='Replacement Gear')return;
  if(game.actors.some(a=>a.items.some(i=>i.getFlag(NS,'cavRoofGearSourceUuid')===GEAR&&i.getFlag(NS,'cavRoofGearRegionUuid')===region.uuid)))return;
  pending.add(RID);
  try{
   await region.setFlag(NS,LEDGER,{status:'reserved',actorId:actor.id,tokenId:doc.id,sourceUuid:GEAR,correctTime:'12:00',hourSourceUuid:HOUR,minuteSourceUuid:MINUTE});
   const item=source.toObject();delete item._id;
   item.flags={...item.flags,[NS]:{...item.flags?.[NS],cavRoofGearSourceUuid:GEAR,cavRoofGearRegionUuid:region.uuid,cavRoofGearPuzzle:'chimney-clock-noon'}};
   const created=await actor.createEmbeddedDocuments('Item',[item]);
   if(created.length!==1)throw new Error('Ambiguous Gear grant; preserve reserved ledger');
   await region.setFlag(NS,LEDGER,{status:'done',actorId:actor.id,tokenId:doc.id,sourceUuid:GEAR,embeddedItemId:created[0].id,correctTime:'12:00'});
   try{await ChatMessage.create({speaker:{alias:'Roof Clock'},content:'<p>At the appointed position, the hands lock in place. Deep within the chimney mechanism, an iron gear slides free.</p>',whisper:[player.id]});}
   catch(e){console.warn('[CAV Roof Clock] Gear granted, whisper failed',e);}
  }catch(e){console.error('[CAV Roof Clock] uncertain award, reserved ledger retained for reconciliation',e);}
  finally{pending.delete(RID);}
 }catch(e){console.error('[CAV Roof Clock] GM request handler error',e);}
};
const hook=Hooks.on('createChatMessage',fn);globalThis[MARKER]={id:hook,owner:game.user.id,world:game.world.id,armedAt:new Date().toISOString()};
console.log('[CAV Roof Clock] GM session listener armed:',hook);
 return true;
}
