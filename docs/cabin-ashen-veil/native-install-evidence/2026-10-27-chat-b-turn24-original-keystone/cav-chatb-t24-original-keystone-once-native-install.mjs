import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-original-keystone-item-source.js').href);
const template=cfg.makeKeystoneWorldTemplate();
if(!cfg.templateValid(template))throw Error('Item source template invalid');
const hash=s=>createHash('sha256').update(s).digest('hex');
const commit=process.argv.includes('--commit-once-original-keystone-gm-library');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('No exact elected GM world tab');
 const x=await page.evaluate(async({template,commit,originals})=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.version!=='14.367'||game.system.id!=='dnd5e'||game.system.version!=='5.3.3'||
    game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||
    game.users.activeGM?.id!==game.user.id)throw Error('Wrong world/elected GM/system');
  const folder=game.folders.get('N6X80ycvxaPIszHg');
  if(!folder||folder.type!=='Item'||!folder.name.includes('Cabin in the Ashen Veil')||
   !folder.name.includes('Puzzle Items'))throw Error('Original puzzle Item folder changed');
  if(game.items.has(template._id)||game.items.contents.some(i=>/keystone/i.test(i.name))||
   game.actors.contents.some(a=>Array.from(a.items).some(i=>/keystone/i.test(i.name))))
   throw Error('Original Keystone already exists or was acquired: STOP');
  const originalRefs=originals.map(uuid=>{
    const i=game.items.get(uuid.slice(5));
    if(!i||i.uuid!==uuid||i.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
     throw Error('Different original puzzle source: '+uuid);
    return i.uuid;
  });
  const vault=game.scenes.get('tjTpG2RVZNoCqRLh'),
   plinth=vault?.regions.get('CAVB799A5357A114'),
   outer=game.scenes.get('CN5fkK2QLUELBGGR'),
   recessed=outer?.regions.get('CAVB67AABD1B35C6'),
   lever=outer?.regions.get('CAVUNDLEVER00001');
  if(!vault||vault.name!=='H-B02 - Secured Keystone Vault'||vault.regions.size!==2||
    plinth?.behaviors.size!==0||
    plinth?.toObject().shapes[0]?.x!==705||
    plinth?.toObject().shapes[0]?.y!==380||
    plinth?.toObject().shapes[0]?.width!==210||
    plinth?.toObject().shapes[0]?.height!==190||
    !outer||recessed?.behaviors.get('CAVUNDKEYBEH0001')?.disabled!==true||
    lever?.behaviors.get('CAVUNDLEVBEH0001')?.disabled!==true||
    outer.regions.get('CAVUNDCROSS00001')?.behaviors.get('CAVUNDOUTTEL0001')?.disabled!==true)
    throw Error('Original Vault/Undercroft physical puzzle context not certified');
  if(template.flags?.[ns]?.cabinPuzzleItem?.status!=='GM_LIBRARY_ONLY'||
    template.flags?.[ns]?.cavKeystoneOriginalSource?.claimStatus!=='NOT_CLAIMED'||
    template.flags?.[ns]?.cavKeystoneOriginalSource?.intendedVaultPlinthRegionUuid!==plinth.uuid||
    template.flags?.[ns]?.cavKeystoneOriginalSource?.intendedRecessRegionId!==recessed.id||
    template.ownership.default!==0||template.type!=='loot'||template.system.quantity!==1)
    throw Error('Proposed owner-source Item permissions/gate mismatch');
  const preflight={world:game.world.id,gm:game.user.name,system:game.system.id+' '+game.system.version,
    sourceFolderId:folder.id,plinthUuid:plinth.uuid,keystoneRecess:recessed.uuid,
    originalSourceUuids:originalRefs,existingKeystones:0,playerKeystoneCopies:0,
    authorizedNewSource:template.flags[ns].cabinPuzzleItem.source,
    newWorldItem:template._id,noPlayerGrant:true,noPortalChange:true};
  if(!commit)return{status:'original-keystone-item-gm-library-preflight-pass-no-writes',preflight};
  const made=await Item.createDocuments([template],{keepId:true});
  const i=game.items.get(template._id);
  if(made?.length!==1||!i||i.uuid!=='Item.CAVKEYSTONEITEM1'||
    i.name!=='Keystone'||i.type!=='loot'||i.folder?.id!==folder.id||
    i.system.quantity!==1||i.ownership.default!==0||
    i.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'||
    i.getFlag(ns,'cavKeystoneOriginalSource')?.claimStatus!=='NOT_CLAIMED'||
    i.getFlag(ns,'cavKeystoneOriginalSource')?.intendedVaultPlinthRegionUuid!==plinth.uuid)
    throw Error('Native Keystone world Item creation uncertain; STOP no replay');
  return{status:'original-keystone-owner-authored-world-source-installed-gm-library-only',
   preflight,installed:{uuid:i.uuid,id:i.id,name:i.name,type:i.type,
    folder:i.folder.id,ownership:i.ownership.default,quantity:i.system.quantity,
    source:i.getFlag(ns,'cabinPuzzleItem')?.source,
    status:i.getFlag(ns,'cabinPuzzleItem')?.status,
    claimStatus:i.getFlag(ns,'cavKeystoneOriginalSource')?.claimStatus,
    plinthUuid:i.getFlag(ns,'cavKeystoneOriginalSource')?.intendedVaultPlinthRegionUuid},
    noPlayerCopies:!game.actors.contents.some(a=>Array.from(a.items).some(x=>x.name==='Keystone'))};
 },{template,commit,originals:cfg.ORIGINALS});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t24-original-keystone-item-install.json';
 writeFileSync(out,JSON.stringify({...x,itemTemplateSHA256:hash(JSON.stringify(template))},null,2));
 console.log(JSON.stringify({...x,itemTemplateSHA256:hash(JSON.stringify(template))}));
}finally{await browser.close()}