import test from "node:test";
import assert from "node:assert/strict";
import {
 CAV_BOOK_MANIFEST,CAV_SPINE_CONFIG,SOPHIA_SCENE_ID,ORIGINAL_GOND_HALF,
 planVeilSixthStorybookPickup,planSpineMosaicSubmission,
 planGondHalfCompartmentPickup,planSpineCompartmentRehydrate
} from "../modules/regionwright/scripts/studio-cav-late-spine-books-contract.js";
import {evaluateSpineOrder,evaluateSpineCollection} from "../modules/regionwright-puzzles-locks/scripts/spine-mosaic-engine.js";

const veil=()=>({canonicalVeilPhase:"active",veilTransitionCount:1,
 chargedGondianSourceVerified:true,ownerVeilProofFromGmReadback:true});
const allBooks=()=>CAV_BOOK_MANIFEST.map((b,i)=>({
 sourceUuid:b.id,sourceItemTitle:b.title,sourceItemType:"loot",
 originalWorldItemReverified:true,publicationYear:b.year,journalPublishedYearVerified:true,
 originCode:b.origin,originalAcquisitionProvenanceVerified:true,
 duplicateOrCounterfeitFound:false,
 currentContext:b.origin==="sophia-bookshelf"?"sophia-bookshelf":"party-actor-inventory",
 preplacedShelfFixtureVerified:i===0||i===3,bookPhysicallyPresentOnShelf:i===0||i===3,
 partyActorOwnerReadbackVerified:i!==0&&i!==3,
 actorInventoryEmbeddedBookVerified:i!==0&&i!==3,
 actorId:i===0||i===3?undefined:"OWNED-BOOK-ACTOR",
 actorAcquisitionLedgerDone:i!==0&&i!==3
}));
const scene=()=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 sophiaSceneId:SOPHIA_SCENE_ID,sophiaSceneReverified:true,
 originalSpineRegionVerified:true,spineRegionUuid:"Scene.CAVHU05Scene0001.Region.SPINE",
 activeNonGmActorOwnerVerified:true,ownedTokenAtSpineVerified:true,
 actorId:"ACTOR",tokenId:"TOKEN",explicitPlayerSubmission:true,
 spinePuzzleOwnedByRegionwright:true,approvedInRoomCompartmentPlanVerified:true,
 compartmentSceneId:SOPHIA_SCENE_ID,hU06SeparateRoomTargetPresent:false,
 sixSlotsBoundToOriginalItemsVerified:true,
 ...veil(),sixthBookClaimLedger:"done",sixthBookVeilProjectionVerified:true,
 spineLedgerStatus:"unsolved",compartmentLedgerStatus:"concealed",
 verifiedBooks:allBooks(),spineInputAuthenticatedByGm:true,
 spineUiSessionBoundToRegionAndActor:true,
 submittedSourceOrder:CAV_BOOK_MANIFEST.map(b=>b.id),
 originalHiddenCompartmentRegionVerified:true,
 compartmentRegionUuid:"Scene.CAVHU05Scene0001.Region.CONCEALED",
 compartmentClosedGeometryVerified:true,safelyRevealInRoomCompartmentVerified:true,
 originalCompartmentPickupActorVerified:true,explicitGondPickup:true,
 ownedTokenAtCompartmentVerified:true,compartmentCurrentlyVisibleVerified:true,
 gondClaimLedger:"none",originalGondItemReverified:true,gondItemUuid:ORIGINAL_GOND_HALF,
 gondItemName:"Gond Emblem Half",gondItemType:"loot",
 worldwideGondRewardCopyCount:0,gondRewardStagedInOriginalCompartment:true,
 distinctFromSuneEmblemHalfVerified:true,
 compartmentRehydrateStatus:"none",compartmentGeometryPresent:false,
 originalCompartmentSafeGeometryVerified:true,rehydrateDoesNotGrantItemsVerified:true,
 existingGondGrantLedgerUnchangedVerified:true
});
const sixth=()=>({
 ...scene(),bedBookRegionUuid:"Scene.CAVHU05Scene0001.Region.SOPHIABED",
 bedBookRegionVerified:true,ownedTokenAtBookVerified:true,explicitPlayerBookPickup:true,
 originalSixthBookStagedOnBedVerified:true,sixthBookClaimLedger:"none",
 originalSourceItemReverified:true,sixthBookItemUuid:CAV_BOOK_MANIFEST[5].id,
 sixthBookItemTitle:CAV_BOOK_MANIFEST[5].title,sixthBookSourceType:"loot",
 sixthBookPublicationYear:1447,readablePublicationYearInJournalVerified:true,
 worldwideSixthBookRewardCopies:0
});
const gond=(x={})=>({...scene(),spineLedgerStatus:"solved",compartmentLedgerStatus:"revealed",...x});

test("all six historically original UUIDs and years agree with locked LOCK-11",()=>{
 assert.deepEqual(CAV_BOOK_MANIFEST.map(b=>b.year),[1442,1443,1444,1445,1446,1447]);
 assert.deepEqual(CAV_BOOK_MANIFEST.map(b=>b.id),[
 "Item.Qplmy8JR7plDYLiY","Item.DLGIhHc0RDqh0YVt",
 "Item.TO69wBYN8sRJuxtH","Item.c3oKW8YkklE8slnX",
 "Item.HV7XjKmgqVITSEvW","Item.gmTsIOqc3qFBc3zA"
 ]);
 assert.equal(ORIGINAL_GOND_HALF,"Item.o9G3UJjEe2QX1ZH0");
 assert.equal(CAV_SPINE_CONFIG.solution.length,6);
});
test("Regionwright existing engine accepts canonical years ascending order",()=>{
 assert.equal(evaluateSpineOrder(CAV_SPINE_CONFIG,CAV_BOOK_MANIFEST.map(b=>b.id)).success,true);
 assert.equal(evaluateSpineCollection(CAV_SPINE_CONFIG,CAV_BOOK_MANIFEST.map(b=>b.id)).complete,true);
});
test("veil-only Princess book can be collected from authentic Sophia bed",()=>{
 assert.equal(planVeilSixthStorybookPickup(sixth()).action,"gm-review-claim-one-sixth-book");
});
for(const patch of [
 {canonicalVeilPhase:"dormant"},{veilTransitionCount:2},
 {chargedGondianSourceVerified:false},{ownerVeilProofFromGmReadback:false},
 {sixthBookVeilProjectionVerified:false},{originalSixthBookStagedOnBedVerified:false}
])test("sixth-book pickup never occurs before genuine Veil staging "+JSON.stringify(patch),()=>{
 assert.equal(planVeilSixthStorybookPickup({...sixth(),...patch}).action,"deny");
});
for(const patch of [
 {sophiaSceneId:"H-U06"},{sophiaSceneReverified:false},
 {bedBookRegionUuid:"Scene.WRONG.Region.BED"},{bedBookRegionVerified:false},
 {ownedTokenAtBookVerified:false},{activeNonGmActorOwnerVerified:false},
 {explicitPlayerBookPickup:false},{origin:"client"},
 {originalSourceItemReverified:false},{sixthBookItemUuid:"Item.FAKE"},
 {sixthBookItemTitle:"A fake bedtime story"},{sixthBookSourceType:"weapon"},
 {sixthBookPublicationYear:1442},{readablePublicationYearInJournalVerified:false},
 {worldwideSixthBookRewardCopies:1}
])test("sixth book exact original source/bed/owner required "+JSON.stringify(patch),()=>{
 assert.equal(planVeilSixthStorybookPickup({...sixth(),...patch}).action,"deny");
});
test("reserved sixth book prevents duplicate and done is idempotent",()=>{
 assert.equal(planVeilSixthStorybookPickup({...sixth(),sixthBookClaimLedger:"reserved"}).action,"gm-review");
 assert.equal(planVeilSixthStorybookPickup({...sixth(),sixthBookClaimLedger:"done"}).action,"no-op");
});
test("real six books, two shelf + four actor-held, unlock H-U05 in-room review",()=>{
 assert.equal(planSpineMosaicSubmission(scene()).action,"gm-review-reveal-hu05-compartment");
});
test("preplaced Knight and Whispers may be moved to authentic actor inventory",()=>{
 const v=scene();for(const i of [0,3]){
   v.verifiedBooks[i]={...v.verifiedBooks[i],currentContext:"party-actor-inventory",
     partyActorOwnerReadbackVerified:true,actorInventoryEmbeddedBookVerified:true,
     actorId:"PC",originalShelfCollectionVerified:true};
 }assert.equal(planSpineMosaicSubmission(v).action,"gm-review-reveal-hu05-compartment");
});
test("starting shelf art order is NOT the solution",()=>{
 const v=scene();
 v.submittedSourceOrder=[v.submittedSourceOrder[3],...v.submittedSourceOrder.filter((_,i)=>i!==3)];
 assert.equal(planSpineMosaicSubmission(v).action,"gm-review-wrong-order-retry");
});
test("incorrect chronological order can be reversed with zero item loss",()=>{
 const v=scene();[v.submittedSourceOrder[0],v.submittedSourceOrder[1]]=[v.submittedSourceOrder[1],v.submittedSourceOrder[0]];
 assert.equal(planSpineMosaicSubmission(v).action,"gm-review-wrong-order-retry");
});
for(const patch of [
 {origin:"client"},{worldId:"WRONG"},{sophiaSceneId:"OTHER"},
 {sophiaSceneReverified:false},{originalSpineRegionVerified:false},
 {spineRegionUuid:"Scene.WRONG.Region.SPINE"},{activeNonGmActorOwnerVerified:false},
 {ownedTokenAtSpineVerified:false},{explicitPlayerSubmission:false},
 {spinePuzzleOwnedByRegionwright:false},{approvedInRoomCompartmentPlanVerified:false},
 {compartmentSceneId:"H-U06"},{hU06SeparateRoomTargetPresent:true},
 {sixSlotsBoundToOriginalItemsVerified:false}
])test("never display invented H-U06 / client/unauthorized spine "+JSON.stringify(patch),()=>{
 assert.equal(planSpineMosaicSubmission({...scene(),...patch}).action,"deny");
});
for(const patch of [
 {canonicalVeilPhase:"dormant"},{veilTransitionCount:0},
 {sixthBookClaimLedger:"none"},{sixthBookVeilProjectionVerified:false}
])test("veil book must truly be claimed, not merely owned as world template "+JSON.stringify(patch),()=>{
 assert.equal(planSpineMosaicSubmission({...scene(),...patch}).action,"deny");
});
for(const patch of [
 {spineLedgerStatus:"reserved"},{compartmentLedgerStatus:"reserved"}
])test("reserved spine and compartment need manual GM reconciliation "+JSON.stringify(patch),()=>{
 assert.equal(planSpineMosaicSubmission({...scene(),...patch}).action,"gm-review");
});
test("previously revealed exact in-room compartment is idempotent",()=>assert.equal(
 planSpineMosaicSubmission({...scene(),spineLedgerStatus:"solved",compartmentLedgerStatus:"revealed"}).action,"no-op"));
test("partial solved stage cannot trigger another reward",()=>assert.equal(
 planSpineMosaicSubmission({...scene(),spineLedgerStatus:"solved",compartmentLedgerStatus:"concealed"}).action,"gm-review"));
for(const patch of [
 {spineInputAuthenticatedByGm:false},{spineUiSessionBoundToRegionAndActor:false},
 {submittedSourceOrder:undefined},{submittedSourceOrder:[]},
 {submittedSourceOrder:[...CAV_BOOK_MANIFEST.slice(0,5).map(b=>b.id),"Item.FAKE"]},
 {submittedSourceOrder:Array(6).fill(CAV_BOOK_MANIFEST[0].id)}
])test("untrusted/invalid UI order rejected "+JSON.stringify(patch),()=>{
 assert.equal(planSpineMosaicSubmission({...scene(),...patch}).action,"deny");
});
for(const patch of [
 {originalHiddenCompartmentRegionVerified:false},
 {compartmentRegionUuid:"Scene.H-U06.Region.FAKE"},
 {compartmentClosedGeometryVerified:false},
 {safelyRevealInRoomCompartmentVerified:false}
])test("no puzzle reveal without actual safe H-U05 compartment "+JSON.stringify(patch),()=>{
 assert.equal(planSpineMosaicSubmission({...scene(),...patch}).action,"deny");
});
for(let idx=0;idx<6;idx++){
 test("missing original book "+(idx+1)+" denies even if titles look similar",()=>{
   const v=scene();v.verifiedBooks.splice(idx,1);
   assert.equal(planSpineMosaicSubmission(v).action,"deny");
 });
 test("forged Item UUID "+(idx+1)+" denies",()=>{
   const v=scene();v.verifiedBooks[idx].sourceUuid="Item.FAKE"+idx;
   assert.equal(planSpineMosaicSubmission(v).action,"deny");
 });
 test("wrong publication year "+(idx+1)+" denies",()=>{
   const v=scene();v.verifiedBooks[idx].publicationYear=1550;
   assert.equal(planSpineMosaicSubmission(v).action,"deny");
 });
 test("unreadable year in Journal "+(idx+1)+" denies",()=>{
   const v=scene();v.verifiedBooks[idx].journalPublishedYearVerified=false;
   assert.equal(planSpineMosaicSubmission(v).action,"deny");
 });
 test("false origin provenance "+(idx+1)+" denies",()=>{
   const v=scene();v.verifiedBooks[idx].originalAcquisitionProvenanceVerified=false;
   assert.equal(planSpineMosaicSubmission(v).action,"deny");
 });
 test("remote uncollected library book "+(idx+1)+" denies",()=>{
   const v=scene();v.verifiedBooks[idx].currentContext="world-library";
   assert.equal(planSpineMosaicSubmission(v).action,"deny");
 });
}
test("known world-library collection alone cannot satisfy actor possession",()=>{
 const v=scene();v.verifiedBooks[1].partyActorOwnerReadbackVerified=false;
 assert.equal(planSpineMosaicSubmission(v).action,"deny");
});
test("duplicate Item records or counterfeits fail closed",()=>{
 const v=scene();v.verifiedBooks[2]={...v.verifiedBooks[0]};
 assert.equal(planSpineMosaicSubmission(v).action,"deny");
 const w=scene();w.verifiedBooks[1].duplicateOrCounterfeitFound=true;
 assert.equal(planSpineMosaicSubmission(w).action,"deny");
});
test("sixth after Veil must carry exact actor claim ledger",()=>{
 const v=scene();v.verifiedBooks[5].actorAcquisitionLedgerDone=false;
 assert.equal(planSpineMosaicSubmission(v).action,"deny");
});
test("Gond claim is a distinct player click from revealing the compartment",()=>{
 assert.equal(planGondHalfCompartmentPickup(gond()).action,"gm-review-grant-one-gond-half");
 assert.equal(planGondHalfCompartmentPickup(gond({explicitGondPickup:false})).action,"deny");
});
test("player can walk to compartment after spine solve without staying at mosaic fixture",()=>{
 assert.equal(planGondHalfCompartmentPickup(gond({ownedTokenAtSpineVerified:false})).action,"gm-review-grant-one-gond-half");
});
for(const patch of [
 {originalCompartmentPickupActorVerified:false},{ownedTokenAtCompartmentVerified:false},
 {originalHiddenCompartmentRegionVerified:false},
 {compartmentRegionUuid:"Scene.OTHER.Region.COMPARTMENT"},
 {approvedInRoomCompartmentPlanVerified:false},
 {hU06SeparateRoomTargetPresent:true},{activeNonGmActorOwnerVerified:false}
])test("Gond claim inside H-U05 physically authenticated "+JSON.stringify(patch),()=>{
 assert.equal(planGondHalfCompartmentPickup(gond(patch)).action,"deny");
});
for(const patch of [
 {canonicalVeilPhase:"dormant"},{originalGondItemReverified:false},
 {gondItemUuid:"Item.FAKE"},{gondItemName:"Sune Emblem Half"},
 {gondItemType:"weapon"},{worldwideGondRewardCopyCount:1},
 {gondRewardStagedInOriginalCompartment:false},{distinctFromSuneEmblemHalfVerified:false}
])test("only once original Gond half from H-U05 after Veil "+JSON.stringify(patch),()=>{
 assert.equal(planGondHalfCompartmentPickup(gond(patch)).action,"deny");
});
test("Gond is not auto-awarded by solving and never duplicated",()=>{
 assert.equal(planGondHalfCompartmentPickup(gond({compartmentLedgerStatus:"concealed"})).action,"gm-review");
 assert.equal(planGondHalfCompartmentPickup(gond({gondClaimLedger:"reserved"})).action,"gm-review");
 assert.equal(planGondHalfCompartmentPickup(gond({gondClaimLedger:"done"})).action,"no-op");
});
test("scene swap retains solved state and may rehydrate geometry WITHOUT loot grant",()=>{
 assert.equal(planSpineCompartmentRehydrate(gond()).action,"gm-review-rehydrate-hu05-compartment");
});
test("existing compartment visual never repeats",()=>assert.equal(planSpineCompartmentRehydrate(gond({compartmentGeometryPresent:true})).action,"no-op"));
for(const patch of [
 {originalCompartmentSafeGeometryVerified:false},
 {rehydrateDoesNotGrantItemsVerified:false},
 {existingGondGrantLedgerUnchangedVerified:false},
 {compartmentGeometryPresent:undefined}
])test("rehydrate fails closed on uncertain or duplicate geometry "+JSON.stringify(patch),()=>assert.equal(
 planSpineCompartmentRehydrate(gond(patch)).action,"gm-review"));
test("never rehydrate a compartment that was never solved",()=>assert.equal(
 planSpineCompartmentRehydrate(scene()).action,"deny"));
test("rehydrate reservation requires manual reconciliation",()=>assert.equal(
 planSpineCompartmentRehydrate(gond({compartmentRehydrateStatus:"reserved"})).action,"gm-review"));