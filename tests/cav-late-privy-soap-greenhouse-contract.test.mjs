import test from "node:test";
import assert from "node:assert/strict";
import {
 planPrivyRetrievalAttempt,planPrivyCopperKeyPickup,planSoapRoomLyeCaseUnlock,planSoapRoomLyePickup,
 HISTORICAL_PRIVY_SCENE,HISTORICAL_PRIVY_RETURN_REGION,ORIGINAL_COPPER_KEY,ORIGINAL_LYE
} from "../modules/regionwright/scripts/studio-cav-late-privy-soap-contract.js";
import {planGreenhouseLyeMix,ORIGINAL_PLANT_KILLER_UUID} from "../modules/regionwright/scripts/studio-cav-late-greenhouse-lye-contract.js";
const shared=()=>({version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 explicitPlayerAction:true,activeNonGmOwnerVerified:true,ownedTokenAtFixture:true,actorId:"PC",tokenId:"TOK",
 canonicalVeilStatus:"active",canonicalVeilTransitionCount:1,veilStateFromGmReadback:true});
const privy=(extra={})=>({
 ...shared(),privySceneId:HISTORICAL_PRIVY_SCENE,currentPrivySceneReverified:true,
 originalPrivyFixtureVerified:true,
 retrievalRegionUuid:"Scene.xx1rWBiWMLxJPlrw.Region.RETRIEVAL",retrievalRegionReverified:true,
 privyVeilProjectionStatus:"done",safePrivyReturnRouteVerified:true,
 originalPrivyReturnRegionUuid:HISTORICAL_PRIVY_RETURN_REGION,
 returnDestinationVerified:true,retrievalStatus:"untried",
 originalCopperSourceReverified:true,copperSourceUuid:ORIGINAL_COPPER_KEY,
 copperSourceName:"Copper Tiny Key",copperSourceType:"loot",worldwideCopperRewardCopyCount:0,
 retrievalMethod:"skill",ability:"Survival",officialCheckDC:12,
 rollIndependentlyVerified:true,totalRoll:12,
 explicitCopperPickupAction:true,ownedTokenAtCopperMarker:true,copperMarkerReverified:true,
 copperMarkerRegionUuid:"Scene.xx1rWBiWMLxJPlrw.Region.COPPER",
 copperGrantStatus:"none",copperMarkerStatus:"visible",originalKeyMarkedRecoverable:true,...extra});
const soap=(extra={})=>({...shared(),soapSceneId:"CAV_BATH02_VERIFIED",
 soapRoomSceneVerified:true,soapRoomCanonCode:"BATH-02",soapCaseRegionVerified:true,
 soapCaseRegionUuid:"Scene.CAV_BATH02_VERIFIED.Region.LYECASE",
 explicitUnlockCaseAction:true,caseLedgerStatus:"locked",
 originalCopperSourceReverified:true,expectedCopperSourceUuid:ORIGINAL_COPPER_KEY,
 actorCarriesOriginalCopperKey:true,actorCopperSourceUuid:ORIGINAL_COPPER_KEY,
 actorCopperAcquisitionFromPrivyVerified:true,originalCopperKeyItemType:"loot",
 sourceKeyIdentityUnmodified:true,explicitLyePickupAction:true,ownedTokenAtLyeCase:true,
 lyeClaimLedgerStatus:"none",originalLyeSourceReverified:true,
 originalLyeSourceUuid:ORIGINAL_LYE,originalLyeName:"Lye",originalLyeItemType:"loot",
 worldwideLyeQuestRewardCount:0,lyeCaseContainsOriginalQuestItem:true,...extra});
const greenhouse=(extra={})=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 explicitMixingLeverAction:true,activeNonGmOwnerVerified:true,
 ownedTokenAtGreenhouseStation:true,actorId:"PC",tokenId:"TOK",
 greenhouseSceneVerified:true,greenhouseCanonCode:"EXT-06",
 greenhouseSceneId:"GREENHOUSEID",mixingRegionVerified:true,
 mixingRegionUuid:"Scene.GREENHOUSEID.Region.MIXER",
 greenhouseProductionStatus:"none",flaskRewardStatus:"none",
 waterworksRestorationLedgerVerified:true,waterworksRestoreStatus:"done",
 waterRestoredFromActualWaterworks:true,sprinklerAlreadyAccessible:true,
 originalLyeSourceReverified:true,expectedLyeSourceUuid:ORIGINAL_LYE,
 actorCarryingAuthenticLye:true,actorLyeSourceUuid:ORIGINAL_LYE,
 actorLyeItemType:"loot",actorLyeAcquiredFromSoapCase:true,
 lyeSoapCasePickupLedgerDone:true,actorLyeQuantityPositive:true,
 actorLyeOriginRegionVerified:true,originalPlantKillerSourceReverified:true,
 plantKillerSourceUuid:ORIGINAL_PLANT_KILLER_UUID,
 plantKillerSourceName:"Plant Killer",plantKillerSourceType:"loot",
 worldwidePlantKillerRewardCopies:0,greenhouseCanStageUniqueFlask:true,
 ...extra
});
test("DC12 certified Survival fallback may resolve Copper Tiny Key",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy()).action,"gm-review-resolve-retrieval");
});
test("DC12 certified Sleight of Hand fallback may resolve",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({ability:"Sleight of Hand"})).action,"gm-review-resolve-retrieval");
});
test("failed DC12 attempt is retriable without permanent gate",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({totalRoll:11})).action,"gm-review-retry");
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalStatus:"retryable",totalRoll:12})).action,"gm-review-resolve-retrieval");
});
test("careful ordinary tools permit certified no-roll fallback",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalMethod:"careful-tools",retrievalToolReasonableApprovedByGm:true,nonRollRetrievalSafe:true})).action,"gm-review-resolve-retrieval");
});
test("fishing parody verified Legendary Fish can resolve",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalMethod:"fishing-parody",optionalFishingModuleActuallyVerified:true,fishingCatchGmVerified:true,fishingResultLabel:"Legendary Fish"})).action,"gm-review-resolve-retrieval");
});
test("missing optional Fishing module never permanently blocks progress",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalMethod:"fishing-parody",optionalFishingModuleActuallyVerified:false})).action,"gm-review-fallback");
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalMethod:"careful-tools",retrievalToolReasonableApprovedByGm:true,nonRollRetrievalSafe:true})).action,"gm-review-resolve-retrieval");
});
for(const m of [
 {origin:"client"},{worldId:"another-world"},{version:4},
 {canonicalVeilStatus:"dormant"},{canonicalVeilTransitionCount:2},{veilStateFromGmReadback:false},
 {privySceneId:"OTHER"},{currentPrivySceneReverified:false},{originalPrivyFixtureVerified:false},
 {retrievalRegionUuid:"Scene.OTHER.Region.RETRIEVAL"},{retrievalRegionReverified:false},
 {privyVeilProjectionStatus:"reserved"},{safePrivyReturnRouteVerified:false},
 {originalPrivyReturnRegionUuid:"Scene.FAKE.Region.RETURN"},{returnDestinationVerified:false},
 {activeNonGmOwnerVerified:false},{ownedTokenAtFixture:false},{explicitPlayerAction:false}
])test("privy rejects invalid phase/location/owner context "+JSON.stringify(m),()=>{
 assert.equal(planPrivyRetrievalAttempt(privy(m)).action,"deny");
});
for(const m of [
 {originalCopperSourceReverified:false},{copperSourceUuid:"Item.WRONG"},
 {copperSourceName:"Fake Copper Key"},{copperSourceType:"weapon"},
 {worldwideCopperRewardCopyCount:1}
])test("privy refuses duplicate or counterfeit Copper Key "+JSON.stringify(m),()=>{
 assert.equal(planPrivyRetrievalAttempt(privy(m)).action,"deny");
});
for(const m of [
 {ability:"Acrobatics"},{officialCheckDC:10},{rollIndependentlyVerified:false},
 {totalRoll:"12"},{totalRoll:undefined}
])test("DC12 roll from GM not client proof "+JSON.stringify(m),()=>{
 assert.equal(planPrivyRetrievalAttempt(privy(m)).action,"deny");
});
test("unknown or reserved retrieval ledgers cannot reroll",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalStatus:"reserved"})).action,"gm-review");
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalStatus:"unknown"})).action,"gm-review");
});
test("resolved retrieval doesn't redrop key",()=>assert.equal(planPrivyRetrievalAttempt(privy({retrievalStatus:"resolved"})).action,"no-op"));
test("unapproved careful tool cannot bypass check",()=>{
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalMethod:"careful-tools",retrievalToolReasonableApprovedByGm:false,nonRollRetrievalSafe:true})).action,"deny");
 assert.equal(planPrivyRetrievalAttempt(privy({retrievalMethod:"careful-tools",retrievalToolReasonableApprovedByGm:true,nonRollRetrievalSafe:undefined})).action,"deny");
});
test("only resolved retrieval permits separate one-time Copper key pickup",()=>{
 assert.equal(planPrivyCopperKeyPickup(privy({retrievalStatus:"resolved"})).action,"gm-review-grant-single-copper-key");
 assert.equal(planPrivyCopperKeyPickup(privy()).action,"gm-review");
});
test("Copper pickup after claim is idempotent",()=>{
 assert.equal(planPrivyCopperKeyPickup(privy({retrievalStatus:"resolved",copperGrantStatus:"done",copperMarkerStatus:"claimed"})).action,"no-op");
});
test("reserved Copper pickup fails closed",()=>assert.equal(planPrivyCopperKeyPickup(privy({retrievalStatus:"resolved",copperGrantStatus:"reserved"})).action,"gm-review"));
for(const m of [
 {explicitCopperPickupAction:false},{ownedTokenAtCopperMarker:false},
 {copperMarkerRegionUuid:"Scene.OTHER.Region.COPPER"},{copperMarkerReverified:false}
])test("Copper pickup must be player owned at authentic marker "+JSON.stringify(m),()=>assert.equal(planPrivyCopperKeyPickup(privy({retrievalStatus:"resolved",...m})).action,"deny"));
test("explicit Copper authenticity checked at grant",()=>assert.equal(planPrivyCopperKeyPickup(privy({retrievalStatus:"resolved",originalKeyMarkedRecoverable:false})).action,"deny"));

test("original Copper Tiny Key unlocks authentic soap case",()=>{
 assert.equal(planSoapRoomLyeCaseUnlock(soap()).action,"gm-review-unlock-soap-case");
});
for(const m of [
 {canonicalVeilStatus:"dormant"},{soapRoomCanonCode:"BATH-01"},
 {soapCaseRegionVerified:false},{soapCaseRegionUuid:"Scene.OTHER.Region.CASE"},
 {activeNonGmOwnerVerified:false},{explicitUnlockCaseAction:false}
])test("Lye case access fails closed "+JSON.stringify(m),()=>assert.equal(planSoapRoomLyeCaseUnlock(soap(m)).action,"deny"));
for(const m of [
 {actorCarriesOriginalCopperKey:false},{actorCopperSourceUuid:"Item.FAKE"},
 {expectedCopperSourceUuid:"Item.FAKE"},{actorCopperAcquisitionFromPrivyVerified:false},
 {originalCopperKeyItemType:"weapon"},{sourceKeyIdentityUnmodified:false}
])test("case key must be genuine Privy original "+JSON.stringify(m),()=>assert.equal(planSoapRoomLyeCaseUnlock(soap(m)).action,"deny"));
test("case ledger reserve and repeat are idempotent/reconcilable",()=>{
 assert.equal(planSoapRoomLyeCaseUnlock(soap({caseLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planSoapRoomLyeCaseUnlock(soap({caseLedgerStatus:"unlocked"})).action,"no-op");
});
test("lye is separate one-time pickup, not automatic from case unlock",()=>{
 assert.equal(planSoapRoomLyePickup(soap({caseLedgerStatus:"unlocked"})).action,"gm-review-grant-single-quest-lye");
 assert.equal(planSoapRoomLyePickup(soap()).action,"gm-review");
});
test("lye claim cannot repeat or bypass reserved ledger",()=>{
 assert.equal(planSoapRoomLyePickup(soap({caseLedgerStatus:"unlocked",lyeClaimLedgerStatus:"done"})).action,"no-op");
 assert.equal(planSoapRoomLyePickup(soap({caseLedgerStatus:"unlocked",lyeClaimLedgerStatus:"reserved"})).action,"gm-review");
});
for(const m of [
 {originalLyeSourceReverified:false},{originalLyeSourceUuid:"Item.FAKE"},
 {originalLyeName:"Real Caustic Chemical"},{originalLyeItemType:"consumable"},
 {worldwideLyeQuestRewardCount:1},{lyeCaseContainsOriginalQuestItem:false}
])test("soap Lye is the single original fictional quest item "+JSON.stringify(m),()=>assert.equal(planSoapRoomLyePickup(soap({caseLedgerStatus:"unlocked",...m})).action,"deny"));
test("Greenhouse requires one item only: original Lye",()=>assert.deepEqual(planGreenhouseLyeMix(greenhouse()),{
 action:"gm-review-produce-single-plant-killer",requiredIngredient:"lye"
}));
test("Ash, proportions and Crimson Veil are not mixing prerequisites",()=>{
 assert.equal(planGreenhouseLyeMix(greenhouse({thornrootAsh:false,ashAvailable:false,mixtureRatio:null,canonicalVeilStatus:"dormant"})).action,"gm-review-produce-single-plant-killer");
});
for(const m of [
 {origin:"client"},{worldId:"OTHER"},{explicitMixingLeverAction:false},
 {ownedTokenAtGreenhouseStation:false},{activeNonGmOwnerVerified:false},
 {greenhouseSceneVerified:false},{greenhouseCanonCode:"EXT-04"},
 {mixingRegionVerified:false},{mixingRegionUuid:"Scene.OTHER.Region.MIXER"}
])test("Greenhouse physical/authentic GM readback required "+JSON.stringify(m),()=>assert.equal(planGreenhouseLyeMix(greenhouse(m)).action,"deny"));
for(const m of [
 {waterworksRestorationLedgerVerified:false},{waterworksRestoreStatus:"reserved"},
 {waterRestoredFromActualWaterworks:false},{sprinklerAlreadyAccessible:false}
])test("Pond/Bath Sluice doesn't substitute for real Waterworks "+JSON.stringify(m),()=>assert.equal(planGreenhouseLyeMix(greenhouse({...m,pondBathSluiceStatus:"open"})).action,"deny"));
for(const m of [
 {originalLyeSourceReverified:false},{expectedLyeSourceUuid:"Item.FAKE"},
 {actorCarryingAuthenticLye:false},{actorLyeSourceUuid:"Item.FAKE"},
 {actorLyeItemType:"weapon"},{actorLyeAcquiredFromSoapCase:false},
 {lyeSoapCasePickupLedgerDone:false},{actorLyeQuantityPositive:false},
 {actorLyeOriginRegionVerified:false}
])test("Greenhouse Lye claim provenance required "+JSON.stringify(m),()=>assert.equal(planGreenhouseLyeMix(greenhouse(m)).action,"deny"));
for(const m of [
 {originalPlantKillerSourceReverified:false},{plantKillerSourceUuid:"Item.FAKE"},
 {plantKillerSourceName:"Fake Flask"},{plantKillerSourceType:"weapon"},
 {worldwidePlantKillerRewardCopies:1},{greenhouseCanStageUniqueFlask:false}
])test("single original Plant Killer reward not duplicate "+JSON.stringify(m),()=>assert.equal(planGreenhouseLyeMix(greenhouse(m)).action,"deny"));
test("partial Greenhouse completion and duplicate production fail closed",()=>{
 assert.equal(planGreenhouseLyeMix(greenhouse({greenhouseProductionStatus:"reserved"})).action,"gm-review");
 assert.equal(planGreenhouseLyeMix(greenhouse({greenhouseProductionStatus:"done",flaskRewardStatus:"none"})).action,"gm-review");
 assert.equal(planGreenhouseLyeMix(greenhouse({greenhouseProductionStatus:"done",flaskRewardStatus:"done"})).action,"no-op");
});