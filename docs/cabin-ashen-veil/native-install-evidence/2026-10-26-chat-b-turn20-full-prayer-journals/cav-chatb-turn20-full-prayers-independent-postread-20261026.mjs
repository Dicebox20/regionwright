import{chromium}from'playwright-core';
import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const manifest=JSON.parse(readFileSync('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/docs/cabin-ashen-veil/owner-authorized-full-prayer-handouts-2026-10-26.json','utf8'));
const orig=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn20-prayers-original-preflight-20261026.json','utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('No exact GM browser tab');
 const data=await p.evaluate(({plans})=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
    !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)
    throw Error('Invalid elected GM');
  const nongms=game.users.contents.filter(u=>!u.isGM);
  const checks=plans.map(q=>{
   const item=game.items.get(q.itemUuid.split('.')[1]);
   const journal=game.journal.get(q.proposedJournalId),page=journal?.pages.contents[0];
   return {
    itemUuid:item?.uuid,itemName:item?.name,itemDescription:item?.system.description.value,
    originalStatus:item?.getFlag(ns,'cabinPuzzleItem')?.status,
    itemJournalFlag:item?.getFlag(ns,'cavFullPrayerJournalUuid'),
    itemProvenance:item?.getFlag(ns,'cavFullPrayerProvenance'),
    journalUuid:journal?.uuid,journalName:journal?.name,
    journalProvenance:journal?.getFlag(ns,'cavFullPrayerProvenance'),
    journalOriginalItemFlag:journal?.getFlag(ns,'cavFullPrayerOriginalSourceUuid'),
    journalOwnership:journal?.ownership,
    journalPages:journal?.pages.size,
    pageUuid:page?.uuid,pageType:page?.type,pageHtml:page?.text?.content,
    pageFormat:page?.text?.format,
    nonGMObserverPermissions:nongms.map(u=>({userId:u.id,
      canObserve:journal.testUserPermission(u,'OBSERVER'),canOwn:journal.testUserPermission(u,'OWNER')}))
   }
  });
  const collisionCounts=plans.map(q=>({
    name:q.title,itemMatches:game.items.contents.filter(i=>i.name===q.title).length,
    journalMatches:game.journal.contents.filter(j=>j.name===q.title).length
  }));
  return{world:game.world.id,gm:game.user.name,checks,collisionCounts,
    actorPrayerCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>
      plans.some(q=>q.title===i.name)).map(i=>({actor:a.id,name:i.name}))),
    studioOriginal:game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVVANITYREG0001')?.behaviors.get('CAVVANITYBEH0001')?.disabled===false,
    workshopOriginal:game.scenes.get('CAVHU08Scene0001')?.regions.get('CAVBE5639AEC2179')?.behaviors.get('CAVWICKSHELFBEH1')?.disabled===false,
    privyDormant:game.scenes.get('xx1rWBiWMLxJPlrw')?.regions.get('CAVPRIVYRETRIEV1')?.behaviors.get('CAVPRIVYRETBH001')?.disabled===true
  }
 },{plans:manifest.prayers});
 const checked=data.checks.map((s,i)=>{
  const src=manifest.prayers[i],prev=orig.originalItemSources[i];
  const expectedDesc=prev.originalDescription+'<hr><h2>'+src.title+'</h2>'+src.readableHtml;
  return{
    title:src.title,pass:s.itemUuid===src.itemUuid&&s.itemName===src.title&&
      s.itemDescription===expectedDesc&&s.originalStatus==='GM_LIBRARY_ONLY'&&
      s.itemJournalFlag==='JournalEntry.'+src.proposedJournalId&&
      s.itemProvenance==='OWNER_AUTHORIZED_NEW_TEXT_2026-10-26'&&
      s.journalUuid==='JournalEntry.'+src.proposedJournalId&&
      s.journalName===src.title&&
      s.journalProvenance==='OWNER_AUTHORIZED_NEW_TEXT_2026-10-26'&&
      s.journalOriginalItemFlag===src.itemUuid&&
      s.journalOwnership?.default===0&&s.journalPages===1&&s.pageType==='text'&&
      s.pageHtml===src.readableHtml&&s.pageFormat===1&&
      s.nonGMObserverPermissions.every(u=>u.canObserve===false&&u.canOwn===false),
    itemUuid:s.itemUuid,itemJournalFlag:s.itemJournalFlag,
    journalUuid:s.journalUuid,pageUuid:s.pageUuid,
    pageSHA256:sha(s.pageHtml||''),expectedPageSHA256:sha(src.readableHtml),
    itemDescriptionSHA256:sha(s.itemDescription||''),
    visibleToNonGMs:s.nonGMObserverPermissions.some(u=>u.canObserve),
    sourceLibraryStatus:s.originalStatus,
    journalPages:s.journalPages
  }
 });
 const report={
  pass:checked.every(x=>x.pass)&&data.collisionCounts.every(z=>z.itemMatches===1&&z.journalMatches===1)&&
    data.actorPrayerCopies.length===0&&data.studioOriginal&&data.workshopOriginal&&data.privyDormant,
  world:data.world,gm:data.gm,checked,collisionCounts:data.collisionCounts,
  actorPrayerCopies:data.actorPrayerCopies.length,
  originalStudioVanityPreserved:data.studioOriginal,
  originalWorkshopWickPreserved:data.workshopOriginal,
  originalPrivyDormantPreserved:data.privyDormant
 };
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn20-full-prayers-independent-postread-20261026.json';
 writeFileSync(path,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!report.pass)throw Error('Independent GM original prayer Journal/Item verification failed');
}finally{await b.close()}