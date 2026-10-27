// Cabin in the Ashen Veil, Chat B T24: new owner-authorized original Keystone.
// Item CREATION ONLY: GM-library, not Vault claimed; does not open any door.
// Established PREPARE -> BUILD -> VERIFY -> CATALOGUE workflow.
export const ITEM_ID='CAVKEYSTONEITEM1';
export const ITEM_UUID='Item.'+ITEM_ID;
export const FOLDER_ID='N6X80ycvxaPIszHg';
export const VAULT_SCENE='tjTpG2RVZNoCqRLh';
export const ORIGINAL_PLINTH='CAVB799A5357A114';
export const ORIGINAL_PLINTH_UUID='Scene.'+VAULT_SCENE+'.Region.'+ORIGINAL_PLINTH;
export const UND01_SCENE='CN5fkK2QLUELBGGR';
export const UND01_RECESS='CAVB67AABD1B35C6';
export const UND01_LEVER='CAVUNDLEVER00001';
export const OWNER_AUTHORITY='2026-10-27-owner-delegated-cav-keystone-source';
export const DESCRIPTION='<p>A palm-sized block of pale, time-worn stone, weighty despite its smooth edges. One face is incised with a rose nested inside a ring of precise gear teeth. The reverse bears a shallow ridge shaped to fit a carefully carved recess.</p><p>This is neither a door key nor a magical teleporter. It was made to join a mechanism; the maker expected someone to fit the stone in place and then operate something else.</p>';
export const ORIGINALS=Object.freeze([
 'Item.pbmUZPfC3WnsBRgi', // source, charged in its ORIGINAL place
 'Item.o9G3UJjEe2QX1ZH0', // Gond half
 'Item.t9uCIpsKeSvtC31w', // Sune half
 'Item.vbDWTbnAZg65ErSS', // completed emblem = mechanism, not 4th socket
 'Item.1n5LONw3nYIy61O9', // Sune Bowl = OUTER Undercroft, never Vault
 'Item.VjdQNwil7pPKzkHU' // filled 027 Dust instance = OUTER
]);
export const KEYS=Object.freeze({
 vaultDoorStatus:'cavLateVaultDoorLedger',
 vaultMarker:'cavLateKeystonePlinthMarker',
 vaultClaim:'cavLateKeystoneGrant',
 originalSource:'cavKeystoneOriginalSource'
});
export function makeKeystoneWorldTemplate(){
 return {
  _id:ITEM_ID,name:'Keystone',type:'loot',
  img:'icons/commodities/stone/geode-raw-grey.webp',folder:FOLDER_ID,
  ownership:{default:0},
  system:{quantity:1,description:{value:DESCRIPTION,chat:''},
   identifier:'cav-vault-keystone',
   source:{revision:1,rules:'2024'},
   identified:true,weight:{value:1,units:'lb'},
   price:{value:0,denomination:'gp'},properties:[],
   rarity:'',type:{value:'',subtype:''}},
  flags:{'dicebox-campaign-helper':{
   cabinPuzzleItem:{source:OWNER_AUTHORITY,status:'GM_LIBRARY_ONLY',itemKey:'Keystone'},
   cavKeystoneOriginalSource:{
    version:1,authority:OWNER_AUTHORITY,approvedAsNewOriginal:true,
    sourceWorld:'cabin-in-the-ashen-veil',
    role:'Vault reward, then inner Undercroft mechanical recess ONLY',
    intendedVaultSceneId:VAULT_SCENE,
    intendedVaultPlinthRegionUuid:ORIGINAL_PLINTH_UUID,
    intendedUND01SceneId:UND01_SCENE,
    intendedRecessRegionId:UND01_RECESS,
    separateStoneLeverRegionId:UND01_LEVER,
    claimStatus:'NOT_CLAIMED',
    sourceStatus:'GM_LIBRARY_ONLY',
    outerScryingBowlSubstituteForbidden:true,
    virtualTransportForbidden:true,
    nativeGameplayTested:false
   }
  }}
 };
}
export function templateValid(x=makeKeystoneWorldTemplate()){
 const f=x?.flags?.['dicebox-campaign-helper'];
 return x?._id===ITEM_ID&&ITEM_ID.length===16&&x?.name==='Keystone'&&
 x?.type==='loot'&&x?.folder===FOLDER_ID&&x?.ownership?.default===0&&
 x?.system?.quantity===1&&x?.system?.identifier==='cav-vault-keystone'&&
 x?.img==='icons/commodities/stone/geode-raw-grey.webp'&&
 f?.cabinPuzzleItem?.status==='GM_LIBRARY_ONLY'&&
 f?.cabinPuzzleItem?.source===OWNER_AUTHORITY&&
 f?.cavKeystoneOriginalSource?.intendedVaultPlinthRegionUuid===ORIGINAL_PLINTH_UUID&&
 f?.cavKeystoneOriginalSource?.intendedRecessRegionId===UND01_RECESS&&
 f?.cavKeystoneOriginalSource?.claimStatus==='NOT_CLAIMED'&&
 !ORIGINALS.includes(ITEM_UUID);
}