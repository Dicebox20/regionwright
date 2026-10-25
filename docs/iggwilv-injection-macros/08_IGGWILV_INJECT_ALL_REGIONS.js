/**
 * Iggwilv's Tower — Inject all Region geometry
 * Foundry Script Macro. Run as GM after the maps are installed and centered.
 * Creates/repairs Regions only. It does not attach behaviors yet.
 */

const FLAG_SCOPE = "regionwright";
const FLAG_KEY = "iggwilvTower";
const PREFIX = "Iggwilv Tower — ";
const GRID = 64;
const roomNames = {
  f1: "Floor 1 Landing", curiosities: "Curiosities Room", chambers: "Private Chambers",
  library: "Private Library", hidden: "Hidden Library", study: "Private Study",
  lab: "Witch's Laboratory", f2: "Floor 2 Landing", summoning: "Summoning Chamber",
  garden: "Astral Garden", vault: "Arcane Vault"
};

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
const scenes = Object.fromEntries(Object.entries(roomNames).map(([key, room]) => [key, game.scenes.find(s => s.name === `${PREFIX}${room}` || s.name === `Iggwilv Tower - ${room}`)]));
const missingScenes = Object.entries(scenes).filter(([, scene]) => !scene).map(([key]) => roomNames[key]);
if (missingScenes.length) throw new Error(`Missing Scenes: ${missingScenes.join(", ")}`);

// Map-local coordinates; the macro adds Foundry's centered-background offset.
const routes = [
  ["01", "f1", [256,960], "curiosities", [1536,640], "F1 west door / Curiosities east door"],
  ["02", "curiosities", [1600,640], "f1", [320,960], "Curiosities east door / F1 west door"],
  ["03", "f1", [960,256], "chambers", [832,1216], "F1 north door / Chambers south door"],
  ["04", "chambers", [832,1216], "f1", [960,320], "Chambers south door / F1 north door"],
  ["05", "f1", [1728,960], "library", [128,960], "F1 east door / Library west door"],
  ["06", "library", [128,960], "f1", [1664,960], "Library west door / F1 east door"],
  ["07", "f1", [960,1728], "lab", [896,256], "F1 south door / Laboratory north door"],
  ["08", "lab", [896,256], "f1", [960,1664], "Laboratory north door / F1 south door"],
  ["09", "library", [1088,128], "study", [768,1216], "Library north door / Study south door"],
  ["10", "study", [768,1216], "library", [1088,192], "Study south door / Library north door"],
  ["11", "library", [2176,704], "hidden", [448,576], "Hidden bookcase / Hidden Library"],
  ["12", "hidden", [448,576], "library", [2112,704], "Hidden Library return / bookcase"],
  ["13", "f1", [960,768], "f2", [1024,1216], "Floor 1 stair / Floor 2 stair"],
  ["14", "f2", [1024,1216], "f1", [960,832], "Floor 2 stair / Floor 1 stair"],
  ["15", "f2", [1024,256], "vault", [832,1216], "Floor 2 north door / Arcane Vault"],
  ["16", "vault", [832,1216], "f2", [1024,320], "Arcane Vault south door / Floor 2"],
  ["17", "f2", [320,1536], "summoning", [1600,320], "Floor 2 southwest arch / Summoning"],
  ["18", "summoning", [1600,320], "f2", [384,1536], "Summoning return / Floor 2"],
  ["19", "f2", [1792,1536], "garden", [192,384], "Floor 2 southeast arch / Astral Garden"],
  ["20", "garden", [192,384], "f2", [1728,1536], "Astral Garden return / Floor 2"]
];

const points = [
  ["P01","f1",[512,128,192,192],"pickup","Landing Relief Star",[],["star"]],
  ["G01","study",[896,1216,192,128],"gate","Private Study Star Socket",["star"],[]],
  ["P02","study",[768,320,192,192],"pickup","Ingredient Cabinet Key",[],["ingredient-cabinet-key"]],
  ["G02","lab",[1600,704,256,384],"gate","Reinforced Ingredient Cabinet",["ingredient-cabinet-key"],["astral-water","demon-skull"]],
  ["P03","curiosities",[1088,256,256,256],"clue","Hourglass Coven’s Hourglass",[],["hourglass-covens-hourglass"]],
  ["G03","study",[384,512,256,384],"puzzle","HOURGLASS Statue Riddle",[],["powdered-silver"]],
  ["P04","library",[896,768,448,384],"pickup","Skeleton Bones Encounter Table",[],["skeleton-bones"]],
  ["P05","lab",[448,192,256,256],"craft","Mortar and Pestle",["skeleton-bones"],["calcium-rich-bone-meal"]],
  ["P06","lab",[768,704,384,384],"puzzle","Four-Ingredient Cauldron",["red-leaf-fern","epsom-salts","blood-meal","calcium-rich-bone-meal"],["fey-infused-plant-food"]],
  ["P07","chambers",[192,320,192,192],"pickup","Sunglobe",[],["sunglobe"]],
  ["P08","chambers",[1152,128,256,256],"pickup","Epsom Salts",[],["epsom-salts"]],
  ["P09","library",[1536,896,256,256],"pickup","Red Leaf Fern",[],["red-leaf-fern"]],
  ["P10","summoning",[128,832,320,320],"pickup","Vampire’s Blood Meal",[],["blood-meal"]],
  ["P11","f2",[256,704,256,256],"pickup-trap","Obsidian Crow’s-Foot Key",[],["obsidian-crows-foot-key"]],
  ["G04","chambers",[64,64,256,320],"gate","Iggwilv Portrait Socket",["obsidian-crows-foot-key"],["iggwilvs-sovereign-seal"]],
  ["P12","hidden",[768,64,192,256],"pickup","Black Tallow Candles",[],["black-tallow-candles"]],
  ["G05","garden",[1664,192,384,384],"gate","Astral Treant Sunglobe Station",["sunglobe"],[]],
  ["G06","garden",[320,704,384,384],"gate","Astral Treant Water Basin",["astral-water"],[]],
  ["G07","garden",[1408,1152,384,384],"gate","Astral Treant Root Bed",["fey-infused-plant-food"],[]],
  ["E01","garden",[1088,576,512,704],"encounter","Astral Treant Awakening",[],["astral-fruit"]],
  ["P13","garden",[1984,1216,448,576],"social","Faerie Dragon Water Infusion",["ordinary-water"],["fey-infused-water"]],
  ["G08","curiosities",[768,192,320,384],"gate","Nixie Tank Rehydration",["fey-infused-water"],[]],
  ["G09","curiosities",[768,192,320,384],"gate","Nixie Astral Fruit Offering",["astral-fruit"],["arcane-lock-password"]],
  ["G10","summoning",[640,640,768,768],"puzzle","Cambion Summoning Circle",["demon-skull","black-tallow-candles","powdered-silver"],["obsidian-thorn"]],
  ["G11","f2",[960,192,256,256],"gate","Arcane Vault Two-Part Lock",["iggwilvs-sovereign-seal","arcane-lock-password"],[]],
  ["P14","vault",[768,512,256,320],"pickup","Ivory Thorn Reliquary",[],["ivory-thorn"]],
  ["P15","f2",[896,1728,384,256],"craft","Thorn Key Assembly",["ivory-thorn","obsidian-thorn"],["thorn-key"]],
  ["G12","f2",[896,1920,384,192],"gate","Final Rose Door",["thorn-key"],[]]
];

const colors = { travel:"#8f5bd7", arrival:"#35aee2", pickup:"#46bf6b", "pickup-trap":"#d34b4b", clue:"#5ea9ff", gate:"#e2a93b", puzzle:"#d879d8", craft:"#d88b48", encounter:"#e34d4d", social:"#62c9bd" };
const offsetRect = (scene, rect) => {
  const [x,y,width,height] = rect;
  const d = scene.dimensions;
  return { x: d.sceneX + x, y: d.sceneY + y, width, height };
};
const regionData = (scene, key, kind, label, rect, extra = {}) => {
  const r = offsetRect(scene, rect);
  return {
    name: `IGG | ${key} | ${roomNames[Object.keys(scenes).find(k => scenes[k] === scene)]} | ${label}`,
    color: colors[kind] ?? "#8f5bd7",
    shapes: [{ type:"rectangle", ...r, anchorX:0, anchorY:0, rotation:0, hole:false }],
    elevation: { bottom:0, top:null }, levels: [], restriction: { enabled:false, type:"move", priority:0 }, attachment: { token:null },
    visibility: 0, highlightMode:"coverage", displayMeasurements:false, hidden:false, locked:false,
    flags: { [FLAG_SCOPE]: { [FLAG_KEY]: { campaign:"iggwilvs-tower", version:1, regionKey:key, kind, label, ...extra } } }
  };
};

async function upsert(scene, key, kind, label, rect, extra = {}) {
  let region = Array.from(scene.regions ?? []).find(r => r.getFlag(FLAG_SCOPE,"iggwilvTower.regionKey") === key);
  if (!region && extra.routeId) region = Array.from(scene.regions ?? []).find(r => r.getFlag(FLAG_SCOPE,"iggwilvTower.routeId") === extra.routeId && r.getFlag(FLAG_SCOPE,"iggwilvTower.role") === extra.role);
  const data = regionData(scene,key,kind,label,rect,extra);
  if (region) return region.update(data);
  return (await scene.createEmbeddedDocuments("Region",[data]))[0];
}

const made = [];
for (const [n,sourceKey,sourceXY,destKey,destXY,label] of routes) {
  const routeId = `T${n}`;
  const source = await upsert(scenes[sourceKey],routeId,"travel",label,[...sourceXY,GRID,GRID],{routeId,role:"source",destinationSceneKey:destKey,arrivalKey:`A${n}`});
  const arrival = await upsert(scenes[destKey],`A${n}`,"arrival",label,[...destXY,GRID*2,GRID*2],{routeId,role:"arrival",sourceSceneKey:sourceKey});
  made.push(source,arrival);
}
for (const [key,sceneKey,rect,kind,label,requires,grants] of points) {
  made.push(await upsert(scenes[sceneKey],key,kind,label,rect,{requires,grants}));
}

console.table(made.map(r => ({key:r.getFlag(FLAG_SCOPE,"iggwilvTower.regionKey"),scene:r.parent.name,name:r.name})));
ui.notifications.info(`Iggwilv Regions installed: ${made.length} travel, arrival, puzzle, item, gate, and encounter Regions.`);
