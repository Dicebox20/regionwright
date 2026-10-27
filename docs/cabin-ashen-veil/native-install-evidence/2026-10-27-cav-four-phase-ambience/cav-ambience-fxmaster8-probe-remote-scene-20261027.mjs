import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');const data=await p.evaluate(async()=>{
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||
 game.users.activeGM.id!==game.user.id)throw Error('GM');
 if(!game.modules.get('fxmaster')?.active||game.modules.get('fxmaster').version!=='8.3.6')throw Error('FX');
 const scene=game.scenes.get('CAVSG06Scene0001');
 if(!scene||scene.name!=='Grove — East Walk'||game.users.contents.some(u=>u.active&&!u.isGM&&u.viewedScene===scene.id))throw Error('Probe scene unavailable/occupied');
 const id='apiMacro_cavAmbienceProbe_p';
 const before=structuredClone(scene.flags?.fxmaster||{});
 if(JSON.stringify(before).includes(id))throw Error('Probe id already exists');
 let created=null;
 try{
  created=await FXMASTER.api.effects.play({scene,particles:[{id,type:'fog',
   options:{belowTokens:true,scale:.24,speed:.14,lifetime:.24,
    density:.12,alpha:.3}}],skipFading:true});
  if(created===false||!(created?.particles||[]).includes(id))
   throw Error('FXMaster did not respect explicit stable id');
  const during=structuredClone(scene.flags?.fxmaster||{});
  return{scene:scene.id,success:true,created,fxFlagsDuring:Object.keys(during),
   nonGMViewers:0,beforePreserved:true};
 }finally{
  await FXMASTER.api.effects.stop({scene,particles:[id],skipFading:true});
 }
});const file='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-fxmaster-api-probe.json';writeFileSync(file,JSON.stringify(data,null,2));console.log(JSON.stringify(data));}finally{await b.close()}