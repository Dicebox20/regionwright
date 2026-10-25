import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(repository)) {
  throw new Error("Provide the final repository URL, for example https://github.com/OWNER/REPOSITORY");
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = [
  { id: "regionwright", manifest: "regionwright.json" },
  { id: "regionwright-puzzles-locks", manifest: "regionwright-puzzles-locks.json" },
  { id: "regionwright-hunting-gathering", manifest: "regionwright-hunting-gathering.json" }
];

for (const item of modules) {
  const modulePath = path.join(root, "dist", "modules", item.id, "module.json");
  const module = JSON.parse(await readFile(modulePath, "utf8"));
  const versionTag = "v" + module.version;
  const releaseManifest = {
    ...module,
    url: repository,
    manifest: repository + "/releases/latest/download/" + item.manifest,
    download: repository + "/releases/download/" + versionTag + "/" + item.id + "-" + versionTag + ".zip",
    bugs: repository + "/issues",
    changelog: repository + "/blob/main/CHANGELOG.md"
  };
  const serialized = JSON.stringify(releaseManifest, null, 2) + "\n";
  await writeFile(modulePath, serialized, "utf8");
  await writeFile(path.join(root, "dist", item.manifest), serialized, "utf8");
}

console.log("GitHub release manifests prepared for all three Regionwright modules.");
