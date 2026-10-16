(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let latest;
  async function decode(bytes,type) {
    const blob=new Blob([bytes],{type});
    // SVG image decode is more interoperable via HTMLImageElement in headless and regular browsers.
    // This blob contains only strictly reconstructed, allowlisted SVG from the import probe.
    if(type!=='image/svg+xml' && typeof createImageBitmap==='function')
      return createImageBitmap(blob,{imageOrientation:'none'});
    // Older browsers and safe SVG: orientation tags are neutralized in temporary bytes.
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(blob),img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Browser decoder rejected this image'));};
      img.src=url;
    });
  }
  function save(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  async function load(file){
    if(!file)return;
    $('error').hidden=true;$('actions').hidden=true;$('status').textContent='Reading local file…';
    try {
      if(file.size>StipraImportProbe.MAX_BYTES)throw Error('16 MiB file limit exceeded');
      const data=new Uint8Array(await file.arrayBuffer());
      $('status').textContent='Validating local image metadata…';
      const info=StipraImportProbe.inspect(data);
      $('status').textContent='Decoding '+info.format.toUpperCase()+' image locally…';
      const prepared=await StipraImport.ingest(data,{
        canvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},
        decode
      },{sourceName:file.name});
      latest=prepared;
      $('result').replaceChildren(prepared.canvas);
      $('report').textContent=JSON.stringify(prepared.metadata,null,2);
      $('actions').hidden=false;
      $('status').textContent=`${prepared.metadata.format.toUpperCase()} · ${prepared.metadata.oriented.width} × ${prepared.metadata.oriented.height} px · alpha: ${prepared.metadata.alpha?'available':'no'} · orientation: ${prepared.metadata.orientation}`;
    } catch(e){
      $('error').textContent=e.message;$('error').hidden=false;
      $('status').textContent='Import rejected (no changes to existing artwork).';
    }
  }
  const drop=$('drop');
  for(const eventName of ['dragenter','dragover']){
    drop.addEventListener(eventName,e=>{e.preventDefault();drop.classList.add('dragging');});
  }
  for(const eventName of ['dragleave','drop']) drop.addEventListener(eventName,e=>{e.preventDefault();drop.classList.remove('dragging');});
  drop.addEventListener('drop',e=>{if(e.dataTransfer.files.length)load(e.dataTransfer.files[0]);});
  $('file').addEventListener('change',e=>load(e.target.files?.[0]));
  $('save').addEventListener('click',()=>{if(latest)latest.canvas.toBlob(blob=>blob&&save(blob,'stipra-normalized.png'),'image/png');});
  $('metadata').addEventListener('click',()=>{if(latest)save(new Blob([JSON.stringify(latest.metadata,null,2)+'\n'],{type:'application/json'}),'stipra-import.json');});
})();
