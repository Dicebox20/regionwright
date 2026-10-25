function documentFromControlled(entry) {
  return entry?.document ?? entry ?? null;
}

export function selectedRegionDocuments(canvasState = globalThis.canvas) {
  return Array.from(canvasState?.regions?.controlled ?? [])
    .map(documentFromControlled)
    .filter(document => document?.documentName === "Region");
}

export function captureSelection({ canvasState = globalThis.canvas, sceneUuid = canvasState?.scene?.uuid } = {}) {
  const seen = new Set();
  return selectedRegionDocuments(canvasState)
    .map(region => ({
      uuid: region.uuid,
      id: region.id,
      name: String(region.name ?? "Unnamed Region"),
      sceneUuid: region.parent?.uuid ?? sceneUuid ?? null
    }))
    .filter(reference => reference.uuid && !seen.has(reference.uuid) && seen.add(reference.uuid));
}

export function validateSelection(selection, { sceneUuid } = {}) {
  if (!Array.isArray(selection) || selection.length === 0) throw new Error("At least one Region must be selected.");
  const seen = new Set();
  for (const reference of selection) {
    if (!reference?.uuid || !reference?.sceneUuid) throw new Error("Every selected Region must include a UUID and Scene UUID.");
    if (seen.has(reference.uuid)) throw new Error(`Duplicate Region selection: ${reference.uuid}`);
    if (sceneUuid && reference.sceneUuid !== sceneUuid) throw new Error(`Region ${reference.name || reference.uuid} is outside the active Scene.`);
    seen.add(reference.uuid);
  }
  return selection;
}
