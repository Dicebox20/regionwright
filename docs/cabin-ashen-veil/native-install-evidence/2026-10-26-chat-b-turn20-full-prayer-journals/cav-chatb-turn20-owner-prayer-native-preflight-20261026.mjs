import{chromium}from'playwright-core';
import{readFileSync,writeFileSync}from'node:fs';
const source='C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/docs/cabin-ashen-veil/owner-authorized-full-prayer-handouts-2026-10-26.json';
const manifest=JSON.parse(readFileSync(source,'utf8'));
if(manifest.contentProvenance!=='OWNER_AUTHORIZED_NEW_TEXT_2026-10-26'||manifest.prayers.length!==2)throw Error('Manifest provenance mismatch');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact elected GM /game page missing');
 const result=await p.evaluate(({prayers})=>{
  const ns='dicebox-campaign-helper';
  if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
   !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('Wrong elected GM/World');
  const studio=game.scenes.get('CAVHU07Scene0001'),workshop=game.scenes.get('CAVHU08Scene0001'),
   boat=game.scenes.get('CAVEXT07Scene001');
  if(!studio||!workshop||!boat||
    !studio.regions.get('CAVVANITYREG0001')||
    !workshop.regions.get('CAVBE5639AEC2179'))
   throw Error('Known original source scenes/regions changed');
  const data=prayers.map(q=>{
    const id=q.itemUuid.split('.')[1],item=game.items.get(id);
    if(!item||item.uuid!==q.itemUuid||item.name!==q.title||item.type!=='loot'||
      item.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')throw Error('Original prayer Item not intact: '+q.title);
    if(q.proposedJournalId.length!==16||game.journal.get(q.proposedJournalId)||
       Array.from(game.journal).some(j=>j.name===q.title||
         j.getFlag(ns,'cavFullPrayerOriginalSourceUuid')===q.itemUuid))
     throw Error('Prayer Journal collision: '+q.title);
    const desc=item.system?.description?.value;
    if(typeof desc!=='string'||desc.length===0||desc.includes('Lady of the Rose, let beauty')||
       desc.includes('Bright Lady, I offer no perfect'))throw Error('Original item description already changed');
    if(item.getFlag(ns,'cavFullPrayerJournalUuid')||item.getFlag(ns,'cavFullPrayerProvenance'))
     throw Error('Item prayer binding already exists; must reconcile');
    if(game.actors.contents.some(a=>Array.from(a.items).some(i=>
       i.name===q.title||i.getFlag(ns,'cavFullPrayerOriginalSourceUuid')===q.itemUuid)))
     throw Error('Prayer already held by Actor; stop for permissions review');
    if(!Array.isArray(q.lines)||q.lines.length<5||q.lines.some(x=>!x)||q.readableHtml.length<450||
       q.readableHtml.includes('<script'))throw Error('Unvalidated full owner prayer prose');
    return{title:q.title,itemUuid:item.uuid,itemId:item.id,originalDescription:desc,
       ownerSourceStatus:item.getFlag(ns,'cabinPuzzleItem')?.status,
       journalId:q.proposedJournalId,ownership:item.ownership,
       itemImg:item.img,fullPrayerCharacters:q.readableHtml.length,
       sceneOwnershipPresent:true};
  });
  return{status:'prayer-two-native-items-and-journals-preflight-pass-no-writes',
    world:game.world.id,gm:game.user.name,worldJournalCount:game.journal.size,
    originalItemSources:data};
 },{prayers:manifest.prayers});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn20-prayers-original-preflight-20261026.json';
 writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await b.close()}