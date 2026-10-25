import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

async function joinAsGM(page) {
  await page.goto("/join");
  const role = page.locator("select").first();
  await expect(role.locator("option").nth(1)).toBeAttached({ timeout: 15_000 });
  const gm = await role.locator("option").evaluateAll(options => {
    const preferred = options.find(option => !option.disabled && /Gamemaster/i.test(option.textContent ?? "") && !/Assistant/i.test(option.textContent ?? ""));
    const fallback = options.find(option => !option.disabled && /Gamemaster/i.test(option.textContent ?? ""));
    return (preferred ?? fallback)?.value ?? null;
  });
  if (!gm) throw new Error("No GM-capable Utility Harness role is available.");
  await role.selectOption(gm);
  await page.getByRole("button", { name: "Join Game Session" }).click();
  await page.waitForFunction(() => Boolean(globalThis.game?.user?.isGM && game?.world && game?.actors && game?.items), null, { timeout: 120_000 });
}

test("classify DDB catalog redundancy without changing the world", async ({ page }) => {
  test.setTimeout(300_000);
  await joinAsGM(page);

  const report = await page.evaluate(() => {
    if (game.world.id !== "the-ballad-of-chauser-bill") throw new Error(`Wrong live world: ${game.world.id}`);
    const folderPath = document => {
      const names = [];
      let folder = document.folder;
      while (folder) {
        names.unshift(folder.name);
        folder = folder.folder;
      }
      return names.join(" / ") || "(root)";
    };
    const summarizeFolders = collection => {
      const groups = new Map();
      for (const document of collection.contents) {
        const key = folderPath(document);
        const current = groups.get(key) ?? { folder: key, count: 0, logicalMB: 0 };
        current.count += 1;
        current.logicalMB += JSON.stringify(document.toObject()).length / 1048576;
        groups.set(key, current);
      }
      return Array.from(groups.values()).map(group => ({ ...group, logicalMB: Number(group.logicalMB.toFixed(2)) })).sort((a, b) => b.logicalMB - a.logicalMB);
    };
    const flagScopes = collection => {
      const counts = new Map();
      for (const document of collection.contents) {
        for (const scope of Object.keys(document.flags ?? {})) counts.set(scope, (counts.get(scope) ?? 0) + 1);
      }
      return Array.from(counts, ([scope, count]) => ({ scope, count })).sort((a, b) => b.count - a.count);
    };
    const ddbLike = document => {
      const scopes = Object.keys(document.flags ?? {});
      return scopes.some(scope => /ddb/i.test(scope)) || /ddb/i.test(folderPath(document));
    };
    const externalText = [
      ...game.scenes.contents, ...game.journal.contents, ...game.macros.contents,
      ...game.tables.contents, ...game.playlists.contents, ...game.messages.contents
    ].map(document => JSON.stringify(document.toObject())).join("\n");
    const externalIds = new Set(externalText.match(/[A-Za-z0-9]{16}/g) ?? []);
    const referenced = document => externalIds.has(document.id);
    const classify = collection => {
      const result = { total: collection.size, ddbLike: 0, ddbLikeReferenced: 0, ddbLikeUnreferenced: 0, custom: 0 };
      for (const document of collection.contents) {
        if (ddbLike(document)) {
          result.ddbLike += 1;
          if (referenced(document)) result.ddbLikeReferenced += 1;
          else result.ddbLikeUnreferenced += 1;
        } else result.custom += 1;
      }
      return result;
    };
    const actorTokenIds = new Set(game.scenes.contents.flatMap(scene => Array.from(scene.tokens ?? [], token => token.actorId).filter(Boolean)));
    const actorSamples = game.actors.contents.filter(ddbLike).slice(0, 5).map(actor => ({ id: actor.id, name: actor.name, type: actor.type, folder: folderPath(actor), flags: actor.toObject().flags }));
    const itemSamples = game.items.contents.filter(ddbLike).slice(0, 5).map(item => ({ id: item.id, name: item.name, type: item.type, folder: folderPath(item), flags: item.toObject().flags }));
    return {
      actors: classify(game.actors),
      items: classify(game.items),
      tokenReferencedActors: actorTokenIds.size,
      ddbActorsUsedByTokens: game.actors.contents.filter(actor => ddbLike(actor) && actorTokenIds.has(actor.id)).length,
      actorFolders: summarizeFolders(game.actors),
      itemFolders: summarizeFolders(game.items),
      actorFlagScopes: flagScopes(game.actors),
      itemFlagScopes: flagScopes(game.items),
      actorSamples,
      itemSamples
    };
  });

  const output = path.resolve("docs/BALLAD_DDB_REDUNDANCY_AUDIT.json");
  await fs.writeFile(output, JSON.stringify(report, null, 2), "utf8");
  console.log(`BALLAD_DDB_AUDIT ${JSON.stringify({ actors: report.actors, items: report.items, tokenReferencedActors: report.tokenReferencedActors, ddbActorsUsedByTokens: report.ddbActorsUsedByTokens, topActorFolders: report.actorFolders.slice(0, 8), topItemFolders: report.itemFolders.slice(0, 8), actorFlagScopes: report.actorFlagScopes.slice(0, 8), itemFlagScopes: report.itemFlagScopes.slice(0, 8) })}`);
});
