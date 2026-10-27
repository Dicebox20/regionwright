import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
const root='C:/Users/rujie/Documents/CAV-Chat-B-Late-Game';
const cfg=await import(pathToFileURL(root+'/modules/regionwright/scripts/studio-cav-early-map-music-47.js').href);
const load=n=>JSON.parse(readFileSync(new URL(n,import.meta.url),'utf8'));
const baseline=load('cav-early-map-music-47-native-originals-preflight.json');
const native=load('cav-map-music-47-independent-gm-postread.json');
const patch=load('cav-music-macro-restore-guard-update-receipt.json');
if(!native.pass||native.verifiedCount!==47||native.actualNativeAmbientSoundCount!==57||
 native.exactGroveEight.length!==8)throw Error('Unverified original native game state');
const entries=cfg.catalog();
const command=cfg.macroCommand(baseline.entries,baseline.originals);
const sha=createHash('sha256').update(command).digest('hex');
if(sha!==patch.newSHA)throw Error('Backup macro no longer matches actual live GM source');
writeFileSync(new URL('./CAV-Independent-Scene-Music-GM-Macro.js',import.meta.url),command+'\n');
const rows=entries.map(e=>{
 const verify=native.allScenes.find(x=>x.id===e.id);
 if(!verify?.pass||verify.soundId!==e.soundId||verify.expectedPath!==e.path||
 verify.volume!==e.volume)throw Error('Mismatched original native Scene '+e.id);
 return{sceneId:e.id,name:e.name,track:e.file,path:e.path,volume:e.volume,
  soundId:e.soundId,center:verify.center,radiusInSceneUnits:verify.radius,
  fullAreaCovered:verify.pixelCoverage>=verify.cornerPixels+120,
  source:e.existingId?'Original yard music retained':'New GM Sound Layer emitter',
  perimeterSmellOfFear:cfg.GROVE_PERIMETER.includes(e.id),gmVerified:verify.pass,
  noDistanceEasing:true,wallOcclusionDisabled:true,repeat:true};
});
if(rows.filter(x=>x.perimeterSmellOfFear).length!==8||rows.some(x=>!x.fullAreaCovered))
 throw Error('Not all owner requested map geometry present');
const lines=[
 '# CAV — Independent Map Music: 47 Scenes (Early Game)',
 '',
 'Installed and independently elected-GM verified on 2026-10-27. Each map has a native Foundry v14 Ambient Sound emitter centered on its image, covering all four corners plus one grid margin; volume easing OFF, walls OFF, repeat ON, darkness activation [0,1]. Does **not** depend on GM Scene activation.',
 '',
 '**Owner-selected ceremonial perimeter:** All eight outer Grove Scenes SG-01 through SG-04, SG-06 through SG-09 use **Demon Slayer - The Smell of Fear.mp3**. The central SG-05 clearing uses a different track. Existing music file was found in the owner local Foundry library and returned HTTP 200; no audio was downloaded or reproduced in Git.',
 '',
 '**GM control:** Foundry Macro Directory → **CAV — Independent Scene Music (GM)** → **Install / Verify / Restore Original Map Sounds**. It preserves ten original rainy/atmospheric sound effects and ADOPTS original Yard Elwynn Forest music without a duplicate. Last installed code backup is `CAV-Independent-Scene-Music-GM-Macro.js`; restoring original sound setup will delete only the 46 sources owned by the macro and restore the original Yard emitter fields/flags. Partial install fails closed with macro pending flag; do not replay one-time installers.',
 '',
 '**Listener caveat:** Native Ambient Sounds generally rely on a player-controlled token inside the audible area, not merely the player opening a Scene tab. Actual client-side volume and playback when navigating independently still require a non-GM test with appropriate tokens on the destination Scenes.',
 '',
 '| Player-facing Scene | Track from owner library | Vol. | Radius (ft) | Origin |',
 '| --- | --- | ---: | ---: | --- |',
 ...rows.map(r=>'| '+r.name+' | '+r.track.replaceAll('|','/')+' | '+r.volume.toFixed(2)+' | '+r.radiusInSceneUnits+' | '+r.source+' |'),
 '',
 'All other legacy AmbientSound placeables, Region Behaviors, lights, map walls, and Scene playlists remain in place. The current Early Game FXMaster ambience stays active; future scene chapter ambience phases were not changed.',
 ''
];
writeFileSync(new URL('./47-SCENE-MUSIC-MATRIX.md',import.meta.url),lines.join('\n'));
writeFileSync(new URL('./47-SCENE-MUSIC-MATRIX.json',import.meta.url),JSON.stringify({
 datePacific:'2026-10-27',world:native.world,activeMoodPhase:'early',scenes:rows,
 originalSoundCount:11,newMusicSoundCount:46,
 reusedYardMusicSoundCount:1,
 originalNonMusicAmbientEffectsPreserved:10,
 currentAmbientSoundTotal:57,
 originalCeremonialPerimeterCount:8,
 macroSourceSHA256:sha,
 independentGmVerified:true,nonGmClientAudiblyVerified:false
},null,2));
console.log(JSON.stringify({rows:rows.length,grove:rows.filter(x=>x.perimeterSmellOfFear).length,
 totalTracks:new Set(rows.map(x=>x.track)).size,macroSHA256:sha,fullyCovered:rows.every(x=>x.fullAreaCovered)}));