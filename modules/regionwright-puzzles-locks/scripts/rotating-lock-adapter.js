export function dnd5eToolsRank(actor) {
  const value = Number(actor?.system?.tools?.thief?.value ?? 0);
  if (value >= 2) return { rank: 2, source: "D&D 5e thieves' tools", supported: true };
  if (value >= 1) return { rank: 1, source: "D&D 5e thieves' tools", supported: true };
  return { rank: 0, source: "D&D 5e thieves' tools", supported: true };
}

export function lockSkillRank(actor, systemId = globalThis.game?.system?.id) {
  if (systemId === "dnd5e") return dnd5eToolsRank(actor);
  return { rank: 0, source: "No system adapter", supported: false };
}
