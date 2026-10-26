// Cabin in the Ashen Veil — Rosewater staging safety contract.
// Planning-only, no native Foundry Scene IDs or GM state writes, until BATH-04/BATH-03 artwork and routes are verified.
// Interactive rings and canonical solution belong to Regionwright: Puzzles & Locks.
export const ROSEWATER_SCENE_CONTRACT_VERSION=1;
export const ROSEWATER_EXPECTED_ROOM_KEYS=Object.freeze(["bath04-reliquary","bath03-boiler"]);
export function rosewaterHatchDecision({water,ringSolved=false,drainedBathSceneVerified=false,
 dryBoilerExitVerified=false,hatchTransaction=null}={}){
 if(hatchTransaction?.status==="reserved")return"reconcile";
 if(hatchTransaction&&hatchTransaction.status!=="done")return"reconcile";
 if(!water||water.status!=="open"||water.pond!=="drained"||water.bath!=="drained")return"requires-drained-bath";
 if(!drainedBathSceneVerified)return"missing-approved-surface";
 if(!ringSolved)return"rings-unsolved";
 if(!dryBoilerExitVerified)return"missing-safe-boiler-exit";
 return"ready";
}
export function rosewaterRefillDecision({reliquaryTokenIds=[],boilerTokenIds=[],
 dryServiceDoorBidirectional=false,dryRoomDestinationsVerified=false,
 boilerIndependentOfPressure=false,pendingTransition=false}={}){
 if(pendingTransition)return"reconcile";
 const occupied=[...reliquaryTokenIds,...boilerTokenIds];
 if(!occupied.length)return"clear";
 if(!dryServiceDoorBidirectional||!dryRoomDestinationsVerified||!boilerIndependentOfPressure)return"unsafe-occupied-underground";
 return"safe-via-dry-boiler-exit";
}
export function rosewaterBowlPickupDecision({hatchOpen=false,authenticBowlSource=false,
 actorInReliquary=false,claim=null}={}){
 if(claim?.status==="done")return"already-claimed";
 if(claim)return"reconcile";
 if(!hatchOpen||!actorInReliquary)return"not-near-reliquary-plinth";
 if(!authenticBowlSource)return"missing-canonical-source";
 return"ready";
}
export function rosewaterWaterVariantRoute({water,wellDryExitVerified=false}={}){
 // The floor hatch is only available on the DRAINED Bathhouse scene.
 // The eastern Reliquary→Boiler dry exit is independent of water state,
 // but cannot be declared safe until both linked rooms and return destinations are verified.
 const drained=water?.status==="open"&&water?.pond==="drained"&&water?.bath==="drained";
 return{poolHatchEnabled:drained&&wellDryExitVerified,dryBoilerExitPersistent:wellDryExitVerified};
}
