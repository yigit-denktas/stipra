'use strict';
// Same index is used by human search and release/capability projections.
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root.document,root.STIPRA_ROADMAP_INDEX||[]);
})(typeof window!=='undefined'?window:null,function(){
 function search(index,query){
  const words=String(query).normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if(!words.length)return [];
  return index.filter(item=>{const haystack=String(item.text).normalize('NFKC').toLowerCase();return words.every(word=>haystack.includes(word));});
 }
 function mount(doc,index){
  const field=doc.getElementById('r-query'),panel=doc.getElementById('r-results'),list=doc.getElementById('r-result-list'),count=doc.getElementById('r-result-count'),form=doc.querySelector('.r-search');
  if(!field||!panel||!list||!count)return;
  function update(){
   const q=field.value.trim(),matches=search(index,q);panel.hidden=!q;list.replaceChildren();if(!q)return;
   count.textContent=matches.length+' '+(matches.length===1?'result':'results')+' for “'+q+'”';
   const frag=doc.createDocumentFragment();
   for(const item of matches.slice(0,80)){
    const li=doc.createElement('li'),a=doc.createElement('a'),type=doc.createElement('small');
    a.href=item.href;a.textContent=item.label;type.textContent=item.kind;li.append(a,type);frag.append(li);
   }list.append(frag);
   if(matches.length>80){const li=doc.createElement('li');li.textContent='Showing first 80 matches. Refine your search.';list.append(li);}
  }
  field.addEventListener('input',update);
  form?.addEventListener('submit',e=>e.preventDefault());
  form?.addEventListener('reset',()=>{field.value='';update();});
  doc.addEventListener('click',e=>{
   const a=e.target.closest('a[href^="#"]');if(!a)return;
   const target=doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
   if(!target)return;for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  });
  if(doc.defaultView?.location?.search){const q=new URLSearchParams(doc.defaultView.location.search).get('q');if(q){field.value=q;update();}}
 }
 return {search,mount};
});
