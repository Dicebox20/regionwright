import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../docs/cabin-ashen-veil/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('owner-authorized-full-prayer-handouts-2026-10-26.json',root),'utf8'));
const evidence=new URL('native-install-evidence/2026-10-26-chat-b-turn20-full-prayer-journals/',root);
const before=JSON.parse(readFileSync(new URL('cav-chatb-turn20-prayers-original-preflight-20261026.json',evidence),'utf8'));
const install=JSON.parse(readFileSync(new URL('cav-chatb-turn20-full-prayer-native-install-20261026.json',evidence),'utf8'));
const after=JSON.parse(readFileSync(new URL('cav-chatb-turn20-full-prayers-independent-postread-20261026.json',evidence),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');

test('new wording has exact scoped owner-authorized provenance, not historic original recovery',()=>{
 assert.equal(manifest.contentProvenance,'OWNER_AUTHORIZED_NEW_TEXT_2026-10-26');
 assert.equal(manifest.ownerAuthorization,'you can make up your own prayer text');
 assert.equal(manifest.prayers.length,2);
});
test('original prayer Items, acquisition and altar usages stay distinct',()=>{
 assert.deepEqual(manifest.prayers.map(x=>x.itemUuid),[
 'Item.5jwy75XyFezukf3b','Item.GXLYq6Tf4OgPNbkU']);
 assert.equal(manifest.prayers[0].title,'Prayer of Protection');
 assert.equal(manifest.prayers[1].title,'Prayer of Devotion');
 assert.match(manifest.prayers[0].canonicalAcquisition,/Music Box/);
 assert.match(manifest.prayers[1].canonicalAcquisition,/Boathouse/);
 assert.match(manifest.prayers[1].canonicalUse,/Sune altar/);
});
test('full prayer text is safe readable HTML matching exact authored line arrays',()=>{
 for(const q of manifest.prayers){
  assert.ok(q.lines.length>=5);
  assert.equal(q.readableHtml,q.lines.map(x=>'<p>'+x+'</p>').join('\n'));
  assert.ok(q.readableHtml.length>450);
  assert.ok(!/[<>](script|iframe|img)/i.test(q.readableHtml));
 }
 assert.notEqual(hash(manifest.prayers[0].readableHtml),hash(manifest.prayers[1].readableHtml));
});
test('two 16-character unique original Journal identifiers with no accidental extra award',()=>{
 const ids=manifest.prayers.map(x=>x.proposedJournalId);
 assert.deepEqual(ids,['CAVPRAYERPROTECT','CAVPRAYERDEVOTN1']);
 assert.ok(ids.every(s=>s.length===16));
 assert.equal(new Set(ids).size,2);
 assert.equal(manifest.integration.neverAutoGrant,true);
 assert.equal(manifest.integration.neverAutoTeleport,true);
});
test('elected-GM original preflight saved descriptions for reconciliation',()=>{
 assert.equal(before.status,'prayer-two-native-items-and-journals-preflight-pass-no-writes');
 assert.equal(before.originalItemSources.length,2);
 for(let i=0;i<2;i++){
  assert.equal(before.originalItemSources[i].itemUuid,manifest.prayers[i].itemUuid);
  assert.equal(before.originalItemSources[i].ownerSourceStatus,'GM_LIBRARY_ONLY');
  assert.ok(before.originalItemSources[i].originalDescription.length>150);
 }
});
test('one-time native installer reports both original GM-only pages, not player grants',()=>{
 assert.equal(install.status,'two-full-owner-authorized-prayer-journals-installed-gm-only');
 assert.equal(install.created.length,2);
 for(let i=0;i<2;i++){
  const r=install.created[i],q=manifest.prayers[i];
  assert.equal(r.originalItemUuid,q.itemUuid);
  assert.equal(r.journalUuid,'JournalEntry.'+q.proposedJournalId);
  assert.equal(r.journalDefaultOwnership,0);
  assert.equal(r.originalLibraryStatus,'GM_LIBRARY_ONLY');
 }
});
test('independent current GM readback verified BOTH exact native pages and Item bindings',()=>{
 assert.equal(after.pass,true);
 assert.equal(after.checked.length,2);
 for(let i=0;i<2;i++){
  const r=after.checked[i],q=manifest.prayers[i];
  assert.equal(r.pass,true);
  assert.equal(r.itemUuid,q.itemUuid);
  assert.equal(r.itemJournalFlag,'JournalEntry.'+q.proposedJournalId);
  assert.equal(r.journalUuid,'JournalEntry.'+q.proposedJournalId);
  assert.equal(r.pageSHA256,hash(q.readableHtml));
  assert.equal(r.pageSHA256,r.expectedPageSHA256);
  assert.equal(r.visibleToNonGMs,false);
  assert.equal(r.sourceLibraryStatus,'GM_LIBRARY_ONLY');
  assert.equal(r.journalPages,1);
 }
});
test('native postread reports zero player copies and no duplicate original sources',()=>{
 assert.equal(after.actorPrayerCopies,0);
 assert.deepEqual(after.collisionCounts.map(x=>[x.itemMatches,x.journalMatches]),[[1,1],[1,1]]);
});
test('existing Studio Vanity, Workshop Wick and dormant Privy Copper stayed unchanged',()=>{
 assert.equal(after.originalStudioVanityPreserved,true);
 assert.equal(after.originalWorkshopWickPreserved,true);
 assert.equal(after.originalPrivyDormantPreserved,true);
});
test('verified native content remains separate from gameplay progression acceptance',()=>{
 assert.equal(manifest.integration.nonGmAcceptanceTested,false);
 assert.equal(manifest.integration.nativeJournalMustStayHiddenUntilEarned,true);
 assert.equal(manifest.integration.foundryWritePerformed,false);
 assert.equal(after.checked.every(x=>x.pass===true&&x.visibleToNonGMs===false),true);
});