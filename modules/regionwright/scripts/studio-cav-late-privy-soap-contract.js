// CAV Chat B L1-G / 2026-10-26: read-only plans, never native Foundry mutations.
// Every receipt MUST be independently prepared by an authenticated elected-GM service.
// The origin string below is NOT itself an authentication mechanism.
// Live original Item, Scene and Region identity must be reverified by Chat A.
export const CAV_PRIVY_SOAP_VERSION = 1;
export const HISTORICAL_PRIVY_SCENE = "xx1rWBiWMLxJPlrw";
export const HISTORICAL_PRIVY_RETURN_REGION = "Scene.xx1rWBiWMLxJPlrw.Region.zVgVWvnpPetxlF5e";
export const HISTORICAL_PRIVY_LANDING_REGION = "Scene.xx1rWBiWMLxJPlrw.Region.663WrP9V8tPPOLvt";
export const ORIGINAL_COPPER_KEY = "Item.D1LRRg4n7y7pRWvk";
export const ORIGINAL_LYE = "Item.vDR4cJU35iODR6gh";
const txt=v=>typeof v==="string"&&v.trim().length>0;
const region=(v,scene)=>txt(scene)&&txt(v)&&v.startsWith("Scene."+scene+".Region.")&&v.length>("Scene."+scene+".Region.").length;
const trusted=r=>r?.version===CAV_PRIVY_SOAP_VERSION&&r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const player=r=>r?.explicitPlayerAction===true&&r.activeNonGmOwnerVerified===true&&r.ownedTokenAtFixture===true&&txt(r.actorId)&&txt(r.tokenId);
const veil=r=>r?.canonicalVeilStatus==="active"&&r?.canonicalVeilTransitionCount===1&&r?.veilStateFromGmReadback===true;
const privy=r=>trusted(r)&&player(r)&&veil(r)&&r.privySceneId===HISTORICAL_PRIVY_SCENE&&
 r.currentPrivySceneReverified===true&&r.originalPrivyFixtureVerified===true&&
 region(r.retrievalRegionUuid,HISTORICAL_PRIVY_SCENE)&&r.retrievalRegionReverified===true&&
 r.privyVeilProjectionStatus==="done"&&r.safePrivyReturnRouteVerified===true&&
 r.originalPrivyReturnRegionUuid===HISTORICAL_PRIVY_RETURN_REGION&&r.returnDestinationVerified===true;
const copperSource=r=>r?.originalCopperSourceReverified===true&&
 r.copperSourceUuid===ORIGINAL_COPPER_KEY&&r.copperSourceName==="Copper Tiny Key"&&
 r.copperSourceType==="loot"&&r.worldwideCopperRewardCopyCount===0;

// Skill fallback is strictly DC 12. Failure is retriable, never removes unique items.
// Other reasonable tools may be approved directly by elected GM without rolling.
// Fishing parody is OPTIONAL and must not make progression dependent on RNG/modules.
export function planPrivyRetrievalAttempt(r) {
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!privy(r))return {action:"deny",reason:"privy-phase-or-player-not-certified"};
 if(r.retrievalStatus==="reserved")return {action:"gm-review",reason:"reserved-privy-transaction"};
 if(r.retrievalStatus==="resolved")return {action:"no-op",reason:"retrieval-already-resolved"};
 if(!["untried","retryable"].includes(r.retrievalStatus))
   return {action:"gm-review",reason:"unknown-privy-retrieval-state"};
 if(!copperSource(r))return {action:"deny",reason:"original-copper-item-not-certified"};
 if(r.retrievalMethod==="skill"){
   if(!["Sleight of Hand","Survival"].includes(r.ability)||r.officialCheckDC!==12||
     r.rollIndependentlyVerified!==true||!Number.isInteger(r.totalRoll))
     return {action:"deny",reason:"unverified-dc12-fallback-roll"};
   if(r.totalRoll<12)return {action:"gm-review-retry",reason:"failed-check-can-repeat-with-time-cost"};
   return {action:"gm-review-resolve-retrieval",method:"skill"};
 }
 if(r.retrievalMethod==="careful-tools"){
   if(r.retrievalToolReasonableApprovedByGm!==true||r.nonRollRetrievalSafe!==true)
     return {action:"deny",reason:"unapproved-careful-retrieval"};
   return {action:"gm-review-resolve-retrieval",method:"careful-tools"};
 }
 if(r.retrievalMethod==="fishing-parody"){
   if(r.optionalFishingModuleActuallyVerified!==true||r.fishingCatchGmVerified!==true||
      r.fishingResultLabel!=="Legendary Fish")
     return {action:"gm-review-fallback",reason:"optional-fishing-unavailable-or-unsuccessful"};
   return {action:"gm-review-resolve-retrieval",method:"fishing-parody"};
 }
 return {action:"deny",reason:"unsupported-retrieval-method"};
}
export function planPrivyCopperKeyPickup(r) {
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!privy(r)||r.explicitCopperPickupAction!==true||
    r.ownedTokenAtCopperMarker!==true||r.copperMarkerReverified!==true||
    !region(r.copperMarkerRegionUuid,HISTORICAL_PRIVY_SCENE))
   return {action:"deny",reason:"no-authenticated-copper-pickup"};
 if(r.copperGrantStatus==="reserved"||r.copperMarkerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-copper-claim"};
 if(r.copperGrantStatus==="done"&&r.copperMarkerStatus==="claimed")
   return {action:"no-op",reason:"already-claimed"};
 if(r.retrievalStatus!=="resolved"||r.copperMarkerStatus!=="visible"||r.copperGrantStatus!=="none")
   return {action:"gm-review",reason:"retrieval-not-yet-visible-or-ledger-uncertain"};
 if(!copperSource(r)||r.originalKeyMarkedRecoverable!==true)
   return {action:"deny",reason:"original-copper-or-recoverability-not-certified"};
 return {action:"gm-review-grant-single-copper-key",reason:"reserve-before-authentic-item-grant"};
}

const soap=r=>trusted(r)&&player(r)&&veil(r)&&txt(r.soapSceneId)&&
 r.soapRoomSceneVerified===true&&r.soapRoomCanonCode==="BATH-02"&&
 region(r.soapCaseRegionUuid,r.soapSceneId)&&r.soapCaseRegionVerified===true;
export function planSoapRoomLyeCaseUnlock(r) {
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!soap(r)||r.explicitUnlockCaseAction!==true)
   return {action:"deny",reason:"soap-case-or-player-not-certified"};
 if(r.caseLedgerStatus==="reserved")return {action:"gm-review",reason:"reserved-case-transaction"};
 if(r.caseLedgerStatus==="unlocked")return {action:"no-op",reason:"case-already-unlocked"};
 if(r.caseLedgerStatus!=="locked")return {action:"gm-review",reason:"unknown-case-ledger"};
 if(r.originalCopperSourceReverified!==true||r.expectedCopperSourceUuid!==ORIGINAL_COPPER_KEY||
    r.actorCarriesOriginalCopperKey!==true||r.actorCopperSourceUuid!==ORIGINAL_COPPER_KEY||
    r.actorCopperAcquisitionFromPrivyVerified!==true||
    r.originalCopperKeyItemType!=="loot"||r.sourceKeyIdentityUnmodified!==true)
   return {action:"deny",reason:"authentic-privy-copper-key-not-certified"};
 return {action:"gm-review-unlock-soap-case",reason:"reserve-before-permanent-case-unlock"};
}
export function planSoapRoomLyePickup(r) {
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!soap(r)||r.explicitLyePickupAction!==true||r.ownedTokenAtLyeCase!==true)
   return {action:"deny",reason:"no-authenticated-soap-lye-pickup"};
 if(r.lyeClaimLedgerStatus==="reserved")return {action:"gm-review",reason:"reserved-lye-claim"};
 if(r.lyeClaimLedgerStatus==="done")return {action:"no-op",reason:"lye-already-claimed"};
 if(r.lyeClaimLedgerStatus!=="none"||r.caseLedgerStatus!=="unlocked")
   return {action:"gm-review",reason:"case-or-lye-ledger-uncertain"};
 if(r.originalLyeSourceReverified!==true||r.originalLyeSourceUuid!==ORIGINAL_LYE||
    r.originalLyeName!=="Lye"||r.originalLyeItemType!=="loot"||
    r.worldwideLyeQuestRewardCount!==0||r.lyeCaseContainsOriginalQuestItem!==true)
   return {action:"deny",reason:"original-fictional-lye-source-not-certified"};
 // No real caustic chemistry, concentrations, ingredient amounts or consumption rule.
 return {action:"gm-review-grant-single-quest-lye",reason:"reserve-before-quest-item-grant"};
}