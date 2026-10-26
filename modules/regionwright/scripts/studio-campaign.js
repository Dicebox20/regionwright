import { ascendancyAPI, installAscendancySocket } from "./ascendancy.js";
import { installCabinSuneWinderService } from "./studio-cav-sune.js";
import { installCabinSuneReliefService, handleCabinSuneReliefRegionEvent } from "./studio-cav-sune-relief.js";
import { installCabin587GMService } from "./studio-cav-587.js";
import { installCabinSluiceCrankGMService, handleCabinSluiceRegionEvent } from "./studio-cav-sluice.js";
import { installCabinSluiceWaterService } from "./studio-cav-water-controller.js";
import { installCabinDrainedPickupsGMService, handleCabinDrainedPickupRegionEvent } from "./studio-cav-drained-pickups.js";
import { installCabinBasementNightstandGMService, handleCabinBasementNightstandRegionEvent } from "./studio-cav-basement-nightstand.js";
import { installCabinRoofClockGMService } from "./studio-cav-roof-clock.js";
import { installCabinAqueductGateGMService, handleCabinAqueductGateRegionEvent } from "./studio-cav-aqueduct-gate.js";
import { handleCabinFirstChaseRegionEvent,recordCabinFirstChaseGMResult,confirmCabinFirstChaseCaptureAfterGMTransfer,describeCabinFirstChase } from "./studio-cav-first-chase.js";
import { ascendancyLiveInstaller } from "./ascendancy-live-installer.js";
import { ascendancyBalladRuntime } from "./ascendancy-ballad-runtime.js";

const campaignAPI = Object.freeze({
  ...ascendancyAPI,
  handoff: ascendancyLiveInstaller,
  ballad: ascendancyBalladRuntime
});

/** Attach campaign-specific tools to Studio's API without owning reusable puzzles. */
export function installStudioCampaign(api) {
  if (api?.campaign) Object.assign(api.campaign, { ascendancy: campaignAPI, cabin: { suneRelief: { handleRegionEvent: handleCabinSuneReliefRegionEvent }, sluice: { handleRegionEvent: handleCabinSluiceRegionEvent }, drainedPickups: { handleRegionEvent: handleCabinDrainedPickupRegionEvent }, successors: { handleRegionEvent: handleCabinBasementNightstandRegionEvent }, aqueductGate: { handleRegionEvent: handleCabinAqueductGateRegionEvent }, firstChase: { handleRegionEvent: handleCabinFirstChaseRegionEvent,recordGMResult: recordCabinFirstChaseGMResult,confirmCaptureAfterGMTransfer:confirmCabinFirstChaseCaptureAfterGMTransfer,describe:describeCabinFirstChase } } });
  // Keep existing Regionwright campaign macros functional through the old key.
  if (api?.premium && api.premium !== api.campaign) Object.assign(api.premium, { ascendancy: campaignAPI });
  installAscendancySocket();
  installCabinSuneWinderService();
  installCabinSuneReliefService();
  installCabin587GMService();
  installCabinSluiceCrankGMService();
  installCabinSluiceWaterService();
  installCabinDrainedPickupsGMService();
  installCabinBasementNightstandGMService();
  installCabinRoofClockGMService();
  installCabinAqueductGateGMService();
  return campaignAPI;
}

export { campaignAPI };
