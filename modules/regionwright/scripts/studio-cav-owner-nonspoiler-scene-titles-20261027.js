/**
 * OWNER 2026-10-27: visible Scene names must not reveal puzzle solutions.
 * F1/F2 replace the historical H-G/H-U numbering for main house floors.
 * Stable Scene document IDs/UUIDs and source lore metadata DO NOT CHANGE.
 * Attic/basement/grounds/grove/underground keep area labels (not F1/F2).
 */
export const SCENE_NAMES=Object.freeze([
 ['CAVAQ01Scene0001','AQ-01 - Unified Aqueduct Network','Aqueduct — Water Channels'],
 ['CAVBATHScene0001','BATH - Unified Bathhouse Surface','Bathhouse — Interior A'],
 ['8yLMRDvxyw58dydh','BATH-DRAINED - Unified Bathhouse Surface','Bathhouse — Interior B'],
 ['CAVEXT01Yard0001','EXT-01 - Carriage Yard and Cabin Front','Grounds — Front Yard'],
 ['CAVEXT02Scene001','EXT-02 - Pond and Sluice Gate','Grounds — Pond'],
 ['CAVEXT03Scene001','EXT-03 - Donovans Shack','Grounds — Small Shack'],
 ['xx1rWBiWMLxJPlrw','EXT-04 - Privy','Grounds — Outbuilding'],
 ['CAVEXT05Scene001','EXT-05 - Forgotten Gazebo','Grounds — Gazebo'],
 ['CAVEXT06Scene001','EXT-06 - Greenhouse Interior','Grounds — Greenhouse'],
 ['CAVEXT07Scene001','EXT-07 - Boathouse Clearing','Grounds — Waterside Clearing'],
 ['CAVEXT08Scene001','EXT-08 - Rear Deck and Family Grounds','Grounds — Rear Terrace'],
 ['CAVTRAILScene001','EXT-TRAIL - Grove Bathhouse Fork','Grounds — Woodland Path'],
 ['CAVFM01Scene0001','FM - Northwestern Forest Maze','Woods — Winding Trails'],
 ['UNEdA6iy6nk1Xuga','H-A01 - Central Attic','Attic — Central Room'],
 ['KwpmPrYgEC7KQVCZ','H-A02 - West Attic Storage','Attic — West Storage'],
 ['gDqaEOR4qaB5IOut','H-A03 - North Attic Storage','Attic — North Storage'],
 ['nyF5EX0JiEu23C3p','H-A04 - East Attic Storage','Attic — East Storage'],
 ['G6NMonfCwMvNzipL','H-B01 - Allens Basement Workshop','Basement — Workroom'],
 ['tjTpG2RVZNoCqRLh','H-B02 - Secured Keystone Vault','Basement — Inner Room'],
 ['ThVGl68hUmiOhWEA','H-B03 - Basement Supply Closet','Basement — Supply Closet'],
 ['CAVHG01Scene0001','H-G01 - Dining Room','F1 — Dining Room'],
 ['CAVHG02Scene0001','H-G02 - Foyer and Basement Stairwell','F1 — Entrance Hall'],
 ['CAVHG03Scene0001','H-G03 - Kitchen','F1 — Kitchen'],
 ['CAVHG04Scene0001','H-G04 - Pantry','F1 — Pantry'],
 ['CAVHG05Scene0001','H-G05 - Allens Study','F1 — Study'],
 ['CAVHG06GreatRoom','H-G06 - Great Room','F1 — Great Room'],
 ['CAVHG09Scene0001','H-G09 - Rear Family Room','F1 — Family Room'],
 ['LhtyO17QenuCExsb','H-R01 - Roof Chimney Clock','Roof — Chimney'],
 ['CAVHU01Scene0001','H-U01 - Nursery','F2 — Nursery'],
 ['gGgUHlHdI7RFrbUh','H-U02 - Upper Gallery and Landing','F2 — Upper Landing'],
 ['CAVHU03Scene0001','H-U03 - Guest Bedroom','F2 — Guest Room'],
 ['CAVHU04Scene0001','H-U04 - Parents Bedroom','F2 — Main Bedroom'],
 ['CAVHU05Scene0001','H-U05 - Sophias Bedroom','F2 — Small Bedroom'],
 ['CAVHU07Scene0001','H-U07 - Dahlia Art Studio','F2 — Art Studio'],
 ['CAVHU08Scene0001','H-U08 - Candle Workshop','F2 — Workroom'],
 ['CAVSG01Scene0001','SG-01 - Northwest Grove Corner','Grove — Northwest Path'],
 ['CAVSG02Scene0001','SG-02 - Northern Processional Walk','Grove — North Walk'],
 ['CAVSG03Scene0001','SG-03 - Northeast Grove Corner','Grove — Northeast Path'],
 ['CAVSG04Scene0001','SG-04 - Western Grove Entrance','Grove — West Entrance'],
 ['CAVSG05Scene0001','SG-05 - Memorial Clearing','Grove — Central Clearing'],
 ['CAVSG06Scene0001','SG-06 - Eastern Grove Walk','Grove — East Walk'],
 ['CAVSG07Scene0001','SG-07 - Southwest Grove Corner','Grove — Southwest Path'],
 ['CAVSG08Scene0001','SG-08 - Southern Grove Walk','Grove — South Walk'],
 ['CAVSG09Scene0001','SG-09 - Southeast Grove Corner','Grove — Southeast Path'],
 ['CN5fkK2QLUELBGGR','UND-01 - Undercroft Approach Keystone Door','Underground — Entry Passage'],
 ['ywpIpQDrkMLIgUP0','UND-02 - Donovan Sophia Sealed Refuge','Underground — Old Rooms'],
 ['hLU4DzVctEGdsuaz','UND-03 - Voss Ritual Chamber','Underground — Deep Chamber']
].map(([id,prior,newName])=>Object.freeze({id,prior,newName})));
export function validateNames(rows=SCENE_NAMES){
 if(rows.length!==47)return false;
 if(new Set(rows.map(x=>x.id)).size!==47||new Set(rows.map(x=>x.newName)).size!==47)return false;
 const secrets=/(?:keystone|ritual|voss|donovan|sophia|crimson|gondian|sune|refuge|aqueduct pressure|sliding mosaic|H-[A-Z]|(?:^|[ –-])(?:H-G|H-U|H-B|UND|EXT|SG|AQ)-?\d+)/i;
 return rows.every(x=>x.id.length===16&&x.prior.length>0&&x.newName.length>4&&!secrets.test(x.newName))&&
  rows.filter(x=>x.id.startsWith('CAVHG')||x.id==='LhtyO17QenuCExsb').filter(x=>x.newName.startsWith('F1 — ')).length===7&&
  rows.filter(x=>x.newName.startsWith('F2 — ')).length===7;
}