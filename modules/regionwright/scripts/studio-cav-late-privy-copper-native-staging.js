// Chat B T18 — owner approved Privy Copper Tiny Key physical source staging.
// These native Region scripts intentionally have NO reward mutations and are
// installed DISABLED until authentic source-charge/Crimson Veil native authority
// exists. They do not manufacture GM Veil provenance from flags.
export const PRIVY_SCENE='xx1rWBiWMLxJPlrw';
export const PRIVY_MAP='Maps/cabin-in-the-ashen-veil/ext-04-privy-approved-v001.png';
export const PRIVY_RETURN='zVgVWvnpPetxlF5e';
export const PRIVY_ARRIVAL='663WrP9V8tPPOLvt';
export const COPPER='Item.D1LRRg4n7y7pRWvk';
export const GONDIAN='Item.pbmUZPfC3WnsBRgi';
export const PRIVY_FIXED_DC=12;
export const PRIVY_METHODS=Object.freeze(['careful-tools','Sleight of Hand','Survival']);
export const PRIVY_STAGES=Object.freeze([
 Object.freeze({kind:'retrieval',regionId:'CAVPRIVYRETRIEV1',behaviorId:'CAVPRIVYRETBH001',
   name:'EXT-04 - Copper Tiny Key in the old privy opening',
   rect:Object.freeze({x:760,y:400,width:160,height:195})}),
 Object.freeze({kind:'key-marker',regionId:'CAVPRIVYKEYMARK1',behaviorId:'CAVPRIVYKEYBH001',
   name:'EXT-04 - Revealed Copper Tiny Key recovery spot',
   rect:Object.freeze({x:785,y:630,width:130,height:130})})
]);
// First-stage output is GM REVIEW only. A future elected-GM service must read
// canonical Aqueduct source-charge and Crimson Veil once-only receipts, verify
// actual owner character and official roll, and persist reserve -> effect -> done.
export function reviewCopperRetrieval(input){
 if(!input||input.worldId!=='cabin-in-the-ashen-veil'||
  input.activeElectedGMVerified!==true||
  input.sceneId!==PRIVY_SCENE||
  input.originalMapVerified!==true||
  input.playerOwnsActorVerified!==true||
  input.playerAtOriginalOpeningVerified!==true||
  input.explicitPlayerAction!==true)return {action:'deny',reason:'unverified-original-interaction'};
 if(input.originalCopperSourceUuid!==COPPER||
  input.originalWorldCopperLibraryStatus!=='GM_LIBRARY_ONLY'||
  input.currentCopperActorCopies!==0)return {action:'deny',reason:'original-source-missing-or-duplicate'};
 if(input.authenticatedCrimsonVeilStatus!=='active'||
  input.veilOnceOnlyTransitionCount!==1||
  input.originalGondianSourceUuid!==GONDIAN||
  input.verifiedOriginalGondianChargeReceipt!==true||
  input.safeReturnPortalStillPresent!==true)return {action:'deny',reason:'canonical-veil-not-authenticated'};
 if(input.retrievalLedgerStatus==='reserved')return {action:'gm-review',reason:'uncertain-reserved-recovery'};
 if(input.retrievalLedgerStatus==='resolved')return {action:'no-op',reason:'already-resolved'};
 if(!['none','retryable'].includes(input.retrievalLedgerStatus))
  return {action:'deny',reason:'unexpected-retrieval-state'};
 if(input.method==='careful-tools'){
  return input.reasonableToolsApprovedByGM===true?
    {action:'gm-review-resolve',reason:'careful-tools-no-roll'}:
    {action:'deny',reason:'careful-tools-not-reviewed'};
 }
 if(!['Sleight of Hand','Survival'].includes(input.method)||
   input.DC!==PRIVY_FIXED_DC||
   input.officialDnd5eRollVerified!==true||
   !Number.isInteger(input.rollTotal))return {action:'deny',reason:'unverified-dc12-check'};
 return input.rollTotal>=PRIVY_FIXED_DC?
  {action:'gm-review-resolve',reason:'successful-official-dc12'}:
  {action:'gm-review-retry',reason:'failed-official-dc12-no-permanent-loss'};
}
const body=String.raw`
const NS='dicebox-campaign-helper';
if(game?.world?.id!=='cabin-in-the-ashen-veil'||!game?.ready||
  scene?.id!=='xx1rWBiWMLxJPlrw'||region?.id!==__REGION__)return;
if(!['behaviorViewed','behaviorUnviewed','behaviorDeactivated'].includes(event?.name))return;
const KEY='__CAV_B18_PRIVY_'+region.id;
if(event.name==='behaviorUnviewed'||event.name==='behaviorDeactivated'){
  const old=globalThis[KEY];if(old?.handler&&canvas?.stage)canvas.stage.off('pointertap',old.handler);
  delete globalThis[KEY];return;
}
// Information-only inspection. The future native GM authorization service must
// commission the real method and award explicitly; never enable this bare
// historical placeholder or treat a player-side click as a signed receipt.
if(globalThis[KEY]?.handler&&canvas?.stage)canvas.stage.off('pointertap',globalThis[KEY].handler);
const handler=async pointer=>{
 if(!canvas?.ready||canvas.scene?.id!=='xx1rWBiWMLxJPlrw')return;
 const at=canvas.stage.toLocal(pointer.global);
 if(!region.testPoint({x:at.x,y:at.y,elevation:0}))return;
 const content=__KIND__==='retrieval'?
 'An unpleasant opening hides a tiny metallic glint. Once the Crimson Veil is genuinely active, a careful tool may recover the key without a roll, or an official DC 12 Sleight of Hand or Survival check may be retried after failure. The Copper Tiny Key cannot be awarded just by entering this Region.':
 'A Copper Tiny Key may become recoverable here after an authenticated Privy retrieval. Until then the spot is empty.';
 await foundry.applications.api.DialogV2.prompt({window:{title:'EXT-04 — Privy'},
  content:'<p>'+content+'</p>',ok:{label:'Close',callback:()=>true},rejectClose:false});
};
if(canvas?.stage){canvas.stage.on('pointertap',handler);globalThis[KEY]={handler};}
return;
`;
export function privyNativeReadOnlySource(kind){
 const c=PRIVY_STAGES.find(x=>x.kind===kind);
 if(!c)throw Error('Unsupported Privy late original stage');
 return body.replace('__REGION__',JSON.stringify(c.regionId))
            .replace('__KIND__',JSON.stringify(kind)).trim();
}