// Cabin in the Ashen Veil — Chat B Turn25 exact original Vault/Workshop physical staging.
// Three (ONLY three) authentic Item sockets + Basement access = FOUR gates.
// Native scripts remain disabled and cannot grant, consume, open Vault or teleport.
export const WORKSHOP=Object.freeze({id:'G6NMonfCwMvNzipL',name:'H-B01 - Allens Basement Workshop',
 art:'Maps/cabin-in-the-ashen-veil/h-b01-allens-basement-workshop-approved-v002.png',
 width:1536,height:1024});
export const VAULT=Object.freeze({id:'tjTpG2RVZNoCqRLh',name:'H-B02 - Secured Keystone Vault',
 art:'Maps/cabin-in-the-ashen-veil/h-b02-secured-keystone-vault-approved-v003.png',
 width:1536,height:1024});
export const EXISTING_BENCH='CAVBABA9513F73A3';
export const EXISTING_VAULT_ENTRY='CAVB1F6B8321128A';
export const EXISTING_VAULT_PLINTH='CAVB799A5357A114';
export const KEYSTONE_SOURCE='Item.CAVKEYSTONEITEM1';
export const AUTHENTIC_ITEM_SOCKETS=Object.freeze({
 'charged-source':'Item.pbmUZPfC3WnsBRgi',
 'gond-half':'Item.o9G3UJjEe2QX1ZH0',
 'sune-half':'Item.t9uCIpsKeSvtC31w'
});
export const OTHER_NOT_SOCKETS=Object.freeze([
 'Item.vbDWTbnAZg65ErSS', // historical completed emblem is actuator not an inventory socket
 'Item.1n5LONw3nYIy61O9', // Sune Bowl belongs to OUTER UND
 'Item.CAVKEYSTONEITEM1' // Vault REWARD, not an input
]);
export const ORIGINAL_WORKSHOP_REGIONS=Object.freeze(['CAVB9C0F653A2A6F','CAVBABA9513F73A3','CAVBASEMENTRET01']);
export const ORIGINAL_VAULT_REGIONS=Object.freeze([EXISTING_VAULT_ENTRY,EXISTING_VAULT_PLINTH]);
export const FIXTURES=Object.freeze([
 Object.freeze({kind:'charged-source',sceneId:WORKSHOP.id,id:'CAVVAULTPOWER001',
  behaviorId:'CAVVPOWERBEH0001',rect:{x:610,y:365,width:130,height:125}}),
 Object.freeze({kind:'gond-half',sceneId:WORKSHOP.id,id:'CAVVAULTGOND0001',
  behaviorId:'CAVVGONDBEH00001',rect:{x:1020,y:358,width:125,height:132}}),
 Object.freeze({kind:'sune-half',sceneId:WORKSHOP.id,id:'CAVVAULTSUNE0001',
  behaviorId:'CAVVSUNEBEH00001',rect:{x:890,y:515,width:130,height:98}}),
 Object.freeze({kind:'turn-joined-emblem',sceneId:WORKSHOP.id,id:EXISTING_BENCH,original:true,
  behaviorId:'CAVVTURNBEH00001',rect:{x:770,y:315,width:220,height:185}}),
 Object.freeze({kind:'workshop-to-vault-sealed',sceneId:WORKSHOP.id,id:'CAVVAULTDOOR0001',
  behaviorId:'CAVVOUTTEL000001',rect:{x:1325,y:535,width:150,height:165},
  destination:'Scene.tjTpG2RVZNoCqRLh.Region.CAVB1F6B8321128A'}),
 Object.freeze({kind:'return-landing-workshop',sceneId:WORKSHOP.id,id:'CAVVAULTLAND0001',
  rect:{x:1095,y:730,width:150,height:130}}),
 Object.freeze({kind:'vault-to-workshop-return',sceneId:VAULT.id,id:'CAVVAULTBACK0001',
  behaviorId:'CAVVBACKTEL00001',rect:{x:50,y:397,width:118,height:148},
  destination:'Scene.G6NMonfCwMvNzipL.Region.CAVVAULTLAND0001'})
]);
export function overlapping(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
export function validFixturePlan(){
 const ids=new Set(),bs=new Set();
 for(const f of FIXTURES){
  const sc=f.sceneId===WORKSHOP.id?WORKSHOP:VAULT;
  if(f.id.length!==16||ids.has(f.sceneId+'/'+f.id)||f.behaviorId&&f.behaviorId.length!==16||
     f.behaviorId&&bs.has(f.behaviorId)||f.rect.x<0||f.rect.y<0||
     f.rect.x+f.rect.width>sc.width||f.rect.y+f.rect.height>sc.height)return false;
  ids.add(f.sceneId+'/'+f.id);if(f.behaviorId)bs.add(f.behaviorId);
  for(const g of FIXTURES){
   if(f===g||f.sceneId!==g.sceneId)continue;
   if(overlapping(f.rect,g.rect))return false;
  }
 }
 return FIXTURES.length===7&&Object.keys(AUTHENTIC_ITEM_SOCKETS).length===3&&
    FIXTURES.filter(f=>f.original).length===1&&
    FIXTURES.filter(f=>f.behaviorId).length===6&&
    FIXTURES.filter(f=>!f.behaviorId).length===1;
}
const passiveInfo=(kind)=>{
const heading=kind==='turn-joined-emblem'?'Joined Emblem Turning Control':
 kind==='charged-source'?'Gondian Power Source Socket':
 kind==='gond-half'?'Gond Emblem Half Socket':'Sune Emblem Half Socket';
const body=kind==='turn-joined-emblem'?
 'The rose and gear mechanism cannot be turned until the three separate authentic items have been seated, after legitimate basement access. No fourth inventory piece is required.':
 'This recess accepts only its proper original component. The Keystone is the Vault reward, not an input. No item is consumed or awarded by inspecting this uncommissioned fixture.';
return String.raw`
if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil')return;
if(scene?.id!=='G6NMonfCwMvNzipL')return;
// DORMANT read-only source. No Item, ledger, portal or GM mutations.
if(event?.name!=='behaviorViewed'||game.user?.isGM)return;
return;
`.trim()+'\n// '+heading+' — '+body;
};
export function nativeBehavior(f){
 if(!f.behaviorId)throw Error('passive arrival fixture has no behavior');
 if(f.destination)return{_id:f.behaviorId,name:'SEALED Vault route — missing authentic 4-gate turn',
 type:'teleportToken',disabled:true,
 system:{events:['tokenExit'],destinations:[f.destination],placement:'center',
  snap:false,choice:true,revealed:false,
  dialog:{revealed:'Use the open Vault passage?',unrevealed:'Use the open Vault passage?'},
  transition:{type:null,duration:1500}}};
 return{_id:f.behaviorId,name:'Vault '+f.kind+' — DORMANT original source review',
 type:'executeScript',disabled:true,
 system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated'],
 source:passiveInfo(f.kind)}};
}