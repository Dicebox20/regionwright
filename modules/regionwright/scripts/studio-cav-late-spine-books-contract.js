// CAV Chat B L1-I: isolated pure contracts; actual Regionwright UI owned by Regionwright.
// NEVER trust player-controlled "elected-gm-readback" text as authentication.
// Integrator must derive all authority, native Item provenance and transaction
// receipts server-side as actual elected active GM. No hooks, sockets, or writes.
import {validateSpineMosaicConfig,evaluateSpineCollection,evaluateSpineOrder} from "../../regionwright-puzzles-locks/scripts/spine-mosaic-engine.js";
export const CAV_SPINE_VERSION=1;
export const SOPHIA_SCENE_ID="CAVHU05Scene0001";
export const ORIGINAL_GOND_HALF="Item.o9G3UJjEe2QX1ZH0"; // Historical Oct24 source only
export const CAV_BOOK_MANIFEST=Object.freeze([
  Object.freeze({id:"Item.Qplmy8JR7plDYLiY",year:1442,title:"The Knight Who Befriended a Dragon",origin:"sophia-bookshelf"}),
  Object.freeze({id:"Item.DLGIhHc0RDqh0YVt",year:1443,title:"Moonlight and the Missing Stars",origin:"attic"}),
  Object.freeze({id:"Item.TO69wBYN8sRJuxtH",year:1444,title:"Felix Fox and the Forgotten Kingdom",origin:"pond-hollow-log"}),
  Object.freeze({id:"Item.c3oKW8YkklE8slnX",year:1445,title:"Whispers of the Little Witch",origin:"sophia-bookshelf"}),
  Object.freeze({id:"Item.HV7XjKmgqVITSEvW",year:1446,title:"The Clockmaker's Starless Sky",origin:"chimney-flue"}),
  Object.freeze({id:"Item.gmTsIOqc3qFBc3zA",year:1447,title:"Princess Penelope and the Sea of Stars",origin:"sophia-bed-after-veil"})
]);
export const CAV_SPINE_CONFIG=validateSpineMosaicConfig({
 version:1,seed:"cav-original-1442-1447",
 books:CAV_BOOK_MANIFEST.map(b=>({id:b.id,title:b.title})),
 solution:CAV_BOOK_MANIFEST.map(b=>b.id)
});
const str=v=>typeof v==="string"&&v.trim().length>0;
const region=(v,scene)=>str(scene)&&str(v)&&v.startsWith("Scene."+scene+".Region.")&&v.length>("Scene."+scene+".Region.").length;
const normalizedTitle=v=>typeof v==="string"?v.normalize("NFKC").replace(/[\u2018\u2019]/g,"'").replace(/\s+/g," ").trim():"";
const trusted=r=>r?.version===CAV_SPINE_VERSION&&r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const atSophia=r=>trusted(r)&&r.sophiaSceneId===SOPHIA_SCENE_ID&&r.sophiaSceneReverified===true&&
 r.activeNonGmActorOwnerVerified===true&&str(r.actorId)&&str(r.tokenId)&&
 r.approvedInRoomCompartmentPlanVerified===true&&r.compartmentSceneId===SOPHIA_SCENE_ID&&
 r.hU06SeparateRoomTargetPresent!==true;
const active=r=>atSophia(r)&&
 r.originalSpineRegionVerified===true&&region(r.spineRegionUuid,SOPHIA_SCENE_ID)&&
 r.activeNonGmActorOwnerVerified===true&&r.ownedTokenAtSpineVerified===true&&
 str(r.actorId)&&str(r.tokenId)&&r.explicitPlayerSubmission===true&&
 r.spinePuzzleOwnedByRegionwright===true&&r.approvedInRoomCompartmentPlanVerified===true&&
 r.compartmentSceneId===SOPHIA_SCENE_ID&&r.hU06SeparateRoomTargetPresent!==true&&
 r.sixSlotsBoundToOriginalItemsVerified===true;
const veil=r=>r.canonicalVeilPhase==="active"&&r.veilTransitionCount===1&&
 r.chargedGondianSourceVerified===true&&r.ownerVeilProofFromGmReadback===true;

export function planVeilSixthStorybookPickup(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(r.sophiaSceneId!==SOPHIA_SCENE_ID||r.sophiaSceneReverified!==true||
    !region(r.bedBookRegionUuid,SOPHIA_SCENE_ID)||r.bedBookRegionVerified!==true||
    r.ownedTokenAtBookVerified!==true||r.activeNonGmActorOwnerVerified!==true||
    r.explicitPlayerBookPickup!==true||!str(r.actorId)||!str(r.tokenId))
   return {action:"deny",reason:"sophia-bed-player-context-not-certified"};
 if(!veil(r)||r.sixthBookVeilProjectionVerified!==true||
    r.originalSixthBookStagedOnBedVerified!==true)
   return {action:"deny",reason:"sixth-book-before-veil-or-not-staged"};
 if(r.sixthBookClaimLedger==="reserved")return {action:"gm-review",reason:"reserved-sixth-book-claim"};
 if(r.sixthBookClaimLedger==="done")return {action:"no-op",reason:"sixth-book-already-claimed"};
 if(r.sixthBookClaimLedger!=="none")return {action:"gm-review",reason:"unknown-sixth-book-ledger"};
 if(r.originalSourceItemReverified!==true||
    r.sixthBookItemUuid!==CAV_BOOK_MANIFEST[5].id||
    normalizedTitle(r.sixthBookItemTitle)!==normalizedTitle(CAV_BOOK_MANIFEST[5].title)||
    r.sixthBookSourceType!=="loot"||r.sixthBookPublicationYear!==1447||
    r.readablePublicationYearInJournalVerified!==true||
    r.worldwideSixthBookRewardCopies!==0)
   return {action:"deny",reason:"original-princess-source-or-year-not-certified"};
 return {action:"gm-review-claim-one-sixth-book",reason:"reserve-before-once-only-veil-book"};
}
function certifyBook(b,expected,r){
 if(!b||b.sourceUuid!==expected.id||b.originalWorldItemReverified!==true||
    b.sourceItemType!=="loot"||normalizedTitle(b.sourceItemTitle)!==normalizedTitle(expected.title)||
    b.journalPublishedYearVerified!==true||b.publicationYear!==expected.year||
    b.originCode!==expected.origin||b.originalAcquisitionProvenanceVerified!==true||
    b.duplicateOrCounterfeitFound!==false)return false;
 if(b.currentContext==="sophia-bookshelf")return expected.origin==="sophia-bookshelf"&&
   b.preplacedShelfFixtureVerified===true&&b.bookPhysicallyPresentOnShelf===true;
 if(b.currentContext==="party-actor-inventory")return b.partyActorOwnerReadbackVerified===true&&
   b.actorInventoryEmbeddedBookVerified===true&&str(b.actorId)&&
   (b.actorAcquisitionLedgerDone===true||expected.origin==="sophia-bookshelf"&&
     b.originalShelfCollectionVerified===true)&&
   (expected.origin!=="sophia-bed-after-veil"||veil(r)&&
     r.sixthBookClaimLedger==="done"&&b.actorAcquisitionLedgerDone===true);
 return false;
}
export function planSpineMosaicSubmission(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!active(r))return {action:"deny",reason:"sophia-spine-player-or-room-not-certified"};
 if(r.spineLedgerStatus==="reserved"||r.compartmentLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-spine-transaction"};
 if(r.spineLedgerStatus==="solved"&&r.compartmentLedgerStatus==="revealed")
   return {action:"no-op",reason:"spine-already-solved"};
 if(r.spineLedgerStatus!=="unsolved"||r.compartmentLedgerStatus!=="concealed")
   return {action:"gm-review",reason:"unknown-spine-or-compartment-ledger"};
 if(!veil(r)||r.sixthBookClaimLedger!=="done"||
    r.sixthBookVeilProjectionVerified!==true)
   return {action:"deny",reason:"veil-era-sixth-book-not-authentically-obtained"};
 const books=r.verifiedBooks;
 if(!Array.isArray(books)||books.length!==6||
    new Set(books.map(b=>b?.sourceUuid)).size!==6||
    CAV_BOOK_MANIFEST.some(expected=>!certifyBook(
      books.find(b=>b?.sourceUuid===expected.id),expected,r)))
   return {action:"deny",reason:"six-original-published-books-not-certified"};
 const gathered=evaluateSpineCollection(CAV_SPINE_CONFIG,books.map(b=>b.sourceUuid));
 if(!gathered.valid||!gathered.complete)
   return {action:"deny",reason:"collection-not-authenticated"};
 if(r.spineInputAuthenticatedByGm!==true||
    r.spineUiSessionBoundToRegionAndActor!==true||
    !Array.isArray(r.submittedSourceOrder))
   return {action:"deny",reason:"unverified-regionwright-submission"};
 const result=evaluateSpineOrder(CAV_SPINE_CONFIG,r.submittedSourceOrder);
 if(!result.valid)return {action:"deny",reason:"invalid-spine-order-payload"};
 if(!result.success)return {action:"gm-review-wrong-order-retry",reason:"rearrangement-reversible-no-item-loss"};
 if(r.originalHiddenCompartmentRegionVerified!==true||
    !region(r.compartmentRegionUuid,SOPHIA_SCENE_ID)||
    r.compartmentClosedGeometryVerified!==true||
    r.safelyRevealInRoomCompartmentVerified!==true)
   return {action:"deny",reason:"in-room-compartment-geometry-not-certified"};
 return {action:"gm-review-reveal-hu05-compartment",reason:"reserve-before-reveal-without-consuming-books"};
}
export function planGondHalfCompartmentPickup(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!atSophia(r)||r.explicitGondPickup!==true||
    r.originalCompartmentPickupActorVerified!==true||
    r.ownedTokenAtCompartmentVerified!==true||
    r.originalHiddenCompartmentRegionVerified!==true||
    !region(r.compartmentRegionUuid,SOPHIA_SCENE_ID))
   return {action:"deny",reason:"not-authentic-in-room-gond-pickup"};
 if(r.gondClaimLedger==="reserved")return {action:"gm-review",reason:"reserved-gond-claim"};
 if(r.gondClaimLedger==="done")return {action:"no-op",reason:"gond-half-already-claimed"};
 if(r.gondClaimLedger!=="none"||
    r.spineLedgerStatus!=="solved"||r.compartmentLedgerStatus!=="revealed"||
    r.compartmentCurrentlyVisibleVerified!==true)
   return {action:"gm-review",reason:"compartment-or-gond-ledger-not-ready"};
 if(!veil(r)||r.originalGondItemReverified!==true||
    r.gondItemUuid!==ORIGINAL_GOND_HALF||r.gondItemName!=="Gond Emblem Half"||
    r.gondItemType!=="loot"||r.worldwideGondRewardCopyCount!==0||
    r.gondRewardStagedInOriginalCompartment!==true||
    r.distinctFromSuneEmblemHalfVerified!==true)
   return {action:"deny",reason:"original-gond-half-or-veil-not-certified"};
 return {action:"gm-review-grant-one-gond-half",reason:"reserve-before-original-compartment-reward"};
}
// Recover persistent in-room compartment geometry after reload; never respawn a reward.
// Caller must apply owner-approved native Region/Tile art with original geometry and
// inspect it independently, not build H-U06 or grant another Gond half.
export function planSpineCompartmentRehydrate(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!atSophia(r)||r.spineLedgerStatus!=="solved"||
    r.compartmentLedgerStatus!=="revealed"||
    r.originalHiddenCompartmentRegionVerified!==true||
    !region(r.compartmentRegionUuid,SOPHIA_SCENE_ID))
   return {action:"deny",reason:"not-authentic-solved-hu05-compartment"};
 if(r.compartmentRehydrateStatus==="reserved")
   return {action:"gm-review",reason:"reserved-rehydrate-transaction"};
 if(r.compartmentGeometryPresent===true)
   return {action:"no-op",reason:"compartment-already-visible"};
 if(r.compartmentGeometryPresent!==false||
    r.originalCompartmentSafeGeometryVerified!==true||
    r.rehydrateDoesNotGrantItemsVerified!==true||
    r.existingGondGrantLedgerUnchangedVerified!==true)
   return {action:"gm-review",reason:"unsafe-or-unknown-compartment-geometry"};
 return {action:"gm-review-rehydrate-hu05-compartment",reason:"restore-only-in-room-puzzle-visuals"};
}