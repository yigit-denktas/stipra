/* Stipra v1 scene/plate contract. Pure JS: identical API in browsers and Node. MIT. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StipraCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const ID = /^[a-z][a-z0-9_-]{0,63}$/;
  const HEX = /^#[a-f\d]{6}$/i;
  const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  function fail(path, message) { throw new TypeError(`${path}: ${message}`); }
  function object(v, path, fields) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) fail(path, 'expected an object');
    for (const key of Object.keys(v)) if (!fields.includes(key)) fail(`${path}.${key}`, 'unknown field');
    return v;
  }
  function list(v, path, min, max) {
    if (!Array.isArray(v) || v.length < min || v.length > max)
      fail(path, `expected an array with ${min}..${max} entries`);
    return v;
  }
  function text(v, path, max = 180) {
    if (typeof v !== 'string' || !v.trim() || v.length > max) fail(path, `expected nonempty text (max ${max} chars)`);
    return v.trim();
  }
  function id(v, path) { if (typeof v !== 'string' || !ID.test(v)) fail(path, 'expected a lowercase stable id [a-z][a-z0-9_-]* (max 64)'); return v; }
  function number(v, path, min, max, integer = false) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isSafeInteger(v)))
      fail(path, `expected a ${integer ? 'safe integer' : 'finite number'} in ${min}..${max}`);
    return v === 0 ? 0 : v;
  }
  function hex(v, path) { if (typeof v !== 'string' || !HEX.test(v)) fail(path, 'expected #RRGGBB color'); return v.toLowerCase(); }
  function region(v, path) {
    object(v, path, ['x', 'y', 'width', 'height']);
    return {x: number(v.x, `${path}.x`, 0, 20000), y: number(v.y, `${path}.y`, 0, 20000),
      width: number(v.width, `${path}.width`, 0.001, 20000), height: number(v.height, `${path}.height`, 0.001, 20000)};
  }
  function checkRect(r, width, height, path) {
    if (r.x + r.width > width + 1e-8 || r.y + r.height > height + 1e-8)
      fail(path, 'rectangle extends outside the canvas');
  }
  function transform(v, path) {
    if (v === undefined) return {translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0};
    object(v, path, ['translateX', 'translateY', 'scaleX', 'scaleY', 'rotate']);
    return {translateX: number(v.translateX ?? 0, `${path}.translateX`, -20000, 20000),
      translateY: number(v.translateY ?? 0, `${path}.translateY`, -20000, 20000),
      scaleX: number(v.scaleX ?? 1, `${path}.scaleX`, 0.001, 100),
      scaleY: number(v.scaleY ?? 1, `${path}.scaleY`, 0.001, 100),
      rotate: number(v.rotate ?? 0, `${path}.rotate`, -360, 360)};
  }
  function geometry(v, path) {
    object(v, path, ['kind', 'x', 'y', 'width', 'height', 'radius', 'points']);
    const kind = v.kind;
    if (kind === 'rect') {
      if (own(v, 'radius') || own(v, 'points')) fail(path, 'rect does not accept radius/points');
      return {kind, x: number(v.x, `${path}.x`, -20000, 20000), y: number(v.y, `${path}.y`, -20000, 20000),
        width: number(v.width, `${path}.width`, 0.001, 20000), height: number(v.height, `${path}.height`, 0.001, 20000)};
    }
    if (kind === 'circle') {
      if (own(v, 'width') || own(v, 'height') || own(v, 'points')) fail(path, 'circle does not accept width/height/points');
      return {kind, x: number(v.x, `${path}.x`, -20000, 20000), y: number(v.y, `${path}.y`, -20000, 20000),
        radius: number(v.radius, `${path}.radius`, 0.001, 20000)};
    }
    if (kind === 'polygon') {
      if (['x', 'y', 'width', 'height', 'radius'].some(k => own(v, k))) fail(path, 'polygon accepts only points');
      const points = list(v.points, `${path}.points`, 3, 2048).map((p, i) => {
        list(p, `${path}.points[${i}]`, 2, 2);
        return [number(p[0], `${path}.points[${i}][0]`, -20000, 20000),
          number(p[1], `${path}.points[${i}][1]`, -20000, 20000)];
      });
      return {kind, points};
    }
    fail(`${path}.kind`, 'expected rect, circle, or polygon (image import is planned, not supported here)');
  }
  function unique(items, path) {
    const ids = new Set();
    for (let i = 0; i < items.length; i++) {
      if (ids.has(items[i].id)) fail(`${path}[${i}].id`, `duplicate id '${items[i].id}'`);
      ids.add(items[i].id);
    }
  }
  function validateRecipe(raw) {
    object(raw, 'recipe', ['version', 'canvas', 'substrate', 'inks', 'plates', 'layers', 'seeds', 'provenance']);
    if (raw.version !== VERSION) fail('recipe.version', `expected ${VERSION}; migrations must be explicit`);
    const c = object(raw.canvas, 'recipe.canvas', ['width', 'height', 'dpi', 'units', 'trim', 'bleed']);
    if (c.units !== 'px') fail('recipe.canvas.units', 'expected px (other units not yet implemented)');
    const width = number(c.width, 'recipe.canvas.width', 1, 20000, true);
    const height = number(c.height, 'recipe.canvas.height', 1, 20000, true);
    if (width * height > 100000000) fail('recipe.canvas', 'pixel area exceeds 100,000,000');
    const trim = region(c.trim, 'recipe.canvas.trim');
    checkRect(trim, width, height, 'recipe.canvas.trim');
    const b = object(c.bleed, 'recipe.canvas.bleed', ['top', 'right', 'bottom', 'left']);
    const bleed = {};
    for (const side of ['top', 'right', 'bottom', 'left']) bleed[side] = number(b[side], `recipe.canvas.bleed.${side}`, 0, 20000);
    if (trim.x < bleed.left || trim.y < bleed.top || trim.x + trim.width + bleed.right > width || trim.y + trim.height + bleed.bottom > height)
      fail('recipe.canvas.bleed', 'bleed around trim must fit inside the canvas');
    const canvas = {width, height, dpi: number(c.dpi, 'recipe.canvas.dpi', 72, 2400, true), units: 'px', trim, bleed};
    const paper = object(raw.substrate, 'recipe.substrate', ['name', 'color']);
    const substrate = {name: text(paper.name, 'recipe.substrate.name'), color: hex(paper.color, 'recipe.substrate.color')};
    const inks = list(raw.inks, 'recipe.inks', 1, 16).map((v, i) => {
      const p = `recipe.inks[${i}]`; object(v, p, ['id', 'name', 'color', 'reference']);
      const ink = {id: id(v.id, `${p}.id`), name: text(v.name, `${p}.name`), color: hex(v.color, `${p}.color`)};
      if (v.reference !== undefined) ink.reference = text(v.reference, `${p}.reference`);
      return ink;
    });
    unique(inks, 'recipe.inks');
    const inkIds = new Set(inks.map(i => i.id));
    const plates = list(raw.plates, 'recipe.plates', inks.length, inks.length).map((v, i) => {
      const p = `recipe.plates[${i}]`; object(v, p, ['id', 'inkId', 'role', 'offset', 'screen']);
      const inkId = id(v.inkId, `${p}.inkId`);
      if (!inkIds.has(inkId)) fail(`${p}.inkId`, `unknown ink '${inkId}'`);
      const o = object(v.offset, `${p}.offset`, ['x', 'y']);
      const s = object(v.screen, `${p}.screen`, ['mode']);
      if (s.mode !== 'solid') fail(`${p}.screen.mode`, 'only solid is supported in v1; halftone screening is tracked in issue #5');
      return {id: id(v.id, `${p}.id`), inkId, role: text(v.role, `${p}.role`, 64),
        offset: {x: number(o.x, `${p}.offset.x`, -20000, 20000), y: number(o.y, `${p}.offset.y`, -20000, 20000)},
        screen: {mode: 'solid'}};
    });
    unique(plates, 'recipe.plates');
    const plateIds = new Set(plates.map(p => p.id));
    const mappedInks = plates.map(p => p.inkId);
    if (new Set(mappedInks).size !== inks.length) fail('recipe.plates', 'each ink must map to exactly one distinct plate');
    const layers = list(raw.layers, 'recipe.layers', 0, 5000).map((v, i) => {
      const p = `recipe.layers[${i}]`; object(v, p, ['id', 'plateId', 'geometry', 'coverage', 'transform', 'clip']);
      const plateId = id(v.plateId, `${p}.plateId`);
      if (!plateIds.has(plateId)) fail(`${p}.plateId`, `unknown plate '${plateId}'`);
      const layer = {id: id(v.id, `${p}.id`), plateId, geometry: geometry(v.geometry, `${p}.geometry`),
        coverage: number(v.coverage, `${p}.coverage`, 0, 1), transform: transform(v.transform, `${p}.transform`)};
      if (v.clip !== undefined) layer.clip = region(v.clip, `${p}.clip`);
      return layer;
    });
    unique(layers, 'recipe.layers');
    const s = object(raw.seeds, 'recipe.seeds', ['geometry', 'screen', 'paper', 'debris']);
    const seeds = {};
    for (const system of ['geometry', 'screen', 'paper', 'debris']) seeds[system] = number(s[system], `recipe.seeds.${system}`, 1, 2147483647, true);
    const p = object(raw.provenance, 'recipe.provenance', ['adapter', 'source', 'notes']);
    const provenance = {adapter: text(p.adapter, 'recipe.provenance.adapter'), source: text(p.source, 'recipe.provenance.source', 500)};
    if (p.notes !== undefined) provenance.notes = text(p.notes, 'recipe.provenance.notes', 500);
    return {version: VERSION, canvas, substrate, inks, plates, layers, seeds, provenance};
  }
  function deriveSeed(base, key) {
    let h = (2166136261 ^ base) >>> 0;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0; h ^= h >>> 16;
    return (h % 2147483647) + 1;
  }
  function resolveRecipe(raw) {
    const recipe = validateRecipe(raw);
    const plateMap = new Map(recipe.plates.map(p => [p.id, {...p, ink: recipe.inks.find(i => i.id === p.inkId), layers: []}]));
    for (const l of recipe.layers) {
      const seeds = {};
      for (const system of Object.keys(recipe.seeds)) seeds[system] = deriveSeed(recipe.seeds[system], `${l.plateId}/${l.id}`);
      plateMap.get(l.plateId).layers.push({...l, seeds});
    }
    return {format: 'stipra-scene', version: VERSION, canvas: recipe.canvas, substrate: recipe.substrate,
      plates: recipe.plates.map(p => plateMap.get(p.id)), seeds: recipe.seeds, provenance: recipe.provenance};
  }
  function attr(v) { return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function shape(g) {
    if (g.kind === 'rect') return `<rect x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}"/>`;
    if (g.kind === 'circle') return `<circle cx="${g.x}" cy="${g.y}" r="${g.radius}"/>`;
    return `<polygon points="${g.points.map(p => p.join(',')).join(' ')}"/>`;
  }
  function renderSvg(scene, options = {}) {
    if (!scene || scene.format !== 'stipra-scene' || scene.version !== VERSION) fail('scene', 'expected resolved v1 Stipra scene');
    const plateId = options.plateId;
    if (plateId !== undefined && !scene.plates.some(p => p.id === plateId)) fail('options.plateId', `unknown plate '${plateId}'`);
    const mono = plateId !== undefined;
    const plates = mono ? scene.plates.filter(p => p.id === plateId) : scene.plates;
    const defs = [];
    const draws = plates.map(p => {
      const layers = p.layers.map(l => {
        const t = l.transform;
        const transform = `translate(${t.translateX} ${t.translateY}) rotate(${t.rotate}) scale(${t.scaleX} ${t.scaleY})`;
        let clipping = '';
        if (l.clip) {
          const cid = `clip-${p.id}-${l.id}`;
          defs.push(`<clipPath id="${cid}" clipPathUnits="userSpaceOnUse"><rect x="${l.clip.x}" y="${l.clip.y}" width="${l.clip.width}" height="${l.clip.height}"/></clipPath>`);
          clipping = ` clip-path="url(#${cid})"`;
        }
        return `<g transform="${transform}"${clipping} fill-opacity="${l.coverage}">${shape(l.geometry)}</g>`;
      }).join('');
      const color = mono ? '#000000' : p.ink.color;
      return `<g data-plate="${p.id}" fill="${color}" transform="translate(${p.offset.x} ${p.offset.y})"${mono ? '' : ' style="mix-blend-mode:multiply"'}>${layers}</g>`;
    }).join('');
    const c = scene.canvas;
    const title = mono ? `Stipra monochrome plate ${plateId}` : 'Stipra composite';
    const paper = mono ? '#ffffff' : scene.substrate.color;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}" viewBox="0 0 ${c.width} ${c.height}"><title>${attr(title)}</title><desc>${attr('Uncalibrated preview; fixed-origin geometry with independent ink plates.')}</desc>${defs.length ? `<defs>${defs.join('')}</defs>` : ''}<rect width="${c.width}" height="${c.height}" fill="${paper}"/>${draws}</svg>`;
  }
  function canonicalRecipe(raw) { return JSON.stringify(validateRecipe(raw), null, 2) + '\n'; }
  return {VERSION, validateRecipe, resolveRecipe, deriveSeed, canonicalRecipe, renderSvg};
});
