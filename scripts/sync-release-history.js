#!/usr/bin/env node
'use strict';
/* A release is published only by GitHub's release.published event, not by
 * closing an issue or merging a PR. Updater is idempotent and append-only. */
const fs=require('node:fs'),path=require('node:path');
function synchronize(history,event){
 if(event.action!=='published'||!event.release)throw Error('Requires release.published event');
 const r=event.release,tag=r.tag_name,publishedAt=r.published_at,url=r.html_url;
 if(!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(tag))throw Error('Release tag must be semver');
 if(!publishedAt||!/^\d{4}-\d\d-\d\dT/.test(publishedAt)||!/^https:\/\/github\.com\//.test(url))throw Error('Published release metadata missing');
 const existing=history.releases.find(x=>x.tag===tag);
 if(existing){if(existing.publishedAt!==publishedAt||existing.url!==url)throw Error('Existing release would change: '+tag);return false;}
 const available=new Set(history.capabilities.map(c=>c.id));
 const raw=r.body||'';
 const declared=raw.match(/^Capabilities\s*:\s*([^\n\r]+)/im);
 let ids=declared?[...new Set((declared[1].match(/[A-Z]{2,4}-\d\d/g)||[]))]:[];
 if(declared&&ids.length===0)throw Error('Capabilities line has no known ID');
 const bad=ids.filter(x=>!available.has(x));if(bad.length)throw Error('Unknown release capability: '+bad.join(', '));
 if(!declared){const issues=new Set([...raw.matchAll(/(?:^|\s)#(\d+)\b/g)].map(m=>Number(m[1])));ids=history.capabilities.filter(c=>c.issues.some(n=>issues.has(n))).map(c=>c.id);}
 history.releases.push({tag,publishedAt,url,summary:r.name||tag,capabilityIds:ids});
 history.releases.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
 history.asOf=publishedAt.slice(0,10);
 return true;
}
function main(){
 const eventFile=process.argv[2],historyFile=process.argv[3]||path.resolve(__dirname,'../docs/data/product-history.json');
 if(!eventFile)throw Error('Usage: node scripts/sync-release-history.js <GitHub release event JSON> [history-file]');
 const event=JSON.parse(fs.readFileSync(eventFile,'utf8'));
 const history=JSON.parse(fs.readFileSync(historyFile,'utf8'));
 if(synchronize(history,event)){fs.writeFileSync(historyFile,JSON.stringify(history,null,2)+'\n');process.stdout.write('Recorded published release '+event.release.tag_name+'\n');}
 else process.stdout.write('Published release already recorded\n');
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={synchronize};
