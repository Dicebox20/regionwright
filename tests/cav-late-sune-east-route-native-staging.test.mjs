import test from 'node:test';
import assert from 'node:assert/strict';
import {
 STUDIO,WORKSHOP,STAGES,EXISTING_STUDIO_VANITY,
 EXISTING_WORKSHOP_WICK,PROTECTION_SOURCE,PROTECTION_JOURNAL,
 rectsOverlap,physicalPlanInvariant,nativeAltarInformationOnlySource,
 altarBehaviorData,teleportBehaviorData
} from '../modules/regionwright/scripts/studio-cav-late-sune-east-route-native-staging.js';
const AF=Object.getPrototypeOf(async function(){}).constructor;
test('actual Studio Workshop original Scene maps, not obsolete H-G07/H-G08 aliases',()=>{
 assert.deepEqual([STUDIO.id,WORKSHOP.id],['CAVHU07Scene0001','CAVHU08Scene0001']);
 assert.equal(STUDIO.width,1536);assert.equal(STUDIO.height,1024);
 assert.equal(WORKSHOP.width,1448);assert.equal(WORKSHOP.height,1086);
 assert.match(STUDIO.art,/h-u07-dahlia-art-studio-approved-v017/);
 assert.match(WORKSHOP.art,/H-U08_Candle_Workshop_V002_OWNER_APPROVED/);
});
test('five fixed actual Regions satisfy 16 character IDs and are disjoint in original natural pixels',()=>{
 assert.equal(STAGES.length,5);
 assert.equal(physicalPlanInvariant(),true);
 assert.equal(new Set(STAGES.map(s=>s.id)).size,5);
 assert.ok(STAGES.every(s=>s.id.length===16));
 assert.ok(STAGES.filter(s=>s.behaviorId).every(s=>s.behaviorId.length===16));
});
test('original Chat A Vanity mirror area remains separate from physical Sune altar and east threshold',()=>{
 assert.equal(EXISTING_STUDIO_VANITY,'CAVVANITYREG0001');
 const vanity={x:1270,y:310,width:200,height:255};
 for(const s of STAGES.filter(s=>s.sceneId===STUDIO.id)){
  assert.ok(!rectsOverlap(s.rect,vanity),s.kind);
 }
 assert.equal(STAGES.find(s=>s.kind==='sune-altar').rect.x,1120);
 assert.ok(STAGES.find(s=>s.kind==='studio-east-departure').rect.x>vanity.x);
});
test('Candle Workshop arrival/return are disjoint from original work table and Wick shelf',()=>{
 assert.equal(EXISTING_WORKSHOP_WICK,'CAVBE5639AEC2179');
 const originalTable={x:575,y:400,width:260,height:220};
 const originalWick={x:435,y:115,width:240,height:175};
 for(const s of STAGES.filter(s=>s.sceneId===WORKSHOP.id)){
  assert.equal(rectsOverlap(s.rect,originalTable),false);
  assert.equal(rectsOverlap(s.rect,originalWick),false);
 }
});
test('original protection Item and recently installed GM hidden Journal stay precise',()=>{
 assert.equal(PROTECTION_SOURCE,'Item.5jwy75XyFezukf3b');
 assert.equal(PROTECTION_JOURNAL,'JournalEntry.CAVPRAYERPROTECT');
});
test('Sune altar source compiles as a Foundry native async Region script',()=>{
 assert.doesNotThrow(()=>new AF('region','event',nativeAltarInformationOnlySource()));
});
test('Sune altar preliminary information script has NO effect/permission/claim mutations',()=>{
 const s=nativeAltarInformationOnlySource();
 for(const fragment of ['CAVHU07Scene0001','CAVSUNEACTION001',
  'DialogV2.prompt','Prayer of Protection','Prayer of Devotion',
  'behaviorViewed'])assert.ok(s.includes(fragment),fragment);
 for(const forbidden of ['setFlag(','createEmbeddedDocuments','deleteEmbeddedDocuments',
  '.update(','teleportToken','game.socket.emit'])
  assert.ok(!s.includes(forbidden),forbidden);
});
test('Altar behavior intentionally disabled; original prayer gating to be commissioned after real item custody',()=>{
 const a=altarBehaviorData();
 assert.equal(a.disabled,true);
 assert.equal(a.type,'executeScript');
 assert.deepEqual(a.system.events,['behaviorViewed','behaviorUnviewed','behaviorDeactivated']);
});
test('East Studio departure destination is passive H-U08 arrival with no auto-transit before prayer',()=>{
 const portal=teleportBehaviorData(STAGES.find(s=>s.kind==='studio-east-departure'));
 assert.equal(portal.disabled,true);
 assert.equal(portal.type,'teleportToken');
 assert.deepEqual(portal.system.events,['tokenExit']);
 assert.deepEqual(portal.system.destinations,
  ['Scene.CAVHU08Scene0001.Region.CAVWORKARRIVAL01']);
 assert.equal(portal.system.placement,'center');
 assert.equal(portal.system.choice,true);
});
test('Workshop return destination is independent passive H-U07 safe landing, not Sune altar',()=>{
 const portal=teleportBehaviorData(STAGES.find(s=>s.kind==='workshop-return-departure'));
 assert.equal(portal.disabled,true);
 assert.deepEqual(portal.system.destinations,
  ['Scene.CAVHU07Scene0001.Region.CAVSTUDIORETURN1']);
 assert.equal(portal.system.choice,true);
});
test('Only three disabled behaviors are planned; two landing destinations passive',()=>{
 assert.equal(STAGES.filter(s=>!!s.behaviorId).length,3);
 assert.equal(STAGES.filter(s=>!s.behaviorId).length,2);
 assert.throws(()=>teleportBehaviorData(STAGES[0]));
});