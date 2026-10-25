(async () => {
  const api = game.modules.get("regionwright-hunting-gathering")?.api?.mining;
  if (!api) return ui.notifications.error("Regionwright: Hunting & Gathering is not ready.");
  try {
    await api.openSetup();
  } catch (error) {
    ui.notifications.warn(error.message ?? String(error));
  }
})();
