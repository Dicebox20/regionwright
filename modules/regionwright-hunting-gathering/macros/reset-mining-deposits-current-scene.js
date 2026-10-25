(async () => {
  const api = game.modules.get("regionwright-hunting-gathering")?.api?.mining;
  if (!api) return ui.notifications.error("Regionwright: Hunting & Gathering is not ready.");
  try {
    const result = await api.resetScene();
    ui.notifications.info(`Reset ${result.reset} mining deposit${result.reset === 1 ? "" : "s"} on ${result.scene.name}.`);
  } catch (error) {
    ui.notifications.warn(error.message ?? String(error));
  }
})();
