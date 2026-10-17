/* Local-only byte signature and metadata probing. Shared by Node and browser. MIT. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./svg.js'));
  else root.StipraImportProbe=factory(root.StipraSVG);
})(typeof globalThis!=='undefined'?globalThis:this,function(SVG){
  'use strict';
  const MAX_BYTES=16*1024*1024, MAX_PIXELS=24000000, MAX_EDGE=20000;
  const ascii=(b,p,n)=>String.fromCharCode(...b.subarray(p,p+n));
  const be16=(b,p)=>b[p]*256+b[p+1];
  const be32=(b,p)=>((b[p]*0x1000000)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3])>>>0;
  const le32=(b,p)=>((b[p])+(b[p+1]<<8)+(b[p+2]<<16)+(b[p+3]*0x1000000))>>>0;
  function iccInfo(b){
    if(b.length<132||be32(b,0)!==b.length||ascii(b,36,4)!=='acsp')fail('invalid embedded ICC header');
    const count=be32(b,128);
    if(count>4096||132+count*12>b.length)fail('invalid ICC tag table');
    let description=null;
    for(let i=0;i<count;i++){
      const at=132+i*12,offset=be32(b,at+4),size=be32(b,at+8);
      if(offset>b.length||size>b.length-offset)fail('invalid ICC tag bounds');
      if(ascii(b,at,4)!=='desc'||size<12)continue;
      const type=ascii(b,offset,4);
      if(type==='desc'){
        const n=be32(b,offset+8);
        if(n>0&&n<=size-12)description=ascii(b,offset+12,Math.min(n-1,512));
      }else if(type==='mluc'&&size>=28){
        const records=be32(b,offset+8),recordSize=be32(b,offset+12);
        if(records&&recordSize>=12&&16+records*recordSize<=size){
          const n=be32(b,offset+20),start=be32(b,offset+24);
          if(n%2===0&&start<=size&&n<=size-start){
            description='';
            for(let j=0;j<Math.min(n,1024);j+=2)description+=String.fromCharCode(be16(b,offset+start+j));
          }
        }
      }
    }
    return {kind:'embedded-icc',byteLength:b.length,description,
      colorSpace:ascii(b,16,4).trim(),connectionSpace:ascii(b,20,4).trim()};
  }
  const bytes=v=>v instanceof Uint8Array?v:(v instanceof ArrayBuffer?new Uint8Array(v):null);
  function fail(msg){throw Error('import: '+msg);}
  function valid(width,height){
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0||width>MAX_EDGE||height>MAX_EDGE||width*height>MAX_PIXELS)
      fail('dimensions exceed 20,000 px edge / 24,000,000 px area or are invalid');
  }
  function exif(b,p,len){
    if(len>=6&&ascii(b,p,6)==='Exif\0\0'){p+=6;len-=6;}
    if(len<8||p+len>b.length)return null;
    const le=ascii(b,p,2)==='II',big=ascii(b,p,2)==='MM';
    if(!le&&!big)return null;
    const u16=k=>le?b[k]+b[k+1]*256:be16(b,k);
    const u32=k=>le?le32(b,k):be32(b,k);
    if(u16(p+2)!==42)return null;
    const ifd=p+u32(p+4);
    if(ifd<p+8||ifd+2>p+len)return null;
    const count=u16(ifd);
    if(count>256||ifd+2+count*12>p+len)return null;
    for(let i=0;i<count;i++){
      const at=ifd+2+i*12;
      if(u16(at)===274 && u16(at+2)===3 && u32(at+4)===1){
        const orientation=u16(at+8);
        if(orientation>=1&&orientation<=8)return {orientation,orientationByteOffset:at+8,littleEndian:le};
      }
    }
    return null;
  }
  function png(b){
    if(b.length<33||ascii(b,12,4)!=='IHDR'||be32(b,8)!==13)fail('malformed PNG IHDR');
    const width=be32(b,16),height=be32(b,20),colorType=b[25];valid(width,height);
    if(![0,2,3,4,6].includes(colorType)||![1,2,4,8,16].includes(b[24]))fail('unsupported PNG bit depth/color type');
    let p=8,icc=false,transparency=false,ended=false,dpi=null,seenIHDR=false;
    for(let count=0;p+12<=b.length&&count<200000;count++){
      const size=be32(b,p),type=ascii(b,p+4,4);
      if(size>b.length-p-12)fail('malformed PNG chunk length');
      if(!seenIHDR&&type!=='IHDR')fail('PNG first chunk must be IHDR');
      seenIHDR=true;
      if(type==='iCCP')icc=true;
      if(type==='tRNS')transparency=true;
      if(type==='pHYs'&&size===9&&b[p+16]===1){
        const x=be32(b,p+8),y=be32(b,p+12);
        if(x&&y) dpi={x:Math.round(x*0.0254*100)/100,y:Math.round(y*0.0254*100)/100};
      }
      if(type==='IEND'){ended=true;break;}
      p+=size+12;
    }
    if(!ended)fail('PNG missing IEND');
    return {format:'png',width,height,orientation:1,hasAlpha:[4,6].includes(colorType)||transparency,
      profile:{kind:icc?'embedded-icc':'unspecified'},dpi,warnings:[]};
  }
  const SOF=new Set([0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF]);
  function jpeg(b){
    let p=2,width=0,height=0,orientation=1,orientationByteOffset=null,littleEndian=false,segments=0;
    const profiles=new Map();let profileCount=0;
    while(p+4<=b.length&&segments++<100000){
      if(b[p]!==0xFF)fail('invalid JPEG marker');
      while(b[p]===0xFF)p++;
      const marker=b[p++];
      if(marker===0xDA||marker===0xD9)break;
      if(marker===0x01||(marker>=0xD0&&marker<=0xD7))continue;
      if(p+2>b.length)fail('truncated JPEG segment');
      const size=be16(b,p);if(size<2||size>b.length-p)fail('truncated JPEG segment payload');
      const off=p+2,len=size-2;
      if(SOF.has(marker)){
        if(len<6)fail('malformed JPEG SOF');
        height=be16(b,off+1);width=be16(b,off+3);
      } else if(marker===0xE1){
        const tag=exif(b,off,len);
        if(tag){orientation=tag.orientation;orientationByteOffset=tag.orientationByteOffset;littleEndian=tag.littleEndian;}
      } else if(marker===0xE2&&len>=12&&ascii(b,off,12)==='ICC_PROFILE\0'){
        if(len<14)fail('truncated JPEG ICC segment');
        const sequence=b[off+12],total=b[off+13];
        if(!sequence||sequence>total||profiles.has(sequence)||(profileCount&&total!==profileCount))fail('invalid JPEG ICC sequence');
        profileCount=total;profiles.set(sequence,b.subarray(off+14,off+len));
      }
      p+=size;
    }
    if(!width||!height)fail('JPEG missing frame dimensions');
    valid(width,height);
    let profile={kind:'unspecified'};
    if(profileCount){
      if(profiles.size!==profileCount)fail('incomplete JPEG ICC segments');
      const size=[...profiles.values()].reduce((sum,part)=>sum+part.length,0),data=new Uint8Array(size);let at=0;
      for(let i=1;i<=profileCount;i++){data.set(profiles.get(i),at);at+=profiles.get(i).length;}
      profile=iccInfo(data);
    }
    return {format:'jpeg',width,height,orientation,orientationByteOffset,littleEndian,
      hasAlpha:false,profile,dpi:null,warnings:[]};
  }
  function webp(b){
    if(b.length<30||ascii(b,8,4)!=='WEBP')fail('malformed WebP header');
    const total=le32(b,4)+8;
    if(total>b.length||total<30)fail('truncated WebP RIFF');
    let p=12,width=0,height=0,hasAlpha=false,icc=false,orientation=1,orientationByteOffset=null,littleEndian=false,animated=false;
    for(let count=0;p+8<=total&&count<100000;count++){
      const tag=ascii(b,p,4),size=le32(b,p+4),off=p+8;
      if(size>total-off)fail('malformed WebP chunk');
      if(tag==='VP8X'){
        if(size<10)fail('malformed VP8X');
        const flags=b[off];
        icc=Boolean(flags&0x20);hasAlpha=Boolean(flags&0x10);animated=Boolean(flags&0x02);
        width=1+b[off+4]+b[off+5]*256+b[off+6]*65536;
        height=1+b[off+7]+b[off+8]*256+b[off+9]*65536;
      }else if(tag==='VP8 '&&!width){
        if(size<10||b[off+3]!==0x9d||b[off+4]!==0x01||b[off+5]!==0x2a)fail('malformed lossy WebP frame');
        width=be16(Uint8Array.of(b[off+7]&0x3f,b[off+6]),0);
        height=be16(Uint8Array.of(b[off+9]&0x3f,b[off+8]),0);
      }else if(tag==='VP8L'&&!width){
        if(size<5||b[off]!==0x2f)fail('malformed lossless WebP frame');
        const packed=le32(b,off+1);
        width=(packed&0x3fff)+1;height=((packed>>>14)&0x3fff)+1;
        hasAlpha=Boolean((packed>>>28)&1);
      }else if(tag==='ICCP')icc=true;
      else if(tag==='EXIF'){
        const info=exif(b,off,size);
        if(info){orientation=info.orientation;orientationByteOffset=info.orientationByteOffset;littleEndian=info.littleEndian;}
      }
      p=off+size+(size%2);
    }
    if(animated)fail('animated WebP unsupported; export a still frame first');
    if(!width||!height)fail('WebP missing intrinsic dimensions');
    valid(width,height);
    return {format:'webp',width,height,orientation,orientationByteOffset,littleEndian,hasAlpha,
      profile:{kind:icc?'embedded-icc':'unspecified'},dpi:null,warnings:[]};
  }
  function inspect(value, opts={}){
    const b=bytes(value);
    if(!b||b.length<8)fail('expected nonempty image file bytes');
    if(b.length>MAX_BYTES)fail('file size exceeds 16 MiB limit');
    let result,source;
    if(ascii(b,0,8)==='\x89PNG\r\n\x1a\n')result=png(b);
    else if(b[0]===0xff&&b[1]===0xd8)result=jpeg(b);
    else if(ascii(b,0,4)==='RIFF'&&ascii(b,8,4)==='WEBP')result=webp(b);
    else {
      // Text is only considered SVG after strict parsing of a bounded UTF-8 payload.
      let str;
      try {str=new TextDecoder('utf-8',{fatal:true}).decode(b);}
      catch {fail('unknown image signature or invalid UTF-8 SVG');}
      if(/^(?:\ufeff)?\s*<!DOCTYPE\s+svg/i.test(str))fail('svg: DTD and external entities forbidden');
      if(!/^(?:\ufeff)?\s*(?:<\?xml\s|<svg[\s>])/.test(str))fail('unsupported image format (PNG, JPEG, WebP, structured SVG only)');
      const safe=SVG.parse(str.replace(/^\ufeff/,''),opts.DOMParserCtor);
      result={format:'svg',width:safe.width,height:safe.height,orientation:1,hasAlpha:true,
        profile:{kind:'unspecified'},dpi:null,warnings:safe.warnings,safeMarkup:safe.safeMarkup,viewBox:safe.viewBox};
    }
    const rotated=[5,6,7,8].includes(result.orientation);
    const displayWidth=rotated?result.height:result.width,displayHeight=rotated?result.width:result.height;
    valid(displayWidth,displayHeight);
    if(result.profile.kind==='embedded-icc')
      result.warnings.push('Original ICC bytes are retained with the source. The decoder converts into an 8-bit sRGB working preview; this is not a calibrated press proof.');
    return {...result,displayWidth,displayHeight,sourceBytes:b.length,
      layout:{width:displayWidth,height:displayHeight,origin:{x:0,y:0},
        trim:{x:0,y:0,width:displayWidth,height:displayHeight},bleed:{top:0,right:0,bottom:0,left:0},
        note:'Source files do not define production trim; the complete oriented image is the initial trim.'}};
  }
  // Create a decoder copy with neutralized orientation tag; the source remains untouched.
  function orientationNeutralBytes(value, metadata){
    const result=new Uint8Array(value);
    const p=metadata.orientationByteOffset;
    if(metadata.orientation!==1&&Number.isSafeInteger(p)&&p>=0&&p+1<result.length){
      result[p]=metadata.littleEndian?1:0;result[p+1]=metadata.littleEndian?0:1;
    }
    return result;
  }
  return {inspect,orientationNeutralBytes,iccInfo,MAX_BYTES,MAX_PIXELS};
});
