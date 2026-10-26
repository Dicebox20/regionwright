import { ascendancyAPI, installAscendancySocket } from "./ascendancy.js";
import { installCabinSuneWinderService } from "./studio-cav-sune.js";
import { installCabinSuneReliefService, handleCabinSuneReliefRegionEvent } from "./studio-cav-sune-relief.js";
import { installCabin587GMService } from "./studio-cav-587.js";
import { installCabinSluiceCrankGMService, handleCabinSluiceRegionEvent } from "./studio-cav-sluice.js";
import { installCabinSluiceWaterService } from "./studio-cav-water-controller.js";
import { installCabinDrainedPickupsGMService, handleCabinDrainedPickupRegionEvent } from "./studio-cav-drained-pickups.js";
import {installCabinBoilerGMService,handleCabinBoilerRegionEvent,describeCabinBoilerPressureGM} from "./studio-cav-boiler-puzzle.js";
import { installCabinBasementNightstandGMService, handleCabinBasementNightstandRegionEvent } from "./studio-cav-basement-nightstand.js";
import { installCabinRoofClockGMService } from "./studio-cav-roof-clock.js";
import { installCabinAqueductGateGMService, handleCabinAqueductGateRegionEvent } from "./studio-cav-aqueduct-gate.js";
import { handleCabinFirstChaseRegionEvent,recordCabinFirstChaseGMResult,confirmCabinFirstChaseCaptureAfterGMTransfer,describeCabinFirstChase } from "./studio-cav-first-chase.js";
import { installSophiaRescueGMService,handleSophiaRescueRegionEvent,prepareSophiaGMConfinement,emergencyReleaseSophiaGM,abortPreparedSophiaGM,describeSophiaConfinementGM } from "./studio-cav-sophia-confinement.js";
import {commissionAqueductForGameplay,unlockForestWellAfterChaseGM,describeAqueductRouting} from "./studio-cav-aqueduct-routing.js";
import {rosewaterHatchDecision,rosewaterRefillDecision,rosewaterBowlPickupDecision,rosewaterWaterVariantRoute,assessUnifiedRosewaterActivation,assessUnifiedBathBowlClaim} from "./studio-cav-rosewater-safety.js";
import { ascendancyLiveInstaller } from "./ascendancy-live-installer.js";
import { ascendancyBalladRuntime } from "./ascendancy-ballad-runtime.js";

const campaignAPI = Object.freeze({
  ...ascendancyAPI,
  handoff: ascendancyLiveInstaller,
  ballad: ascendancyBalladRuntime
});

/** Attach campaign-specific tools to Studio's API without owning reusable puzzles. */
export function installStudioCampaign(api) {
  if (api?.campaign) Object.assign(api.campaign, { ascendancy: campaignAPI, cabin: { suneRelief: { handleRegionEvent: handleCabinSuneReliefRegionEvent }, sluice: { handleRegionEvent: handleCabinSluiceRegionEvent }, drainedPickups: { handleRegionEvent: handleCabinDrainedPickupRegionEvent }, successors: { handleRegionEvent: handleCabinBasementNightstandRegionEvent }, aqueductGate: { handleRegionEvent: handleCabinAqueductGateRegionEvent }, firstChase: { handleRegionEvent: handleCabinFirstChaseRegionEvent,recordGMResult: recordCabinFirstChaseGMResult,confirmCaptureAfterGMTransfer:confirmCabinFirstChaseCaptureAfterGMTransfer,describe:describeCabinFirstChase }, sophia: {handleRegionEvent:handleSophiaRescueRegionEvent,prepare:prepareSophiaGMConfinement,emergencyRelease:emergencyReleaseSophiaGM,abortPrepared:abortPreparedSophiaGM,describe:describeSophiaConfinementGM}, aqueductRoutes: {commissionForGameplay:commissionAqueductForGameplay,unlockWellAfterChase:unlockForestWellAfterChaseGM,describe:describeAqueductRouting}, boiler: {handleRegionEvent:handleCabinBoilerRegionEvent,describe:describeCabinBoilerPressureGM}, rosewaterSafety: {hatchDecision:rosewaterHatchDecision,refillDecision:rosewaterRefillDecision,bowlPickupDecision:rosewaterBowlPickupDecision,waterVariantRoute:rosewaterWaterVariantRoute,unifiedRingActivation:assessUnifiedRosewaterActivation,unifiedBowlClaim:assessUnifiedBathBowlClaim} } });
  // Keep existing Regionwright campaign macros functional through the old key.
  if (api?.premium && api.premium !== api.campaign) Object.assign(api.premium, { ascendancy: campaignAPI });
  installAscendancySocket();
  installCabinSuneWinderService();
  installCabinSuneReliefService();
  installCabin587GMService();
  installCabinSluiceCrankGMService();
  installCabinSluiceWaterService();
  installCabinDrainedPickupsGMService();
 installCabinBoilerGMService();
  installCabinBasementNightstandGMService();
  installCabinRoofClockGMService();
  installCabinAqueductGateGMService();
  installSophiaRescueGMService();
  return campaignAPI;
}

export { campaignAPI };
