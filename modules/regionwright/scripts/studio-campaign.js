import { ascendancyAPI, installAscendancySocket } from "./ascendancy.js";
import { ascendancyLiveInstaller } from "./ascendancy-live-installer.js";
import { ascendancyBalladRuntime } from "./ascendancy-ballad-runtime.js";

const campaignAPI = Object.freeze({
  ...ascendancyAPI,
  handoff: ascendancyLiveInstaller,
  ballad: ascendancyBalladRuntime
});

/** Attach campaign-specific tools to Studio's API without owning reusable puzzles. */
export function installStudioCampaign(api) {
  if (api?.campaign) Object.assign(api.campaign, { ascendancy: campaignAPI });
  // Keep existing Regionwright campaign macros functional through the old key.
  if (api?.premium && api.premium !== api.campaign) Object.assign(api.premium, { ascendancy: campaignAPI });
  installAscendancySocket();
  return campaignAPI;
}

export { campaignAPI };
