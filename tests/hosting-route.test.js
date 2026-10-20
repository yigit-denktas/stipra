'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('Stiprā prefix proxy preserves paths and response headers without forwarding credentials',async()=>{
  const {serve}=await import('../ops/stipra-route.mjs');
  const response=await serve(new Request('https://apps.yigitdenktas.com/stipra/guide/?v=2',{
    headers:{cookie:'private',authorization:'private',range:'bytes=0-9'}
  }),async(url,options)=>{
    assert.equal(url,'https://yigitdenktas-apps.pages.dev/stipra/guide/?v=2');
    assert.equal(options.redirect,'manual');
    assert.equal(options.headers.get('cookie'),null);
    assert.equal(options.headers.get('authorization'),null);
    assert.equal(options.headers.get('range'),'bytes=0-9');
    return new Response('studio',{headers:{'content-security-policy':"default-src 'self'"}});
  });
  assert.equal(await response.text(),'studio');
  assert.equal(response.headers.get('content-security-policy'),"default-src 'self'");
});
test('Stiprā route is bounded, read-only, handles redirects and fails visibly',async()=>{
  const {serve}=await import('../ops/stipra-route.mjs');
  const never=()=>{throw Error('must not fetch');};
  for(const path of ['/','/api/count','/stipra-other'])
    assert.equal((await serve(new Request('https://apps.yigitdenktas.com'+path),never)).status,404);
  assert.equal((await serve(new Request('https://other.example/stipra/'),never)).status,404);
  assert.equal((await serve(new Request('https://apps.yigitdenktas.com/stipra/',{method:'POST'}),never)).status,405);
  const bare=await serve(new Request('https://apps.yigitdenktas.com/stipra?q=1'),never);
  assert.equal(bare.headers.get('location'),'https://apps.yigitdenktas.com/stipra/?q=1');
  const redirect=await serve(new Request('https://apps.yigitdenktas.com/stipra/guide'),async()=>
    new Response(null,{status:308,headers:{location:'/stipra/guide/'}}));
  assert.equal(redirect.headers.get('location'),'https://apps.yigitdenktas.com/stipra/guide/');
  assert.equal((await serve(new Request('https://apps.yigitdenktas.com/stipra/'),never)).status,502);
});
