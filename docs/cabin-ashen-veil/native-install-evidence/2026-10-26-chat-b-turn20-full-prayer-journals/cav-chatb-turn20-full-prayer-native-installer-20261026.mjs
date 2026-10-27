import {chromium} from "playwright-core";
import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const doc=JSON.parse(readFileSync("C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/docs/cabin-ashen-veil/owner-authorized-full-prayer-handouts-2026-10-26.json","utf8"));
const saved=JSON.parse(readFileSync("C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn20-prayers-original-preflight-20261026.json","utf8"));
const hash=s=>createHash('sha256').update(s).digest('hex');
const commit=process.argv.includes("--commit-original-owner-prayer-journals");
if(doc.contentProvenance!=="OWNER_AUTHORIZED_NEW_TEXT_2026-10-26"||
 doc.status!=="SOURCE_ONLY_NOT_INSTALLED"||doc.prayers.length!==2||
 saved.originalItemSources?.length!==2)throw Error("Incorrect dated source/preflight");
const plans=doc.prayers.map((q,i)=>({
 ...q,oldDescription:saved.originalItemSources[i].originalDescription,
 sourceSHA256:hash(q.readableHtml),
 newDescription:saved.originalItemSources[i].originalDescription+
   '<hr><h2>'+q.title+'</h2>'+q.readableHtml
}));
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==="http://127.0.0.1:30000/game");
 if(!p)throw Error('Exact elected GM Foundry game tab unavailable');
 const result=await p.evaluate(async ({plans,commit})=>{
  const ns="dicebox-campaign-helper";
  if(!game?.ready||game.version!=="14.367"||
    game.world?.id!=="cabin-in-the-ashen-veil"||
    !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error("Wrong elected GM session");
  if(!game.scenes.get("CAVHU07Scene0001")?.regions.get("CAVVANITYREG0001")||
      !game.scenes.get("CAVHU08Scene0001")?.regions.get("CAVBE5639AEC2179"))
   throw Error("Original Studio/Workshop state changed");
  for(const q of plans){
   const item=game.items.get(q.itemUuid.split(".")[1]);
   if(!item||item.uuid!==q.itemUuid||item.name!==q.title||item.type!=="loot"||
     item.getFlag(ns,"cabinPuzzleItem")?.status!=="GM_LIBRARY_ONLY"||
     item.system.description.value!==q.oldDescription)throw Error("Item changed since verified preflight: "+q.title);
   if(game.journal.get(q.proposedJournalId)||
      Array.from(game.journal).some(j=>j.name===q.title||
        j.getFlag(ns,"cavFullPrayerOriginalSourceUuid")===q.itemUuid)||
      item.getFlag(ns,"cavFullPrayerJournalUuid"))throw Error("Journal collision/old link: "+q.title);
   if(game.actors.contents.some(a=>Array.from(a.items).some(x=>x.name===q.title)))
     throw Error("Character prayer copy currently present; permission source check needed");
   if(!q.readableHtml.startsWith("<p>")||!q.readableHtml.endsWith("</p>")||
      q.proposedJournalId.length!==16)throw Error("Prayer page malformed");
  }
  if(!commit)return{status:"live-preflight-reconfirmed-no-writes",
   currentGM:game.user.name,
   plan:plans.map(q=>({name:q.title,originalItem:q.itemUuid,
     futureJournal:q.proposedJournalId,readablePageLength:q.readableHtml.length}))};
  const installed=[];
  for(const q of plans){
   const item=game.items.get(q.itemUuid.split(".")[1]);
   const entryData={
    _id:q.proposedJournalId,
    name:q.title,ownership:{default:0},
    pages:[{name:q.title,type:"text",text:{format:1,content:q.readableHtml}}],
    flags:{[ns]:{
      cavFullPrayerOriginalSourceUuid:q.itemUuid,
      cavFullPrayerProvenance:"OWNER_AUTHORIZED_NEW_TEXT_2026-10-26",
      cavFullPrayerAudience:"GM_LIBRARY_ONLY",
      cavFullPrayerStatus:"content-installed-not-player-awarded"
    }}
   };
   const created=await JournalEntry.createDocuments([entryData],{keepId:true});
   const journal=game.journal.get(q.proposedJournalId);
   const page=journal?.pages.contents[0];
   if(created.length!==1||!journal||journal.id!==q.proposedJournalId||
     journal.pages.size!==1||page?.text?.content!==q.readableHtml||
     journal.ownership.default!==0||journal.getFlag(ns,"cavFullPrayerOriginalSourceUuid")!==q.itemUuid)
    throw Error("Partial Journal create for "+q.title+"; STOP and reconcile; do not auto retry");
   const updated=await item.update({
    "system.description.value":q.newDescription,
    ["flags."+ns+".cavFullPrayerJournalUuid"]:journal.uuid,
    ["flags."+ns+".cavFullPrayerProvenance"]:"OWNER_AUTHORIZED_NEW_TEXT_2026-10-26",
    ["flags."+ns+".cavFullPrayerStatus"]:"GM_LIBRARY_ONLY_CONTENT_BOUND"
   });
   const after=game.items.get(item.id);
   if(!updated||after.system.description.value!==q.newDescription||
     after.getFlag(ns,"cavFullPrayerJournalUuid")!==journal.uuid||
     after.getFlag(ns,"cabinPuzzleItem")?.status!=="GM_LIBRARY_ONLY")
    throw Error("Partial original Item description/binding after "+q.title+"; STOP, no retry");
   installed.push({
     title:q.title,originalItemUuid:after.uuid,
     journalUuid:journal.uuid,readablePageUuid:page.uuid,
     journalDefaultOwnership:journal.ownership.default,
     descriptionCharacters:after.system.description.value.length,
     originalLibraryStatus:after.getFlag(ns,"cabinPuzzleItem")?.status,
     sourceProvenance:after.getFlag(ns,"cavFullPrayerProvenance")
   });
  }
  return{status:"two-full-owner-authorized-prayer-journals-installed-gm-only",
   world:game.world.id,gm:game.user.name,created:installed};
 },{plans,commit});
 const out="C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn20-full-prayer-native-install-20261026.json";
 writeFileSync(out,JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await b.close()}