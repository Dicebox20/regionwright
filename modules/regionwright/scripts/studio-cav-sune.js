export const STEPS=Object.freeze([
Object.freeze({key:"sw",scene:"CAVSG07Scene0001",region:"0JAM9urrHnAxVUgM"}),
Object.freeze({key:"ne",scene:"CAVSG03Scene0001",region:"BfKhb34dSEfVTf2e"}),
Object.freeze({key:"nw",scene:"CAVSG01Scene0001",region:"gksvZIqj8jWdqzn7"}),
Object.freeze({key:"se",scene:"CAVSG09Scene0001",region:"BrugKqcQyDImUvwt"})
]);
const WORLD="cabin-in-the-ashen-veil",NS="dicebox-campaign-helper",LEDGER="cavSuneBustClaim";
const WINDER="Item.JdxWT2pmO0aRrv3l",PICKUP="Scene.KwpmPrYgEC7KQVCZ.Region.82gAoSwyIPu8EdQs";
const RELIEF_SCENE="CAVSG05Scene0001",RELIEF_REGION="L15BdSqcbCOLPnIN";
const HATCH_SCENE="gGgUHlHdI7RFrbUh",HATCH_REGION="UOudBnxOGVlAlPoa";
const MARKER="__CAV_SUNE_GM_MESSAGE_HOOK_v002",BUSY="__CAV_SUNE_GM_TX_v003";
export const CANON_ORDER=STEPS.map(s=>s.key);
export function evaluateSuneAttempt(done,attempt){
 const n=CANON_ORDER.indexOf(attempt);
 if(n<0||!Array.isArray(done)||done.length!==4||done.some(x=>typeof x!=="boolean"))return {kind:"deny"};
 const next=done.indexOf(false);
 if(next===-1)return {kind:"already",next:4};
 if(done.some((v,i)=>i>next&&v))return {kind:"reconcile"};
 return n===next?{kind:"advance",next:n}:{kind:"reset",next:0};
}
function exactAuthority(g){return g?.ready===true&&g.world?.id===WORLD&&g.user?.isGM===true&&g.users?.activeGM?.id===g.user.id;}
async function processAttempt(req,authorId){
 const g=game;if(!exactAuthority(g)||req?.version!==1||req?.action!=="sune-bust-use")return "denied";
 const player=g.users.get(authorId);if(!player?.active||player.isGM)return "denied";
 const step=STEPS.find(s=>s.key===req.key);
 if(!step||step.scene!==req.sceneId||step.region!==req.regionId)return "denied";
 const sc=g.scenes.get(step.scene),region=sc?.regions.get(step.region),token=sc?.tokens.get(req.tokenId),actor=token?.actor;
 if(!region||!token||token.hidden||!actor||actor.type!=="character"||!actor.testUserPermission(player,"OWNER"))return "denied";
 const pt={x:token.x+token.width*sc.grid.size/2,y:token.y+token.height*sc.grid.size/2,elevation:0};
 if(!region.testPoint(pt))return "denied";
 const hatch=g.scenes.get(HATCH_SCENE)?.regions.get(HATCH_REGION);
 if(hatch?.getFlag(NS,"cavAtticLadderLowered")?.status!=="done")return "denied";
 const hasWinder=actor.items.some(i=>i.name==="Clockwork Winder"&&i.getFlag(NS,"cavAtticLootSourceUuid")===WINDER&&i.getFlag(NS,"cavAtticLootRegionUuid")===PICKUP);
 if(!hasWinder)return "denied";
 const relief=g.scenes.get(RELIEF_SCENE)?.regions.get(RELIEF_REGION);if(!relief)return "blocked";
 if(relief.getFlag(NS,"cavSuneBustSequence")?.status==="completed")return "already";
 const regions=STEPS.map(s=>g.scenes.get(s.scene)?.regions.get(s.region));
 if(regions.some(r=>!r))return "blocked";
 const flags=regions.map(r=>r.getFlag(NS,LEDGER));
 if(flags.some(f=>f?.status==="reserved"))return "reconcile";
 const v=evaluateSuneAttempt(flags.map(f=>f?.status==="done"),req.key);
 if(v.kind==="deny"||v.kind==="reconcile")return v.kind;if(v.kind==="already")return "already";
 if(v.kind==="reset"){
  for(let i=0;i<regions.length;i++)if(flags[i]?.status==="done")await regions[i].unsetFlag(NS,LEDGER);
  await relief.setFlag(NS,"cavSuneBustProgress",{status:"reset",expected:"sw",version:3});
  return "reset";
 }
 const n=v.next;
 await region.setFlag(NS,LEDGER,{status:"reserved",step:n+1,actorId:actor.id,tokenId:token.id,winderSource:WINDER});
 await region.setFlag(NS,LEDGER,{status:"done",step:n+1,actorId:actor.id,tokenId:token.id,winderSource:WINDER});
 if(n===3){
  await relief.setFlag(NS,"cavSuneBustSequence",{status:"completed",order:"SW NE NW SE",winderSource:WINDER,version:3});
  await relief.setFlag(NS,"cavSuneBustProgress",{status:"completed",expected:null,version:3});
 }else await relief.setFlag(NS,"cavSuneBustProgress",{status:"in-progress",expected:STEPS[n+1].key,version:3});
 return n===3?"completed":"advanced";
}
export function installCabinSuneWinderService(){
 if(typeof Hooks==="undefined"||typeof game==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[MARKER]?.hookId)return true;
 const handler=async(message,options,authorId)=>{
  if(!exactAuthority(game))return;
  const req=message?.getFlag?.(NS,"cavSuneBustUse");if(!req)return;
  const user=message.user;if(!user||user.id!==authorId||user.isGM||!user.active)return;
  if(globalThis[BUSY])return;
  globalThis[BUSY]=true;let result="blocked";
  try{result=await processAttempt(req,authorId);}
  catch(e){console.error("[CAV Sune] readback required following uncertain write",e);result="reconcile";}
  finally{globalThis[BUSY]=false;}
  const responses={reset:"The sequence slips out of alignment. The mechanism returns to its starting position.",advanced:"The clockwork catches and turns.",completed:"The last winder catches. A hidden relief shifts behind Sune's statue.",reconcile:"The mechanism halts. The GM must reconcile its saved state.",denied:"The mechanism resists; you cannot work it from here.",already:"This mechanism has already completed its sequence."};
  try{await ChatMessage.create({speaker:{alias:"Sune Grove"},content:"<p>"+(responses[result]||"The mechanism remains still.")+"</p>",whisper:[authorId]});}
  catch(e){console.warn("[CAV Sune] result notification failed, state preserved",e);}
 };
 const hookId=Hooks.on("createChatMessage",handler);
 globalThis[MARKER]={hookId,gmId:game.user?.id,world:WORLD,version:3,installedBy:"regionwright-studio"};
 return true;
}

