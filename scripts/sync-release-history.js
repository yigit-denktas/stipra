#!/usr/bin/env node
'use strict';
// Only release.published creates a publication. Issues/PR links never imply shipped features.
// Optional release-note lines: - Added [INK-01] New editable mask workflow
const fs=require('node:fs'),path=require('node:path');
const typeNames={Added:'added',Improved:'improved',Fixed:'fixed',Verified:'verified',Researched:'research',Deprecated:'deprecated',Removed:'removed'};
function synchronize(history,event){
 if(history.contract!=='stipra-product-history-v2')throw Error('Upgrade product history before publication');
 if(event.action!=='published'||!event.release)throw Error('Requires release.published event');
 const r=event.release,tag=r.tag_name,publishedAt=r.published_at,url=r.html_url;
 if(!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(tag))throw Error('Release tag must be semver');
 if(!publishedAt||!/^\d{4}-\d\d-\d\dT/.test(publishedAt)||!/^https:\/\/github\.com\//.test(url))throw Error('Published release metadata missing');
 const existing=history.releases.find(x=>x.tag===tag);
 if(existing){if(existing.publishedAt!==publishedAt||existing.url!==url)throw Error('Existing release would change: '+tag);return false;}
 const available=new Set(history.capabilities.map(c=>c.id)),raw=String(r.body||'');
 const lines=raw.split(/\r?\n/).filter(s=>/^\s*[-*]\s+(?:Added|Improved|Fixed|Verified|Researched|Deprecated|Removed)\s+\[/i.test(s));
 const changes=[];
 for(const line of lines){
  const m=line.match(/^\s*[-*]\s+(Added|Improved|Fixed|Verified|Researched|Deprecated|Removed)\s+\[([A-Z]{2,4}-\d\d)\]\s+(.+?)\s*$/i);
  if(!m)throw Error('Malformed structured release change: '+line);
  const type=typeNames[Object.keys(typeNames).find(k=>k.toLowerCase()===m[1].toLowerCase())],id=m[2],title=m[3];
  if(!available.has(id))throw Error('Unknown release capability: '+id);
  if(changes.some(e=>e.capabilityId===id&&e.type===type&&e.title===title))throw Error('Repeated release change: '+id);
  changes.push({id:'REL-'+tag.replace(/[^A-Za-z0-9]+/g,'-').toUpperCase()+'-'+String(changes.length+1).padStart(2,'0'),date:publishedAt.slice(0,10),type,stage:'release',capabilityId:id,title,releaseTag:tag});
 }
 const ids=[...new Set(changes.map(e=>e.capabilityId))];
 history.releases.push({tag,publishedAt,url,summary:r.name||tag,capabilityIds:ids});
 history.events.push(...changes);
 history.releases.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
 return true;
}
function main(){
 const eventFile=process.argv[2],file=process.argv[3]||path.resolve(__dirname,'../docs/data/product-history.json');
 if(!eventFile)throw Error('Usage: node scripts/sync-release-history.js <GitHub-event.json> [history-file]');
 const history=JSON.parse(fs.readFileSync(file,'utf8')),event=JSON.parse(fs.readFileSync(eventFile,'utf8'));
 if(synchronize(history,event)){fs.writeFileSync(file,JSON.stringify(history,null,2)+'\n');console.log('Recorded release '+event.release.tag_name);}
 else console.log('Release already recorded');
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={synchronize};
