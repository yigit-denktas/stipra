/* Safe, deliberately restricted SVG input. DOM parsing + element/attribute allowlists,
 * reconstruction from typed values (never echo source XML). MIT. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StipraSVG = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const TAGS = new Set(['svg', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path']);
  const ATTRS = new Set(['width','height','viewBox','preserveAspectRatio','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','opacity','fill-opacity','stroke-opacity','transform','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','points']);
  const NUMERIC = new Set(['x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','stroke-width','opacity','fill-opacity','stroke-opacity']);
  const COLORS = /^(?:#[0-9a-f]{3,8}|none|black|white|red|green|blue|transparent)$/i;
  const TRANSFORM = /^(?:\s*(?:translate|scale|rotate|matrix|skewX|skewY)\s*\(\s*[-+0-9.,eE\s]+\)\s*)+$/;
  const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  const esc = s => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function fail(message) { throw new Error('svg: ' + message); }
  function countable(v, key, allowZero=true) {
    if (!NUMBER.test(v.trim())) fail(key + ': expected finite numeric SVG pixels');
    const n = Number(v);
    if (!Number.isFinite(n) || Math.abs(n) > 20000 || (!allowZero && n<=0)) fail(key + ': value out of bounds');
    return String(n);
  }
  function dimension(s, name) {
    if (typeof s !== 'string') fail(name + ': required pixel dimension');
    return Number(countable(s.replace(/px$/, ''), name, false));
  }
  function parse(source, DOMParserCtor) {
    if (typeof source !== 'string' || source.length > 2*1024*1024) fail('source must be UTF-8 text under 2 MiB');
    // No DTD, entity declarations, processing instructions, comments or CDATA are allowed.
    // Rejection is defense in depth; the allowlisted DOM reconstruction is the security boundary.
    if (/<!|<\?/.test(source.replace(/^\s*<\?xml\s+version=["']1\.0["']\s+encoding=["']UTF-8["']\s*\?>/i, '')))
      fail('DTD, entities, processing instructions, comments and CDATA are unsupported');
    const Parser = DOMParserCtor || (typeof DOMParser === 'function' ? DOMParser : null);
    if (!Parser) fail('XML parser unavailable');
    let parsingError = null;
    const parser = new Parser({errorHandler: {warning: ()=>{}, error: x => {parsingError=String(x);}, fatalError: x => {parsingError=String(x);}}});
    const doc = parser.parseFromString(source, 'image/svg+xml');
    if (parsingError || !doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length)
      fail('malformed XML' + (parsingError ? ': ' + parsingError : ''));
    const rootEl = doc.documentElement;
    if (rootEl.localName !== 'svg' || (rootEl.namespaceURI && rootEl.namespaceURI !== NS))
      fail('root must be an SVG element in the SVG namespace');
    let nodes = 0;
    function serialize(node, depth) {
      if (++nodes > 4096 || depth > 32) fail('element/depth budget exceeded');
      const name = node.localName;
      if (!TAGS.has(name) || node.prefix) fail('unsupported element <' + node.nodeName + '> (no scripts, fonts, filters, images, links or foreignObject)');
      if (node.namespaceURI && node.namespaceURI !== NS) fail('foreign namespace rejected');
      const attrs = [];
      for (let i=0;i<node.attributes.length;i++) {
        const a=node.attributes.item(i), key=a.name, val=a.value.trim();
        if (key==='xmlns' && depth===0 && val===NS) continue;
        if (!ATTRS.has(key) || a.prefix || (a.namespaceURI && a.namespaceURI !== null))
          fail('unsupported attribute ' + key + ' on <' + name + '>');
        if (depth!==0 && ['width','height','viewBox','preserveAspectRatio'].includes(key)) fail(key + ' is root-only');
        let safe=val;
        if (NUMERIC.has(key)) safe=countable(val,key);
        else if (['width','height'].includes(key)) safe=countable(val.replace(/px$/,''),key,false);
        else if (key==='viewBox' || key==='points') {
          if (!/^[-+\deE.\s,]+$/.test(val)) fail(key + ': invalid coordinate list');
          const nums=val.trim().split(/[\s,]+/).filter(Boolean);
          if ((key==='viewBox' && nums.length!==4) || (key==='points' && (nums.length<4 || nums.length%2!==0 || nums.length>4096)))
            fail(key + ': invalid numeric component count');
          safe=nums.map(x=>countable(x,key)).join(' ');
        } else if (key==='d') {
          if (!/^[MmLlHhVvCcSsQqTtAaZz\d\s,+.eE-]+$/.test(val) || val.length>200000) fail('unsupported path commands');
          safe=val;
        } else if (key==='transform') {
          if (!TRANSFORM.test(val)) fail('unsupported transform syntax');
        } else if (['fill','stroke'].includes(key)) {
          if (!COLORS.test(val)) fail('color must be literal hex or simple named color');
        } else if (key==='preserveAspectRatio') {
          if (!/^(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?)$/.test(val)) fail('unsupported preserveAspectRatio');
        } else if (key==='fill-rule') {
          if (!['evenodd','nonzero'].includes(val)) fail('unsupported fill-rule');
        } else if (key==='stroke-linecap') {
          if (!['butt','round','square'].includes(val)) fail('unsupported linecap');
        } else if (key==='stroke-linejoin') {
          if (!['miter','round','bevel'].includes(val)) fail('unsupported linejoin');
        }
        if (['opacity','fill-opacity','stroke-opacity'].includes(key) && (Number(safe)<0 || Number(safe)>1))
          fail(key + ': expected value 0..1');
        if (['r','rx','ry','stroke-width'].includes(key) && Number(safe)<0) fail(key + ': expected nonnegative value');
        attrs.push([key,safe]);
      }
      const attrString=attrs.map(([k,v])=>' '+k+'="'+esc(v)+'"').join('');
      let children='';
      for(let n=node.firstChild;n;n=n.nextSibling) {
        if(n.nodeType===1) children+=serialize(n,depth+1);
        else if(n.nodeType===3 && !n.nodeValue.trim()) continue;
        else fail('text, entities and non-element nodes are unsupported');
      }
      return '<'+name+attrString+'>'+children+'</'+name+'>';
    }
    const width=dimension(rootEl.getAttribute('width'), 'width'), height=dimension(rootEl.getAttribute('height'),'height');
    if (!Number.isInteger(width) || !Number.isInteger(height)) fail('root dimensions must be integer pixels');
    if (width*height>24000000) fail('pixel budget exceeded');
    const viewBoxValue=rootEl.getAttribute('viewBox');
    if (viewBoxValue) {
      const parts=viewBoxValue.trim().split(/[\s,]+/).map(Number);
      if(parts.length!==4 || parts.some(n=>!Number.isFinite(n)) || parts[2]<=0 || parts[3]<=0)
        fail('viewBox width and height must be positive');
    }
    const inner=serialize(rootEl,0);
    return {format:'svg', width, height, viewBox:viewBoxValue||`0 0 ${width} ${height}`,
      hasAlpha:true, safeMarkup:inner.replace(/^<svg/, '<svg xmlns="'+NS+'"'),
      warnings:['Safe SVG subset only: text, fonts, filters, external assets, embedded images and CSS are rejected.']};
  }
  return {parse};
});
