import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function joinAsGM(page) {
  await page.goto("/join");
  const role = page.locator("select").first();
  await expect(role.locator("option").nth(1)).toBeAttached({ timeout: 15_000 });
  const availableRole = await role.locator("option").evaluateAll(options => {
    const preferred = options.find(option => !option.disabled && /Assistant Gamemaster/i.test(option.textContent ?? ""));
    const fallback = options.find(option => !option.disabled && /Gamemaster/i.test(option.textContent ?? ""));
    return (preferred ?? fallback)?.value ?? null;
  });
  if (!availableRole) throw new Error("The Utility Harness has no available GM-capable test role.");
  await role.selectOption(availableRole);
  await page.getByRole("button", { name: "Join Game Session" }).click();
  await expect(page.getByRole("tab", { name: "Region Controls" })).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => Boolean(globalThis.game?.ready && globalThis.canvas?.scene), null, { timeout: 15_000 });
  await page.locator("#notifications .notification").evaluateAll(nodes => nodes.forEach(node => { node.style.pointerEvents = "none"; }));
}

async function joinAsPlayer(page) {
  await page.goto("/join");
  const role = page.locator("select").first();
  await expect(role.locator("option").nth(1)).toBeAttached({ timeout: 15_000 });
  const playerRole = await role.locator("option").evaluateAll(options => options.find(option => !option.disabled && /Player3/i.test(option.textContent ?? ""))?.value ?? null);
  if (!playerRole) throw new Error("The Utility Harness has no available Player3 test role.");
  await role.selectOption(playerRole);
  await page.getByRole("button", { name: "Join Game Session" }).click();
  await page.waitForFunction(() => Boolean(globalThis.game?.user && globalThis.canvas?.scene), null, { timeout: 15_000 });
  // Foundry can open this native dialog after the canvas has initialized. Use
  // its DOM click so the paused-scene overlay cannot consume the test click.
  const savePlayerConfiguration = page.getByRole("button", { name: "Save Player Configuration" });
  if (await savePlayerConfiguration.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await savePlayerConfiguration.evaluate(button => button.click());
    await expect(savePlayerConfiguration).toBeHidden({ timeout: 10_000 });
  }
}

async function openBuilder(page) {
  const opened = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    if (typeof api?.openBuilder !== "function") return false;
    globalThis.__regionwrightTestBuilder = await api.openBuilder();
    return Boolean(globalThis.__regionwrightTestBuilder);
  });
  expect(opened).toBe(true);
  await expect(page.locator(".rbb-shell")).toBeVisible();
}

test("launchpad and guided lock prompt expose an accessible, map-aware flow", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  await openBuilder(page);

  await expect(page.locator(".rbb-selector-rail")).toHaveCount(0);
  await expect(page.locator(".regionwright:not(.regionwright-guide) .window-content")).toHaveCSS("background-color", "rgba(0, 0, 0, 0.35)");
  await expect(page.locator(".rbb-shell")).toHaveCSS("font-family", /Candara/i);
  await expect(page.getByRole("heading", { name: "What would you like to make?" })).toBeVisible();
  await expect(page.locator(".rbb-visual-launchpad-card")).toHaveCount(4);

  const drawingWindowState = await page.evaluate(async () => {
    const builder = globalThis.__regionwrightTestBuilder;
    if (!builder) return { found: false, minimized: false, restored: false };
    await builder._beginRegionCreate({ kind: "studio" });
    await new Promise(resolve => setTimeout(resolve, 100));
    const minimized = Boolean(builder.minimized ?? builder.element.classList.contains("minimized"));
    builder._cancelRegionCreate();
    await new Promise(resolve => setTimeout(resolve, 100));
    return { found: true, minimized, restored: !Boolean(builder.minimized ?? builder.element.classList.contains("minimized")) };
  });
  expect(drawingWindowState).toEqual({ found: true, minimized: true, restored: true });

  await page.getByRole("button", { name: /^Studio$/i }).click();
  await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pressure Plate" })).toBeVisible();
  await page.locator('.regionwright:not(.regionwright-guide) [data-action="topic"][data-topic="puzzles"]').click();

  await page.locator('[data-action="start-lockpick"]').evaluate(button => button.click());
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await expect(page.locator(".regionwright-guide .window-content")).toHaveCSS("background-color", "rgba(0, 0, 0, 0.35)");
  await expect(page.locator(".rbb-guide-progress-footer")).toBeVisible();
  await expect(page.locator(".rbb-guide-step-track li.is-current")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Choose a Door." })).toBeVisible();
  await expect(page.locator('[data-action="close-guide"]')).toBeVisible();
  await expect(page.getByText("Choose a Door.", { exact: true })).toBeVisible();
  await page.waitForTimeout(100);
  const guideFooterLayout = await page.evaluate(() => {
    const bounds = selector => document.querySelector(selector)?.getBoundingClientRect();
    const dialog = bounds(".regionwright-guide");
    const guide = bounds(".rbb-guide-content");
    const actions = bounds(".rbb-guide-actions");
    const close = bounds('[data-action="close-guide"]');
    const steps = bounds(".rbb-guide-actions .rbb-guide-progress-footer");
    const next = bounds('[data-action="lockpick-next"]');
    if (!dialog || !guide || !actions || !close || !steps || !next) return null;
    return {
      guideCenterX: guide.left + guide.width / 2,
      guideLeft: guide.left,
      guideRight: guide.right,
      closeCenterY: close.top + close.height / 2,
      closeLeft: close.left,
      stepsCenterX: steps.left + steps.width / 2,
      stepsCenterY: steps.top + steps.height / 2,
      closeRight: close.right,
      nextCenterY: next.top + next.height / 2,
      nextLeft: next.left,
      nextRight: next.right,
      dialogLeft: dialog.left,
      dialogRight: dialog.right
    };
  });
  expect(guideFooterLayout).not.toBeNull();
  expect(Math.abs(guideFooterLayout.stepsCenterX - guideFooterLayout.guideCenterX)).toBeLessThan(4);
  expect(guideFooterLayout.closeLeft - guideFooterLayout.guideLeft).toBeLessThan(24);
  expect(guideFooterLayout.guideRight - guideFooterLayout.nextRight).toBeLessThan(24);
  expect(guideFooterLayout.stepsCenterX).toBeGreaterThan(guideFooterLayout.closeRight);
  expect(guideFooterLayout.stepsCenterX).toBeLessThan(guideFooterLayout.nextLeft);
  expect(Math.abs(guideFooterLayout.closeCenterY - guideFooterLayout.stepsCenterY)).toBeLessThan(3);
  expect(Math.abs(guideFooterLayout.nextCenterY - guideFooterLayout.stepsCenterY)).toBeLessThan(3);
  const guideTypography = await page.evaluate(() => ({
    instruction: Number.parseFloat(getComputedStyle(document.querySelector(".rbb-guide-header h2")).fontSize),
    choice: Number.parseFloat(getComputedStyle(document.querySelector(".rbb-picker-row strong")).fontSize),
    button: Number.parseFloat(getComputedStyle(document.querySelector('[data-action="lockpick-next"]')).fontSize)
  }));
  expect(guideTypography.instruction).toBeGreaterThanOrEqual(24);
  expect(guideTypography.choice).toBeGreaterThanOrEqual(17);
  expect(guideTypography.button).toBeGreaterThanOrEqual(15);
  const guideCompaction = await page.evaluate(() => {
    const dialog = document.querySelector(".regionwright-guide")?.getBoundingClientRect();
    const step = document.querySelector(".rbb-guide-step-content")?.getBoundingClientRect();
    const actions = document.querySelector(".rbb-guide-actions")?.getBoundingClientRect();
    if (!dialog || !step || !actions) return null;
    return { width: dialog.width, height: dialog.height, emptyGap: actions.top - step.bottom };
  });
  expect(guideCompaction).not.toBeNull();
  expect(guideCompaction.width).toBeGreaterThanOrEqual(510);
  expect(guideCompaction.width).toBeLessThanOrEqual(530);
  expect(guideCompaction.height).toBeGreaterThanOrEqual(290);
  expect(guideCompaction.height).toBeLessThanOrEqual(310);
  expect(guideCompaction.emptyGap).toBeLessThan(36);

  const door = page.getByRole("button", { name: /Door A/ });
  await expect(door).toBeVisible();
  await door.click();
  await expect(door).toContainText("Selected");

  const accessibility = await new AxeBuilder({ page }).include(".regionwright-guide").analyze();
  expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);
});

test("visual locator places a beacon on Region, Door, Tile, Actor, and Creature targets", async ({ page }) => {
  test.setTimeout(90_000);
  await joinAsGM(page);
  await openBuilder(page);
  const report = await page.evaluate(async () => {
    const scene = canvas.scene;
    const ActorClass = game.actors.documentClass ?? globalThis.Actor;
    const prefix = `Regionwright E2E Locator ${Date.now()}`;
    const [actor] = await ActorClass.createDocuments([{ name: `${prefix} Actor`, type: "character" }]);
    const [[region], [tile], [door], [token]] = await Promise.all([
      scene.createEmbeddedDocuments("Region", [{ name: `${prefix} Region`, shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }] }]),
      scene.createEmbeddedDocuments("Tile", [{ x: 600, y: 200, width: 200, height: 200, texture: { src: "icons/svg/mystery-man.svg" } }]),
      scene.createEmbeddedDocuments("Wall", [{ c: [1000, 200, 1000, 400], door: CONST.WALL_DOOR_TYPES.DOOR, ds: CONST.WALL_DOOR_STATES.CLOSED }]),
      scene.createEmbeddedDocuments("Token", [{ name: `${prefix} Creature`, actorId: actor.id, x: 200, y: 600, width: 1, height: 1, texture: { src: "icons/svg/mystery-man.svg" } }])
    ]);
    try {
      await canvas.draw();
      const builder = globalThis.__regionwrightTestBuilder;
      const targets = [
        { type: "region", uuid: region.uuid, expected: { x: 300, y: 300 } },
        { type: "tile", uuid: tile.uuid, expected: { x: 700, y: 300 } },
        { type: "door", uuid: door.uuid, expected: { x: 1000, y: 300 } },
        { type: "actor", uuid: actor.uuid, expected: { x: 250, y: 650 } },
        { type: "token", uuid: token.uuid, expected: { x: 250, y: 650 } }
      ];
      const locators = [];
      for (const target of targets) {
        builder._rbbHoveredTarget = { uuid: target.uuid, type: target.type };
        builder._setDocumentHighlight(target.uuid, target.type, true);
        const locator = builder._rbbDocumentHighlights.get(`${target.type}:${target.uuid}`)?.locator?.root;
        const placeable = builder._documentPlaceables(target.uuid, target.type)[0];
        locators.push({ type: target.type, found: Boolean(locator), hasArrow: Boolean(locator?.arrow), x: locator?.position?.x, y: locator?.position?.y, expected: target.expected, placeableBounds: placeable?.bounds ? { x: placeable.bounds.x, y: placeable.bounds.y, width: placeable.bounds.width, height: placeable.bounds.height } : null, document: { x: placeable?.document?.x, y: placeable?.document?.y, width: placeable?.document?.width, height: placeable?.document?.height }, center: placeable?.center ? { x: placeable.center.x, y: placeable.center.y } : null });
      }
      builder._clearAllDocumentHighlights();
      return locators;
    } finally {
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (scene.tiles.get(tile.id)) await scene.deleteEmbeddedDocuments("Tile", [tile.id]);
      if (scene.walls.get(door.id)) await scene.deleteEmbeddedDocuments("Wall", [door.id]);
      if (scene.tokens.get(token.id)) await scene.deleteEmbeddedDocuments("Token", [token.id]);
      if (game.actors.get(actor.id)) await actor.delete();
    }
  });
  for (const locator of report) {
    expect(locator.found, JSON.stringify(locator)).toBe(true);
    expect(locator.hasArrow, JSON.stringify(locator)).toBe(false);
    expect(locator.x, JSON.stringify(locator)).toBeCloseTo(locator.expected.x, 0);
    expect(locator.y, JSON.stringify(locator)).toBeCloseTo(locator.expected.y, 0);
  }
});

test("Studio activity starts, edits, highlights, saves, and reviews a draft", async ({ page }) => {
  // World-setting updates are serialized by Foundry and can take longer than
  // a normal UI render when the Utility Harness is under load.
  test.setTimeout(150_000);
  await joinAsGM(page);
  const studioApi = await page.evaluate(() => ({ compile: typeof game.modules.get("regionwright")?.api?.studio?.compile === "function", drafts: typeof game.modules.get("regionwright")?.api?.studio?.drafts?.save === "function" }));
  expect(studioApi).toEqual({ compile: true, drafts: true });
  await openBuilder(page);
  await page.getByRole("button", { name: /^Studio$/i }).click();
  const startSample = page.locator('[data-action="studio-start-sample"]');
  if (!(await startSample.count())) await page.locator('[data-action="studio-reset"]').click();
  await page.locator('[data-action="studio-start-sample"]').click();
  await expect(page.getByRole("heading", { name: "Pressure Plate Alarm" })).toBeVisible();
  await page.locator('[data-action="studio-select-node"][data-studio-node-id="plate"]').click();
  await expect(page.getByText("Choose the area")).toBeVisible();
  const regionChoice = page.locator('[data-action="studio-pick-region"]').first();
  if (await regionChoice.count()) {
    await regionChoice.click();
    await expect(regionChoice).toContainText(/Selected/);
  }
  await page.locator('[data-action="studio-select-node"][data-studio-node-id="warning"]').click();
  await page.locator('[data-studio-field="text"]').fill("Display the warning");
  await page.locator('[data-action="studio-review"]').click();
  await expect(page.getByRole("heading", { name: "Pressure Plate Alarm" })).toBeVisible();
  await expect(page.getByText("Publishing adds a warning and a one-time pause to the selected area.")).toBeVisible();
  await expect(page.locator(".rbb-studio-review-success")).toHaveText("Ready to publish.");
  await page.locator('[data-action="studio-back"]').click();
  await expect(page.locator('[data-action="studio-back"]')).toHaveCount(0);
  await page.locator('[data-action="studio-save-draft"]').click();
  await expect(page.locator(".rbb-footer-status")).toContainText(/Saved Studio draft/, { timeout: 45_000 });
  await page.locator('[data-action="studio-reset"]').click();
  await page.locator('[data-action="studio-load-draft"]').click();
  await page.locator('[data-action="studio-select-node"][data-studio-node-id="warning"]').click();
  await expect(page.locator('[data-studio-field="text"]')).toHaveValue("Display the warning", { timeout: 45_000 });
});

test("Studio starts the named Secret Reveal template", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  await openBuilder(page);
  await page.getByRole("button", { name: /^Studio$/i }).click();
  await page.locator('[data-action="studio-start-secret-reveal"]').click();
  await expect(page.getByRole("heading", { name: "Reveal a Secret" })).toBeVisible();
  await expect(page.getByText("Choose the area")).toBeVisible();
  await page.locator('[data-action="studio-select-node"][data-studio-node-id="reveal"]').click();
  await expect(page.getByText("Choose hidden creatures")).toBeVisible();
});

test("Studio starts the Symbolic Key Gate template", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  await openBuilder(page);
  await page.getByRole("button", { name: /^Studio$/i }).click();
  await page.locator('[data-action="studio-start-key-gate"]').click();
  await expect(page.getByRole("heading", { name: "Symbolic Key Gate" })).toBeVisible();
  await expect(page.getByText("Choose the area")).toBeVisible();
  await page.locator('[data-action="studio-select-node"][data-studio-node-id="hub-facts"]').click();
  await expect(page.getByText("Choose objectives")).toBeVisible();
});

test("Studio publishes and removes only its Pressure Plate Alarm behaviors", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const region = (await scene.createEmbeddedDocuments("Region", [{
      name: `Regionwright E2E Pressure Plate ${Date.now()}`,
      shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const blueprint = structuredClone(api.studio.starter({ sceneUuid: scene.uuid, sceneName: scene.name }));
    blueprint.nodes.find(node => node.id === "plate").config.targetUuid = region.uuid;
    try {
      await game.settings.set("regionwright", "enableRegionWrites", true);
      const published = await api.studio.activities.publishPressurePlate(blueprint);
      const taggedAfterPublish = Array.from(region.behaviors).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "pressure-plate-alarm");
      const removed = await api.studio.activities.clearPressurePlate(blueprint);
      const taggedAfterRemove = Array.from(region.behaviors).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "pressure-plate-alarm");
      return {
        created: published.created.length,
        taggedAfterPublish: taggedAfterPublish.length,
        types: taggedAfterPublish.map(behavior => behavior.type).sort(),
        removed: removed.removed,
        taggedAfterRemove: taggedAfterRemove.length
      };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
    }
  });

  expect(report).toEqual({
    created: 2,
    taggedAfterPublish: 2,
    types: ["displayScrollingText", "pauseGame"],
    removed: 2,
    taggedAfterRemove: 0
  });
});

test("Studio Story Beat publishes and removes only its native behaviors", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const [region] = await scene.createEmbeddedDocuments("Region", [{
      name: `Regionwright E2E Story Beat ${Date.now()}`,
      shapes: [{ type: "rectangle", x: 600, y: 600, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]);
    const blueprint = structuredClone(api.studio.storyBeat({ sceneUuid: scene.uuid, sceneName: scene.name }));
    blueprint.nodes.find(node => node.id === "beat-region").config.targetUuid = region.uuid;
    try {
      await game.settings.set("regionwright", "enableRegionWrites", true);
      const published = await api.studio.activities.publishStoryBeat(blueprint);
      const taggedAfterPublish = Array.from(region.behaviors).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "story-beat");
      const removed = await api.studio.activities.clearStoryBeat(blueprint);
      const taggedAfterRemove = Array.from(region.behaviors).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "story-beat");
      return { created: published.created.length, taggedAfterPublish: taggedAfterPublish.length, types: taggedAfterPublish.map(behavior => behavior.type).sort(), removed: removed.removed, taggedAfterRemove: taggedAfterRemove.length };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
    }
  });
  expect(report).toEqual({ created: 2, taggedAfterPublish: 2, types: ["displayScrollingText", "pauseGame"], removed: 2, taggedAfterRemove: 0 });
});

test("Studio guides a GM across Scenes to publish and reset a Scene Portal", async ({ page }) => {
  test.setTimeout(120_000);
  await joinAsGM(page);
  const fixture = await page.evaluate(async () => {
    const originalSceneUuid = canvas.scene.uuid;
    const SceneClass = game.scenes.documentClass ?? globalThis.Scene;
    const prefix = `Regionwright E2E Studio Portal ${Date.now()}`;
    const [sourceScene, destinationScene] = await SceneClass.createDocuments([
      { name: `${prefix} Entrance`, width: 1200, height: 800, padding: 0.25, grid: { type: 1, size: 100 } },
      { name: `${prefix} Arrival`, width: 1200, height: 800, padding: 0.25, grid: { type: 1, size: 100 } }
    ]);
    const [sourceRegion] = await sourceScene.createEmbeddedDocuments("Region", [{ name: "Portal Entrance", shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }] }]);
    const [destinationRegion] = await destinationScene.createEmbeddedDocuments("Region", [{ name: "Portal Arrival", shapes: [{ type: "rectangle", x: 600, y: 200, width: 200, height: 200, hole: false }] }]);
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    await sourceScene.view();
    return { originalSceneUuid, sourceSceneUuid: sourceScene.uuid, destinationSceneUuid: destinationScene.uuid, sourceRegionUuid: sourceRegion.uuid, destinationRegionUuid: destinationRegion.uuid, previousWrites };
  });
  try {
    await openBuilder(page);
    await page.getByRole("button", { name: /^Studio$/i }).click();
    const portalStart = await page.evaluate(() => {
      try {
        globalThis.__regionwrightTestBuilder?._studioStartPortal();
        return { id: globalThis.__regionwrightTestBuilder?._rbbState?.studioBlueprint?.id ?? null };
      } catch (error) { return { id: null, error: error.message ?? String(error) }; }
    });
    expect(portalStart, JSON.stringify(portalStart)).toEqual({ id: "scene-portal" });
    await expect(page.locator(".rbb-flow-header h2")).toHaveText("Scene Portal", { timeout: 20_000 });
    await page.locator('[data-action="studio-pick-region"][data-studio-uuid="' + fixture.sourceRegionUuid + '"]').click();
    await page.locator('[data-action="studio-select-node"][data-studio-node-id="portal-arrival"]').click();
    await page.locator('[data-action="studio-set-portal-scene"][data-scene-uuid="' + fixture.destinationSceneUuid + '"]').click();
    await expect(page.getByRole("button", { name: "Switch Scene" })).toBeVisible();
    await page.getByRole("button", { name: "Switch Scene" }).click();
    await page.waitForFunction(sceneUuid => canvas.scene?.uuid === sceneUuid, fixture.destinationSceneUuid, { timeout: 20_000 });
    await page.evaluate(() => globalThis.__regionwrightTestBuilder?._refresh());
    const arrival = page.locator('[data-action="studio-pick-region"][data-studio-uuid="' + fixture.destinationRegionUuid + '"]');
    await expect(arrival).toBeVisible({ timeout: 20_000 });
    await arrival.click();
    await page.locator('[data-action="studio-review"]').click();
    await expect(page.getByText("Go back to the portal entrance Scene")).toBeVisible();
    const review = page.locator(".rbb-studio-review");
    await review.getByRole("button", { name: "Switch Scene" }).click();
    await page.waitForFunction(sceneUuid => canvas.scene?.uuid === sceneUuid, fixture.sourceSceneUuid, { timeout: 20_000 });
    await page.evaluate(() => globalThis.__regionwrightTestBuilder?._refresh());
    await expect(page.locator('[data-action="studio-publish"]')).toBeEnabled({ timeout: 20_000 });
    await page.locator('[data-action="studio-publish"]').click();
    const published = await page.evaluate(uuid => {
      const region = fromUuidSync(uuid);
      return Array.from(region?.behaviors ?? []).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "scene-portal").map(behavior => ({ type: behavior.type, destinations: Array.from(behavior.system?.destinations ?? []) }));
    }, fixture.sourceRegionUuid);
    expect(published).toEqual([{ type: "teleportToken", destinations: [fixture.destinationRegionUuid] }]);
    await page.locator('[data-action="studio-unpublish"]').click();
    const remaining = await page.evaluate(uuid => Array.from(fromUuidSync(uuid)?.behaviors ?? []).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "scene-portal").length, fixture.sourceRegionUuid);
    expect(remaining).toBe(0);
  } finally {
    await page.evaluate(async data => {
      const original = fromUuidSync(data.originalSceneUuid);
      if (original?.view) await original.view();
      await game.settings.set("regionwright", "enableRegionWrites", data.previousWrites);
      for (const uuid of [data.sourceSceneUuid, data.destinationSceneUuid]) {
        const scene = fromUuidSync(uuid);
        if (scene) await scene.delete();
      }
    }, fixture).catch(() => {});
  }
});

test("Studio Story Fact publishes, records GM-owned progress, and resets", async ({ page }) => {
  test.setTimeout(90_000);
  await joinAsGM(page);
  const fixture = await page.evaluate(async () => {
    const scene = canvas.scene;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const previousFacts = game.settings.get("regionwright", "studioStoryFacts");
    const [region] = await scene.createEmbeddedDocuments("Region", [{ name: `Regionwright E2E Story Fact ${Date.now()}`, shapes: [{ type: "rectangle", x: 400, y: 400, width: 200, height: 200, hole: false }] }]);
    await game.settings.set("regionwright", "enableRegionWrites", true);
    return { regionUuid: region.uuid, previousWrites, previousFacts };
  });
  try {
    await openBuilder(page);
    await page.getByRole("button", { name: /^Studio$/i }).click();
    await page.locator('[data-action="studio-start-story-fact"]').evaluate(button => button.click());
    await expect(page.locator(".rbb-flow-header h2")).toHaveText("Story Fact");
    await page.locator('[data-action="studio-pick-region"][data-studio-uuid="' + fixture.regionUuid + '"]').click();
    await page.locator('[data-action="studio-select-node"][data-studio-node-id="set-fact"]').click();
    await page.locator('[data-studio-field="factLabel"]').fill("E2E Crystal Awakened");
    await page.locator('[data-action="studio-select-node"][data-studio-node-id="fact-message"]').click();
    await page.locator('[data-studio-field="text"]').fill("The crystal awakens.");
    await page.locator('[data-action="studio-review"]').click();
    await expect(page.locator('[data-action="studio-publish"]')).toBeEnabled();
    await page.locator('[data-action="studio-publish"]').click();
    const result = await page.evaluate(async uuid => {
      const api = game.modules.get("regionwright")?.api;
      const region = fromUuidSync(uuid);
      const trigger = await api.studio.activities.handleStoryFact(region, { name: "tokenEnter" });
      const facts = api.studio.facts.list();
      const owned = Array.from(region.behaviors).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "story-fact").length;
      return { trigger, facts, owned };
    }, fixture.regionUuid);
    expect(result.trigger.status).toBe("set");
    expect(result.facts).toEqual(expect.arrayContaining([expect.objectContaining({ label: "E2E Crystal Awakened", value: true })]));
    expect(result.owned).toBe(2);
    await page.locator('[data-action="studio-unpublish"]').click();
    const remaining = await page.evaluate(uuid => Array.from(fromUuidSync(uuid)?.behaviors ?? []).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "story-fact").length, fixture.regionUuid);
    expect(remaining).toBe(0);
  } finally {
    await page.evaluate(async data => {
      const scene = fromUuidSync(data.regionUuid)?.parent;
      const region = fromUuidSync(data.regionUuid);
      if (region && scene) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      await game.settings.set("regionwright", "enableRegionWrites", data.previousWrites);
      await game.settings.set("regionwright", "studioStoryFacts", data.previousFacts);
    }, fixture).catch(() => {});
  }
});

test("Studio Hub Unlock opens a Door only after every chosen fact is true", async ({ page }) => {
  test.setTimeout(120_000);
  await joinAsGM(page);
  const fixture = await page.evaluate(async () => {
    const scene = canvas.scene;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const previousFacts = game.settings.get("regionwright", "studioStoryFacts");
    const [region] = await scene.createEmbeddedDocuments("Region", [{ name: `Regionwright E2E Hub ${Date.now()}`, shapes: [{ type: "rectangle", x: 600, y: 600, width: 200, height: 200, hole: false }] }]);
    const [door] = await scene.createEmbeddedDocuments("Wall", [{ c: [1000, 400, 1000, 600], door: CONST.WALL_DOOR_TYPES.DOOR, ds: CONST.WALL_DOOR_STATES.LOCKED }]);
    await game.settings.set("regionwright", "enableRegionWrites", true);
    const facts = game.modules.get("regionwright")?.api?.studio?.facts;
    await facts.set({ label: "E2E West Orb", value: true });
    await facts.set({ label: "E2E East Orb", value: true });
    return { regionUuid: region.uuid, doorUuid: door.uuid, previousWrites, previousFacts, facts: facts.list().filter(fact => /^E2E (West|East) Orb$/.test(fact.label)).map(fact => fact.id), locked: CONST.WALL_DOOR_STATES.LOCKED, closed: CONST.WALL_DOOR_STATES.CLOSED };
  });
  try {
    await openBuilder(page);
    await page.getByRole("button", { name: /^Studio$/i }).click();
    await page.locator('[data-action="studio-start-hub-unlock"]').evaluate(button => button.click());
    await expect(page.locator(".rbb-flow-header h2")).toHaveText("Hub Unlock");
    await page.locator('[data-action="studio-pick-region"][data-studio-uuid="' + fixture.regionUuid + '"]').click();
    await page.locator('[data-action="studio-select-node"][data-studio-node-id="hub-facts"]').click();
    for (const factId of fixture.facts) await page.locator('[data-action="studio-toggle-fact"][data-fact-id="' + factId + '"]').click();
    await page.locator('[data-action="studio-select-node"][data-studio-node-id="hub-door"]').click();
    await page.locator('[data-action="studio-pick-door"][data-studio-uuid="' + fixture.doorUuid + '"]').click();
    await page.locator('[data-action="studio-review"]').click();
    await expect(page.locator('[data-action="studio-publish"]')).toBeEnabled();
    await page.locator('[data-action="studio-publish"]').click();
    const unlocked = await page.evaluate(async ({ regionUuid, doorUuid }) => {
      const api = game.modules.get("regionwright")?.api;
      const result = await api.studio.activities.handleHubUnlock(fromUuidSync(regionUuid), { name: "tokenEnter" });
      return { result, doorState: fromUuidSync(doorUuid)?.ds, behaviors: Array.from(fromUuidSync(regionUuid)?.behaviors ?? []).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "hub-unlock").length };
    }, fixture);
    expect(unlocked.result.status).toBe("unlocked");
    expect(unlocked.doorState).toBe(fixture.closed);
    expect(unlocked.behaviors).toBe(2);
    await page.locator('[data-action="studio-unpublish"]').click();
    const reset = await page.evaluate(({ regionUuid, doorUuid }) => ({ doorState: fromUuidSync(doorUuid)?.ds, behaviors: Array.from(fromUuidSync(regionUuid)?.behaviors ?? []).filter(behavior => behavior.getFlag("regionwright", "studioActivity")?.id === "hub-unlock").length }), fixture);
    expect(reset).toEqual({ doorState: fixture.locked, behaviors: 0 });
  } finally {
    await page.evaluate(async data => {
      const region = fromUuidSync(data.regionUuid);
      const door = fromUuidSync(data.doorUuid);
      if (region?.parent) await region.parent.deleteEmbeddedDocuments("Region", [region.id]);
      if (door?.parent) await door.parent.deleteEmbeddedDocuments("Wall", [door.id]);
      await game.settings.set("regionwright", "enableRegionWrites", data.previousWrites);
      await game.settings.set("regionwright", "studioStoryFacts", data.previousFacts);
    }, fixture).catch(() => {});
  }
});

test("Studio Scene Moment reveals hidden creatures through the GM and resets them", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const [region] = await scene.createEmbeddedDocuments("Region", [{
      name: `Regionwright E2E Scene Moment ${Date.now()}`,
      shapes: [{ type: "rectangle", x: 400, y: 400, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]);
    const [token] = await scene.createEmbeddedDocuments("Token", [{
      name: "Regionwright Hidden Witness", x: 900, y: 900, width: 1, height: 1, hidden: true,
      texture: { src: "icons/svg/mystery-man.svg" }, flags: { regionwright: { integrationTest: true } }
    }]);
    const blueprint = structuredClone(api.studio.sceneMoment({ sceneUuid: scene.uuid, sceneName: scene.name }));
    blueprint.nodes.find(node => node.id === "moment-region").config.targetUuid = region.uuid;
    blueprint.nodes.find(node => node.id === "reveal").config.targetUuids = [token.uuid];
    try {
      await game.settings.set("regionwright", "enableRegionWrites", true);
      const published = await api.studio.activities.publishSceneMoment(blueprint);
      const trigger = await api.studio.activities.handleSceneMoment(region, { name: "tokenEnter" });
      const revealed = scene.tokens.get(token.id)?.hidden === false;
      const removed = await api.studio.activities.clearSceneMoment(blueprint);
      const reset = scene.tokens.get(token.id)?.hidden === true;
      return { created: published.created.length, trigger, revealed, removed: removed.removed, reset };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (scene.tokens.get(token.id)) await scene.deleteEmbeddedDocuments("Token", [token.id]);
    }
  });
  expect(report).toEqual({ created: 2, trigger: { status: "revealed", targets: 1 }, revealed: true, removed: 2, reset: true });
});

test("Studio Secret Reveal reveals and resets a hidden Tile through the GM", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const [region] = await scene.createEmbeddedDocuments("Region", [{ name: `Regionwright E2E Secret Area ${Date.now()}`, shapes: [{ type: "rectangle", x: 400, y: 400, width: 200, height: 200, hole: false }] }]);
    const [tile] = await scene.createEmbeddedDocuments("Tile", [{ x: 700, y: 400, width: 200, height: 200, hidden: true, texture: { src: "icons/svg/mystery-man.svg" } }]);
    const blueprint = structuredClone(api.studio.secretReveal({ sceneUuid: scene.uuid, sceneName: scene.name }));
    blueprint.nodes.find(node => node.id === "moment-region").config.targetUuid = region.uuid;
    blueprint.nodes.find(node => node.id === "reveal").config.targetTileUuids = [tile.uuid];
    try {
      await game.settings.set("regionwright", "enableRegionWrites", true);
      const published = await api.studio.activities.publishSceneMoment(blueprint);
      const trigger = await api.studio.activities.handleSceneMoment(region, { name: "tokenEnter" });
      const revealed = scene.tiles.get(tile.id)?.hidden === false;
      const removed = await api.studio.activities.clearSceneMoment(blueprint);
      return { created: published.created.length, trigger, revealed, removed: removed.removed, reset: scene.tiles.get(tile.id)?.hidden === true };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (scene.tiles.get(tile.id)) await scene.deleteEmbeddedDocuments("Tile", [tile.id]);
    }
  });
  expect(report).toEqual({ created: 2, trigger: { status: "revealed", targets: 1 }, revealed: true, removed: 2, reset: true });
});

test("Player3 requests Story Fact and Hub Unlock outcomes while the GM performs every write", async ({ browser }) => {
  test.setTimeout(150_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    fixture = await gmPage.evaluate(async () => {
      const api = game.modules.get("regionwright")?.api;
      const scene = canvas.scene;
      const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
      const previousFacts = game.settings.get("regionwright", "studioStoryFacts");
      const [factRegion, hubRegion] = await scene.createEmbeddedDocuments("Region", [
        { name: `Regionwright E2E Player Fact ${Date.now()}`, shapes: [{ type: "rectangle", x: 200, y: 200, width: 150, height: 150, hole: false }] },
        { name: `Regionwright E2E Player Hub ${Date.now()}`, shapes: [{ type: "rectangle", x: 600, y: 200, width: 150, height: 150, hole: false }] }
      ]);
      const [door] = await scene.createEmbeddedDocuments("Wall", [{ c: [1000, 200, 1000, 400], door: CONST.WALL_DOOR_TYPES.DOOR, ds: CONST.WALL_DOOR_STATES.LOCKED }]);
      await game.settings.set("regionwright", "enableRegionWrites", true);
      const factBlueprint = structuredClone(api.studio.storyFact({ sceneUuid: scene.uuid, sceneName: scene.name }));
      factBlueprint.nodes.find(node => node.id === "fact-region").config.targetUuid = factRegion.uuid;
      Object.assign(factBlueprint.nodes.find(node => node.id === "set-fact").config, { factId: "fact.e2e-player-key", label: "Player Key Found" });
      factBlueprint.nodes.find(node => node.id === "fact-message").config.text = "A key turns in the distance.";
      await api.studio.activities.publishStoryFact(factBlueprint);
      const hubBlueprint = structuredClone(api.studio.hubUnlock({ sceneUuid: scene.uuid, sceneName: scene.name }));
      hubBlueprint.nodes.find(node => node.id === "hub-region").config.targetUuid = hubRegion.uuid;
      hubBlueprint.nodes.find(node => node.id === "hub-facts").config.factIds = ["fact.e2e-player-key"];
      hubBlueprint.nodes.find(node => node.id === "hub-door").config.targetUuid = door.uuid;
      hubBlueprint.nodes.find(node => node.id === "hub-message").config.text = "The final door opens.";
      await api.studio.activities.publishHubUnlock(hubBlueprint);
      return { sceneUuid: scene.uuid, factRegionUuid: factRegion.uuid, hubRegionUuid: hubRegion.uuid, doorUuid: door.uuid, previousWrites, previousFacts, locked: CONST.WALL_DOOR_STATES.LOCKED, closed: CONST.WALL_DOOR_STATES.CLOSED };
    });
    await playerPage.waitForFunction(ids => Boolean(fromUuidSync(ids.factRegionUuid) && fromUuidSync(ids.hubRegionUuid) && fromUuidSync(ids.doorUuid)), fixture, { timeout: 20_000 });
    const factRequest = await playerPage.evaluate(async ids => {
      const api = game.modules.get("regionwright")?.api;
      return { userIsGM: game.user.isGM, result: await api.studio.activities.handleStoryFact(fromUuidSync(ids.factRegionUuid), { name: "tokenEnter" }) };
    }, fixture);
    expect(factRequest).toEqual({ userIsGM: false, result: { status: "requested" } });
    await gmPage.waitForFunction(factId => {
      const api = game.modules.get("regionwright")?.api;
      return api?.studio?.facts?.list?.().some(fact => fact.id === factId && fact.value === true);
    }, "fact.e2e-player-key", { timeout: 30_000 });
    const hubRequest = await playerPage.evaluate(async ids => ({ userIsGM: game.user.isGM, result: await game.modules.get("regionwright")?.api?.studio?.activities?.handleHubUnlock(fromUuidSync(ids.hubRegionUuid), { name: "tokenEnter" }) }), fixture);
    expect(hubRequest).toEqual({ userIsGM: false, result: { status: "requested" } });
    await gmPage.waitForFunction(({ doorUuid, closed }) => fromUuidSync(doorUuid)?.ds === closed, { doorUuid: fixture.doorUuid, closed: fixture.closed }, { timeout: 30_000 });
    const gmState = await gmPage.evaluate(({ factId, doorUuid }) => ({ fact: game.modules.get("regionwright")?.api?.studio?.facts?.list?.().find(entry => entry.id === factId)?.value, doorState: fromUuidSync(doorUuid)?.ds, userIsGM: game.user.isGM }), { factId: "fact.e2e-player-key", doorUuid: fixture.doorUuid });
    expect(gmState).toEqual({ fact: true, doorState: fixture.closed, userIsGM: true });
  } finally {
    if (fixture) await gmPage.evaluate(async data => {
      const api = game.modules.get("regionwright")?.api;
      const factRegion = fromUuidSync(data.factRegionUuid);
      const hubRegion = fromUuidSync(data.hubRegionUuid);
      const door = fromUuidSync(data.doorUuid);
      if (factRegion) {
        const blueprint = structuredClone(api.studio.storyFact({ sceneUuid: data.sceneUuid, sceneName: factRegion.parent.name }));
        blueprint.nodes.find(node => node.id === "fact-region").config.targetUuid = factRegion.uuid;
        Object.assign(blueprint.nodes.find(node => node.id === "set-fact").config, { factId: "fact.e2e-player-key", label: "Player Key Found" });
        try { await api.studio.activities.clearStoryFact(blueprint); } catch (_) {}
      }
      if (hubRegion) {
        const blueprint = structuredClone(api.studio.hubUnlock({ sceneUuid: data.sceneUuid, sceneName: hubRegion.parent.name }));
        blueprint.nodes.find(node => node.id === "hub-region").config.targetUuid = hubRegion.uuid;
        blueprint.nodes.find(node => node.id === "hub-facts").config.factIds = ["fact.e2e-player-key"];
        blueprint.nodes.find(node => node.id === "hub-door").config.targetUuid = data.doorUuid;
        try { await api.studio.activities.clearHubUnlock(blueprint); } catch (_) {}
      }
      const scene = fromUuidSync(data.sceneUuid);
      if (scene?.regions?.get(factRegion?.id)) await scene.deleteEmbeddedDocuments("Region", [factRegion.id]);
      if (scene?.regions?.get(hubRegion?.id)) await scene.deleteEmbeddedDocuments("Region", [hubRegion.id]);
      if (door?.parent?.walls?.get(door.id)) await door.parent.deleteEmbeddedDocuments("Wall", [door.id]);
      await game.settings.set("regionwright", "enableRegionWrites", data.previousWrites);
      await game.settings.set("regionwright", "studioStoryFacts", data.previousFacts);
    }, fixture).catch(() => {});
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("Player3 requests a Secret Reveal Tile while the GM performs the Tile write", async ({ browser }) => {
  test.setTimeout(120_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    fixture = await gmPage.evaluate(async () => {
      const api = game.modules.get("regionwright")?.api;
      const scene = canvas.scene;
      const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
      const [region] = await scene.createEmbeddedDocuments("Region", [{ name: `Regionwright E2E Player Secret ${Date.now()}`, shapes: [{ type: "rectangle", x: 200, y: 500, width: 150, height: 150, hole: false }] }]);
      const [tile] = await scene.createEmbeddedDocuments("Tile", [{ x: 600, y: 500, width: 200, height: 200, hidden: true, texture: { src: "icons/svg/mystery-man.svg" } }]);
      const blueprint = structuredClone(api.studio.secretReveal({ sceneUuid: scene.uuid, sceneName: scene.name }));
      blueprint.nodes.find(node => node.id === "moment-region").config.targetUuid = region.uuid;
      blueprint.nodes.find(node => node.id === "reveal").config.targetTileUuids = [tile.uuid];
      try { await game.settings.set("regionwright", "enableRegionWrites", true); await api.studio.activities.publishSceneMoment(blueprint); } catch (error) { await game.settings.set("regionwright", "enableRegionWrites", previousWrites); throw error; }
      return { sceneUuid: scene.uuid, regionUuid: region.uuid, tileUuid: tile.uuid, previousWrites };
    });
    await playerPage.waitForFunction(ids => Boolean(fromUuidSync(ids.regionUuid) && fromUuidSync(ids.tileUuid)), fixture, { timeout: 20_000 });
    const request = await playerPage.evaluate(async ids => ({ isGM: game.user.isGM, result: await game.modules.get("regionwright")?.api?.studio?.activities?.handleSceneMoment(fromUuidSync(ids.regionUuid), { name: "tokenEnter" }) }), fixture);
    expect(request).toEqual({ isGM: false, result: { status: "requested" } });
    await gmPage.waitForFunction(uuid => fromUuidSync(uuid)?.hidden === false, fixture.tileUuid, { timeout: 30_000 });
  } finally {
    if (fixture) await gmPage.evaluate(async data => {
      const scene = fromUuidSync(data.sceneUuid);
      const region = fromUuidSync(data.regionUuid);
      const tile = fromUuidSync(data.tileUuid);
      if (region && scene) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (tile && scene) await scene.deleteEmbeddedDocuments("Tile", [tile.id]);
      await game.settings.set("regionwright", "enableRegionWrites", data.previousWrites);
    }, fixture).catch(() => {});
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("teleport test API is available to the GM harness", async ({ page }) => {
  await joinAsGM(page);
  const apiState = await page.evaluate(() => {
    const api = game.modules.get("regionwright")?.api;
    return { available: Boolean(api), sceneTeleport: typeof api?.tests?.runSceneToSceneTeleport === "function" };
  });
  expect(apiState).toEqual({ available: true, sceneTeleport: true });
});

test("darkness behavior changes canvas darkness inside its selected Region", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      return await api.tests.run({
        behaviorKey: "darkness",
        parameters: { mode: "override", modifier: 0.5 },
        cleanup: true
      });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.enteredRegion).toBe(true);
  expect(report.darknessAfter).toBeCloseTo(0.5, 2);
});

test("active-effects behavior applies a selected world Active Effect", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const actorClass = game.actors.documentClass ?? globalThis.Actor;
    const itemClass = game.items.documentClass ?? globalThis.Item;
    const prefix = `Regionwright E2E Active Effect ${Date.now()}`;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    let actor;
    let item;
    try {
      actor = (await actorClass.createDocuments([{ name: `${prefix} Actor`, type: "character" }]))[0];
      item = (await itemClass.createDocuments([{
        name: `${prefix} Item`,
        type: "loot"
      }]))[0];
      const effect = (await item.createEmbeddedDocuments("ActiveEffect", [{
        name: `${prefix} Effect`,
        changes: [],
        duration: {}
      }]))[0];
      return await api.tests.run({
        behaviorKey: "active-effects",
        actor,
        effectUuid: effect.uuid,
        cleanup: true
      });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (item?.id && game.items.get(item.id)) await item.delete();
      if (actor?.id && game.actors.get(actor.id)) await actor.delete();
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.enteredRegion).toBe(true);
});

test("toggle-behavior disables its target Behavior on Token entry", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      return await api.tests.run({ behaviorKey: "toggle-behavior", cleanup: true });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.enteredRegion).toBe(true);
});

test("scrolling-text behavior reaches Foundry's native renderer", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const result = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const original = canvas.interface?.createScrollingText;
    const calls = [];
    if (typeof original === "function") {
      canvas.interface.createScrollingText = function (...args) {
        calls.push(args);
        return original.apply(this, args);
      };
    }
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      const report = await api.tests.run({
        behaviorKey: "scrolling-text",
        parameters: { events: ["tokenAnimateIn"], text: "Regionwright test", color: "#ffffff", visibility: "gm", once: false },
        cleanup: true
      });
      return { report, rendererAvailable: typeof original === "function", callCount: calls.length };
    } finally {
      if (typeof original === "function") canvas.interface.createScrollingText = original;
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
    }
  });
  console.log(`[Regionwright scrolling-text probe] ${JSON.stringify(result)}`);
  expect(result.rendererAvailable).toBe(true);
  expect(result.report.status, JSON.stringify(result, null, 2)).toBe("passed");
  expect(result.report.scrollingTextCalls).toBeGreaterThan(0);
});

test("execute-macro behavior runs an explicitly reviewed harmless Macro", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const macroClass = game.macros.documentClass ?? globalThis.Macro;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    const prefix = `Regionwright E2E Macro ${Date.now()}`;
    let macro;
    try {
      macro = (await macroClass.createDocuments([{
        name: prefix,
        type: "script",
        scope: "global",
        command: "globalThis.__regionwrightTestMacroCalls = (globalThis.__regionwrightTestMacroCalls ?? 0) + 1;"
      }]))[0];
      globalThis.__regionwrightTestMacroCalls = 0;
      return await api.tests.run({
        behaviorKey: "execute-macro",
        approvedMacro: true,
        macroUuid: macro.uuid,
        cleanup: true
      });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (macro?.id && game.macros.get(macro.id)) await macro.delete();
      delete globalThis.__regionwrightTestMacroCalls;
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.macroCallsAfter).toBeGreaterThan(report.macroCallsBefore);
});

test("execute-script behavior runs an explicitly approved harmless Script", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      globalThis.__regionwrightTestScriptCalls = 0;
      return await api.tests.run({
        behaviorKey: "execute-script",
        approvedScript: true,
        scriptSource: "globalThis.__regionwrightTestScriptCalls = (globalThis.__regionwrightTestScriptCalls ?? 0) + 1;",
        cleanup: true
      });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      delete globalThis.__regionwrightTestScriptCalls;
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.scriptCallsAfter).toBeGreaterThan(report.scriptCallsBefore);
});

test("pause behavior pauses the world when Player3 enters the Region", async ({ browser }) => {
  test.setTimeout(90_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    fixture = await gmPage.evaluate(async () => {
      const api = game.modules.get("regionwright")?.api;
      const scene = canvas.scene;
      const player = game.users.contents.find(user => /Player3/i.test(user.name) && !user.isGM);
      if (!player) throw new Error("Player3 is not available in the Utility Harness.");
      const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
      await game.settings.set("regionwright", "enableRegionWrites", true);
      const prefix = `Regionwright E2E Pause ${Date.now()}`;
      const actors = await (game.actors.documentClass ?? globalThis.Actor).createDocuments([{
        name: `${prefix} Actor`,
        type: "character",
        ownership: { default: 0, [player.id]: 3 }
      }]);
      const actor = actors[0];
      const regions = await scene.createEmbeddedDocuments("Region", [{
        name: `${prefix} Region`,
        shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }],
        flags: { regionwright: { integrationTest: true } }
      }]);
      const region = regions[0];
      const tokens = await scene.createEmbeddedDocuments("Token", [{
        name: `${prefix} Token`, x: 0, y: 0, width: 1, height: 1,
        actorId: actor.id, flags: { regionwright: { integrationTest: true } }
      }]);
      const token = tokens[0];
      const plan = api.plan.create({
        sceneUuid: scene.uuid,
        regions: [{ uuid: region.uuid, id: region.id, name: region.name, sceneUuid: scene.uuid }],
        behaviorKey: "pause",
        parameters: { once: false }
      });
      plan.approval.gmReviewed = true;
      await api.apply(plan, { regions: [region], activeSceneUuid: scene.uuid, writesEnabled: true });
      if (game.paused) game.togglePause(false);
      return { sceneUuid: scene.uuid, regionId: region.id, tokenId: token.id, actorId: actor.id, previousWrites };
    });

    await playerPage.waitForFunction(({ sceneUuid, tokenId }) => Boolean(
      game?.scenes?.active?.uuid === sceneUuid
      && canvas?.tokens?.get?.(tokenId)?.document?.isOwner
    ), fixture, { timeout: 15_000 });
    const moveResult = await playerPage.evaluate(async ({ tokenId }) => {
      const placeable = canvas.tokens.get(tokenId);
      if (!placeable?.document?.isOwner) return { owner: false, moved: false };
      const moved = await placeable.document.move([
        { x: 0, y: 0 },
        { x: 300, y: 300, action: "walk" }
      ]);
      return { owner: true, moved };
    }, fixture);
    expect(moveResult.owner).toBe(true);
    await gmPage.waitForFunction(() => game?.paused === true, null, { timeout: 15_000 });
  } finally {
    if (fixture) {
      await gmPage.evaluate(async ({ regionId, tokenId, actorId, previousWrites }) => {
        const scene = canvas.scene;
        if (scene?.tokens?.get(tokenId)) await scene.deleteEmbeddedDocuments("Token", [tokenId]);
        if (scene?.regions?.get(regionId)) await scene.deleteEmbeddedDocuments("Region", [regionId]);
        if (game.actors.get(actorId)) await game.actors.get(actorId).delete();
        if (game.paused) game.togglePause(false);
        await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      }, fixture).catch(error => console.warn("Pause E2E cleanup:", error));
    }
    await playerContext.close();
    await gmContext.close();
  }
});

test("weather layer exposes the v14 suppression state used by Regions", async ({ page }) => {
  await joinAsGM(page);
  const state = await page.evaluate(() => ({
    weatherKeys: Object.keys(canvas.weather ?? {}),
    weatherOwnKeys: Object.getOwnPropertyNames(canvas.weather ?? {}),
    suppressionChildren: canvas.weather?.suppression?.children?.length ?? null,
    effectCount: canvas.weather?.effects?.size ?? null,
    weatherConfigKeys: Object.keys(CONFIG.weatherEffects ?? {}),
    sceneEnvironment: canvas.scene?.environment?.toObject?.() ?? canvas.scene?.environment ?? null
  }));
  console.log(`[Regionwright weather probe] ${JSON.stringify(state)}`);
  expect(state.weatherOwnKeys).toContain("suppression");
});

test("suppress-weather behavior creates a local suppression mesh for native rain", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const result = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    canvas.weather.initializeEffects(CONFIG.weatherEffects.rain);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const report = await api.tests.run({ behaviorKey: "suppress-weather", weather: true, cleanup: true });
      return {
        report,
        weatherEffectCount: canvas.weather.effects.size,
        suppressionChildren: canvas.weather.suppression.children.length
      };
    } finally {
      canvas.weather.clearEffects();
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
    }
  });

  expect(result.weatherEffectCount).toBeGreaterThan(0);
  expect(result.report.status, JSON.stringify(result, null, 2)).toBe("passed");
  expect(result.report.weatherSuppressionAfter).toBeGreaterThan(result.report.weatherSuppressionBefore);
});

test("define-surface behavior registers the reviewed interaction flags", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      return await api.tests.run({
        behaviorKey: "define-surface",
        parameters: { placement: "bottom", light: false, move: true, sight: false, sound: true, occlusion: true, exposure: false, culling: false },
        cleanup: true
      });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.surfaceAfter).toBeGreaterThan(report.surfaceBefore);
  expect(report.surface).toMatchObject({ light: false, move: true, sight: false, sound: true, occlusion: true });
});

test("change-level behavior opens the native Scene Level prompt", async ({ page }) => {
  test.setTimeout(90_000);
  await joinAsGM(page);
  const fixture = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const stalePrefix = "Regionwright E2E Change Level";
    const staleTokens = Array.from(scene.tokens ?? []).filter(token => String(token.name ?? "").startsWith(stalePrefix)).map(token => token.id);
    const staleRegions = Array.from(scene.regions ?? []).filter(region => String(region.name ?? "").startsWith(stalePrefix)).map(region => region.id);
    const staleLevels = Array.from(scene.levels ?? []).filter(level => String(level.name ?? "").startsWith(stalePrefix)).map(level => level.id);
    if (staleTokens.length) await scene.deleteEmbeddedDocuments("Token", staleTokens);
    if (staleRegions.length) await scene.deleteEmbeddedDocuments("Region", staleRegions);
    if (staleLevels.length) await scene.deleteEmbeddedDocuments("Level", staleLevels);
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    const prefix = `Regionwright E2E Change Level ${Date.now()}`;
    const levels = await scene.createEmbeddedDocuments("Level", [
      { name: `${prefix} Ground`, elevation: { bottom: 0, top: 10 } },
      { name: `${prefix} Upper`, elevation: { bottom: 10, top: 20 } }
    ]);
    const regions = await scene.createEmbeddedDocuments("Region", [{
      name: `${prefix} Region`,
      shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]);
    const region = regions[0];
    const tokens = await scene.createEmbeddedDocuments("Token", [{
      name: `${prefix} Token`, x: 0, y: 0, width: 1, height: 1, elevation: 0,
      flags: { regionwright: { integrationTest: true } }
    }]);
    const token = tokens[0];
    const plan = api.plan.create({
      sceneUuid: scene.uuid,
      regions: [{ uuid: region.uuid, id: region.id, name: region.name, sceneUuid: scene.uuid }],
      behaviorKey: "change-level",
      parameters: { movementActionsText: "walk" }
    });
    plan.approval.gmReviewed = true;
    await api.apply(plan, { regions: [region], activeSceneUuid: scene.uuid, writesEnabled: true });
    globalThis.__regionwrightChangeLevelMove = canvas.tokens.get(token.id).document.move([
      { x: 0, y: 0 }, { x: 300, y: 300, action: "walk" }
    ]).catch(() => false);
    return { sceneUuid: scene.uuid, levelIds: levels.map(level => level.id), regionId: region.id, tokenId: token.id, previousWrites };
  });

  try {
    const dialogs = page.locator('dialog[open], [role="dialog"]:visible');
    await expect(dialogs.first()).toBeVisible({ timeout: 10_000 });
    const dialogText = await dialogs.last().innerText();
    console.log(`[Regionwright Change Level prompt] ${dialogText}`);
    expect(dialogText).toMatch(/level/i);
    await dialogs.last().getByRole("button", { name: /don't move|cancel|close/i }).click().catch(() => {});
    await page.waitForTimeout(500);
  } finally {
    await page.evaluate(async ({ levelIds, regionId, tokenId, previousWrites }) => {
      delete globalThis.__regionwrightChangeLevelMove;
      const scene = canvas.scene;
      if (scene.tokens.get(tokenId)) await scene.deleteEmbeddedDocuments("Token", [tokenId]);
      if (scene.regions.get(regionId)) await scene.deleteEmbeddedDocuments("Region", [regionId]);
      if (levelIds.length) await scene.deleteEmbeddedDocuments("Level", levelIds);
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
    }, fixture);
  }
});

test("movement-cost behavior participates in an actual Token movement path", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const actor = (await (game.actors.documentClass ?? globalThis.Actor).createDocuments([{
      name: `Regionwright E2E Movement Path ${Date.now()}`, type: "character"
    }]))[0];
    const region = (await scene.createEmbeddedDocuments("Region", [{
      name: `Regionwright E2E Movement Path Region ${Date.now()}`,
      shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const token = (await scene.createEmbeddedDocuments("Token", [{
      name: `Regionwright E2E Movement Path Token ${Date.now()}`, x: 0, y: 0, width: 1, height: 1,
      actorId: actor.id, flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      const action = Object.keys(CONFIG.Token?.movement?.actions ?? {}).find(entry => entry !== "displace") ?? "walk";
      const plan = api.plan.create({
        sceneUuid: scene.uuid,
        regions: [{ uuid: region.uuid, id: region.id, name: region.name, sceneUuid: scene.uuid }],
        behaviorKey: "movement-cost",
        parameters: { difficulties: { [action]: 2 } }
      });
      plan.approval.gmReviewed = true;
      await api.apply(plan, { regions: [region], activeSceneUuid: scene.uuid, writesEnabled: true });
      const placeable = canvas.tokens.get(token.id);
      placeable.control({ releaseOthers: false, pan: false });
      const moved = await token.move({ x: 300, y: 300, action });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const processed = placeable.createTerrainMovementPath([
        { x: 0, y: 0 }, { x: 300, y: 300, action }
      ], { preview: false });
      return {
        moved,
        tokenPosition: { x: token.x, y: token.y },
        terrain: processed.map(waypoint => waypoint.terrain?.toObject?.() ?? waypoint.terrain ?? null).filter(Boolean)
      };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (scene.tokens.get(token.id)) await scene.deleteEmbeddedDocuments("Token", [token.id]);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (game.actors.get(actor.id)) await actor.delete();
    }
  });

  expect(report.moved, JSON.stringify(report, null, 2)).toBe(true);
  expect(report.tokenPosition.x).toBeGreaterThanOrEqual(200);
  expect(report.tokenPosition.y).toBeGreaterThanOrEqual(200);
  expect(report.tokenPosition.x).toBeLessThan(300);
  expect(report.tokenPosition.y).toBeLessThan(300);
  expect(report.terrain.length, JSON.stringify(report, null, 2)).toBeGreaterThan(0);
});

test("D&D5e difficult-terrain behavior affects an actual Token movement path", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const actor = (await (game.actors.documentClass ?? globalThis.Actor).createDocuments([{
      name: `Regionwright E2E Difficult Terrain ${Date.now()}`, type: "character"
    }]))[0];
    const region = (await scene.createEmbeddedDocuments("Region", [{
      name: `Regionwright E2E Difficult Terrain Region ${Date.now()}`,
      shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const token = (await scene.createEmbeddedDocuments("Token", [{
      name: `Regionwright E2E Difficult Terrain Token ${Date.now()}`, x: 0, y: 0, width: 1, height: 1,
      actorId: actor.id, flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      const action = Object.keys(CONFIG.Token?.movement?.actions ?? {}).find(entry => entry !== "displace") ?? "walk";
      const plan = api.plan.create({
        sceneUuid: scene.uuid,
        regions: [{ uuid: region.uuid, id: region.id, name: region.name, sceneUuid: scene.uuid }],
        behaviorKey: "difficult-terrain",
        parameters: { magical: false }
      });
      plan.approval.gmReviewed = true;
      await api.apply(plan, { regions: [region], activeSceneUuid: scene.uuid, writesEnabled: true });
      const placeable = canvas.tokens.get(token.id);
      placeable.control({ releaseOthers: false, pan: false });
      const moved = await token.move({ x: 300, y: 300, action });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const processed = placeable.createTerrainMovementPath([
        { x: 0, y: 0 }, { x: 300, y: 300, action }
      ], { preview: false });
      return {
        moved,
        tokenPosition: { x: token.x, y: token.y },
        terrain: processed.map(waypoint => waypoint.terrain?.toObject?.() ?? waypoint.terrain ?? null).filter(Boolean)
      };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (scene.tokens.get(token.id)) await scene.deleteEmbeddedDocuments("Token", [token.id]);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (game.actors.get(actor.id)) await actor.delete();
    }
  });

  expect(report.moved).toBe(true);
  expect(report.tokenPosition.x).toBeGreaterThanOrEqual(200);
  expect(report.tokenPosition.y).toBeGreaterThanOrEqual(200);
  expect(report.tokenPosition.x).toBeLessThan(300);
  expect(report.tokenPosition.y).toBeLessThan(300);
  expect(report.terrain.length, JSON.stringify(report, null, 2)).toBeGreaterThan(0);
});

test("shared integration runner verifies both native terrain behaviors", async ({ page }) => {
  test.setTimeout(90_000);
  await joinAsGM(page);
  const results = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const actor = (await (game.actors.documentClass ?? globalThis.Actor).createDocuments([{
      name: `Regionwright E2E Shared Terrain Runner ${Date.now()}`, type: "character"
    }]))[0];
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    try {
      const action = Object.keys(CONFIG.Token?.movement?.actions ?? {}).find(entry => entry !== "displace") ?? "walk";
      const movement = await api.tests.run({ behaviorKey: "movement-cost", actor, parameters: { difficulties: { [action]: 2 } }, cleanup: true });
      const difficult = await api.tests.run({ behaviorKey: "difficult-terrain", actor, cleanup: true });
      return { movement, difficult };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (game.actors.get(actor.id)) await actor.delete();
    }
  });

  expect(results.movement.status, JSON.stringify(results, null, 2)).toBe("passed");
  expect(results.difficult.status, JSON.stringify(results, null, 2)).toBe("passed");
});

test("Player3 can open the lockpick puzzle and submit a GM-routed attempt", async ({ browser }) => {
  test.setTimeout(90_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    fixture = await gmPage.evaluate(async () => {
      const api = game.modules.get("regionwright")?.api;
      const scene = canvas.scene;
      const previousPuzzleWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      const wall = (await scene.createEmbeddedDocuments("Wall", [{
        name: `Regionwright E2E Lockpick Door ${Date.now()}`,
        c: [400, 200, 400, 400],
        door: 1,
        ds: CONST.WALL_DOOR_STATES.LOCKED,
        flags: { regionwright: { integrationTest: true } }
      }]))[0];
      const configured = await api.lockpicking.configureDoor({ door: wall, difficulty: "veryEasy", seed: "player-routing" });
      return { doorUuid: wall.uuid, config: configured.config, previousPuzzleWrites };
    });

    await joinAsPlayer(playerPage);
    const playerResult = await playerPage.evaluate(async ({ doorUuid, config }) => {
      const api = game.modules.get("regionwright")?.api;
      const dialog = await api.lockpicking.open(doorUuid);
      const opened = Boolean(dialog);
      const hasNativeDoorPermission = Boolean(game.user.can?.("WALL_DOORS"));
      await new Promise(resolve => setTimeout(resolve, 500));
      const visible = Boolean(document.querySelector(".rw-lockpick-dialog"));
      const movementEvent = new KeyboardEvent("keydown", { code: "KeyW", key: "w", bubbles: true, cancelable: true });
      document.body.dispatchEvent(movementEvent);
      const movementBlocked = movementEvent.defaultPrevented && !game.keyboard.downKeys.has("KeyW");
      const result = await api.lockpicking.request({ doorUuid, picks: config.targets, tension: config.tension });
      return { opened, visible, guardInstalled: typeof dialog?._movementGuardRelease === "function", movementBlocked, hasNativeDoorPermission, isGM: game.user.isGM, role: game.user.role, pending: result?.pending === true };
    }, fixture);
    try {
      await playerPage.waitForFunction(() => !document.querySelector(".rw-lockpick-dialog"), null, { timeout: 10_000 });
    } catch (error) {
      const relayState = await Promise.all([
        gmPage.evaluate(() => ({
          user: { id: game.user?.id, isGM: game.user?.isGM },
          activeGM: { id: game.users?.activeGM?.id ?? null, isGM: game.users?.activeGM?.isGM ?? false },
          socketListeners: Object.keys(game.socket?._callbacks ?? {}).filter(key => key.includes("regionwright"))
        })),
        playerPage.evaluate(() => ({
          user: { id: game.user?.id, isGM: game.user?.isGM },
          activeGM: { id: game.users?.activeGM?.id ?? null, isGM: game.users?.activeGM?.isGM ?? false },
          socketListeners: Object.keys(game.socket?._callbacks ?? {}).filter(key => key.includes("regionwright")),
          feedback: document.querySelector(".rw-lockpick-feedback")?.textContent?.trim() ?? ""
        }))
      ]);
      throw new Error(`Lockpick GM relay did not complete: ${JSON.stringify(relayState)}`, { cause: error });
    }
    const gmDoorState = await gmPage.evaluate(({ doorUuid }) => {
      const door = fromUuidSync(doorUuid);
      return {
        ds: door?.ds,
        lockFlag: door?.getFlag?.("regionwright", "lockpicking") ?? null,
        lockedState: CONST.WALL_DOOR_STATES.LOCKED,
        closedState: CONST.WALL_DOOR_STATES.CLOSED
      };
    }, fixture);
    console.log(`[lockpick player] ${JSON.stringify(playerResult)}`);
    console.log(`[lockpick gm state] ${JSON.stringify(gmDoorState)}`);

    expect(playerResult.opened).toBe(true);
    expect(playerResult.visible).toBe(true);
    expect(playerResult.movementBlocked).toBe(true);
    expect(playerResult.isGM).toBe(false);
    expect(playerResult.pending).toBe(true);
    expect(gmDoorState.ds).toBe(gmDoorState.closedState);
    expect(gmDoorState.ds).not.toBe(gmDoorState.lockedState);
  } finally {
    if (fixture) {
      await gmPage.evaluate(async ({ doorUuid, previousPuzzleWrites }) => {
        const door = fromUuidSync(doorUuid);
        if (door?.parent?.deleteEmbeddedDocuments) await door.parent.deleteEmbeddedDocuments("Wall", [door.id]);
        await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousPuzzleWrites);
      }, fixture);
    }
    await playerContext.close();
    await gmContext.close();
  }
});

test("Pitfall Trap executes through the native Region script, detects the Token, and returns it", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const scene = canvas.scene;
    const actor = (await (game.actors.documentClass ?? globalThis.Actor).createDocuments([{
      name: `Regionwright E2E Pitfall Success ${Date.now()}`, type: "character"
    }]))[0];
    const region = (await scene.createEmbeddedDocuments("Region", [{
      name: `Regionwright E2E Pitfall Region ${Date.now()}`,
      shapes: [{ type: "rectangle", x: 200, y: 200, width: 200, height: 200, hole: false }],
      flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const token = (await scene.createEmbeddedDocuments("Token", [{
      name: `Regionwright E2E Pitfall Token ${Date.now()}`, x: 0, y: 0, width: 1, height: 1,
      actorId: actor.id, flags: { regionwright: { integrationTest: true } }
    }]))[0];
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    const previousPuzzleWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);
    await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
    try {
      await api.traps.configurePitfall({ region, dc: 1, once: false, damage: "1d1" });
      actor.rollSkill = async () => ({ total: 20 });
      const placeable = canvas.tokens.get(token.id);
      placeable.control({ releaseOthers: false, pan: false });
      const moved = await token.move({ x: 300, y: 300, action: "walk" });
      await new Promise(resolve => setTimeout(resolve, 1500));
      const config = region.getFlag("regionwright", "pitfallTrap");
      return {
        moved,
        tokenPosition: { x: token.x, y: token.y },
        detected: config?.state?.detectedBy?.includes(token.uuid) ?? false,
        crossed: config?.state?.crossedBy?.includes(token.uuid) ?? false,
        triggered: config?.state?.triggered ?? false
      };
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousPuzzleWrites);
      if (scene.tokens.get(token.id)) await scene.deleteEmbeddedDocuments("Token", [token.id]);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      if (game.actors.get(actor.id)) await actor.delete();
    }
  });

  expect(report.moved, JSON.stringify(report, null, 2)).toBe(false);
  expect(report.tokenPosition.x).toBe(0);
  expect(report.tokenPosition.y).toBe(0);
  expect(report.detected).toBe(true);
  expect(report.crossed).toBe(false);
  expect(report.triggered).toBe(false);
});

test("Puzzles & Locks Rotation Lock setup guides a GM from Door selection to the playable puzzle", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const fixture = await page.evaluate(async () => {
    const scene = canvas.scene;
    const previousPuzzleWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
    await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
    const wall = (await scene.createEmbeddedDocuments("Wall", [{
      name: `Regionwright E2E Rotation Lock Door ${Date.now()}`,
      c: [600, 200, 600, 400], door: 1, ds: CONST.WALL_DOOR_STATES.LOCKED,
      flags: { regionwright: { integrationTest: true } }
    }]))[0];
    return { doorUuid: wall.uuid, doorName: wall.name, previousPuzzleWrites };
  });

  try {
    await openBuilder(page);
    await page.locator('.regionwright:not(.regionwright-guide) [data-action="topic"][data-topic="puzzles"]').click();
    await page.getByRole("button", { name: /Open Puzzles & Locks/i }).click();
    const rotationOption = page.locator('.rw-pl-hub-games [data-setup="rotation-lock"]');
    await expect(rotationOption).toBeVisible({ timeout: 15_000 });
    await rotationOption.evaluate(button => button.click());
    await expect(page.locator(".rw-rotation-setup-dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Choose Door & difficulty.")).toBeVisible();

    const doorOption = page.locator(`.rw-rotation-setup-dialog [data-door="${fixture.doorUuid}"]`);
    await expect(doorOption).toBeVisible();
    await doorOption.click();
    const createButton = page.locator('.rw-rotation-setup-dialog [data-create="true"]');
    await expect(createButton).toBeEnabled();
    await createButton.click();
    await expect(page.locator(".rw-rotation-setup-dialog")).toHaveCount(0, { timeout: 15_000 });

    const runtime = await page.evaluate(async ({ doorUuid }) => {
      const module = game.modules.get("regionwright-puzzles-locks");
      const door = fromUuidSync(doorUuid);
      const data = door?.getFlag("regionwright", "rotatingLock");
      const dialog = await module?.api?.rotatingLock?.open(doorUuid);
      await new Promise(resolve => setTimeout(resolve, 500));
      const torqueEvent = new KeyboardEvent("keydown", { code: "KeyA", key: "a", bubbles: true, cancelable: true });
      document.body.dispatchEvent(torqueEvent);
      const torqueInput = dialog?.lockState?.torqueInput ?? 0;
      const releaseEvent = new KeyboardEvent("keyup", { code: "KeyA", key: "a", bubbles: true, cancelable: true });
      document.body.dispatchEvent(releaseEvent);
      const pointBoard = document.querySelector(".rw-rotation-dialog [data-rw-rotation-point-board]");
      const pixels = pointBoard?.width && pointBoard?.height ? pointBoard.getContext("2d")?.getImageData(0, 0, pointBoard.width, pointBoard.height).data : null;
      let pointBoardHasMarks = false;
      if (pixels) for (let index = 3; index < pixels.length; index += 4) { if (pixels[index] > 0) { pointBoardHasMarks = true; break; } }
      window.__rwRotationPointBoardProbe = pointBoard;
      return { configured: Boolean(data?.config?.premiumFeature), puzzleOpen: Boolean(dialog), visible: Boolean(document.querySelector(".rw-rotation-dialog")), pointBoardRendered: Boolean(pointBoard && pointBoard.width > 0 && pointBoard.height > 0 && pointBoardHasMarks), torqueInput, torqueBlocked: torqueEvent.defaultPrevented, releaseBlocked: releaseEvent.defaultPrevented };
    }, fixture);
    expect(runtime.configured).toBe(true);
    expect(runtime.puzzleOpen).toBe(true);
    expect(runtime.visible).toBe(true);
    expect(runtime.pointBoardRendered).toBe(true);
    expect(runtime.torqueInput).toBe(1);
    expect(runtime.torqueBlocked).toBe(true);
    expect(runtime.releaseBlocked).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.locator(".rw-rotation-dialog")).toHaveCount(0, { timeout: 5_000 });
    const pointBoardDisposed = await page.evaluate(() => {
      const canvas = window.__rwRotationPointBoardProbe;
      delete window.__rwRotationPointBoardProbe;
      return Boolean(canvas && canvas.width === 0 && canvas.height === 0);
    });
    expect(pointBoardDisposed).toBe(true);
  } finally {
    await page.evaluate(async ({ doorUuid, previousPuzzleWrites }) => {
      const door = fromUuidSync(doorUuid);
      if (door?.parent?.deleteEmbeddedDocuments) await door.parent.deleteEmbeddedDocuments("Wall", [door.id]);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousPuzzleWrites);
    }, fixture);
  }
});

test("Player3 finishes a Rotation Lock through the active GM without a local Wall write", async ({ browser }) => {
  test.setTimeout(90_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    fixture = await gmPage.evaluate(async () => {
      const scene = canvas.scene;
      const previousPuzzleWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      const door = (await scene.createEmbeddedDocuments("Wall", [{
        name: `Regionwright E2E Player Rotation Door ${Date.now()}`,
        c: [500, 200, 500, 400], door: 1, ds: CONST.WALL_DOOR_STATES.LOCKED,
        flags: { regionwright: { integrationTest: true } }
      }]))[0];
      await game.modules.get("regionwright-puzzles-locks")?.api?.rotatingLock?.configureDoor({ door, baseTier: 0, seed: "player-rotation" });
      return { doorUuid: door.uuid, previousPuzzleWrites };
    });
    await joinAsPlayer(playerPage);
    await playerPage.waitForFunction(({ doorUuid }) => Boolean(
      game.modules.get("regionwright-puzzles-locks")?.api?.rotatingLock
      && fromUuidSync(doorUuid)?.getFlag?.("regionwright", "rotatingLock")
    ), fixture, { timeout: 15_000 });
    const playerResult = await playerPage.evaluate(async ({ doorUuid }) => {
      const puzzle = game.modules.get("regionwright-puzzles-locks")?.api?.rotatingLock;
      const dialog = await puzzle?.open(doorUuid);
      if (!dialog) return { opened: false, completed: false };
      const originalUpdate = dialog.door.update;
      let localWriteAttempted = false;
      dialog.door.update = async () => {
        localWriteAttempted = true;
        throw new Error("Player attempted a local Wall write.");
      };
      try {
        // A real player spends more than one event loop after the GM creates
        // the session before opening the cylinder. Let both socket clients
        // settle before exercising the finish relay directly.
        await new Promise(resolve => setTimeout(resolve, 750));
        await dialog._onOpened();
      } finally {
        dialog.door.update = originalUpdate;
      }
      return { opened: true, localWriteAttempted, isGM: game.user.isGM };
    }, fixture);
    const gmDoorState = await gmPage.evaluate(({ doorUuid }) => {
      const door = fromUuidSync(doorUuid);
      return {
        ds: door?.ds,
        closed: CONST.WALL_DOOR_STATES.CLOSED,
        userId: game.user?.id,
        activeGMId: game.users?.activeGM?.id ?? null,
        listeners: game.socket?.listeners?.("module.regionwright")?.length ?? null
      };
    }, fixture);
    expect(playerResult, JSON.stringify({ playerResult, gmDoorState }, null, 2)).toEqual({ opened: true, localWriteAttempted: false, isGM: false });
    expect(gmDoorState.ds).toBe(gmDoorState.closed);
  } finally {
    if (fixture) {
      await gmPage.evaluate(async ({ doorUuid, previousPuzzleWrites }) => {
        const door = fromUuidSync(doorUuid);
        if (door?.parent?.walls?.get(door.id)) await door.parent.deleteEmbeddedDocuments("Wall", [door.id]);
        await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousPuzzleWrites);
      }, fixture).catch(() => {});
    }
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("Studio diagnostics expose repair notes in the live GM runtime without writing", async ({ page }) => {
  test.setTimeout(60_000);
  await joinAsGM(page);
  const report = await page.evaluate(() => {
    const studio = game.modules.get("regionwright")?.api?.studio;
    const blueprint = structuredClone(studio?.hubUnlock?.({ sceneUuid: canvas.scene.uuid, sceneName: canvas.scene.name }));
    blueprint.nodes.find(node => node.id === "hub-region").config.targetUuid = "Scene.missing.Region.missing";
    blueprint.nodes.find(node => node.id === "hub-facts").config.factIds = ["fact.unfinished"];
    blueprint.nodes.find(node => node.id === "hub-door").config.targetUuid = "Scene.missing.Wall.missing";
    const result = studio?.diagnose?.(blueprint, {
      facts: { "fact.unfinished": { label: "Find the moon key", value: false } },
      resolveUuid: () => null
    });
    return {
      available: typeof studio?.diagnose === "function",
      status: result?.status,
      errors: result?.errors?.map(item => item.message) ?? [],
      warnings: result?.warnings?.map(item => item.message) ?? []
    };
  });
  expect(report.available).toBe(true);
  expect(report.status).toBe("blocked");
  expect(report.errors.join(" ")).toMatch(/target that still exists/i);
  expect(report.warnings.join(" ")).toMatch(/moon key.*not complete/i);
});

test("cross-Scene teleport moves a test Token into the resulting destination Region", async ({ page }) => {
  test.setTimeout(60_000);
  page.on("console", message => {
    const text = message.text();
    if ((message.type() === "error" && !text.includes("screen resolution")) || text.includes("cleanup")) console.log(`[Foundry ${message.type()}] ${text}`);
  });
  await joinAsGM(page);

  const report = await page.evaluate(async () => {
    const api = game.modules.get("regionwright")?.api;
    const prefix = `Regionwright E2E Scene Teleport ${Date.now()}`;

    const SceneDocument = game.scenes.documentClass ?? globalThis.Scene;
    const scenes = await SceneDocument.createDocuments([
      { name: `${prefix} Source`, width: 1200, height: 800, padding: 0.25, grid: { type: 1, size: 100 } },
      { name: `${prefix} Destination`, width: 1200, height: 800, padding: 0.25, grid: { type: 1, size: 100 } }
    ]);
    const sourceScene = scenes[0];
    const destinationScene = scenes[1];
    const previousWrites = game.settings.get("regionwright", "enableRegionWrites");
    await game.settings.set("regionwright", "enableRegionWrites", true);

    try {
      await sourceScene.view();
      return await api.tests.runSceneToSceneTeleport({
        sourceScene,
        destinationScene,
        transitionDuration: 500,
        cleanup: true
      });
    } finally {
      await game.settings.set("regionwright", "enableRegionWrites", previousWrites);
      if (game.scenes.active?.uuid !== sourceScene.uuid) {
        try { await sourceScene.view(); } catch (error) { console.warn("E2E source Scene restore:", error); }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      for (const scene of scenes) {
        if (!game.scenes.get(scene.id)) continue;
        try { await scene.delete(); } catch (error) { console.warn("E2E fixture cleanup:", error); }
      }
    }
  });

  expect(report.status, JSON.stringify(report, null, 2)).toBe("passed");
  expect(report.sceneSwitched).toBe(true);
  expect(report.destinationContainsToken).toBe(true);
  expect(report.sourceRegionUuid).toContain("Region");
  expect(report.destinationRegionUuid).toContain("Region");
});

test("GM and Player3 contexts can stay connected for player-client verification", async ({ browser }) => {
  test.setTimeout(120_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    const roles = await Promise.all([
      gmPage.evaluate(() => ({ isGM: game.user.isGM, name: game.user.name })),
      playerPage.evaluate(() => ({ isGM: game.user.isGM, name: game.user.name }))
    ]);
    expect(roles[0].isGM).toBe(true);
    expect(roles[1].isGM).toBe(false);
    expect(roles[1].name).toMatch(/Player3/i);
  } finally {
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("Laser Grid routes an eight-way player puzzle through the GM listener", async ({ browser }) => {
  test.setTimeout(90_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    await gmPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.laserGrid), null, { timeout: 15_000 });
    await playerPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.laserGrid), null, { timeout: 15_000 });
    await playerPage.waitForTimeout(500);
    fixture = await gmPage.evaluate(async () => {
      const module = game.modules.get("regionwright-puzzles-locks");
      const api = module?.api?.laserGrid;
      const door = [...canvas.scene.walls.values()].find(entry => Number(entry.door ?? 0) > 0);
      if (!api || !door) throw new Error(JSON.stringify({ hasPremiumApi: Boolean(module?.api), premiumKeys: Object.keys(module?.api ?? {}), doorCount: canvas.scene.walls.size, moduleActive: module?.active, moduleTitle: module?.title }));
      const previousWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
      const previousState = door.ds;
      const previousFlag = structuredClone(door.flags?.regionwright?.laserGrid ?? null);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      await api.configureDoor({ door, tier: 1, seed: "e2e-laser-grid" });
      return { doorUuid: door.uuid, previousWrites, previousState, previousFlag };
    });
    const solution = await playerPage.evaluate(async ({ doorUuid }) => {
      const engine = await import("/modules/regionwright-puzzles-locks/scripts/laser-grid-engine.js");
      const door = fromUuidSync(doorUuid);
      const config = door.getFlag("regionwright", "laserGrid").config;
      const pieces = config.pieces;
      let found = null;
      const search = (index, orientations = {}) => {
        if (found) return;
        if (index === pieces.length) {
          if (engine.traceLaserGrid(config, orientations).solved) found = orientations;
          return;
        }
        const piece = pieces[index];
        const count = piece.kind === "diode" ? 8 : 4;
        for (let orientation = 0; orientation < count; orientation += 1) search(index + 1, { ...orientations, [piece.id]: orientation });
      };
      search(0);
      if (!found) throw new Error("Laser Grid fixture has no solution.");
      const opened = await game.modules.get("regionwright-puzzles-locks")?.api?.laserGrid?.open(doorUuid);
      if (!opened) throw new Error("Player could not open Laser Grid.");
      return { pieces, solution: found };
    }, fixture);
    await expect(playerPage.locator(".rw-laser-grid")).toBeVisible();
    for (const piece of solution.pieces) {
      const target = solution.solution[piece.id];
      const count = piece.kind === "diode" ? 8 : 4;
      const turns = (target - piece.orientation + count) % count;
      // The Utility Harness deliberately keeps the Scene paused. Dispatch
      // browser click events directly to the same controls so the pause
      // overlay cannot intercept this puzzle interaction.
      const clicked = await playerPage.evaluate(({ id, turns }) => {
        for (let turn = 0; turn < turns; turn += 1) {
          const button = document.querySelector(`[data-laser-piece="${id}"]`);
          if (!button) return false;
          button.click();
        }
        return true;
      }, { id: piece.id, turns });
      expect(clicked, `Missing Laser Grid piece ${piece.id}`).toBe(true);
    }
    await gmPage.waitForFunction(({ doorUuid }) => Number(fromUuidSync(doorUuid)?.ds) !== (CONST.WALL_DOOR_STATES?.LOCKED ?? 2), fixture, { timeout: 15_000 });
    await expect(playerPage.locator(".rw-laser-grid")).toHaveCount(0, { timeout: 15_000 });
  } finally {
    if (fixture) {
      await gmPage.evaluate(async ({ doorUuid, previousWrites, previousState, previousFlag }) => {
        const door = fromUuidSync(doorUuid);
        if (door) await door.update({ ds: previousState, "flags.regionwright.laserGrid": previousFlag });
        await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousWrites);
      }, fixture).catch(() => {});
    }
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("Timing Dial completes mixed-difficulty stops through the active GM", async ({ browser }) => {
  test.setTimeout(90_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    await gmPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.timingDial), null, { timeout: 15_000 });
    await playerPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.timingDial), null, { timeout: 15_000 });
    fixture = await gmPage.evaluate(async () => {
      const door = [...canvas.scene.walls.values()].find(entry => Number(entry.door ?? 0) > 0);
      const api = game.modules.get("regionwright-puzzles-locks")?.api?.timingDial;
      if (!api || !door) throw new Error("Timing Dial fixture is unavailable.");
      const previousWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
      const previousState = door.ds;
      const previousFlag = structuredClone(door.flags?.regionwright?.timingDial ?? null);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      const configured = await api.configureDoor({ door, difficulties: [0, 3], seed: "e2e-timing-dial" });
      return { doorUuid: door.uuid, stepDifficulties: configured.config.steps.map(step => step.difficulty), previousWrites, previousState, previousFlag };
    });
    expect(fixture.stepDifficulties).toEqual([0, 3]);
    const playerResult = await playerPage.evaluate(async ({ doorUuid }) => {
      const puzzle = game.modules.get("regionwright-puzzles-locks")?.api?.timingDial;
      let dialog = null;
      for (let attempt = 0; attempt < 20 && !dialog; attempt += 1) {
        dialog = await puzzle?.open(doorUuid);
        if (!dialog) await new Promise(resolve => setTimeout(resolve, 250));
      }
      if (!dialog) return { opened: false, localWriteAttempted: false };
      const originalUpdate = dialog.door.update;
      let localWriteAttempted = false;
      dialog.door.update = async () => { localWriteAttempted = true; throw new Error("Player attempted a local Wall write."); };
      try {
        for (const step of dialog.config.steps) {
          dialog.angle = step.targetAngle;
          await dialog._stop();
        }
      } finally {
        dialog.door.update = originalUpdate;
      }
      return { opened: true, localWriteAttempted };
    }, fixture);
    expect(playerResult).toEqual({ opened: true, localWriteAttempted: false });
    await gmPage.waitForFunction(({ doorUuid }) => Number(fromUuidSync(doorUuid)?.ds) !== (CONST.WALL_DOOR_STATES?.LOCKED ?? 2), fixture, { timeout: 15_000 });
    await expect(playerPage.locator(".rw-timing-puzzle")).toHaveCount(0, { timeout: 15_000 });
  } finally {
    if (fixture) {
      await gmPage.evaluate(async ({ doorUuid, previousWrites, previousState, previousFlag }) => {
        const door = fromUuidSync(doorUuid);
        if (door) await door.update({ ds: previousState, "flags.regionwright.timingDial": previousFlag });
        await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousWrites);
      }, fixture).catch(() => {});
    }
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("Ingredient Mixing sends a named recipe from Player3 to the GM", async ({ browser }) => {
  // The Utility Harness can render with software graphics, so two Foundry
  // clients occasionally need longer than a normal browser for socket sync.
  test.setTimeout(150_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    await gmPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.ingredientMixing), null, { timeout: 15_000 });
    await playerPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.ingredientMixing), null, { timeout: 15_000 });
    fixture = await gmPage.evaluate(async () => {
      const door = [...canvas.scene.walls.values()].find(entry => Number(entry.door ?? 0) > 0);
      const api = game.modules.get("regionwright-puzzles-locks")?.api?.ingredientMixing;
      const previousWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
      const previousState = door.ds;
      const previousFlag = structuredClone(door.flags?.regionwright?.ingredientMixing ?? null);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      const configured = await api.configure({ target: door, ingredients: [{ name: "Moonwater", target: 2 }, { name: "Ember Salt", target: 5 }, { name: "Nightshade", target: 7 }] });
      return { targetUuid: door.uuid, ingredientNames: configured.config.ingredients.map(item => item.name), previousWrites, previousState, previousFlag };
    });
    expect(fixture.ingredientNames).toEqual(["Moonwater", "Ember Salt", "Nightshade"]);
    const playerResult = await playerPage.evaluate(async ({ targetUuid }) => {
      const api = game.modules.get("regionwright-puzzles-locks")?.api?.ingredientMixing;
      let dialog = null;
      for (let attempt = 0; attempt < 20 && !dialog; attempt += 1) { dialog = await api?.open(targetUuid); if (!dialog) await new Promise(resolve => setTimeout(resolve, 250)); }
      if (!dialog) return { opened: false, localWriteAttempted: false };
      const originalUpdate = dialog.target.update;
      let localWriteAttempted = false;
      dialog.target.update = async () => { localWriteAttempted = true; throw new Error("Player attempted a local target update."); };
      try {
        for (const ingredient of dialog.config.ingredients) dialog.amounts[ingredient.id] = ingredient.target;
        await dialog._submit();
      } finally { dialog.target.update = originalUpdate; }
      return { opened: true, localWriteAttempted };
    }, fixture);
    expect(playerResult).toEqual({ opened: true, localWriteAttempted: false });
    await gmPage.waitForFunction(({ targetUuid }) => Number(fromUuidSync(targetUuid)?.ds) !== (CONST.WALL_DOOR_STATES?.LOCKED ?? 2), fixture, { timeout: 15_000 });
    await expect(playerPage.locator(".rw-ingredient-mixing")).toHaveCount(0, { timeout: 15_000 });
  } finally {
    if (fixture) await gmPage.evaluate(async ({ targetUuid, previousWrites, previousState, previousFlag }) => {
      const door = fromUuidSync(targetUuid);
      if (door) await door.update({ ds: previousState, "flags.regionwright.ingredientMixing": previousFlag });
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousWrites);
    }, fixture).catch(() => {});
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});

test("Ingredient Mixing supports Tile and Region placement", async ({ page }) => {
  test.setTimeout(90_000);
  await joinAsGM(page);
  const report = await page.evaluate(async () => {
    const scene = canvas.scene;
    const api = game.modules.get("regionwright-puzzles-locks")?.api?.ingredientMixing;
    const previousPuzzleWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
    const previousRegionWrites = game.settings.get("regionwright", "enableRegionWrites");
    const prefix = `Regionwright E2E Ingredient ${Date.now()}`;
    const [[tile], [region]] = await Promise.all([
      scene.createEmbeddedDocuments("Tile", [{ x: 200, y: 200, width: 100, height: 100, texture: { src: "icons/svg/flask.svg" } }]),
      scene.createEmbeddedDocuments("Region", [{ name: `${prefix} Region`, shapes: [{ type: "rectangle", x: 400, y: 200, width: 100, height: 100, hole: false }] }])
    ]);
    try {
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      await game.settings.set("regionwright", "enableRegionWrites", true);
      await api.configure({ target: tile, ingredients: [{ name: "Silverleaf", target: 3 }, { name: "Dawn Dew", target: 6 }] });
      await api.configure({ target: region, ingredients: [{ name: "Silverleaf", target: 3 }, { name: "Dawn Dew", target: 6 }] });
      const tileDialog = await api.open(tile.uuid);
      const regionDialog = await api.handleRegionEvent(region, { userId: game.user.id });
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        tileFlag: tile.getFlag("regionwright", "ingredientMixing")?.persistent?.status,
        regionFlag: region.getFlag("regionwright", "ingredientMixing")?.persistent?.status,
        regionBehavior: Array.from(region.behaviors).some(entry => entry.flags?.regionwright?.ingredientMixing?.region),
        tileDialog: Boolean(tileDialog),
        regionDialog: Boolean(regionDialog),
        jarCount: document.querySelectorAll(".rw-ingredient-mixing .rw-mix-jar").length
      };
    } finally {
      for (const dialog of Object.values(ui.windows)) {
        if (dialog?.options?.classes?.includes?.("rw-ingredient-mixing-dialog")) await dialog.close();
      }
      if (scene.tiles.get(tile.id)) await scene.deleteEmbeddedDocuments("Tile", [tile.id]);
      if (scene.regions.get(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousPuzzleWrites);
      await game.settings.set("regionwright", "enableRegionWrites", previousRegionWrites);
    }
  });
  expect(report).toEqual({ tileFlag: "locked", regionFlag: "locked", regionBehavior: true, tileDialog: true, regionDialog: true, jarCount: 4 });
});

test("Spine Mosaic completes a player bookshelf through the active GM", async ({ browser }) => {
  test.setTimeout(150_000);
  const gmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const playerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gmPage = await gmContext.newPage();
  const playerPage = await playerContext.newPage();
  let fixture = null;
  try {
    await joinAsGM(gmPage);
    await joinAsPlayer(playerPage);
    await gmPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.spineMosaic), null, { timeout: 15_000 });
    await playerPage.waitForFunction(() => Boolean(game.modules.get("regionwright-puzzles-locks")?.api?.spineMosaic), null, { timeout: 15_000 });
    fixture = await gmPage.evaluate(async () => {
      const door = [...canvas.scene.walls.values()].find(entry => Number(entry.door ?? 0) > 0);
      const api = game.modules.get("regionwright-puzzles-locks")?.api?.spineMosaic;
      const previousWrites = game.settings.get("regionwright-puzzles-locks", "enablePuzzleWrites");
      const previousState = door.ds;
      const previousFlag = structuredClone(door.flags?.regionwright?.spineMosaic ?? null);
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", true);
      const configured = await api.configure({ target: door, books: ["Moon", "Crown", "Rose", "Key"] });
      return { targetUuid: door.uuid, titles: configured.config.books.map(book => book.title), previousWrites, previousState, previousFlag };
    });
    expect(fixture.titles).toEqual(["Moon", "Crown", "Rose", "Key"]);
    const playerResult = await playerPage.evaluate(async ({ targetUuid }) => {
      const api = game.modules.get("regionwright-puzzles-locks")?.api?.spineMosaic;
      let dialog = null;
      for (let attempt = 0; attempt < 20 && !dialog; attempt += 1) {
        dialog = await api?.open(targetUuid);
        if (!dialog) await new Promise(resolve => setTimeout(resolve, 250));
      }
      if (!dialog) return { opened: false, localWriteAttempted: false, books: 0 };
      const originalUpdate = dialog.target.update;
      let localWriteAttempted = false;
      dialog.target.update = async () => { localWriteAttempted = true; throw new Error("Player attempted a local target update."); };
      try {
        dialog.order = [...dialog.config.solution];
        await dialog._submit();
        return { opened: true, localWriteAttempted, books: dialog.config.books.length };
      } finally { dialog.target.update = originalUpdate; }
    }, fixture);
    expect(playerResult).toEqual({ opened: true, localWriteAttempted: false, books: 4 });
    await gmPage.waitForFunction(({ targetUuid }) => Number(fromUuidSync(targetUuid)?.ds) !== (CONST.WALL_DOOR_STATES?.LOCKED ?? 2), fixture, { timeout: 15_000 });
    await expect(playerPage.locator(".rw-spine-mosaic")).toHaveCount(0, { timeout: 15_000 });
  } finally {
    if (fixture) await gmPage.evaluate(async ({ targetUuid, previousWrites, previousState, previousFlag }) => {
      const door = fromUuidSync(targetUuid);
      if (door) await door.update({ ds: previousState, "flags.regionwright.spineMosaic": previousFlag });
      await game.settings.set("regionwright-puzzles-locks", "enablePuzzleWrites", previousWrites);
    }, fixture).catch(() => {});
    await playerContext.close().catch(() => {});
    await gmContext.close().catch(() => {});
  }
});
