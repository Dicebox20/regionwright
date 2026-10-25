import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

async function joinAsGM(page) {
  await page.goto("/join");
  const role = page.locator("select").first();
  await expect(role.locator("option").nth(1)).toBeAttached({ timeout: 15_000 });
  const gm = await role.locator("option").evaluateAll(options => {
    const preferred = options.find(option => !option.disabled && /Assistant Gamemaster/i.test(option.textContent ?? ""));
    const fallback = options.find(option => !option.disabled && /Gamemaster/i.test(option.textContent ?? ""));
    return (preferred ?? fallback)?.value ?? null;
  });
  if (!gm) throw new Error("No GM-capable Utility Harness role is available.");
  await role.selectOption(gm);
  await page.getByRole("button", { name: "Join Game Session" }).click();
  await page.waitForFunction(() => Boolean(globalThis.game?.user?.isGM && game?.world && game?.actors && game?.items && game?.scenes), null, { timeout: 120_000 });
}

test("audit the live Ballad of Chauser Bill world", async ({ page }) => {
  test.setTimeout(180_000);
  await joinAsGM(page);

  const report = await page.evaluate(async () => {
    if (game.world.id !== "the-ballad-of-chauser-bill") throw new Error(`Wrong live world: ${game.world.id}`);

    const stable = value => {
      if (Array.isArray(value)) return value.map(stable);
      if (!value || typeof value !== "object") return value;
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
    };
    const canonical = document => {
      const copy = foundry.utils.deepClone(document.toObject());
      delete copy._id;
      delete copy._stats;
      delete copy.sort;
      return JSON.stringify(stable(copy));
    };
    const documentId = value => value?.id ?? (typeof value === "string" ? value : null);
    const fingerprint = text => {
      let hash = 2166136261;
      for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
      return (hash >>> 0).toString(16).padStart(8, "0");
    };
    const collectionEntries = [
      ["actors", game.actors], ["items", game.items], ["scenes", game.scenes], ["journal", game.journal],
      ["macros", game.macros], ["tables", game.tables], ["playlists", game.playlists], ["messages", game.messages],
      ["folders", game.folders], ["users", game.users], ["combats", game.combats]
    ];
    const allText = collectionEntries.flatMap(([, collection]) => collection?.contents ?? []).map(document => JSON.stringify(document.toObject())).join("\n");
    const collections = {};
    const exactDuplicates = [];
    const sameNameGroups = [];

    for (const [collectionName, collection] of collectionEntries) {
      const documents = collection?.contents ?? [];
      const byHash = new Map();
      const byName = new Map();
      for (const document of documents) {
        const text = canonical(document);
        const hash = fingerprint(text);
        if (!byHash.has(hash)) byHash.set(hash, []);
        byHash.get(hash).push({ document, text });
        if (document.name) {
          const key = `${document.type ?? ""}\u0000${document.name.trim().toLocaleLowerCase()}`;
          if (!byName.has(key)) byName.set(key, []);
          byName.get(key).push({ document, text });
        }
      }
      for (const [hash, group] of byHash) {
        const exact = group.filter(entry => entry.text === group[0].text);
        if (exact.length < 2) continue;
        exactDuplicates.push({
          collection: collectionName,
          hash,
          documents: exact.map(({ document, text }) => ({
            id: document.id,
            uuid: document.uuid,
            name: document.name ?? null,
            type: document.type ?? null,
            folder: documentId(document.folder),
            logicalKB: Number((text.length / 1024).toFixed(1)),
            references: Math.max(0, allText.split(document.id).length - 2)
          }))
        });
      }
      for (const group of byName.values()) {
        if (group.length < 2) continue;
        sameNameGroups.push({
          collection: collectionName,
          name: group[0].document.name,
          type: group[0].document.type ?? null,
          count: group.length,
          exact: new Set(group.map(entry => entry.text)).size === 1,
          ids: group.map(entry => entry.document.id)
        });
      }
      const sized = documents.map(document => {
        const text = JSON.stringify(document.toObject());
        return {
          id: document.id,
          uuid: document.uuid,
          name: document.name ?? null,
          type: document.type ?? null,
          logicalKB: text.length / 1024,
          embeddedItems: document.items?.size ?? document.items?.length ?? 0,
          embeddedEffects: document.effects?.size ?? document.effects?.length ?? 0,
          tokens: document.tokens?.size ?? document.tokens?.length ?? 0,
          walls: document.walls?.size ?? document.walls?.length ?? 0,
          regions: document.regions?.size ?? document.regions?.length ?? 0
        };
      });
      collections[collectionName] = {
        count: documents.length,
        logicalMB: Number((sized.reduce((sum, entry) => sum + entry.logicalKB, 0) / 1024).toFixed(2)),
        topDocuments: sized.sort((a, b) => b.logicalKB - a.logicalKB).slice(0, 20).map(entry => ({ ...entry, logicalKB: Number(entry.logicalKB.toFixed(1)) }))
      };
    }

    const sceneActorIds = new Set(game.scenes.contents.flatMap(scene => Array.from(scene.tokens ?? []).map(token => token.actorId).filter(Boolean)));
    const unreferencedActors = game.actors.contents.filter(actor => !sceneActorIds.has(actor.id)).map(actor => ({ id: actor.id, uuid: actor.uuid, name: actor.name, type: actor.type, folder: documentId(actor.folder), logicalKB: Number((JSON.stringify(actor.toObject()).length / 1024).toFixed(1)) }));
    const emptyFolders = game.folders.contents.filter(folder => !(folder.contents?.length) && !(folder.children?.length)).map(folder => ({ id: folder.id, uuid: folder.uuid, name: folder.name, type: folder.type, folder: documentId(folder.folder) }));

    const packs = [];
    for (const pack of game.packs) {
      if (pack.metadata.packageName !== game.world.id) continue;
      const index = await pack.getIndex({ fields: ["name", "type", "img", "folder"] });
      const target = pack.documentName === "Actor" ? game.actors : pack.documentName === "JournalEntry" ? game.journal : pack.documentName === "RollTable" ? game.tables : game.items;
      const worldNames = new Set((target?.contents ?? []).map(document => `${document.type ?? ""}\u0000${document.name ?? ""}`));
      packs.push({
        collection: pack.collection,
        label: pack.metadata.label,
        documentName: pack.documentName,
        count: index.size,
        indexKB: Number((JSON.stringify(Array.from(index.values())).length / 1024).toFixed(1)),
        worldNameOverlaps: Array.from(index.values()).filter(entry => worldNames.has(`${entry.type ?? ""}\u0000${entry.name ?? ""}`)).length
      });
    }

    const fogCollection = game.collections.get("FogExploration");
    const validSceneIds = new Set(game.scenes.contents.map(scene => scene.id));
    const orphanFog = (fogCollection?.contents ?? []).filter(fog => !validSceneIds.has(documentId(fog.scene))).map(fog => ({ id: fog.id, scene: documentId(fog.scene), user: documentId(fog.user) }));

    return {
      world: { id: game.world.id, title: game.world.title, coreVersion: game.version, system: game.system.id, systemVersion: game.system.version },
      collections,
      exactDuplicates,
      sameNameGroups: sameNameGroups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      unreferencedActors: unreferencedActors.sort((a, b) => b.logicalKB - a.logicalKB),
      emptyFolders,
      packs: packs.sort((a, b) => b.count - a.count),
      fog: { loaded: fogCollection?.size ?? 0, orphaned: orphanFog },
      modules: game.modules.filter(module => module.active).map(module => ({ id: module.id, version: module.version }))
    };
  });

  const output = path.resolve("docs/BALLAD_CHAUSER_BILL_LIVE_AUDIT.json");
  await fs.writeFile(output, JSON.stringify(report, null, 2), "utf8");
  console.log(`BALLAD_AUDIT ${JSON.stringify({ world: report.world, counts: Object.fromEntries(Object.entries(report.collections).map(([key, value]) => [key, value.count])), exactDuplicateGroups: report.exactDuplicates.length, sameNameGroups: report.sameNameGroups.length, unreferencedActors: report.unreferencedActors.length, emptyFolders: report.emptyFolders.length, packs: report.packs })}`);
});
