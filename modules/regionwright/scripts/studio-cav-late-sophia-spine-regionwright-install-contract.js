// CAV Chat B T28: Sophia original in-room bookcase -> native Regionwright
// spineMosaic.configure() exact 6 historical Item sources/art, but puzzle
// tokenEnter remains DISABLED until authentic canonical Veil + book pickup.
// Use module's standard owner-approved configuration API, temporary native
// Puzzle/Region writes enabled during installation only, then restored.
// No extra Region, reward, H-U06 room or Storybook completion is fabricated.
export const SCENE_ID='CAVHU05Scene0001';
export const BOOKCASE_ID='CAVB994894A7432F';
export const UUID='Scene.CAVHU05Scene0001.Region.CAVB994894A7432F';
export const APPROVED_MAP='Maps/cabin-in-the-ashen-veil/H-U05_Sophias_Bedroom_V004_OWNER_APPROVED_SOUTH_DOOR_REMOVED_2026-10-24.png';
export const OWNER_NAME="Sophia's Bookcase — Six Storybooks";
export const PUZZLE_MODULE='regionwright-puzzles-locks';
export const FLAG='spineMosaic';
export const SEED='cav-original-1442-1447';
export const BOOKS=Object.freeze([
 Object.freeze({uuid:'Item.Qplmy8JR7plDYLiY',year:1442,title:'The Knight Who Befriended a Dragon',
   image:'worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/the-knight-who-befriended-a-dragon.png'}),
 Object.freeze({uuid:'Item.DLGIhHc0RDqh0YVt',year:1443,title:'Moonlight and the Missing Stars',
   image:'worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/moonlight-and-the-missing-stars.png'}),
 Object.freeze({uuid:'Item.TO69wBYN8sRJuxtH',year:1444,title:'Felix Fox and the Forgotten Kingdom',
   image:'worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/felix-fox-and-the-forgotten-kingdom.png'}),
 Object.freeze({uuid:'Item.c3oKW8YkklE8slnX',year:1445,title:'Whispers of the Little Witch',
   image:'worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/whispers-of-the-little-witch.png'}),
 Object.freeze({uuid:'Item.HV7XjKmgqVITSEvW',year:1446,title:"The Clockmaker's Starless Sky",
   image:'worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/the-clockmakers-starless-sky.png'}),
 Object.freeze({uuid:'Item.gmTsIOqc3qFBc3zA',year:1447,title:'Princess Penelope and the Sea of Stars',
   image:'worlds/cabin-in-the-ashen-veil/assets/book-spine-mosaic-v001/princess-penelope-and-the-sea-of-stars.png'})
]);
export const PROTECTED_BEHAVIORS=Object.freeze({
 closeup:'LRYrBIQNN92SCJai',
 gondReward:'CAVGONDREWARD001'
});
export const SOURCE_REWARD='Item.o9G3UJjEe2QX1ZH0';
export const SOURCE_REWARD_TILE='CAVHU05GONDTILE1';
export function expectedBooks(){return BOOKS.map(b=>({title:b.title,image:b.image}));}
export function proposedSpineConfig(api){
 if(typeof api?.createConfig!=='function')throw Error('Missing standard Regionwright spine API');
 const config=api.createConfig({books:expectedBooks(),seed:SEED});
 if(config?.version!==1||config.books?.length!==6||config.solution?.length!==6||
   config.books.some((b,i)=>b.id!=='book-'+(i+1)||b.image!==BOOKS[i].image||
     b.title!==BOOKS[i].title.slice(0,28))||
   config.solution.some((id,i)=>id!=='book-'+(i+1)))
  throw Error('Regionwright Spine native config drift: stop');
 return config;
}
export function sourceBoundFlag(config){
 return{
 version:1,status:'configured-disabled-await-authentic-sixth-veil',
 originalBookcaseUuid:UUID,originalItemIds:BOOKS.map(b=>b.uuid),
 originalPublicationYears:BOOKS.map(b=>b.year),
 configBookToOriginalUuid:Object.fromEntries(config.books.map((book,i)=>[book.id,BOOKS[i].uuid])),
 originalCloseupBehaviorId:PROTECTED_BEHAVIORS.closeup,
 originalGondRewardBehaviorId:PROTECTED_BEHAVIORS.gondReward,
 originalGondTileId:SOURCE_REWARD_TILE,
 originalGondWorldItemUuid:SOURCE_REWARD,
 nativeSpineCompletionVerified:false,
 nativeVeilSixthPickupVerified:false,
 rewardGranted:false,
 nativePlayerTested:false,
 originalRegionwrightApiUsed:true
 };
}