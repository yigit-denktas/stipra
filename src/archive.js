'use strict';
const JSZip=require('jszip');
/** Opens a bounded non-ZIP64 archive after checking original names, duplicates and inflated sizes. */
async function openArchive(input){
  const bytes=Buffer.from(input);if(bytes.length>64*1024*1024||bytes.length<22)throw Error('Archive size limit');
  let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
  if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw Error('Unsupported archive directory');
  const count=bytes.readUInt16LE(end+10),offset=bytes.readUInt32LE(end+16),size=bytes.readUInt32LE(end+12);
  if(!count||count>256||offset+size!==end||bytes.readUInt16LE(end+8)!==count)throw Error('Archive entry limit or ZIP64');
  let at=offset,total=0;const sizes=new Map(),checksums=new Map();
  for(let i=0;i<count;i++){
    if(at+46>end||bytes.readUInt32LE(at)!==0x02014b50)throw Error('Invalid central directory');
    const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),length=bytes.readUInt32LE(at+24),n=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32);
    if(flags&1||![0,8].includes(method)||at+46+n+extra+comment>end)throw Error('Unsupported encrypted/compressed archive');
    const name=bytes.subarray(at+46,at+46+n).toString('utf8');
    if(!/^[a-zA-Z0-9_.\/-]+$/.test(name)||name.startsWith('/')||name.split('/').some(x=>x==='..'||x==='.')||name.includes('//')||sizes.has(name))throw Error('Unsafe or repeated archive path');
    total+=length;if(length>64*1024*1024||total>256*1024*1024)throw Error('Inflated archive size limit');
    sizes.set(name,length);checksums.set(name,bytes.readUInt32LE(at+16));at+=46+n+extra+comment;
  }
  if(at!==end)throw Error('Unexpected directory bytes');
  const zip=await JSZip.loadAsync(bytes);
  if(Object.keys(zip.files).some(name=>!sizes.has(name)||zip.files[name].unsafeOriginalName&&zip.files[name].unsafeOriginalName!==name))throw Error('Archive names changed during decoding');
  return {names:[...sizes.keys()],async read(name,limit=64*1024*1024){
    const expected=sizes.get(name),file=zip.file(name);if(expected===undefined||!file||expected>limit)throw Error('Missing or oversized archive entry '+name);
    return new Promise((resolve,reject)=>{
      const chunks=[];let length=0,failed=false;const stream=file.internalStream('uint8array');
      stream.on('data',chunk=>{if(failed)return;length+=chunk.length;if(length>expected||length>limit){failed=true;stream.pause();reject(Error('Inflated entry exceeds declared limit'));}else chunks.push(Buffer.from(chunk));});
      stream.on('error',reject);stream.on('end',()=>{if(!failed){if(length!==expected)reject(Error('Truncated archive entry'));else {const data=Buffer.concat(chunks);let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}if(((crc^0xffffffff)>>>0)!==checksums.get(name))reject(Error('Archive checksum mismatch'));else resolve(data);}}});stream.resume();
    });
  }};
}
module.exports={openArchive};
