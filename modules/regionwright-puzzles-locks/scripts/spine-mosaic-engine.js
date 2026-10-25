export const SPINE_MOSAIC_VERSION = 1;
export const SPINE_MOSAIC_TARGET_TYPES = Object.freeze(["door", "tile", "region"]);

const defaultBooks = ["Moon", "Crown", "Rose", "Key", "Star", "Wave"];
const cleanTitle = (value, fallback) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 28) || fallback;
const cleanBookImage = value => { const path = String(value ?? "").trim(); return path && !/^(?:javascript|data|vbscript):/i.test(path) && !/[<>"'`]/.test(path) ? path.slice(0, 2048) : ""; };

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value ?? "spine-mosaic")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
function random(seed) {
  let state = hashSeed(seed) || 1;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
}

export function createSpineMosaicConfig({ books = [], seed = "" } = {}) {
  const source = Array.isArray(books) && books.length ? books : defaultBooks;
  const normalized = source.slice(0, 9).map((book, index) => Object.freeze({
    id: `book-${index + 1}`,
    title: cleanTitle(typeof book === "object" ? book.title : book, `Book ${index + 1}`), image: cleanBookImage(typeof book === "object" ? book.image : "")
  }));
  if (normalized.length < 4) throw new Error("Choose four to nine books.");
  return Object.freeze({
    version: SPINE_MOSAIC_VERSION,
    seed: String(seed ?? "").trim().slice(0, 80),
    books: Object.freeze(normalized),
    solution: Object.freeze(normalized.map(book => book.id))
  });
}

export function validateSpineMosaicConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== SPINE_MOSAIC_VERSION) throw new Error("This bookshelf configuration is unsupported.");
  if (!Array.isArray(config.books) || config.books.length < 4 || config.books.length > 9 || !Array.isArray(config.solution)) throw new Error("Choose four to nine books.");
  const ids = new Set();
  const books = config.books.map((book, index) => {
    const id = String(book?.id ?? "").trim();
    if (!id || ids.has(id)) throw new Error("Each book must be unique.");
    ids.add(id);
    return Object.freeze({ id, title: cleanTitle(book?.title, `Book ${index + 1}`), image: cleanBookImage(book?.image) });
  });
  const solution = config.solution.map(id => String(id ?? "").trim());
  if (solution.length !== books.length || new Set(solution).size !== books.length || solution.some(id => !ids.has(id))) throw new Error("The bookshelf order is invalid.");
  return Object.freeze({ version: SPINE_MOSAIC_VERSION, seed: String(config.seed ?? "").slice(0, 80), books: Object.freeze(books), solution: Object.freeze(solution) });
}

export function shuffledSpineOrder(config, seed = "") {
  const checked = validateSpineMosaicConfig(config);
  const order = [...checked.solution];
  const next = random(`${checked.seed}:${seed}`);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  if (order.every((id, index) => id === checked.solution[index])) [order[0], order[1]] = [order[1], order[0]];
  return Object.freeze(order);
}

export function evaluateSpineOrder(config, order) {
  const checked = validateSpineMosaicConfig(config);
  const attempted = Array.isArray(order) ? order.map(id => String(id ?? "").trim()) : [];
  const valid = attempted.length === checked.solution.length && new Set(attempted).size === checked.solution.length && attempted.every(id => checked.solution.includes(id));
  return Object.freeze({ valid, success: valid && attempted.every((id, index) => id === checked.solution[index]) });
}

// Pure inventory gate. Book acquisition is checked independently from ordering.
// The caller supplies stable collected book IDs from verified campaign inventory state.
export function evaluateSpineCollection(config, collectedIds) {
  const checked = validateSpineMosaicConfig(config);
  const supplied = Array.isArray(collectedIds) ? collectedIds : [];
  const known = new Set(checked.books.map(book => book.id));
  const ids = supplied.map(value => String(value ?? "").trim());
  const valid = ids.length === new Set(ids).size && ids.every(id => known.has(id));
  const collected = new Set(ids.filter(id => known.has(id)));
  const missing = checked.books.filter(book => !collected.has(book.id)).map(book => book.id);
  return Object.freeze({ valid, complete: valid && missing.length === 0, missing: Object.freeze(missing) });
}
