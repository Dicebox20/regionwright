// CAV Chat B L1-J: pure source decisions. No GM sockets, item/scene mutations,
// native Region registration, player UI, or Foundry writes.
// "elected-gm-readback" is NOT an authentication scheme. Only an independently
// authenticated elected GM may build a native readback + execute native effects.
export const VAULT_CONTRACT_VERSION=1;
export const BASEMENT_WORKSHOP_SCENE="G6NMonfCwMvNzipL"; // Source/Historical Scene
export const SECURED_VAULT_SCENE="tjTpG2RVZNoCqRLh"; // Oct24 scene inventory; reread live
export const BASEMENT_ACCESS_FLAG="cavWeatheredBasementUnlocked";
export const ORIGINAL_GONDIAN_SOURCE="Item.pbmUZPfC3WnsBRgi";
export const ORIGINAL_GOND_HALF="Item.o9G3UJjEe2QX1ZH0";
export const ORIGINAL_SUNE_HALF="Item.t9uCIpsKeSvtC31w";
export const HISTORICAL_COMPLETED_EMBLEM="Item.vbDWTbnAZg65ErSS";
export const ORIGINAL_SCRYING_BOWL="Item.1n5LONw3nYIy61O9";
export const VAULT_SOCKET_KINDS=Object.freeze(["charged-source","gond-half","sune-half"]);
const SOURCES=Object.freeze({
 "charged-source":ORIGINAL_GONDIAN_SOURCE,
 "gond-half":ORIGINAL_GOND_HALF,
 "sune-half":ORIGINAL_SUNE_HALF
});
const str=x=>typeof x==="string"&&x.trim().length>0;
const itemId=x=>str(x)&&/^Item\.[^.]+$/.test(x);
const region=(v,s)=>str(s)&&str(v)&&v.startsWith("Scene."+s+".Region.")&&v.length>("Scene."+s+".Region.").length;
const trusted=r=>r?.version===VAULT_CONTRACT_VERSION&&r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const player=r=>r?.actorIsOwnedNonGmCharacterVerified===true&&
 r?.tokenAtOriginalFixtureVerified===true&&r?.explicitPlayerAction===true&&
 str(r.actorId)&&str(r.tokenId);
const basement=r=>r?.basementAccessFlagName===BASEMENT_ACCESS_FLAG&&
 r?.basementAccessStatus==="done"&&r?.weatheredKeyBasementEntryVerified===true&&
 r?.basementPortalIsGenuineAndEnabled===true&&r?.workshopSceneVerified===true&&
 r?.workshopSceneId===BASEMENT_WORKSHOP_SCENE;
const workshop=r=>trusted(r)&&player(r)&&basement(r)&&
 r.sceneId===BASEMENT_WORKSHOP_SCENE&&r.vaultActuatorRegionVerified===true&&
 region(r.vaultActuatorRegionUuid,BASEMENT_WORKSHOP_SCENE)&&
 r.originalVaultActuatorVerified===true&&r.actuatorHasExactlyThreeItemSockets===true;
const slotsKnown=r=>["empty","installed"].includes(r.chargedSourceSocketStatus)&&
 ["empty","installed"].includes(r.gondSocketStatus)&&["empty","installed"].includes(r.suneSocketStatus);
const slotsReserved=r=>r.chargedSourceSocketStatus==="reserved"||
 r.gondSocketStatus==="reserved"||r.suneSocketStatus==="reserved";
const slotStatus=(r,k)=>k==="charged-source"?r.chargedSourceSocketStatus:
 k==="gond-half"?r.gondSocketStatus:r.suneSocketStatus;
const originalFor=(r,kind)=>{
 const expected=SOURCES[kind];
 return r.originalWorldItemSourceReverified===true&&
 r.expectedOriginalSourceUuid===expected&&r.actorItemSourceUuid===expected&&
 r.actorItemType==="loot"&&r.actorHoldsVerifiedOriginalItem===true&&
 r.actorSourceIdentityPreserved===true&&r.sourceItemOriginLedgerDone===true&&
 r.itemPickupProvenanceVerified===true&&r.actorItemHasNoDuplicateCopies===true&&
 r.itemNotAlreadyInstalledInAnotherFixture===true&&
 (kind==="charged-source"?
   r.itemSourceName==="Uncharged Gondian Power Source"&&
   r.chargeState==="charged"&&r.originalSourceChargeLedgerDone===true&&
   r.canonicalVeilActiveVerified===true&&r.sourceChargedAtOriginalAqueductVerified===true:
  kind==="gond-half"?
   r.itemSourceName==="Gond Emblem Half"&&
   r.originalH_U05GondClaimDone===true&&r.gondClaimProvenanceVerified===true:
   r.itemSourceName==="Sune Emblem Half"&&
   r.originalSuneAltarClaimDone===true&&r.suneClaimProvenanceVerified===true);
};
export function planVaultSocketInstall(r,kind){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!VAULT_SOCKET_KINDS.includes(kind))return {action:"deny",reason:"unsupported-socket"};
 if(!workshop(r)||r.explicitInstallSocketKind!==kind)
   return {action:"deny",reason:"original-vault-workshop-context-not-certified"};
 if(slotsReserved(r)||r.vaultDoorLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-socket-or-door-reconciliation"};
 if(!slotsKnown(r))return {action:"gm-review",reason:"unknown-socket-status"};
 if(slotStatus(r,kind)==="installed")
   return r.installedCurrentSocketSourceReverified===true&&
     r.installedCurrentSocketSourceUuid===SOURCES[kind]
       ? {action:"no-op",reason:"socket-already-installed"}
       : {action:"gm-review",reason:"installed-socket-source-uncertain"};
 if(r.vaultDoorLedgerStatus!=="locked")
   return {action:"gm-review",reason:"door-state-not-locked"};
 if(r.originalSocketRegionVerified!==true||
    !region(r.socketRegionUuid,BASEMENT_WORKSHOP_SCENE)||
    r.socketAcceptsOnlySpecifiedSource!==true||
    !originalFor(r,kind)||r.nativeCustodyTransactionPlanVerified!==true)
   return {action:"deny",reason:"authentic-source-or-socket-provenance-not-certified"};
 // Three item sockets plus Basement access predicate = exactly FOUR readiness
 // checks. No fourth inserted component, no fifth "completed emblem" item.
 // GM must reserve one socket, move/hold the original item without duplicating,
 // independently reread installed identity, then complete the socket ledger.
 return {action:"gm-review-reserve-original-vault-socket",socket:kind};
}

export function planVaultTurnJoinedEmblem(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!workshop(r)||r.explicitTurnJoinedEmblem!==true||
    r.originalTurnControlRegionVerified!==true||
    !region(r.turnControlRegionUuid,BASEMENT_WORKSHOP_SCENE))
   return {action:"deny",reason:"not-original-joined-emblem-actuator-action"};
 if(slotsReserved(r)||r.vaultDoorLedgerStatus==="reserved"||
    r.plinthMarkerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-vault-transaction"};
 if(r.vaultDoorLedgerStatus==="open"&&["visible","claimed"].includes(r.plinthMarkerStatus)&&
    slotsKnown(r)&&VAULT_SOCKET_KINDS.every(k=>slotStatus(r,k)==="installed")&&
    r.actuatorAssemblyStatus==="joined")
   return r.installedOriginalsStillVerifiedOnReread===true&&
     r.vaultDoorNativeReadbackVerified===true&&
     r.sourceInstalledSourceUuid===ORIGINAL_GONDIAN_SOURCE&&
     r.gondInstalledSourceUuid===ORIGINAL_GOND_HALF&&
     r.suneInstalledSourceUuid===ORIGINAL_SUNE_HALF
     ? {action:"no-op",reason:"vault-already-open"}
     : {action:"gm-review",reason:"opened-vault-originals-uncertain"};
 if(!slotsKnown(r)||VAULT_SOCKET_KINDS.some(k=>slotStatus(r,k)!=="installed"))
   return {action:"deny",reason:"the-three-original-item-sockets-incomplete"};
 if(r.vaultDoorLedgerStatus!=="locked"||r.plinthMarkerStatus!=="hidden"||
    r.actuatorAssemblyStatus!=="ready")
   return {action:"gm-review",reason:"partial-vault-state"};
 if(r.sourceInstalledSourceUuid!==ORIGINAL_GONDIAN_SOURCE||
    r.gondInstalledSourceUuid!==ORIGINAL_GOND_HALF||
    r.suneInstalledSourceUuid!==ORIGINAL_SUNE_HALF||
    r.sourceInstalledChargedInPlaceVerified!==true||
    r.sourceChargeLedgerDoneVerified!==true||
    r.gondRewardH_U05LedgerDoneVerified!==true||
    r.suneStudioRewardLedgerDoneVerified!==true||
    r.completedEmblemIsMechanismNotFifthEarnedItem!==true||
    r.finalTurnRequiresNoExtraInventoryItem!==true||
    r.originalEmblemHasRoseAndGearGeometryVerified!==true)
   return {action:"deny",reason:"not-all-four-authentic-vault-predicates"};
 if(r.vaultSceneId!==SECURED_VAULT_SCENE||
    r.vaultSceneCurrentlyVerified!==true||
    r.originalWorkshopVaultDoorRegionVerified!==true||
    !region(r.workshopVaultDoorRegionUuid,BASEMENT_WORKSHOP_SCENE)||
    r.realNativeWorkshopVaultPortalVerified!==true||
    r.nativePortalDestinationRegionVerified!==true||
    r.originalVaultPlinthMarkerRegionVerified!==true||
    !region(r.vaultPlinthMarkerRegionUuid,SECURED_VAULT_SCENE)||
    r.safeWorkshopVaultArrivalAndReturnVerified!==true||
    r.vaultInitiallyClosedVerified!==true||
    r.keystoneWillNotBeGrantedByTurn!==true||
    r.scryingBowlFromVaultForbiddenVerified!==true)
   return {action:"deny",reason:"unsafe-vault-door-or-reward-layout"};
 // GM reserves locked→open + hidden→visible, enables original native portal,
 // verifies safe arrival+return and visible plinth without creating any reward.
 return {action:"gm-review-open-vault-and-expose-keystone-plinth",reason:"four-authentic-gates-complete"};
}
export function planVaultKeystonePickup(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!player(r)||r.sceneId!==SECURED_VAULT_SCENE||
    r.vaultSceneId!==SECURED_VAULT_SCENE||r.vaultSceneCurrentlyVerified!==true||
    r.originalVaultPlinthRegionVerified!==true||
    !region(r.plinthRegionUuid,SECURED_VAULT_SCENE)||
    r.explicitTakeKeystone!==true||r.actorAtKeystonePlinthVerified!==true)
   return {action:"deny",reason:"not-original-keystone-plinth-action"};
 if(r.keystoneGrantLedgerStatus==="reserved"||r.keystoneMarkerLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-keystone-claim"};
 if(r.keystoneGrantLedgerStatus==="done"&&r.keystoneMarkerLedgerStatus==="claimed")
   return r.keystoneClaimReceiptIndependentlyVerified===true
    ? {action:"no-op",reason:"keystone-already-claimed"}
    : {action:"gm-review",reason:"done-keystone-claim-unverified"};
 if(r.vaultDoorLedgerStatus!=="open"||
    r.actuatorAssemblyStatus!=="joined"||
    r.keystoneMarkerLedgerStatus!=="visible"||
    r.keystoneGrantLedgerStatus!=="none"||
    r.originalPlinthRewardPhysicalVisibleVerified!==true)
   return {action:"gm-review",reason:"vault-plinth-or-claim-state-not-ready"};
 // Keystone UUID is deliberately UNRESOLVED. The October 24 creation receipt
 // has no Keystone Item! Chat A must independently find a current approved source
 // or run the established owner-authorized Item creation workflow and reread it.
 if(r.currentWorldKeystoneItemReadbackVerified!==true||
    r.keystoneSourceApprovedByOwnerOrExistingCanonVerified!==true||
    !itemId(r.keystoneSourceUuid)||
    r.keystoneSourceName!=="Keystone"||r.keystoneSourceType!=="loot"||
    r.keystoneSourceUuid===ORIGINAL_SCRYING_BOWL||
    r.keystoneSourceUuid===HISTORICAL_COMPLETED_EMBLEM||
    r.keystoneSourceDistinctFromEveryVaultInputVerified!==true||
    r.keystoneSourceNotStagedAtBathReliquaryVerified!==true||
    r.worldwideKeystoneRewardCopies!==0||
    r.keystoneOriginalPlinthBindingVerified!==true)
   return {action:"deny",reason:"original-keystone-source-not-resolved"};
 // Real native GM adapter reserves, grants one approved source copy after explicit
 // pickup, rechecks inventory, and marks done. Never auto-award on opening the Vault.
 return {action:"gm-review-grant-single-original-keystone",reason:"reserve-before-authentic-keystone-reward"};
}
export function planVaultDoorRehydrate(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(r.vaultDoorLedgerStatus!=="open"||r.actuatorAssemblyStatus!=="joined"||
    r.vaultSceneId!==SECURED_VAULT_SCENE||
    r.workshopSceneId!==BASEMENT_WORKSHOP_SCENE||
    r.authoritativeVaultOpenReadbackVerified!==true)
   return {action:"deny",reason:"not-certified-as-open-original-vault"};
 if(r.nativePortalRehydrateLedger==="reserved")
   return {action:"gm-review",reason:"reserved-vault-rehydration"};
 if(r.physicalVaultPortalOpen===true&&r.safeReturnPortalOpen===true)
   return {action:"no-op",reason:"original-vault-route-already-open"};
 if(r.physicalVaultPortalOpen!==false||r.safeReturnPortalOpen!==false||
    r.originalNativePortalPairVerified!==true||
    r.safeArrivalAndReturnAfterSceneReloadVerified!==true||
    r.noItemOrPlinthRewardMutationDuringRestoreVerified!==true)
   return {action:"gm-review",reason:"uncertain-vault-travel-geometry"};
 return {action:"gm-review-restore-vault-portals-only",reason:"reopen-original-route-without-reward"};
}