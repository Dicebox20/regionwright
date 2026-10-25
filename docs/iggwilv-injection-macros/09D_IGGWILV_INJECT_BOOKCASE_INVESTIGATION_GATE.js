/**
 * Iggwilv's Tower — T11 Investigation Gate
 * Foundry Script Macro. Run once as GM after 09B.
 *
 * Replaces T11's controller trigger with a DC 15 Investigation gate.
 * Success permanently discovers the arrangement puzzle and immediately opens
 * Regionwright Spine Mosaic. Failure does not activate the puzzle.
 */

const DC = 15;
const REGION_KEY = "T11";
const CONTROLLER_NAME = "IGG | Runtime Controller";

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
if (!game.macros.getName(CONTROLLER_NAME)) throw new Error(`Missing Script Macro: ${CONTROLLER_NAME}`);

const target = game.scenes.contents
  .flatMap(scene => Array.from(scene.regions ?? []))
  .find(region => region.flags?.regionwright?.iggwilvTower?.regionKey === REGION_KEY);
if (!target) throw new Error("Missing Tower Region T11.");

const controller = Array.from(target.behaviors ?? []).find(behavior =>
  behavior.flags?.regionwright?.iggwilvTowerBehavior?.role === "controller"
);
if (!controller) throw new Error("T11 is missing its Tower controller behavior. Run 09B first.");

const source = `
if (game.user.isGM) {
  const STATE_JOURNAL = "IGG | Runtime State";
  const STATE_SCOPE = "regionwright";
  const STATE_KEY = "iggwilvTowerState";
  const token = event?.data?.token?.document ?? event?.data?.token ?? event?.token?.document ?? event?.token ?? null;
  const actor = token?.actor ?? (token?.actorId ? game.actors.get(token.actorId) : null);
  const journal = game.journal.getName(STATE_JOURNAL);
  if (!journal) throw new Error("Missing IGG Runtime State Journal.");
  const current = foundry.utils.deepClone(journal.flags?.regionwright?.iggwilvTowerState ?? {});

  if (!current.bookcaseDiscovered) {
    if (!actor) throw new Error("The Investigation gate requires a triggering Actor.");
    const bonus = Number(actor.system?.skills?.inv?.total ?? actor.system?.skills?.inv?.mod ?? 0);
    const roll = await new Roll("1d20 + @bonus", { bonus }).evaluate();
    const total = Number(roll.total ?? 0);
    if (total < ${DC}) {
      ui.notifications.warn(\`\${actor.name} fails to discover the hidden book arrangement (Investigation \${total} vs DC ${DC}).\`);
      return;
    }
    current.bookcaseDiscovered = true;
    current.bookcaseInvestigationTotal = total;
    await journal.setFlag(STATE_SCOPE, STATE_KEY, current);
    ui.notifications.info(\`\${actor.name} discovers that the book spines form a movable magical arrangement (Investigation \${total}).\`);
  }

  await game.macros.getName(${JSON.stringify(CONTROLLER_NAME)})?.execute({ region, event });
}`.trim();

await target.updateEmbeddedDocuments("RegionBehavior", [{
  _id: controller.id,
  name: `IGG | T11 | DC ${DC} Investigation → Spine Mosaic`,
  type: "executeScript",
  disabled: false,
  system: { events: ["tokenEnter"], source },
  flags: {
    regionwright: {
      iggwilvTowerBehavior: {
        version: 2,
        campaign: "iggwilvs-tower",
        regionKey: REGION_KEY,
        role: "controller",
        gate: "investigation",
        dc: DC
      }
    }
  }
}]);

ui.notifications.info(`T11 now requires a DC ${DC} Investigation check before Spine Mosaic activates.`);

