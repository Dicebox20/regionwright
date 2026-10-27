import{chromium}from'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Exact GM');
const x=await p.evaluate(()=>{
 const ns='dicebox-campaign-helper',sc=game.scenes.get('CAVHU05Scene0001'),
 reg=sc?.regions.get('CAVB994894A7432F');
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
 const puzzle=game.modules.get('regionwright-puzzles-locks')?.api?.spineMosaic;
 let ws=null,rw=null;try{ws=game.settings.get('regionwright-puzzles-locks','enablePuzzleWrites')}catch(e){ws='unregistered'};try{rw=game.settings.get('regionwright','enableRegionWrites')}catch(e){rw='unregistered'}
 return{
  world:game.world.id,gm:game.user.name,module:game.modules.get('regionwright-puzzles-locks')?.version,
  puzzleFunctions:Object.keys(puzzle||{}),puzzleWriteSetting:ws,regionWriteSetting:rw,
  scene:sc?.uuid,sceneName:sc?.name,regionCount:sc?.regions.size,
  bookcase:{uuid:reg?.uuid,name:reg?.name,shape:reg?.toObject().shapes,
   behaviorCount:reg?.behaviors.size,flags:reg?.flags,
   behaviors:Array.from(reg?.behaviors||[]).map(z=>({
     id:z.id,name:z.name,type:z.type,disabled:z.disabled,
     events:Array.from(z.system.events||[]),source:z.system.source}))},
  claimedBooks:[
   'Qplmy8JR7plDYLiY','DLGIhHc0RDqh0YVt','TO69wBYN8sRJuxtH',
   'c3oKW8YkklE8slnX','HV7XjKmgqVITSEvW','gmTsIOqc3qFBc3zA'
  ].map(id=>{
   const i=game.items.get(id);return{uuid:i?.uuid,name:i?.name,description:i?.system?.description?.value?.slice(0,400),
    img:i?.img,type:i?.type,status:i?.getFlag(ns,'cabinPuzzleItem')?.status};
  }),
  actorBookCopies:game.actors.contents.flatMap(a=>a.items.contents.filter(i=>/the knight|moonlight|felix fox|whispers of|clockmaker|princess penelope/i.test(i.name)).map(i=>({actor:a.name,item:i.name}))),
  originalGondCopies:game.actors.contents.flatMap(a=>a.items.contents.filter(i=>i.name==='Gond Emblem Half')).length,
  hiddenGondTile:sc?.tiles.get('CAVHU05GONDTILE1')?.toObject(),
  moduleConfigPreview:(()=>{try{return puzzle?.createConfig({books:['The Knight Who Befriended a Dragon','Moonlight and the Missing Stars','Felix Fox and the Forgotten Kingdom','Whispers of the Little Witch',"The Clockmaker's Starless Sky",'Princess Penelope and the Sea of Stars'],seed:'cav-original-1442-1447'});}catch(e){return {error:e.message}}})()
 };
});
console.log(JSON.stringify(x).slice(0,15000));
}finally{await b.close()}