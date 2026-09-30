/* ================================================================
   MISSION: PARV · station software
   You don't need to edit this file. Everything personal is in config.js.
   ================================================================ */
(() => {
'use strict';

/* ---------------- config ---------------- */
const C = (typeof CONFIG !== 'undefined') ? CONFIG : {};
const NAME = C.commanderName || 'Commander';
const HER = C.yourName || 'CAPCOM';
const UP = s => String(s).toUpperCase();
const [DY, DM, DD] = (C.askedOutDate || '2025-01-23').split('-').map(Number);
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MM = String(DM).padStart(2, '0'), DDs = String(DD).padStart(2, '0');
const EXP = `${MM}-${DDs}`;
const DATE_LONG = `${MONL[DM - 1]} ${DD}, ${DY}`;
const FREQ_TARGET = Math.round(parseFloat(`${DM}.${DDs}`) * 100) / 100;
const SONG = Object.assign({ title: 'Our song', youtubeId: '', startSeconds: 0 }, C.song || {});
const PH = C.photos || {};
const LET = C.letters || {};

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rand = (a, b) => a + Math.random() * (b - a);
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------------- photos ---------------- */
function pget(k) { const p = PH[k]; if (!p) return { src: '', caption: '' }; return typeof p === 'string' ? { src: p, caption: '' } : { src: p.src || '', caption: p.caption || '' }; }
function missingHTML(src, label) { return `<div class="ph-missing"><span>📷</span><b>${esc(label)}</b><small>add <code>${esc(src || 'a photo')}</code></small></div>`; }
window.__imgFail = img => { img.outerHTML = missingHTML(img.getAttribute('src'), img.dataset.label); };
function img(p, label) {
  if (!p || !p.src) return missingHTML('', label);
  return `<img class="ph" src="${esc(p.src)}" alt="${esc(label)}" data-label="${esc(label)}" onerror="__imgFail(this)" draggable="false">`;
}
function polaroid(p, label, r = 0, w) {
  return `<figure class="polaroid" style="--r:${r}deg;${w ? `--w:${w};` : ''}"><div class="pol-img">${img(p, label)}</div><figcaption>${esc(p.caption || '')}</figcaption></figure>`;
}
function letter(k) { const l = LET[k]; if (!l) return { title: '', text: '' }; return typeof l === 'string' ? { title: '', text: l } : { title: l.title || '', text: l.text || '' }; }

/* ---------------- sound (all synthesized) ---------------- */
const Snd = {
  ctx: null, on: true, master: null, noiseBuf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    this.ctx = new A();
    this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 1 : 0; this.master.connect(this.ctx.destination);
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b; return this.ctx;
  },
  toggle() { this.on = !this.on; if (this.master) this.master.gain.value = this.on ? 1 : 0; return this.on; },
  tone(f, d = .08, type = 'sine', v = .05, delay = 0, f2) {
    const a = this.ctx; if (!a) return; const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + .05);
  },
  noise(d = .2, v = .1, freq = 1200, delay = 0, type = 'bandpass', f2) {
    const a = this.ctx; if (!a) return; const t = a.currentTime + delay;
    const s = a.createBufferSource(); s.buffer = this.noiseBuf; const bq = a.createBiquadFilter(); bq.type = type; bq.frequency.setValueAtTime(freq, t);
    if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t + d);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(bq); bq.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + d + .05);
  },
  cont(kind, o = {}) {
    const a = this.ctx; if (!a) return { set() {}, stop() {} };
    const g = a.createGain(); g.gain.value = 0; let src;
    if (kind === 'noise') { src = a.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true; const bq = a.createBiquadFilter(); bq.type = o.type || 'bandpass'; bq.frequency.value = o.freq || 1500; bq.Q.value = o.q || .7; src.connect(bq); bq.connect(g); }
    else { src = a.createOscillator(); src.type = o.type || 'sine'; src.frequency.value = o.freq || 440; src.connect(g); }
    g.connect(this.master); src.start();
    let dead = false;
    return {
      set: v => { if (!dead) g.gain.setTargetAtTime(v, a.currentTime, .05); },
      freq: f => { if (src.frequency) src.frequency.setTargetAtTime(f, a.currentTime, .05); },
      stop: (f = .3) => { if (dead) return; dead = true; g.gain.setTargetAtTime(0, a.currentTime, f / 3); setTimeout(() => { try { src.stop(); } catch (e) {} }, f * 1000 + 300); }
    };
  },
  tick() { this.tone(2600, .015, 'square', .012); },
  click() { this.tone(1800, .03, 'square', .02); },
  beep() { this.tone(880, .09, 'sine', .06); },
  ok() { this.tone(660, .08, 'sine', .06); this.tone(990, .12, 'sine', .06, .09); },
  bad() { this.tone(220, .18, 'square', .045); this.tone(170, .25, 'square', .045, .18); },
  success() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .25, 'triangle', .07, i * .11)); },
  radio() { this.noise(.12, .05, 2600); this.tone(1400, .04, 'square', .015, .1); },
  whoosh() { this.noise(.9, .05, 300, 0, 'bandpass', 1400); },
  clunk() { this.tone(140, .14, 'square', .07); this.noise(.1, .08, 800); },
  thud() { this.tone(90, .35, 'sine', .3, 0, 45); this.noise(.2, .12, 400, 0, 'lowpass'); },
  scream() { this.tone(1100, .8, 'sawtooth', .12, 0, 160); this.tone(1400, .6, 'square', .06, .02, 300); this.noise(.6, .25, 3000); },
  powerDown() { this.tone(440, 1.3, 'sawtooth', .05, 0, 40); },
  powerUp() { this.tone(60, 1, 'sawtooth', .04, 0, 480); this.tone(880, .1, 'sine', .05, 1); },
  hum: null,
  startHum() { if (this.hum || !this.ctx) return; const a = this.cont('tone', { freq: 55 }), b = this.cont('noise', { type: 'lowpass', freq: 240 }); a.set(.012); b.set(.03); this.hum = [a, b]; },
  stopHum() { if (this.hum) { this.hum.forEach(x => x.stop(1)); this.hum = null; } },
  pad: null,
  startPad() { if (this.pad || !this.ctx) return; this.pad = [220, 277.18, 329.63, 440].map((f, i) => { const c = this.cont('tone', { freq: f }); c.set(i === 3 ? .004 : .009); return c; }); },
  stopPad() { if (this.pad) { this.pad.forEach(x => x.stop(1.5)); this.pad = null; } }
};

/* ---------------- procedural Earth ---------------- */
const Earth = (() => {
  const TW = 512, TH = 256;
  let R, G, B, CL, LI, ready = false;
  const renders = {}, views = [];
  let rot = .62, last = 0;
  function noiseFn(seed) {
    const r = mulberry32(seed), N = 256, v = new Float32Array(N * N);
    for (let i = 0; i < v.length; i++) v[i] = r();
    return (x, y, px) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const X0 = ((x0 % px) + px) % px, X1 = (X0 + 1) % px, Y0 = ((y0 % N) + N) % N, Y1 = (Y0 + 1) % N;
      const a = v[Y0 * N + X0], b = v[Y0 * N + X1], c = v[Y1 * N + X0], d = v[Y1 * N + X1];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }
  function fbm(n, u, v, base, oct) { let s = 0, amp = .5, f = base, norm = 0; for (let o = 0; o < oct; o++) { s += amp * n(u * f, v * f * .5, f); norm += amp; amp *= .5; f *= 2; } return s / norm; }
  function init() {
    if (ready) return;
    const nL = noiseFn(11), nC = noiseFn(29), nD = noiseFn(47), r = mulberry32(5);
    R = new Uint8ClampedArray(TW * TH); G = new Uint8ClampedArray(TW * TH); B = new Uint8ClampedArray(TW * TH);
    CL = new Float32Array(TW * TH); LI = new Float32Array(TW * TH);
    for (let y = 0; y < TH; y++) {
      const lat = (.5 - (y + .5) / TH) * 180, al = Math.abs(lat);
      for (let x = 0; x < TW; x++) {
        const i = y * TW + x, u = x / TW, v = y / TH;
        const hgt = fbm(nL, u, v, 3, 6) - (al > 60 ? (al - 60) * .002 : 0);
        const land = hgt > .505;
        const ice = al > 74 + (hgt - .5) * 30;
        let cr, cg, cb;
        if (ice) { cr = 232; cg = 238; cb = 245; }
        else if (land) {
          const t = clamp((hgt - .505) / .16, 0, 1);
          const dry = fbm(nD, u, v, 4, 3);
          if (al < 32 && dry > .56) { cr = 196; cg = 170; cb = 112; }
          else { cr = lerp(54, 150, t); cg = lerp(112, 128, t); cb = lerp(56, 82, t); }
        } else {
          const t = clamp((.505 - hgt) / .2, 0, 1);
          cr = lerp(30, 8, t); cg = lerp(112, 40, t); cb = lerp(168, 98, t);
        }
        R[i] = cr; G[i] = cg; B[i] = cb;
        const c = fbm(nC, u, v, 5, 5);
        CL[i] = smooth(.52, .7, c) * .9;
        LI[i] = (land && !ice && al < 60 && r() < .07) ? .5 + r() * .5 : 0;
      }
    }
    ready = true;
  }
  function prep(S) {
    const cv = document.createElement('canvas'); cv.width = cv.height = S; const ctx = cv.getContext('2d');
    const out = document.createElement('canvas'); out.width = out.height = S; const octx = out.getContext('2d');
    const imgd = ctx.createImageData(S, S);
    const tilt = .38, ct = Math.cos(tilt), st = Math.sin(tilt), sc = .86;
    let L = [-.55, .38, .74]; const ln = Math.hypot(...L); L = L.map(x => x / ln);
    const I = [], U = [], V = [], D = [], Z = [], AL = [];
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const x = ((px + .5) / S * 2 - 1) / sc, y = ((py + .5) / S * 2 - 1) / sc, r2 = x * x + y * y;
      const edge = (1 - Math.sqrt(r2)) * S * sc / 2 + .5; if (edge <= 0) continue;
      const z = Math.sqrt(Math.max(0, 1 - r2)), xr = x * ct - y * st, yr = x * st + y * ct;
      const lat = Math.asin(clamp(-yr, -1, 1)), lon = Math.atan2(xr, z);
      I.push((py * S + px) * 4); U.push((lon / (2 * Math.PI) + .5) * TW); V.push(clamp(Math.floor((.5 - lat / Math.PI) * TH), 0, TH - 1));
      D.push(x * L[0] - y * L[1] + z * L[2]); Z.push(z); AL.push(Math.min(1, edge) * 255);
    }
    return renders[S] = { cv, ctx, out, octx, imgd, I: Int32Array.from(I), U: Float32Array.from(U), V: Int32Array.from(V), D: Float32Array.from(D), Z: Float32Array.from(Z), AL: Uint8ClampedArray.from(AL), sc };
  }
  function draw(S) {
    init(); const P = renders[S] || prep(S), d = P.imgd.data;
    const sh = rot * TW, csh = rot * 1.25 * TW;
    for (let k = 0; k < P.I.length; k++) {
      let tx = (P.U[k] + sh) % TW; tx = (tx + TW) % TW | 0;
      let cx = (P.U[k] + csh) % TW; cx = (cx + TW) % TW | 0;
      const row = P.V[k] * TW, ti = row + tx, ci = row + cx;
      let r = R[ti], g = G[ti], b = B[ti]; const ca = CL[ci];
      r += (250 - r) * ca; g += (252 - g) * ca; b += (255 - b) * ca;
      const df = P.D[k], day = clamp(df * 1.25 + .12, 0, 1), lit = .05 + .95 * day;
      r *= lit; g *= lit; b *= lit;
      const night = clamp(-df * 3, 0, 1) * (1 - ca * .8), city = LI[ti] * night;
      r += city * 255; g += city * 190; b += city * 110;
      const rim = Math.pow(1 - P.Z[k], 2.5);
      r += rim * 70 * day; g += rim * 130 * day; b += rim * (230 * day + 30);
      const i = P.I[k]; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = P.AL[k];
    }
    P.ctx.putImageData(P.imgd, 0, 0);
    const o = P.octx; o.clearRect(0, 0, S, S);
    const rr = S / 2 * P.sc, gr = o.createRadialGradient(S / 2, S / 2, rr * .96, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(120,190,255,.55)'); gr.addColorStop(.35, 'rgba(90,160,255,.18)'); gr.addColorStop(1, 'rgba(60,120,255,0)');
    o.fillStyle = gr; o.fillRect(0, 0, S, S);
    o.drawImage(P.cv, 0, 0);
    return P.out;
  }
  return {
    init,
    add(cv, S, when) { cv.width = cv.height = S; views.push({ cv, ctx: cv.getContext('2d'), S, when }); },
    remove(cv) { const i = views.findIndex(v => v.cv === cv); if (i >= 0) views.splice(i, 1); },
    tick(t) {
      if (t - last < 40) return; const dt = Math.min(.2, (t - last) / 1000); last = t; rot += dt * .004;
      const act = views.filter(v => v.cv.isConnected && v.when());
      if (!act.length) return; const cache = {};
      for (const v of act) { const src = cache[v.S] || (cache[v.S] = draw(v.S)); v.ctx.clearRect(0, 0, v.S, v.S); v.ctx.drawImage(src, 0, 0); }
    }
  };
})();

/* ---------------- starfields ---------------- */
const starCanvases = [];
function stars(cv, n = 420, seed = 5) {
  if (!starCanvases.includes(cv)) starCanvases.push(cv);
  cv._n = n; cv._seed = seed;
  const w = cv.clientWidth || innerWidth, hh = cv.clientHeight || innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = hh * dpr; const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hh);
  const r = mulberry32(seed);
  const g = x.createLinearGradient(0, hh * .1, w, hh * .8);
  g.addColorStop(0, 'rgba(120,140,255,0)'); g.addColorStop(.5, 'rgba(160,120,230,.08)'); g.addColorStop(1, 'rgba(120,140,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, hh);
  for (let i = 0; i < n; i++) {
    const sx = r() * w, sy = r() * hh, s = Math.pow(r(), 3) * 1.8 + .25, a = .35 + r() * .65, c = r();
    x.fillStyle = c < .08 ? `rgba(255,215,170,${a})` : c < .18 ? `rgba(175,205,255,${a})` : `rgba(255,255,255,${a})`;
    x.beginPath(); x.arc(sx, sy, s, 0, 7); x.fill();
  }
}

/* ---------------- state & loop ---------------- */
const state = { scene: 'boot', idx: 0, visited: new Set(), done: {}, locked: false, hrShown: 72, hrSpike: 0, metStart: 0, redeemed: new Set(), letterOpen: false, briefing: false, finaleSeen: false, mouse: { x: innerWidth / 2, y: innerHeight / 2 } };
const loops = new Set();
let conLoops = [];
let lastT = performance.now();
function frame(t) {
  const dt = Math.min(.1, (t - lastT) / 1000); lastT = t;
  loops.forEach(f => f(dt, t));
  conLoops.slice().forEach(f => f(dt, t));
  Earth.tick(t);
  requestAnimationFrame(frame);
}
function show(scene) { $$('.scene').forEach(s => s.classList.toggle('active', s.id === 'scene-' + scene)); state.scene = scene; }
function toast(msg, ms = 2800) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }
function showEvent(id, big, small = '', ms = 1900) { const e = $('#' + id); e.innerHTML = `${esc(big)}${small ? `<small>${esc(small)}</small>` : ''}`; e.classList.add('show'); clearTimeout(e._h); if (ms) e._h = setTimeout(() => e.classList.remove('show'), ms); }
function hearts(container, x, y, n = 14, set = ['💗', '💖', '💕', '❤️', '💋']) {
  for (let i = 0; i < n; i++) {
    const s = h(`<span class="fheart">${set[i % set.length]}</span>`);
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', rand(-160, 160) + 'px'); s.style.setProperty('--dr', rand(-60, 60) + 'deg');
    s.style.animationDelay = (i * 40) + 'ms'; container.append(s); setTimeout(() => s.remove(), 2600);
  }
}
async function typeInto(el, text, speed = 18, skip = () => false, sound = false) {
  el.textContent = '';
  for (let i = 0; i < text.length; i++) {
    if (skip()) { el.textContent = text; return; }
    el.textContent += text[i];
    if (sound && i % 3 === 0 && text[i] !== ' ') Snd.tick();
    await sleep(speed);
  }
}

/* ---------------- CAPCOM comms ---------------- */
const Comms = {
  q: [], busy: false, skip: false,
  cur: null,
  say(text, tag) {
    if (tag === 'visit') { this.q = this.q.filter(m => m.tag !== 'visit'); if (this.cur && this.cur.tag === 'visit') this.skip = true; }
    this.q.push({ text, tag }); if (!this.busy) this.next();
  },
  async next() {
    const box = $('#comms'), txt = $('#comms-text');
    const item = this.q.shift(); this.cur = item || null;
    if (item == null) { this.busy = false; box.classList.remove('show'); return; }
    const m = item.text;
    this.busy = true; this.skip = false;
    $('#comms-who').textContent = `CAPCOM · ${UP(HER)}`;
    box.classList.add('show'); Snd.radio();
    await typeInto(txt, m, 20, () => this.skip);
    this.skip = false;
    const wait = 2400 + m.length * 32; let w = 0;
    while (w < wait && !this.skip) { await sleep(100); w += 100; }
    this.next();
  }
};
const say = (t, tag) => Comms.say(t, tag);

/* ---------------- patch & ISS art ---------------- */
let uid = 0;
function patchSVG() {
  const id = 'pc' + (++uid);
  return `<svg viewBox="0 0 100 100" class="badge-patch" aria-hidden="true"><defs><path id="${id}" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"/></defs>
  <circle cx="50" cy="50" r="48" fill="#0d2a52" stroke="#fff" stroke-width="2.5"/><circle cx="50" cy="50" r="29" fill="#15457f"/>
  <text font-family="Space Mono,monospace" font-size="8" font-weight="700" fill="#fff" letter-spacing="1.2"><textPath href="#${id}">MISSION ${esc(UP(NAME))} · EXP ${EXP} ·</textPath></text>
  <circle cx="38" cy="38" r="1.2" fill="#fff"/><circle cx="64" cy="42" r="1" fill="#fff"/><circle cx="60" cy="30" r="1.3" fill="#fff"/>
  <path d="M50 27 C56 34 58 42 58 51 L42 51 C42 42 44 34 50 27Z" fill="#fff"/><circle cx="50" cy="40" r="3" fill="#15457f"/>
  <path d="M42 47 L37 55 L42 53Z M58 47 L63 55 L58 53Z" fill="#ff79b4"/>
  <path d="M50 71 C43 65 44 59 47.5 59 C49 59 50 60.5 50 60.5 C50 60.5 51 59 52.5 59 C56 59 57 65 50 71Z" fill="#ff79b4"/></svg>`;
}
function issSVG(k) {
  const pid = 'sp' + k + (++uid), gid = 'mg' + k + uid;
  let arr = '';
  for (const x of [-410, -330, 270, 350]) {
    arr += `<line x1="${x + 30}" y1="-235" x2="${x + 30}" y2="115" stroke="#6d7887" stroke-width="3"/><rect x="${x}" y="-235" width="60" height="158" fill="url(#${pid})" stroke="#5e4a2a"/><rect x="${x}" y="-43" width="60" height="158" fill="url(#${pid})" stroke="#5e4a2a"/>`;
  }
  let zz = 'M-440 -68'; for (let x = -440, up = true; x <= 440; x += 16, up = !up) zz += ` L${x} ${up ? -52 : -68}`;
  return `<svg viewBox="-460 -250 920 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
  <pattern id="${pid}" width="10" height="14" patternUnits="userSpaceOnUse"><rect width="10" height="14" fill="#4a3212"/><rect x=".8" y=".8" width="8.4" height="12.4" fill="#b37a2c"/></pattern>
  <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafbfc"/><stop offset=".55" stop-color="#d9dfe6"/><stop offset="1" stop-color="#9aa6b2"/></linearGradient></defs>
  ${arr}
  <rect x="-440" y="-68" width="880" height="16" fill="#aab4be" stroke="#6d7887"/><path d="${zz}" stroke="#6d7887" fill="none"/>
  <rect x="-232" y="-52" width="24" height="104" fill="#f1f4f7" stroke="#aab4bf"/><rect x="208" y="-52" width="24" height="104" fill="#f1f4f7" stroke="#aab4bf"/>
  <rect x="-34" y="-62" width="68" height="50" fill="url(#${gid})" stroke="#8a96a4"/>
  <rect x="-190" y="-30" width="380" height="58" rx="29" fill="url(#${gid})" stroke="#8a96a4"/>
  <rect x="-110" y="-29" width="3" height="56" fill="#b0bac5"/><rect x="107" y="-29" width="3" height="56" fill="#b0bac5"/>
  <circle r="40" fill="url(#${gid})" stroke="#8a96a4" stroke-width="2"/><circle r="27" fill="#c3ccd6" stroke="#8a96a4"/><circle r="16" fill="#2b3440"/><circle r="9" fill="#fff"/><path d="M-9 0H9M0 -9V9" stroke="#111" stroke-width="2.5"/>
  </svg>`;
}
function cupolaSVG() {
  const cx = 100, cy = 100, R = 98, P = (r, deg) => { const a = deg * Math.PI / 180; return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`; };
  let d = 'M' + [0, 1, 2, 3, 4, 5].map(i => P(R, i * 60 - 90)).join('L') + 'Z';
  d += `M${cx - 36},${cy} a36,36 0 1,0 72,0 a36,36 0 1,0 -72,0Z`;
  for (let i = 0; i < 6; i++) { const a1 = i * 60 - 90 + 8, a2 = i * 60 - 30 - 8; d += `M${P(44, a1)}L${P(80, a1)}L${P(80, a2)}L${P(44, a2)}Z`; }
  let bolts = ''; for (let i = 0; i < 18; i++) bolts += `<circle cx="${P(90, i * 20 - 90).split(',')[0]}" cy="${P(90, i * 20 - 90).split(',')[1]}" r="1.4" fill="#7b8795"/>`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="${d}" fill="#bcc5cf" fill-rule="evenodd" stroke="#7b8795" stroke-width="2"/>${bolts}</svg>`;
}

/* =================================================================
   1. BOOT
   ================================================================= */
async function typeLine(T, text, cls = '', speed = 14) { const d = document.createElement('div'); if (cls) d.className = cls; T.append(d); for (const ch of text) { d.textContent += ch; await sleep(speed); } return d; }
async function dots(d, n = 12, ok = ' OK') { for (let i = 0; i < n; i++) { d.textContent += '.'; await sleep(40); } if (ok) { const s = document.createElement('span'); s.className = 'ok'; s.textContent = ok; d.append(s); } }
async function boot() {
  const T = $('#term');
  await sleep(500);
  await typeLine(T, '> ISS CREW TERMINAL  ·  v4.2.0', 'dim');
  let d = await typeLine(T, '> Establishing uplink to station '); await dots(d);
  d = await typeLine(T, '> Loading crew manifest '); await dots(d);
  await typeLine(T, '> 1 new commander assignment pending', 'warn');
  await typeLine(T, '> AUTHENTICATION REQUIRED', 'pink');
  T.append(h(`<div class="prompt-row"><span>CALLSIGN:</span><input id="callsign" maxlength="18" autocomplete="off" spellcheck="false" aria-label="Callsign"></div>`));
  const hint = h(`<div class="dim" style="font-size:12px">type your name and press ENTER</div>`); T.append(hint);
  const inp = $('#callsign'); inp.focus();
  document.addEventListener('pointerdown', () => { if (state.scene === 'boot' && inp.isConnected && !inp.disabled) setTimeout(() => inp.focus(), 0); });
  inp.addEventListener('keydown', async e => {
    Snd.init();
    if (e.key !== 'Enter') { Snd.click(); return; }
    const v = inp.value.trim(); if (!v || inp.disabled) return;
    inp.disabled = true; hint.remove(); Snd.beep();
    d = await typeLine(T, '> Verifying biometrics '); await dots(d, 10, '');
    if (v.toLowerCase() === NAME.toLowerCase()) await typeLine(T, `> IDENTITY CONFIRMED: COMMANDER ${UP(NAME)}`, 'ok');
    else {
      await typeLine(T, `> Callsign "${UP(v)}" not on manifest…`, 'warn');
      await typeLine(T, '> Running facial recognition… cute face detected. Override accepted.', 'pink');
      await typeLine(T, `> IDENTITY CONFIRMED: COMMANDER ${UP(NAME)}`, 'ok');
    }
    Snd.ok(); await sleep(900);
    T.style.opacity = 0; await sleep(600); T.style.display = 'none';
    $('#badge-slot').innerHTML = badgeHTML();
    $('#badge-stage').classList.add('show'); Snd.success();
  });
  $('#to-launch').addEventListener('click', () => { Snd.init(); launch(); });
}
function badgeHTML() {
  return `<div class="badge"><div class="badge-top"><span>INTERNATIONAL SPACE STATION</span><span>CREW ID</span></div>
  <div class="badge-body"><div class="badge-photo">${img(pget('commanderBadge'), 'His photo')}</div>
  <div class="badge-info"><div class="role">Commander</div><h2>${esc(UP(NAME))}</h2>
  <dl><dt>EXPEDITION</dt><dd>${EXP}</dd><dt>CALLSIGN</dt><dd>${esc(UP(NAME))}-1</dd><dt>CLEARANCE</dt><dd>LEVEL ♥</dd><dt>CO-PILOT</dt><dd>${esc(UP(HER))}</dd></dl></div></div>
  <div class="badge-bar"></div>${patchSVG()}<div class="badge-holo"></div></div>`;
}

/* =================================================================
   2. LAUNCH
   ================================================================= */
let rumble = null;
async function launch() {
  show('launch'); stars($('#launch-stars'), 500, 11);
  const ul = $('#gonogo ul'), cd = $('#countdown'), tc = $('#t-clock');
  const items = [['BOOSTER', 'GO'], ['GUIDANCE', 'GO'], ['TELEMETRY', 'GO'], ['RANGE SAFETY', 'GO'], ['WEATHER', 'GO'], ['SNACKS ON BOARD', 'GO'], [`CAPCOM · ${UP(HER)}`, 'GO ♥']];
  await sleep(600);
  for (const [k, v] of items) {
    const li = h(`<li><span>${esc(k)}</span><b class="${v.includes('♥') ? 'pinkt' : ''}">${v}</b></li>`); ul.append(li);
    await sleep(30); li.classList.add('in'); Snd.tone(v.includes('♥') ? 1320 : 990, .07, 'sine', .05); await sleep(430);
  }
  await sleep(300);
  for (let t = 10; t >= 4; t--) { cd.textContent = `T-${t}`; tc.textContent = `-00:${String(t).padStart(2, '0')}`; Snd.tone(t === 4 ? 880 : 660, .08, 'square', .03); await sleep(720); }
  cd.textContent = 'T-3 · HOLD'; tc.textContent = '-00:03';
  showEvent('launch-event', 'MAIN ENGINE START', 'commander: hold the throttle to 100%', 0);
  const thr = $('#throttle'); thr.disabled = false; thr.querySelector('.lbl').textContent = 'Hold to throttle up';
  $('#throttle-hint').textContent = 'click & hold · or hold SPACE';
  await throttleHold();
  thr.disabled = true; thr.querySelector('.lbl').textContent = 'Throttle 100%'; $('#throttle-hint').innerHTML = '&nbsp;';
  $('#launch-event').classList.remove('show');
  for (let t = 3; t >= 1; t--) { cd.textContent = `T-${t}`; tc.textContent = `-00:0${t}`; Snd.tone(880, .1, 'square', .04); await sleep(480); }
  cd.textContent = 'LIFTOFF'; Snd.tone(1320, .3, 'triangle', .06); setTimeout(() => $('#launch-cta').classList.add('gone'), 1200);
  liftoff();
}
function throttleHold() {
  return new Promise(res => {
    let v = 0, held = false; const btn = $('#throttle'), prog = btn.querySelector('.prog'), wrap = $('#rocket-wrap');
    const down = e => { if (e.type === 'keydown') { if (e.code !== 'Space') return; e.preventDefault(); } held = true; Snd.init(); if (!rumble) rumble = Snd.cont('noise', { type: 'lowpass', freq: 110 }); };
    const up = e => { if (e.type === 'keyup' && e.code !== 'Space') return; held = false; };
    btn.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const f = dt => {
      v = clamp(v + (held ? dt / 1.6 : -dt * .7), 0, 1);
      prog.style.width = (v * 100) + '%'; $('#t-thr').textContent = Math.round(v * 100) + '%';
      $('#flame').classList.toggle('on', v > .12); wrap.classList.toggle('shake-soft', v > .35);
      if (rumble) rumble.set(v * .35);
      if (v >= 1) { loops.delete(f); btn.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); res(); }
    };
    loops.add(f);
  });
}
function liftoff() {
  const wrap = $('#rocket-wrap'), ground = $('#ground'), sky = $('#sky'), st = $('#launch-stars'), sm = $('#smoke');
  sm.width = innerWidth; sm.height = innerHeight; const sx = sm.getContext('2d'); const parts = [];
  wrap.classList.remove('shake-soft'); wrap.classList.add('shake'); if (rumble) rumble.set(.5);
  const events = [[.3, 'LIFTOFF', `${UP(NAME)}-1 has cleared the tower`], [3.3, 'MAX-Q', 'maximum aerodynamic pressure'], [5.2, 'STAGE SEPARATION', 'booster away · second engine start'], [7.8, 'ENGINE CUTOFF', 'coasting to orbit'], [9.4, 'ORBIT ACHIEVED', '408 km · 27,580 km/h']];
  let t = 0, ei = 0;
  const f = dt => {
    t += dt;
    const rise = t < 2.5 ? Math.pow(t / 2.5, 2) * 24 : 24;
    wrap.style.transform = `translateY(${-rise}vh)`;
    const gy = t > 1.2 ? Math.pow(t - 1.2, 2) * 9 : 0; ground.style.transform = `translateY(${gy}vh)`;
    const gv = t > 1.2 ? 2 * (t - 1.2) * 9 * innerHeight / 100 : 0;
    sky.style.opacity = 1 - smooth(2, 7, t); st.style.opacity = smooth(3, 7.5, t);
    $('#t-alt').textContent = (408 * smooth(0, 10, t)).toFixed(1) + ' km';
    $('#t-vel').textContent = Math.round(27580 * smooth(0, 9.6, t)).toLocaleString() + ' km/h';
    $('#t-stage').textContent = t < 5.2 ? '1 · BOOSTER' : t < 7.8 ? '2 · UPPER' : 'COAST';
    $('#t-clock').textContent = '+00:' + String(Math.floor(t)).padStart(2, '0');
    if (ei < events.length && t >= events[ei][0]) {
      const [, big, small] = events[ei]; showEvent('launch-event', big, small, 1800);
      if (big === 'STAGE SEPARATION') { $('#flash').style.opacity = .7; setTimeout(() => $('#flash').style.opacity = 0, 120); $('#r-booster').classList.add('sep'); $('#flame').classList.remove('on'); Snd.thud(); setTimeout(() => $('#flame2').classList.add('on'), 600); }
      if (big === 'ENGINE CUTOFF') { $('#flame2').classList.remove('on'); wrap.classList.remove('shake'); if (rumble) { rumble.stop(1.5); rumble = null; } }
      if (big === 'ORBIT ACHIEVED') Snd.success();
      ei++;
    }
    if (t < 4.5) {
      const r = wrap.getBoundingClientRect(), nx = r.left + r.width / 2, ny = r.top + r.height * .98;
      for (let i = 0; i < 4; i++) parts.push({ x: nx + rand(-12, 12), y: ny, vx: rand(-160, 160), vy: rand(40, 120), r: rand(10, 22), a: .55 });
    }
    sx.clearRect(0, 0, sm.width, sm.height);
    for (const p of parts) { p.x += p.vx * dt; p.y += (p.vy + gv) * dt; p.vx *= .985; p.r += dt * 38; p.a -= dt * .16; if (p.a > 0) { sx.fillStyle = `rgba(235,235,240,${p.a})`; sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 7); sx.fill(); } }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].a <= 0 || parts[i].y > innerHeight + 100) parts.splice(i, 1);
    if (t >= 11.6) { loops.delete(f); dock(); }
  };
  loops.add(f);
}

/* =================================================================
   3. DOCKING
   ================================================================= */
function dock() {
  show('dock'); stars($('#dock-stars'), 520, 21);
  Earth.add($('#dock-earth'), 560, () => state.scene === 'dock');
  const wrapI = $('#iss-wrap'); wrapI.innerHTML = issSVG('d');
  const keys = { up: 0, down: 0, left: 0, right: 0 };
  const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  const kd = e => { const k = map[e.code]; if (k) { keys[k] = 1; e.preventDefault(); } };
  const ku = e => { const k = map[e.code]; if (k) keys[k] = 0; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  $$('.pad-keys button').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { keys[k] = 1; b.classList.add('on'); b.setPointerCapture(e.pointerId); });
    const off = () => { keys[k] = 0; b.classList.remove('on'); };
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off);
  });
  let auto = false;
  $('#autodock').addEventListener('click', () => { auto = true; $('#autodock').hidden = true; showEvent('dock-event', 'AUTOPILOT ENGAGED', "relax, commander. I've got you ♥", 2200); Snd.ok(); });
  const off = { x: (Math.random() < .5 ? -1 : 1) * innerWidth * .16, y: -innerHeight * .12 }, vel = { x: 0, y: 0 }, drift = { x: 0, y: 0 };
  let range = 90, rate = 0, t = 0, done = false, thrust = null;
  Snd.init(); thrust = Snd.cont('noise', { type: 'bandpass', freq: 900, q: 1.5 });
  showEvent('dock-event', 'RENDEZVOUS', 'International Space Station · 90 m', 2400);
  const TX = 460, TY = 250;
  const f = dt => {
    t += dt;
    let ix = keys.right - keys.left, iy = keys.down - keys.up;
    if (auto) { ix = clamp(off.x / 50, -1, 1); iy = clamp(off.y / 50, -1, 1); }
    thrust.set((ix || iy) ? .05 : 0);
    drift.x = clamp(drift.x + rand(-1, 1) * dt * 150 - off.x * dt * .15, -32, 32); drift.y = clamp(drift.y + rand(-1, 1) * dt * 150 - off.y * dt * .15, -32, 32);
    vel.x += (drift.x - ix * 300) * dt; vel.y += (drift.y - iy * 300) * dt;
    const damp = Math.pow(.3, dt); vel.x *= damp; vel.y *= damp;
    off.x = clamp(off.x + vel.x * dt, -innerWidth * .3, innerWidth * .3); off.y = clamp(off.y + vel.y * dt, -innerHeight * .26, innerHeight * .26);
    const dist = Math.hypot(off.x, off.y), ok = dist < 55;
    rate = lerp(rate, ok && !done ? 10.5 : 0, Math.min(1, dt * 3)); range = Math.max(0, range - rate * dt);
    const s = .24 + Math.pow(1 - range / 90, 1.7) * 2.3;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    wrapI.style.transform = `translate(${cx - TX + off.x}px, ${cy - TY + off.y}px) scale(${s})`;
    $('#dock-earth').style.transform = `translate(calc(-50% + ${off.x * .15}px), ${off.y * .15}px)`;
    $('#reticle').classList.toggle('ok', ok);
    const tg = $('#tgt'); tg.style.transform = `translate(${cx + off.x}px, ${cy + off.y}px)`; tg.style.opacity = range < 25 ? 0 : .85; $('#tgt-l').textContent = `ISS · ${range.toFixed(0)} m`;
    $('#d-range').textContent = range.toFixed(1) + ' m';
    $('#d-rate').textContent = (-rate / 10).toFixed(2) + ' m/s';
    $('#d-xy').textContent = `${Math.round(off.x / 10)} / ${Math.round(-off.y / 10)}`;
    const stt = $('#d-status'); stt.textContent = done ? 'CAPTURE' : ok ? 'APPROACH · ALIGNED' : 'HOLD · ALIGN TARGET'; stt.className = ok ? 'ok' : 'warn';
    if (!auto && t > 20 && $('#autodock').hidden && !done) $('#autodock').hidden = false;
    if (range <= 0 && !done) {
      done = true; loops.delete(f); thrust.stop(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      finishDock();
    }
  };
  loops.add(f);
}
async function finishDock() {
  Snd.thud(); showEvent('dock-event', 'CONTACT', 'soft capture confirmed', 1300); await sleep(1400);
  Snd.clunk(); showEvent('dock-event', 'HARD CAPTURE', 'hooks closed · docked to the ISS', 1300); await sleep(1400);
  Snd.noise(1.3, .06, 3000, 0, 'highpass'); showEvent('dock-event', 'EQUALIZING PRESSURE', 'opening hatch…', 1400); await sleep(1500);
  enterStation(true);
}

/* =================================================================
   4. STATION
   ================================================================= */
const MISSIONS = {
  m1: { n: 1, mod: 'cupola', title: 'Calibrate the telescope', sys: 'OBSERVATION', letter: 'cupola', label: 'TELESCOPE CONTROL' },
  m2: { n: 2, mod: 'zarya', title: 'Power-down test', sys: 'ELECTRICAL', letter: 'nightOps', label: 'EPS · MAIN BUS' },
  m3: { n: 3, mod: 'destiny', title: 'Plot a course to Toronto', sys: 'NAVIGATION', letter: 'anniversary', label: 'GNC · NAVIGATION' },
  m4: { n: 4, mod: 'zvezda', title: 'Restore communications', sys: 'COMMS', letter: 'song', label: 'COMMS · S-BAND' },
  m5: { n: 5, mod: 'harmony', title: 'Crew addition request', sys: 'CREW', letter: 'crewQuarters', label: 'CREW OPS' },
  m6: { n: 6, mod: 'tranquility', title: 'Oxygen levels critical', sys: 'LIFE SUPPORT', letter: 'lifeSupport', label: 'ECLSS · LIFE SUPPORT' }
};
const MIDS = Object.keys(MISSIONS);
const MODULES = [
  { id: 'unity', name: 'UNITY', short: 'UNITY', sub: 'Node 1 · Crew hub', fact: 'The first US-built module (1998). Its six hatches tie the whole station together.' },
  { id: 'cupola', name: 'CUPOLA', short: 'CUPOLA', sub: 'Observation module', fact: 'Seven windows. At launch its centre window was the largest ever flown in space.', m: 'm1' },
  { id: 'zarya', name: 'ZARYA', short: 'ZARYA', sub: 'Power & propulsion', fact: '"Sunrise" in Russian. The very first piece of the ISS, launched November 1998.', m: 'm2', solar: true },
  { id: 'destiny', name: 'DESTINY', short: 'DESTINY', sub: 'US Laboratory · GNC', fact: "Home of the station's main command and navigation computers since 2001.", m: 'm3' },
  { id: 'zvezda', name: 'ZVEZDA', short: 'ZVEZDA', sub: 'Service module · Comms', fact: '"Star" in Russian. Its arrival in 2000 let the very first crew move in.', m: 'm4', solar: true },
  { id: 'harmony', name: 'HARMONY', short: 'HARMONY', sub: 'Node 2 · Crew quarters', fact: "Holds the crew quarters: each astronaut's phone-booth-sized bedroom.", m: 'm5' },
  { id: 'tranquility', name: 'TRANQUILITY', short: 'TRANQ.', sub: 'Node 3 · Life support', fact: 'Oxygen generation, water recycling and (unofficially) kiss reserves.', m: 'm6' },
  { id: 'quest', name: 'QUEST', short: 'QUEST', sub: 'Joint airlock', fact: 'Where spacewalks begin. The outer hatch opens only when the station is safe.', m: 'airlock', solar: true }
];
const modIndex = id => MODULES.findIndex(m => m.id === id);
const allDone = () => MIDS.every(id => state.done[id]);
const doneCount = () => MIDS.filter(id => state.done[id]).length;

const FLOATS = {
  unity: [{ e: '🧸', t: 'Emergency cuddle unit. Standard issue.' }, { pol: 0 }, { e: '🔧', t: "Torque wrench. Please don't throw it at the crew." }],
  cupola: [{ e: '📷', t: '16 sunrises a day. Plenty to photograph.' }, { e: '🪐', t: 'Souvenir from a previous expedition.' }],
  zarya: [{ e: '🔋', t: 'Spare battery. Fully charged. Unlike you at 3 a.m.' }, { e: '🔦', t: 'A flashlight. Might come in handy in here…' }],
  destiny: [{ e: '🧪', t: "Science. Do not drink." }, { pol: 1 }, { e: '🗺️', t: 'A map of Toronto. Oddly specific.' }],
  zvezda: [{ e: '🎧', t: 'Headset. Tuned to one very specific frequency.' }, { e: '📻', t: 'Backup radio. Only plays one song.' }],
  harmony: [{ e: '🧦', t: 'One sock. The other one is floating somewhere in Zarya.' }, { pol: 2 }, { e: '🪥', t: 'Toothbrush. Velcro-mounted.' }],
  tranquility: [{ e: '🧃', t: 'Green juice pouch. Fresh Kitchen special.' }, { e: '🌱', t: 'Veggie experiment. Thriving.' }],
  quest: [{ e: '🧤', t: 'EVA glove. Size: perfect.' }, { e: '⭐', t: 'A star someone brought inside.' }]
};
const VISIT = {
  cupola: () => 'This is the Cupola: best view in the solar system. The telescope needs manual calibration, Commander. Target coordinates are already loaded.',
  zarya: () => "Zarya's main power bus is overdue for a shutdown test. Follow the procedure exactly… and stay alert in the dark.",
  destiny: () => 'Navigation lives here in Destiny. We need a course plotted to downtown Toronto. I think you remember the way.',
  zvezda: () => "Comms are down in Zvezda. Tune the receiver until you find our frequency. Hint: it's a date you should know.",
  harmony: () => `Crew quarters. There's a crew-addition request on file from ${DATE_LONG}… still waiting on your signature.`,
  tranquility: () => "Tranquility is reporting a life support fault. The oxygen is fine. The other critical reserve is… not.",
  quest: () => allDone() ? 'All six systems green. Suit up, Commander. The outer hatch is ready for you.' : `The Quest airlock stays sealed until all six systems are green. ${6 - doneCount()} to go, Commander.`
};
const DONE_LINES = {
  m1: 'Target acquired. That bench look familiar, Commander?',
  m2: 'Power restored. Your heart rate is still elevated. Sorry. Not sorry.',
  m3: 'Course logged. One year down, and counting.',
  m4: 'Comms restored. Reading you loud and clear, Commander.',
  m5: 'Request approved. Crew roster updated: two aboard.',
  m6: 'Life support nominal. Kiss reserves at 100%.'
};
const NOTES = {
  m1: 'Target locked: a forest bench beside the river, UTM campus. One memory recovered from before either of us said anything.',
  m2: 'Anomaly identified: one (1) co-pilot hiding in the dark. Heart-rate spike logged. Some traditions survive even in orbit.',
  m3: 'Course logged: UTM → Museum of Illusions → Fresh Kitchen + Juice Bar. Our first anniversary, downtown.',
  m4: `Ground uplink restored on ${FREQ_TARGET.toFixed(2)} GHz. Now playing from Earth: ${SONG.title}.`,
  m5: `Crew roster updated: 2 aboard. Request filed ${DATE_LONG}, from your dorm room. Approved immediately.`,
  m6: `Life support nominal. An emergency supply kit has been unlocked. Tap a coupon to redeem it, then show it to ${HER}.`
};
const REWARD_PHOTOS = { m1: [['bench', 'Bench photo', -3]], m2: [['boo', 'Boo photo', 3]], m3: [['museum', 'Museum of Illusions photo', -4], ['freshKitchen', 'Fresh Kitchen photo', 3]], m5: [['dorm', 'Dorm photo', -2]] };

function racks(seed) {
  const r = mulberry32(seed); const L = ['EXPRESS', 'WHC', 'CDRA', 'OGS', 'MSG', 'TEPC', 'HRF', 'CEVIS', 'FIR', 'MELFI', 'WRS', 'ELC', 'PCS', 'KU-BAND', 'GLACIER', 'ACE', 'SSC', 'CWC'];
  const led = () => ['g', 'a', 'b', ''][Math.floor(r() * 4)];
  let s = '';
  for (let i = 0; i < 27; i++) {
    const t = r(); s += '<div class="rk">';
    if (t < .3) s += `<span class="lbl">${L[Math.floor(r() * L.length)]}-${1 + Math.floor(r() * 9)}</span><i class="led ${led()}" style="animation-delay:${(r() * 2).toFixed(2)}s"></i><i class="led ${led()}" style="animation-delay:${(r() * 2).toFixed(2)}s"></i>`;
    else if (t < .47) s += '<div class="vent"></div>';
    else if (t < .62) s += `<span class="lbl">${L[Math.floor(r() * L.length)]}</span><div class="knobs-s"><i></i><i></i><i></i></div>`;
    else if (t < .74) s += '<div class="bag"></div><div class="strap"></div>';
    else if (t < .86) s += '<div class="velcro"></div><div class="velcro"></div><div class="cable"></div>';
    else s += `<span class="lbl">${L[Math.floor(r() * L.length)]}</span><div class="cable"></div>`;
    s += '</div>';
  }
  return s;
}
const porthole = () => '<div class="porthole"><div class="pstars"></div><canvas class="earthc"></canvas></div>';
function termBtn(mid) {
  const M = MISSIONS[mid];
  return `<button class="term-btn" data-open="${mid}"><span class="alert">!</span><div class="scr"><div class="scr-top">M0${M.n} · ${M.sys}</div><div class="scr-title">${M.title}</div><div class="scr-status">● AWAITING COMMANDER</div><div class="scr-go">▶ OPERATE</div></div><div class="term-label"><span>${M.label}</span><i></i></div></button>`;
}
function pieceHTML(m) {
  switch (m.id) {
    case 'unity': return `<div class="board"><div class="board-in"><div class="board-head"><span>STATION STATUS · EXP ${EXP}</span><span id="board-met">MET 00:00:00</span></div><div id="board-rows"></div><div class="board-foot">▸ select a system to float there</div></div></div>
      <div class="locker"><div class="locker-name">CDR ${esc(UP(NAME))}</div><div class="mini-badge">${img(pget('commanderBadge'), 'His photo')}</div><div class="sticky">${esc(C.welcomeNote || '')}</div></div>${porthole()}`;
    case 'cupola': return `<div class="cupola"><div class="cup-bg"></div><canvas class="earthc cup"></canvas>${cupolaSVG()}</div>${termBtn('m1')}`;
    case 'zarya': return `<div class="powerbus"><div>MAIN BUS · 4 CHANNELS</div><div class="cells"><div class="cell"><i style="--c:88%"></i></div><div class="cell"><i style="--c:76%"></i></div><div class="cell"><i style="--c:92%"></i></div><div class="cell"><i style="--c:81%"></i></div></div><div style="margin-top:8px">1A · 1B · 2A · 2B</div></div>${termBtn('m2')}${porthole()}`;
    case 'destiny': return `${porthole()}${termBtn('m3')}<div class="gnc"><canvas class="gnc-c" width="320" height="180"></canvas><div>GROUND TRACK · LIVE</div></div>`;
    case 'zvezda': return `<div class="dish"></div>${termBtn('m4')}${porthole()}`;
    case 'harmony': return `<div class="quarters"><button class="door" data-door="him"><span class="dn">CDR ${esc(UP(NAME))}</span><span class="curtain"></span></button><button class="door her" data-door="her"><span class="dn">${esc(UP(HER))} ♥</span><span class="curtain"></span></button><button class="door vac" data-door="vac"><span class="dn">VACANT</span><span class="curtain"></span></button></div>${termBtn('m5')}`;
    case 'tranquility': return `<div class="tanks"><div class="tank"><div class="tg">3%</div>K₂-A</div><div class="tank"><div class="tg">3%</div>K₂-B</div></div>${termBtn('m6')}`;
    case 'quest': return `<div class="suit">🧑‍🚀</div><div class="hatch"><div class="hl" id="hatch-l">SEALED · 0/6</div><div class="wheel" id="hatch-w"></div></div>
      <button class="term-btn" data-open="airlock" id="airlock-btn"><span class="alert">!</span><div class="scr"><div class="scr-top">EVA · QUEST AIRLOCK</div><div class="scr-title">Final EVA</div><div class="scr-status" id="airlock-st">● LOCKED · SYSTEMS PENDING</div><div class="scr-go">▶ OPERATE</div></div><div class="term-label"><span>AIRLOCK CONTROL</span><i></i></div></button>`;
  }
  return '';
}
function extraHTML(m) {
  if (m.id === 'zarya') return `<div class="glow-note" style="left:6%;top:12%;--r:-8deg">hi cutie 👀</div><div class="glow-note" style="right:9%;top:9%;--r:6deg">you're getting warmer…</div><div class="glow-note" style="left:28%;bottom:9%;--r:-3deg">remember that bench at night?</div><div class="glow-note" style="right:24%;bottom:12%;--r:5deg">don't look behind you</div><div class="lurker" id="lurker">👀</div>`;
  if (m.id === 'tranquility') return '<div class="beacon"></div>';
  return '';
}
let stationBuilt = false;
function buildStation() {
  if (stationBuilt) return; stationBuilt = true;
  const track = $('#track');
  MODULES.forEach((m, i) => {
    const el = h(`<div class="module mod-${m.id}" style="left:${i * 100}vw">
      ${m.solar ? '<div class="solar top"></div><div class="solar bottom"></div>' : ''}
      ${i > 0 ? '<div class="conn l"></div>' : ''}${i < MODULES.length - 1 ? '<div class="conn r"></div>' : ''}
      <div class="hull"><div class="hull-in">
        <div class="racks">${racks(i * 7 + 3)}</div>
        <div class="handrail h1"></div><div class="handrail h2"></div>
        <div class="piece">${pieceHTML(m)}</div>
        ${extraHTML(m)}
        <div class="plate"><b>${m.name}</b> · ${m.sub}<br><small>${m.fact}</small></div>
        <div class="floaters"></div>
      </div></div></div>`);
    track.append(el);
    $$('canvas.earthc', el).forEach(cv => Earth.add(cv, cv.classList.contains('cup') ? 360 : 240, () => state.scene === 'station' && Math.abs(state.idx - i) <= 1));
  });
  // minimap
  $('#minimap').innerHTML = MODULES.map((m, i) => `${i ? '<span class="mm-link"></span>' : ''}<button class="mm ${m.m ? (m.m === 'airlock' ? 'lock' : '') : 'hub'}" data-i="${i}"><span class="mmbox"><i></i></span>${m.short}</button>`).join('');
  $('#minimap').addEventListener('click', e => { const b = e.target.closest('.mm'); if (b) go(+b.dataset.i); });
  // HUD
  $('#hud-face').innerHTML = img(pget('commanderBadge'), 'His photo');
  $('#hud-name').textContent = `CDR ${UP(NAME)} · EXP ${EXP}`;
  // interactions on track
  track.addEventListener('click', e => {
    const t = e.target.closest('[data-open]'); if (t) { openConsole(t.dataset.open); return; }
    const r = e.target.closest('[data-go]'); if (r) { go(+r.dataset.go); return; }
    const d = e.target.closest('[data-door]');
    if (d) {
      Snd.click();
      const msg = { him: 'Your sleeping bag, strapped to the wall. Astronauts sleep standing up.', her: `Reserved for your co-pilot, ${HER}. Knock first. 😌`, vac: 'Vacant. Plenty of room up here.' }[d.dataset.door];
      toast(msg);
    }
  });
  $('#nav-l').onclick = () => go(state.idx - 1);
  $('#nav-r').onclick = () => go(state.idx + 1);
  $('#log-btn').onclick = () => openLog();
  $('#log-close').onclick = () => $('#log').classList.remove('show');
  $('#snd-btn').onclick = () => { Snd.init(); $('#snd-btn').textContent = Snd.toggle() ? '🔊' : '🔇'; };
  $('#comms').onclick = () => { Comms.skip = true; };
  // floaters
  MODULES.forEach((m, i) => { const box = $$('.module')[i].querySelector('.floaters'); (FLOATS[m.id] || []).forEach(it => addFloater(box, m.id, it)); });
  // destiny ground track
  const gc = $('.gnc-c'); const gx = gc.getContext('2d'); let gt = 0;
  loops.add(dt => {
    if (state.scene !== 'station' || MODULES[state.idx].id !== 'destiny') return; gt += dt;
    const w = gc.width, hh = gc.height; gx.fillStyle = '#06101c'; gx.fillRect(0, 0, w, hh);
    gx.strokeStyle = 'rgba(111,243,255,.08)'; for (let x = 0; x < w; x += 20) { gx.beginPath(); gx.moveTo(x, 0); gx.lineTo(x, hh); gx.stroke(); } for (let y = 0; y < hh; y += 20) { gx.beginPath(); gx.moveTo(0, y); gx.lineTo(w, y); gx.stroke(); }
    const Y = (x, k) => hh / 2 - Math.sin((x / w) * Math.PI * 2 + k) * hh * .32;
    for (let k = 0; k < 3; k++) { gx.strokeStyle = `rgba(111,243,255,${.15 + k * .2})`; gx.beginPath(); for (let x = 0; x <= w; x += 4) { const y = Y(x, k * .8); x ? gx.lineTo(x, y) : gx.moveTo(x, y); } gx.stroke(); }
    const px = (gt * 18) % w, py = Y(px, 1.6); gx.fillStyle = '#ff79b4'; gx.beginPath(); gx.arc(px, py, 5, 0, 7); gx.fill();
    gx.fillStyle = 'rgba(255,121,180,.3)'; gx.beginPath(); gx.arc(px, py, 5 + (gt * 12 % 12), 0, 7); gx.fill();
  });
  // HUD clocks
  setInterval(() => {
    if (!state.metStart) return; const s = Math.floor((Date.now() - state.metStart) / 1000);
    const f = n => String(n).padStart(2, '0'); const txt = `${f(Math.floor(s / 3600))}:${f(Math.floor(s / 60) % 60)}:${f(s % 60)}`;
    $('#met').textContent = txt; const bm = $('#board-met'); if (bm) bm.textContent = 'MET ' + txt;
    $('#alt').textContent = (408 + Math.sin(s / 20) * .4).toFixed(1) + ' km';
    $('#vel').textContent = (27580 + Math.round(Math.sin(s / 7) * 6)).toLocaleString() + ' km/h';
    $('#orbit').textContent = 1 + Math.floor(s / 5520);
  }, 1000);
  // heart rate
  loops.add(dt => {
    const base = 72 + doneCount() * 5 + (state.scene === 'finale' ? 20 : 0);
    const target = base + state.hrSpike; state.hrSpike = Math.max(0, state.hrSpike - dt * 6);
    state.hrShown = lerp(state.hrShown, target, Math.min(1, dt * 2));
    const el = $('#hr'); if (el) el.textContent = Math.round(state.hrShown + Math.sin(performance.now() / 700) * 1.2);
  });
  refreshStatus();
}

/* ---------- floaters (zero-g objects) ---------- */
const floaters = [];
function addFloater(box, mod, it, pos) {
  let el, photo = null;
  if (it.pol != null) {
    const arr = PH.floating || []; const p = arr[it.pol]; if (!p) return;
    photo = typeof p === 'string' ? { src: p, caption: '' } : p;
    el = h(`<div class="floater pol"><div class="pol-img">${img(photo, 'Floating photo ' + (it.pol + 1))}</div></div>`);
  } else el = h(`<div class="floater">${it.e}</div>`);
  box.append(el);
  const W = box.clientWidth || innerWidth * .88, H = box.clientHeight || innerHeight * .6;
  const f = { el, box, mod, photo, t: it.t, x: pos ? pos.x : W * rand(.08, .85), y: pos ? pos.y : H * rand(.1, .7), vx: rand(-25, 25), vy: rand(-20, 20), r: rand(-25, 25), vr: rand(-12, 12), drag: false };
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); Snd.init(); el.setPointerCapture(e.pointerId);
    f.drag = true; f.moved = 0; f.br = box.getBoundingClientRect(); f.ox = e.clientX - f.br.left - f.x; f.oy = e.clientY - f.br.top - f.y; f.hist = [[e.clientX, e.clientY, performance.now()]];
  });
  el.addEventListener('pointermove', e => {
    if (!f.drag) return; const nx = e.clientX - f.br.left - f.ox, ny = e.clientY - f.br.top - f.oy;
    f.moved += Math.hypot(nx - f.x, ny - f.y); f.x = nx; f.y = ny; f.hist.push([e.clientX, e.clientY, performance.now()]); if (f.hist.length > 6) f.hist.shift(); place(f);
  });
  const up = e => {
    if (!f.drag) return; f.drag = false; const h0 = f.hist[0], dtm = Math.max(16, performance.now() - h0[2]);
    if (f.moved < 6) {
      if (f.photo) lightbox(f.photo); else if (f.t) toast(f.t);
      f.vx += rand(-40, 40); f.vy += rand(-40, 40); f.vr += rand(-60, 60); Snd.click();
    } else {
      f.vx = clamp((e.clientX - h0[0]) / dtm * 1000, -1500, 1500); f.vy = clamp((e.clientY - h0[1]) / dtm * 1000, -1500, 1500); f.vr = rand(-240, 240);
      if (Math.hypot(f.vx, f.vy) > 300) Snd.noise(.25, .04, 900, 0, 'bandpass', 2400);
    }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  floaters.push(f); place(f); return f;
}
function place(f) { f.el.style.transform = `translate(${f.x}px,${f.y}px) rotate(${f.r}deg)`; }
const boxSize = new Map();
function measureBoxes() { boxSize.clear(); floaters.forEach(f => { f.w = f.el.offsetWidth; f.h = f.el.offsetHeight; }); }
function updateFloaters(dt) {
  const cur = MODULES[state.idx].id;
  for (const f of floaters) {
    if (f.mod !== cur || f.drag) continue;
    let bs = boxSize.get(f.box); if (!bs) { bs = [f.box.clientWidth, f.box.clientHeight]; boxSize.set(f.box, bs); }
    if (!f.w) { f.w = f.el.offsetWidth; f.h = f.el.offsetHeight; }
    const [W, H] = bs;
    f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vr * dt;
    if (f.x < 0) { f.x = 0; f.vx = Math.abs(f.vx) * .75; if (f.vx > 120) Snd.tone(300, .05, 'sine', .03); }
    if (f.x > W - f.w) { f.x = W - f.w; f.vx = -Math.abs(f.vx) * .75; if (-f.vx > 120) Snd.tone(300, .05, 'sine', .03); }
    if (f.y < 0) { f.y = 0; f.vy = Math.abs(f.vy) * .75; }
    if (f.y > H - f.h) { f.y = H - f.h; f.vy = -Math.abs(f.vy) * .75; }
    const sp = Math.hypot(f.vx, f.vy), keep = Math.pow(sp > 60 ? .55 : .97, dt);
    f.vx *= keep; f.vy *= keep; f.vr *= Math.pow(.6, dt);
    if (sp < 10) { f.vx += rand(-1, 1) * 30 * dt; f.vy += rand(-1, 1) * 30 * dt; }
    place(f);
  }
}
function lightbox(p) {
  const lb = $('#lightbox'); $('#lb-inner').innerHTML = polaroid(p, 'Floating photo', -2) + '<div style="font-family:var(--mono);font-size:11px;color:#8fb2c6;letter-spacing:.14em">CLICK ANYWHERE TO LET IT FLOAT AWAY</div>';
  lb.classList.add('show'); lb.onclick = () => lb.classList.remove('show');
}

/* ---------- navigation ---------- */
function go(i, silent) {
  i = clamp(i, 0, MODULES.length - 1);
  if (state.locked || Con.id || state.briefing) return;
  const changed = i !== state.idx; state.idx = i;
  $('#track').style.transform = `translateX(${-i * 100}vw)`;
  $('#station-stars').style.transform = `translateX(${-i * 2}vw)`;
  $('#earth-limb').style.transform = `translateX(${-i * 5}vw)`;
  const m = MODULES[i]; $('#mod-name').textContent = m.name; $('#mod-sub').textContent = m.sub;
  $('#nav-l').disabled = i === 0; $('#nav-r').disabled = i === MODULES.length - 1;
  $$('.mm').forEach((b, k) => b.classList.toggle('cur', k === i));
  if (changed && !silent) { Snd.whoosh(); if (state.visited.size > 1) $('#nav-hint').style.opacity = 0; }
  setTimeout(() => firstVisit(m.id), silent ? 200 : 1100);
}
function firstVisit(id) {
  if (state.visited.has(id) && id !== 'quest') return;
  if (id === 'quest' && state.visited.has('quest') && !allDone()) return;
  state.visited.add(id);
  if (VISIT[id]) say(VISIT[id](), 'visit');
}
function refreshStatus() {
  MIDS.forEach(id => {
    const d = !!state.done[id];
    $$(`.term-btn[data-open="${id}"]`).forEach(b => { b.classList.toggle('done', d); const s = b.querySelector('.scr-status'); if (s) s.textContent = d ? '✓ SYSTEM NOMINAL' : '● AWAITING COMMANDER'; const g = b.querySelector('.scr-go'); if (g) g.textContent = d ? '▶ VIEW DATA PACKET' : '▶ OPERATE'; });
  });
  const rows = $('#board-rows');
  if (rows) rows.innerHTML = MIDS.map(id => { const M = MISSIONS[id], d = state.done[id], mi = modIndex(M.mod); return `<button class="board-row ${d ? 'done' : ''}" data-go="${mi}"><span class="bn">M0${M.n}</span><span class="bt">${M.title}<small>${MODULES[mi].name} · ${M.sys}</small></span><span class="bs">${d ? '✓ NOMINAL' : '● PENDING'}</span></button>`; }).join('')
    + `<button class="board-row ${allDone() ? 'done' : 'lock'}" data-go="${modIndex('quest')}"><span class="bn">EVA</span><span class="bt">Final EVA<small>QUEST · AIRLOCK</small></span><span class="bs">${allDone() ? '✓ READY' : '🔒 LOCKED'}</span></button>`;
  $$('.mm').forEach((b, i) => { const m = MODULES[i]; if (!m.m) return; if (m.m === 'airlock') { b.classList.toggle('lock', !allDone()); b.classList.toggle('done', allDone()); } else b.classList.toggle('done', !!state.done[m.m]); });
  $('#log-count').textContent = `${doneCount()}/6`;
  const hl = $('#hatch-l'); if (hl) { hl.textContent = allDone() ? 'EVA READY' : `SEALED · ${doneCount()}/6`; hl.classList.toggle('ok', allDone()); }
  const ab = $('#airlock-btn'); if (ab) { ab.classList.toggle('done', false); $('#airlock-st').textContent = allDone() ? '● READY · AWAITING COMMANDER' : `● LOCKED · ${doneCount()}/6 SYSTEMS`; }
  const tq = $('.mod-tranquility'); if (tq) { tq.classList.toggle('ok', !!state.done.m6); $$('.tg', tq).forEach(g => g.textContent = state.done.m6 ? '100%' : '3%'); }
}

function enterStation(iris) {
  buildStation();
  const st = $('#scene-station');
  st.classList.add('active');
  requestAnimationFrame(() => { stars($('#station-stars'), 480, 3); measureBoxes(); });
  if (iris) {
    st.classList.add('iris-open'); st.style.zIndex = 5;
    setTimeout(() => { st.classList.remove('iris-open'); st.style.zIndex = ''; show('station'); }, 1750);
  } else show('station');
  state.scene = 'station'; state.metStart = Date.now();
  Snd.startHum();
  go(0, true); state.visited.add('unity');
  loops.add(dt => { if (state.scene === 'station') updateFloaters(dt); });
  setTimeout(showBriefing, iris ? 1900 : 300);
}
function showBriefing() {
  state.briefing = true;
  const card = $('#brief-card');
  card.innerHTML = `<span class="lbl-s">MISSION BRIEFING · EXPEDITION ${EXP}</span><h2>Welcome aboard, Commander ${esc(NAME)}.</h2>
   <p class="brief-txt">The International Space Station is yours. Six station systems need a commander's hands. Each system you restore recovers a <b>data packet from Earth</b>. Restore all six and the <b>Quest airlock</b> will open for one final spacewalk.</p>
   <div class="brief-list">${MIDS.map(id => { const M = MISSIONS[id]; return `<div><b>M0${M.n}</b><span>${M.title}<br><small style="color:#6f8799">${MODULES[modIndex(M.mod)].name} · ${M.sys}</small></span></div>`; }).join('')}</div>
   <div class="controls"><span><kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> float between modules</span><span>click glowing consoles to operate</span><span>grab &amp; throw anything floating</span><span><kbd>Esc</kbd> exit a console</span></div>
   <button class="btn pink big" id="brief-go">Accept mission</button>`;
  $('#brief').classList.add('show'); Snd.beep();
  $('#brief-go').onclick = () => {
    $('#brief').classList.remove('show'); state.briefing = false; Snd.ok();
    say(`Welcome aboard, Commander ${NAME}. I'm your CAPCOM for this expedition. ♥`);
    say('Quick tip: everything up here floats. Grab something and throw it.');
    say('First stop: the Cupola, one module to your right. Press → when you’re ready.');
  };
}

/* ---------- mission log ---------- */
function openLog() {
  const list = $('#log-list');
  list.innerHTML = MIDS.map(id => { const M = MISSIONS[id], d = state.done[id], L = letter(M.letter);
    return `<div class="log-item ${d ? 'done' : ''}"><div class="log-top"><span>M0${M.n} · ${MODULES[modIndex(M.mod)].name}</span><b>${d ? '✓ COMPLETE' : '● PENDING'}</b></div><div class="log-title">${M.title}</div>
    <div class="log-btns"><button class="btn" data-lgo="${modIndex(M.mod)}">Float there</button>${d ? `<button class="btn pink" data-lletter="${M.letter}">📩 ${esc(L.title || 'Transmission')}</button>` : ''}</div></div>`; }).join('')
    + (state.finaleSeen ? `<div class="log-item done"><div class="log-top"><span>EVA · QUEST</span><b>✓ COMPLETE</b></div><div class="log-title">Final transmission</div><div class="log-btns"><button class="btn pink" data-lletter="final">📩 Read again</button><button class="btn" data-lpass="1">🎫 Boarding pass</button></div></div>` : '');
  list.onclick = e => {
    const g = e.target.closest('[data-lgo]'); if (g) { $('#log').classList.remove('show'); go(+g.dataset.lgo); }
    const l = e.target.closest('[data-lletter]'); if (l) openLetter(l.dataset.lletter);
    if (e.target.closest('[data-lpass]')) showPass();
  };
  $('#log').classList.add('show'); Snd.click();
}

/* ---------- letters ---------- */
function openLetter(key) {
  const L = letter(key); state.letterOpen = true;
  const env = $('#envelope'); env.className = 'envelope';
  const n = MIDS.findIndex(id => MISSIONS[id].letter === key) + 1;
  $('#paper-tag').textContent = key === 'final' ? 'FINAL TRANSMISSION' : `TRANSMISSION 0${n}`;
  $('#paper-meta').textContent = `FROM ${UP(HER)} · TO CDR ${UP(NAME)}`;
  $('#paper-title').textContent = L.title; $('#paper-body').textContent = L.text; $('#paper-sign').textContent = `— ${HER} ♥`;
  $('#env-hint').style.visibility = 'visible';
  $('#letter').classList.add('show'); Snd.tone(1200, .1, 'sine', .05); Snd.tone(1600, .14, 'sine', .05, .1);
}
function closeLetter() { $('#letter').classList.remove('show'); state.letterOpen = false; }

/* ---------- console framework ---------- */
const Con = { id: null, cleanups: [] };
function api(id) { return { loop: f => conLoops.push(f), cleanup: f => Con.cleanups.push(f), complete: () => completeMission(id), close: closeConsole }; }
function runCleanups() { Con.cleanups.forEach(f => { try { f(); } catch (e) { console.warn(e); } }); Con.cleanups = []; conLoops = []; }
function openConsole(id) {
  if (state.locked || Con.id || state.briefing) return;
  Snd.init(); Con.id = id;
  const M = MISSIONS[id];
  $('#c-tag').textContent = id === 'airlock' ? 'EVA' : `M0${M.n}`;
  $('#c-title').textContent = id === 'airlock' ? 'EVA preparation' : M.title;
  $('#c-mod').textContent = id === 'airlock' ? 'QUEST · AIRLOCK' : `${MODULES[modIndex(M.mod)].name} · ${M.sys}`;
  const body = $('#c-body'); body.innerHTML = '';
  $('#console').classList.add('show'); Snd.beep();
  if (id !== 'airlock' && state.done[id]) showReward(id); else RENDER[id](body, api(id));
}
function closeConsole() {
  if (!Con.id) return; runCleanups();
  $('#console').classList.remove('show'); Con.id = null; Radio.dock(); Snd.click();
}
function completeMission(id) {
  if (state.done[id]) return;
  state.done[id] = true; runCleanups(); refreshStatus(); Snd.success(); state.hrSpike += 14;
  if (Con.id === id) showReward(id);
  say(DONE_LINES[id]);
  if (id === 'm6') { const box = $('.mod-tranquility .floaters'); for (let i = 0; i < 7; i++) addFloater(box, 'tranquility', { e: i % 3 ? '💋' : '💗', t: 'Surplus kiss. Life support is very, very nominal.' }); }
  if (allDone()) setTimeout(() => say(`All six systems are green. Commander ${NAME}, report to the Quest airlock. Something's waiting for you outside.`), 3500);
}
function showReward(id) {
  const M = MISSIONS[id], L = letter(M.letter), body = $('#c-body');
  let photos = (REWARD_PHOTOS[id] || []).map(([k, lab, r]) => polaroid(pget(k), lab, r, REWARD_PHOTOS[id].length > 1 ? '210px' : '250px')).join('');
  let extra = '';
  if (id === 'm4') photos = '<div class="player-slot" id="pslot">Tuning ground transmission…</div>';
  if (id === 'm4') extra = `<a class="btn" style="align-self:flex-start" href="https://www.youtube.com/watch?v=${encodeURIComponent(SONG.youtubeId)}&t=${SONG.startSeconds}s" target="_blank" rel="noopener">Not playing? Open on YouTube ↗</a>`;
  if (id === 'm6') extra = `<div class="lbl-s">Emergency supply kit · ${(C.coupons || []).length} coupons</div><div class="coupons">${(C.coupons || []).map((c, i) => `<button class="coupon ${state.redeemed.has(i) ? 'redeemed' : ''}" data-c="${i}"><span class="ci">${esc(c.icon || '💌')}</span><b>${esc(c.title)}</b><small>${esc(c.note || '')}</small><span class="rd">REDEEMED ✓<small>show this to ${esc(HER)}</small></span></button>`).join('')}</div>`;
  body.innerHTML = `<div class="reward"><div class="rw-head"><div class="rw-check">✓</div><div><small>MISSION 0${M.n} COMPLETE · ${M.sys} NOMINAL</small><h3>Data packet recovered</h3></div></div>
    <div class="rw-body">${photos ? `<div class="rw-photos">${photos}</div>` : ''}<div class="rw-side">${extra}<p class="rw-note">${esc(NOTES[id])}</p>
    <div class="opts"><button class="btn pink" data-letter="${M.letter}">📩 Open transmission</button><button class="btn" data-close="1">Return to station</button></div></div></div></div>`;
  body.querySelector('[data-letter]').onclick = () => openLetter(M.letter);
  body.querySelector('[data-close]').onclick = closeConsole;
  if (id === 'm4') requestAnimationFrame(() => Radio.play($('#pslot')));
  if (id === 'm6') $$('.coupon', body).forEach(c => c.onclick = () => { const i = +c.dataset.c; if (state.redeemed.has(i)) return; state.redeemed.add(i); c.classList.add('redeemed'); Snd.thud(); const r = c.getBoundingClientRect(), br = body.getBoundingClientRect(); hearts(body, r.left - br.left + r.width / 2, r.top - br.top, 8); });
}

/* ---------- radio / YouTube ---------- */
const Radio = {
  el: null, slot: null,
  play(slot) {
    if (!SONG.youtubeId) return;
    if (!this.el) {
      this.el = h(`<div id="radio"><div class="radio-bar"><span>📻 ${esc(SONG.title)} · ground uplink</span><button class="r-stop" title="Stop">■</button></div><iframe src="https://www.youtube.com/embed/${encodeURIComponent(SONG.youtubeId)}?start=${SONG.startSeconds | 0}&autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${esc(SONG.title)}"></iframe></div>`);
      document.body.append(this.el); this.el.querySelector('.r-stop').onclick = () => this.stop();
      if (Snd.hum) Snd.hum.forEach(x => x.set(.004));
    }
    this.attach(slot);
  },
  attach(slot) {
    if (!this.el || !slot) return; this.slot = slot; const r = slot.getBoundingClientRect();
    this.el.classList.remove('mini'); Object.assign(this.el.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', right: 'auto', bottom: 'auto' });
  },
  dock() { if (!this.el) return; this.slot = null; this.el.classList.add('mini'); Object.assign(this.el.style, { left: '', top: '', width: '', height: '', right: '', bottom: '' }); },
  stop() { if (this.el) { this.el.remove(); this.el = null; } }
};

/* ---------- knob control ---------- */
function knob(host, o) {
  host.innerHTML = `<div class="knob"><div class="knob-wrap"><span class="ticks"></span><div class="knob-dial"><i></i></div></div><div class="knob-label">${o.label}</div><div class="knob-val"></div></div>`;
  const dial = host.querySelector('.knob-dial'), val = host.querySelector('.knob-val');
  let v = o.value, lastTick = null, sy = 0, sx = 0, sv = 0, drag = false;
  const set = nv => {
    v = clamp(nv, o.min, o.max);
    dial.style.transform = `rotate(${-135 + 270 * (v - o.min) / (o.max - o.min)}deg)`;
    val.textContent = o.fmt ? o.fmt(v) : Math.round(v);
    const tk = Math.floor(v / (o.tick || (o.max - o.min) / 40)); if (lastTick !== null && tk !== lastTick) Snd.tick(); lastTick = tk;
    o.onChange && o.onChange(v);
  };
  dial.addEventListener('pointerdown', e => { drag = true; sy = e.clientY; sx = e.clientX; sv = v; dial.setPointerCapture(e.pointerId); e.preventDefault(); });
  dial.addEventListener('pointermove', e => { if (drag) set(sv + ((sy - e.clientY) + (e.clientX - sx)) * o.sens); });
  const end = () => drag = false; dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  dial.addEventListener('wheel', e => { e.preventDefault(); set(v - Math.sign(e.deltaY) * (o.wheel || (o.max - o.min) / 50)); }, { passive: false });
  set(v); return { get: () => v, set };
}
function holdBtn(btn, dur, onP, onDone) {
  let v = 0, held = false, fin = false, last = performance.now(); const prog = btn.querySelector('.prog');
  btn.addEventListener('pointerdown', () => { if (!btn.disabled) held = true; });
  const up = () => held = false; window.addEventListener('pointerup', up);
  return { f: () => { const now = performance.now(), dt = Math.min(.2, (now - last) / 1000); last = now; if (fin) return; v = clamp(v + (held ? dt / dur : -dt / dur * 1.5), 0, 1); prog.style.width = v * 100 + '%'; onP && onP(v, held); if (v >= 1) { fin = true; onDone(); } }, cleanup: () => window.removeEventListener('pointerup', up) };
}

/* =================================================================
   MISSIONS
   ================================================================= */
const RENDER = {};

/* ---- M1 · Cupola telescope ---- */
RENDER.m1 = (body, A) => {
  const target = 38 + Math.round(Math.random() * 44);
  body.innerHTML = `<div class="cpad">
    <div class="scope"><canvas id="scope-earth"></canvas><div class="scope-photo" id="scope-photo">${img(pget('bench'), 'Bench photo')}</div><div class="scope-ret" id="scope-ret"></div>
      <div class="scope-read tl">TGT 43.548°N 79.663°W</div><div class="scope-read tr" id="m1-z">ZOOM 1.0×</div><div class="scope-read bl" id="m1-lock">NO LOCK</div><div class="scope-read br">UTM · MISSISSAUGA</div></div>
    <div class="side">
      <div class="lbl-s">Cupola · Earth observation telescope</div>
      <p class="brief-txt">Ground target: a <b>forest bench beside the river</b> on campus. Crank the <b>zoom</b> all the way in, then fine-tune the <b>focus</b> until the image locks.</p>
      <div class="knobs"><div id="k-zoom"></div><div id="k-focus"></div></div>
      <div class="meter">SIGNAL CLARITY<div class="bar"><i id="m1-bar"></i></div></div>
      <div class="kv"><span>AUTOFOCUS</span><b style="color:var(--red)">OFFLINE</b></div>
      <div class="kv"><span>ORBITAL PASS</span><b>SOUTHERN ONTARIO</b></div>
      <div class="status-line" id="m1-status">▸ drag the dials up / down, or scroll on them</div>
    </div></div>`;
  const cv = $('#scope-earth'); Earth.add(cv, 360, () => Con.id === 'm1'); A.cleanup(() => Earth.remove(cv));
  let z = 0, f = 6, lockT = 0, locked = false;
  const upd = () => {
    cv.style.transform = `scale(${1 + Math.pow(z / 100, 2) * 7})`; cv.style.opacity = 1 - smooth(55, 92, z);
    const ph = $('#scope-photo'); ph.style.opacity = smooth(48, 88, z);
    ph.style.filter = `blur(${(Math.abs(f - target) * .4 + (100 - z) * .06).toFixed(1)}px)`; ph.style.transform = `scale(${1.6 - .6 * z / 100})`;
    const cl = smooth(60, 100, z) * (1 - clamp(Math.abs(f - target) / 40, 0, 1));
    $('#m1-bar').style.width = cl * 100 + '%'; $('#m1-z').textContent = 'ZOOM ' + (1 + z / 100 * 49).toFixed(1) + '×';
  };
  knob($('#k-zoom'), { label: 'ZOOM', min: 0, max: 100, value: 0, sens: .45, fmt: v => (1 + v / 100 * 49).toFixed(1) + '×', onChange: v => { z = v; upd(); } });
  knob($('#k-focus'), { label: 'FOCUS', min: 0, max: 100, value: 6, sens: .3, fmt: v => Math.round(v) + '%', onChange: v => { f = v; upd(); } });
  A.loop(dt => {
    if (locked) return;
    const ok = z >= 92 && Math.abs(f - target) <= 3.5;
    if (ok) {
      lockT += dt; $('#m1-lock').textContent = 'LOCKING ' + Math.min(100, Math.round(lockT * 100)) + '%';
      if (lockT >= 1) {
        locked = true; $('#scope-ret').style.setProperty('--rc', 'rgba(89,245,158,.9)'); $('#m1-lock').textContent = 'TARGET LOCKED';
        const s = $('#m1-status'); s.textContent = '✓ TARGET ACQUIRED · recovering data packet…'; s.classList.add('ok'); Snd.ok();
        setTimeout(() => A.complete(), 1600);
      }
    } else { lockT = 0; $('#m1-lock').textContent = z < 92 ? 'NO LOCK · ZOOM IN' : (Math.abs(f - target) < 12 ? 'CLOSE · FINE-TUNE FOCUS' : 'NO LOCK · ADJUST FOCUS'); }
  });
};

/* ---- M2 · Zarya power-down + night ops ---- */
RENDER.m2 = (body, A) => {
  const buses = ['1A', '1B', '2A', '2B'], order = shuffle(buses.slice());
  body.innerHTML = `<div class="cpad"><div class="side" style="justify-content:center">
    <div class="lbl-s">Zarya · Main bus power-down test</div>
    <p class="brief-txt">Standard shutdown test. Open the four main bus breakers <b>in the exact order</b> on the procedure card. One wrong move and the system resets.</p>
    <div class="breakers">${buses.map(b => `<div class="brk" data-b="${b}"><span class="lamp"></span><div class="sw"></div><span>BUS ${b}</span></div>`).join('')}</div>
    <div class="master" id="master"><i></i>MASTER CAUTION</div>
    <div class="status-line" id="m2-status">▸ click a breaker to open it</div></div>
    <div style="width:300px;flex:none;display:flex;flex-direction:column;justify-content:center"><div class="proc"><h5>PROCEDURE ISS-EPS-${MM}${DDs} · POWER-DOWN</h5><ol id="proc">${order.map((b, i) => `<li>${i + 1}. OPEN BUS ${b}</li>`).join('')}</ol><div style="margin-top:8px;font-size:11px;color:#7a7a7a">Crew note: a flashlight is issued automatically. Probably.</div></div></div></div>`;
  let step = 0, busy = false;
  $$('.brk', body).forEach(el => el.addEventListener('click', () => {
    if (busy || el.classList.contains('off')) return;
    if (el.dataset.b === order[step]) {
      el.classList.add('off'); $$('#proc li', body)[step].classList.add('done'); step++; Snd.clunk();
      if (step === 4) { busy = true; const s = $('#m2-status'); s.textContent = 'MAIN BUS OFFLINE · emergency lighting… failed.'; s.style.color = 'var(--red)'; Snd.powerDown(); setTimeout(() => { A.close(); startNightOps(); }, 1700); }
    } else {
      busy = true; Snd.bad(); $('#master').classList.add('on'); const s = $('#m2-status'); s.textContent = 'WRONG SEQUENCE · RESETTING BUS'; s.style.color = 'var(--red)';
      setTimeout(() => { $$('.brk', body).forEach(b => b.classList.remove('off')); $$('#proc li', body).forEach(l => l.classList.remove('done')); step = 0; busy = false; $('#master').classList.remove('on'); s.textContent = '▸ follow the procedure card exactly'; s.style.color = ''; }, 1400);
    }
  }));
};
function startNightOps() {
  state.locked = true; document.body.classList.add('dark'); if (Snd.hum) Snd.hum.forEach(x => x.set(.004));
  const lurker = $('#lurker'); const left = Math.random() < .5;
  lurker.style.left = (left ? rand(8, 26) : rand(74, 92)) + '%'; lurker.style.top = rand(22, 80) + '%';
  const dk = $('#darkness');
  const mv = e => { state.mouse.x = e.clientX; state.mouse.y = e.clientY; dk.style.setProperty('--mx', e.clientX + 'px'); dk.style.setProperty('--my', e.clientY + 'px'); };
  window.addEventListener('pointermove', mv); dk.style.setProperty('--mx', state.mouse.x + 'px'); dk.style.setProperty('--my', state.mouse.y + 'px');
  say("Lights are out. Motion sensor is picking something up in Zarya… use your flashlight and find it. Carefully, Commander.", 'visit');
  let ping = 0, armed = 0;
  const bars = $$('#sensor-bars i');
  const f = dt => {
    armed += dt; const r = lurker.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const d = Math.hypot(state.mouse.x - cx, state.mouse.y - cy);
    const lv = clamp(8 - Math.floor(d / 90), 0, 8); bars.forEach((b, i) => b.classList.toggle('on', i < lv));
    $('#sensor-range').textContent = (d / 100).toFixed(1) + ' m';
    ping += dt * 1000; const iv = clamp(d * 2.1, 110, 1500);
    if (ping >= iv) { ping = 0; Snd.tone(900 + lv * 120, .05, 'sine', .045); }
    if (d < 70 && armed > 1.5) { loops.delete(f); window.removeEventListener('pointermove', mv); jumpscare(); }
  };
  loops.add(f);
}
async function jumpscare() {
  $('#boo-photo').innerHTML = img(pget('boo'), 'Boo photo'); $('#boo').classList.add('show'); Snd.scream(); state.hrSpike = 70;
  await sleep(2400);
  $('#boo').classList.remove('show'); document.body.classList.remove('dark'); state.locked = false; Snd.powerUp(); if (Snd.hum) Snd.hum.forEach((x, i) => x.set(i ? .03 : .012));
  await sleep(700); completeMission('m2'); openConsole('m2');
}

/* ---- M3 · Destiny navigation ---- */
RENDER.m3 = (body, A) => {
  const WP = { museum: { x: 525, y: 262, label: 'Museum of Illusions', done: false }, fresh: { x: 462, y: 214, label: 'Fresh Kitchen + Juice Bar', done: false } };
  let pos = { x: 110, y: 184 }, busy = false;
  body.innerHTML = `<div class="cpad"><div class="navmap"><svg viewBox="0 -70 600 540" id="navsvg">
    <defs><pattern id="ngrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="rgba(111,243,255,.07)"/></pattern></defs>
    <rect x="0" y="-70" width="600" height="540" fill="url(#ngrid)"/>
    <path d="M0 318 C70 300 150 296 230 304 C310 312 370 296 440 282 C500 270 560 272 600 262 L600 470 L0 470Z" fill="#0b2a4a" stroke="rgba(111,243,255,.35)"/>
    <text x="300" y="362" fill="rgba(111,243,255,.35)" font-size="13" letter-spacing="6" text-anchor="middle" font-family="Space Mono">LAKE ONTARIO</text>
    <path d="M0 150 C150 162 300 150 600 138" stroke="rgba(255,189,74,.25)" stroke-width="3" fill="none"/><text x="572" y="130" fill="rgba(255,189,74,.45)" font-size="9" font-family="Space Mono">401</text>
    <path d="M0 268 C120 266 220 256 330 256 C420 254 480 252 600 244" stroke="rgba(255,189,74,.25)" stroke-width="3" fill="none"/><text x="250" y="250" fill="rgba(255,189,74,.45)" font-size="9" font-family="Space Mono">QEW</text>
    <path d="M140 30 C150 120 130 210 160 306" stroke="rgba(111,160,255,.4)" stroke-width="2" fill="none"/><text x="150" y="60" fill="rgba(111,160,255,.5)" font-size="8" font-family="Space Mono" transform="rotate(80 150 60)">CREDIT RIVER</text>
    <text x="70" y="236" fill="rgba(220,235,245,.35)" font-size="12" letter-spacing="4" font-family="Space Mono">MISSISSAUGA</text>
    <text x="440" y="184" fill="rgba(220,235,245,.35)" font-size="12" letter-spacing="4" font-family="Space Mono">TORONTO</text>
    <g id="routes"></g>
    <g><circle cx="110" cy="184" r="7" fill="#59f59e"/><text x="110" y="170" fill="#59f59e" font-size="10" text-anchor="middle" font-family="Space Mono">UTM · HOME</text></g>
    ${Object.entries(WP).map(([k, w]) => `<g class="wp" data-wp="${k}"><circle class="hit" cx="${w.x}" cy="${w.y}" r="22"/><circle class="pulse" cx="${w.x}" cy="${w.y}" r="9"/><circle class="ring" cx="${w.x}" cy="${w.y}" r="9"/><circle cx="${w.x}" cy="${w.y}" r="3.5" fill="#fff"/><text x="${w.x + (k === 'fresh' ? -14 : 8)}" y="${w.y + (k === 'fresh' ? -14 : 28)}" fill="#cfe6f5" font-size="10" text-anchor="end" font-family="Space Mono">${w.label.toUpperCase()}</text></g>`).join('')}
    <g id="ship" transform="translate(110 184)"><path d="M0 -10 L7 8 L0 4 L-7 8Z" fill="#fff" stroke="#ff79b4" stroke-width="1.5"/></g>
    </svg></div><div class="navside" id="navside"></div></div>`;
  const side = $('#navside'), svg = $('#navsvg'), ship = $('#ship');
  const plot = () => {
    side.innerHTML = `<div class="lbl-s">Destiny · Guidance, navigation &amp; control</div>
      <p class="brief-txt">Flight plan for our <b>first anniversary</b>: downtown Toronto. Select each waypoint on the map to plot a course and fly there.</p>
      <div class="wplist"><div class="kv ok"><span>ORIGIN</span><b>UTM · HOME BASE</b></div>${Object.values(WP).map(w => `<div class="kv ${w.done ? 'ok' : ''}"><span>${w.label.toUpperCase()}</span><b>${w.done ? '✓ VISITED' : 'PENDING'}</b></div>`).join('')}</div>
      <div class="status-line">▸ click a pulsing waypoint on the map</div>`;
  };
  plot();
  $$('.wp', svg).forEach(g => g.addEventListener('click', () => {
    const k = g.dataset.wp, w = WP[k]; if (busy || w.done) return; busy = true; Snd.beep();
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M${pos.x} ${pos.y} Q ${(pos.x + w.x) / 2} ${Math.min(pos.y, w.y) - 90} ${w.x} ${w.y}`);
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#ff79b4'); p.setAttribute('stroke-width', '3');
    $('#routes').append(p); const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    side.innerHTML = `<div class="lbl-s">Course plotted</div><div class="kv"><span>DESTINATION</span><b>${w.label.toUpperCase()}</b></div><div class="kv"><span>DISTANCE</span><b>${(len / 12).toFixed(1)} km</b></div><div class="status-line">▸ ENGAGING…</div>`;
    let t = 0; const thr = Snd.cont('noise', { type: 'bandpass', freq: 700 }); thr.set(.03);
    const fly = dt => {
      t = Math.min(1, t + dt / 2); const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      p.style.strokeDashoffset = len * (1 - e); const a = p.getPointAtLength(len * e), b = p.getPointAtLength(Math.min(len, len * e + 1));
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90; ship.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
      if (t >= 1) { conLoops = conLoops.filter(x => x !== fly); thr.stop(); p.style.strokeDasharray = '6 6'; pos = { x: w.x, y: w.y }; Snd.ok(); challenge(k); }
    };
    A.loop(fly); A.cleanup(() => thr.stop());
  }));
  const arrive = k => {
    WP[k].done = true; $(`.wp[data-wp="${k}"]`, svg).classList.add('visited'); busy = false;
    if (Object.values(WP).every(w => w.done)) { side.insertAdjacentHTML('beforeend', '<div class="status-line ok">✓ FLIGHT PLAN COMPLETE · recovering data packet…</div>'); setTimeout(() => A.complete(), 1500); }
    else plot();
  };
  const challenge = k => {
    if (k === 'museum') {
      side.innerHTML = `<div class="challenge"><h5>⚠ OPTICAL DISTORTION FIELD · MUSEUM OF ILLUSIONS</h5><p>Navigation sensors are being fooled. Confirm the reading manually: <b>which line is longer?</b></p>
        <div class="illusion"><svg viewBox="0 0 300 150"><g stroke="#6ff3ff" stroke-width="3" fill="none" stroke-linecap="round"><line x1="70" y1="45" x2="230" y2="45"/><path class="fin" d="M70 45 L48 25 M70 45 L48 65 M230 45 L252 25 M230 45 L252 65"/></g>
        <g stroke="#ff79b4" stroke-width="3" fill="none" stroke-linecap="round"><line x1="70" y1="110" x2="230" y2="110"/><path class="fin" d="M70 110 L92 90 M70 110 L92 130 M230 110 L208 90 M230 110 L208 130"/></g>
        <g id="rulers" stroke="#59f59e" stroke-dasharray="4 4" opacity="0" style="transition:opacity .6s"><line x1="70" y1="10" x2="70" y2="140"/><line x1="230" y1="10" x2="230" y2="140"/></g></svg></div>
        <div class="opts"><button class="btn" data-a="top">Top · cyan</button><button class="btn" data-a="bot">Bottom · pink</button><button class="btn" data-a="same">They're equal</button></div><div class="status-line" id="ill-res"></div></div>`;
      $$('[data-a]', side).forEach(b => b.onclick = () => {
        const res = $('#ill-res');
        if (b.dataset.a !== 'same') { Snd.bad(); res.textContent = 'Negative. Your eyes are lying to you, Commander. Look again.'; res.style.color = 'var(--red)'; return; }
        Snd.ok(); $('#rulers').setAttribute('opacity', '1'); res.textContent = '✓ Equal. Exactly 160 units each. The museum got you once; not twice.'; res.className = 'status-line ok'; res.style.color = '';
        $$('[data-a]', side).forEach(x => x.disabled = true);
        setTimeout(() => { side.querySelector('.challenge').insertAdjacentHTML('beforeend', `<div class="mini-photo">${img(pget('museum'), 'Museum of Illusions photo')}</div><button class="btn green" id="ill-next">Continue ▸</button>`); $('#ill-next').onclick = () => { Snd.click(); arrive('museum'); }; }, 900);
      });
    } else {
      side.innerHTML = `<div class="challenge"><h5>🥗 RESUPPLY · FRESH KITCHEN + JUICE BAR</h5><p>A resupply capsule is inbound with our anniversary dinner. <b>Drag it into the docking port</b> to capture it.</p>
        <div class="capsule-zone" id="cz"><div class="port" id="port">PORT</div><div class="capsule" id="cap">🥑</div></div><div id="fk-res"></div></div>`;
      const cap = $('#cap'), cz = $('#cz'); let drag = false, ox = 0, oy = 0, caught = false;
      cap.addEventListener('pointerdown', e => { if (caught) return; drag = true; cap.setPointerCapture(e.pointerId); const r = cap.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; cap.style.cursor = 'grabbing'; });
      cap.addEventListener('pointermove', e => { if (!drag) return; const zr = cz.getBoundingClientRect(); cap.style.left = clamp(e.clientX - zr.left - ox, 0, zr.width - 60) + 'px'; cap.style.top = clamp(e.clientY - zr.top - oy, 0, zr.height - 60) + 'px'; cap.style.marginTop = '0'; });
      cap.addEventListener('pointerup', () => {
        if (!drag) return; drag = false; cap.style.cursor = '';
        const a = cap.getBoundingClientRect(), b = $('#port').getBoundingClientRect();
        if (Math.hypot(a.left + a.width / 2 - (b.left + b.width / 2), a.top + a.height / 2 - (b.top + b.height / 2)) < 40) {
          caught = true; const zr = cz.getBoundingClientRect(); cap.style.transition = 'all .3s'; cap.style.left = (b.left - zr.left + 5) + 'px'; cap.style.top = (b.top - zr.top + 5) + 'px'; Snd.clunk();
          setTimeout(() => {
            $('#fk-res').innerHTML = `<div class="ration"><h6>EXPEDITION RATION · VEGAN · ANNIVERSARY EDITION</h6>Source: Fresh Kitchen + Juice Bar, Toronto<br>Contents: ${esc(HER)}'s favourite restaurant, with her favourite person<br>Shelf life: forever</div><div class="mini-photo" style="margin-top:10px">${img(pget('freshKitchen'), 'Fresh Kitchen photo')}</div><button class="btn green" id="fk-next" style="margin-top:10px">Continue ▸</button>`;
            Snd.ok(); $('#fk-next').onclick = () => { Snd.click(); arrive('fresh'); };
            side.scrollTop = side.scrollHeight;
          }, 500);
        } else Snd.tick();
      });
    }
  };
};

/* ---- M4 · Zvezda radio ---- */
RENDER.m4 = (body, A) => {
  let f = 7.4, lockT = 0, t = 0, locked = false;
  body.innerHTML = `<div class="cpad"><div class="radio"><div class="lbl-s">Zvezda · S-band ground uplink receiver</div>
    <div class="freq" id="freq">07.40 <small>GHz</small></div>
    <canvas class="scope-wave" id="wave"></canvas>
    <div style="display:flex;align-items:center;gap:18px"><div class="sig" id="sig">${[20, 30, 40, 50, 62, 74, 86, 100].map(x => `<i style="height:${x}%"></i>`).join('')}</div><div class="status-line" id="m4-status">NO CARRIER · STATIC</div></div></div>
    <div class="side" style="align-items:center;justify-content:center;max-width:320px"><div id="k-freq"></div><div class="fine"><button class="btn" id="fdn">◀ 0.01</button><button class="btn" id="fup">0.01 ▶</button></div>
    <p class="brief-txt" style="text-align:center">Ground is transmitting on a date you should know.<br><b>Format: MM.DD</b></p><p class="brief-txt" style="text-align:center;font-size:12px;color:#7f93a6">drag or scroll the dial · ← → keys fine-tune</p></div></div>`;
  const K = knob($('#k-freq'), { label: 'TUNING', min: 0, max: 12.99, value: f, sens: .02, wheel: .05, tick: .1, fmt: v => v.toFixed(2), onChange: v => { f = Math.round(v * 100) / 100; } });
  $('#fdn').onclick = () => K.set(f - .01); $('#fup').onclick = () => K.set(f + .01);
  const kd = e => { if (e.key === 'ArrowLeft') { K.set(f - .01); e.preventDefault(); } if (e.key === 'ArrowRight') { K.set(f + .01); e.preventDefault(); } };
  window.addEventListener('keydown', kd); A.cleanup(() => window.removeEventListener('keydown', kd));
  const stn = Snd.cont('noise', { type: 'bandpass', freq: 2200, q: .5 }), car = Snd.cont('tone', { freq: 523 });
  A.cleanup(() => { stn.stop(); car.stop(); });
  const cv = $('#wave'); cv.width = cv.clientWidth; cv.height = cv.clientHeight; const x = cv.getContext('2d');
  const bars = $$('#sig i');
  A.loop(dt => {
    t += dt; const d = Math.abs(f - FREQ_TARGET), clean = 1 - smooth(0, 1.4, d);
    const fe = $('#freq'); fe.firstChild.textContent = f.toFixed(2).padStart(5, '0') + ' ';
    const lv = Math.round(clean * 8); bars.forEach((b, i) => b.classList.toggle('on', i < lv));
    stn.set(locked ? 0 : .07 * (1 - clean) + .004); car.set(locked ? 0 : .01 * Math.pow(clean, 5));
    const w = cv.width, hh = cv.height; x.fillStyle = 'rgba(5,11,16,.55)'; x.fillRect(0, 0, w, hh);
    x.strokeStyle = 'rgba(111,243,255,.06)'; for (let i = 0; i < w; i += 30) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, hh); x.stroke(); }
    x.strokeStyle = clean > .95 ? '#59f59e' : '#6ff3ff'; x.lineWidth = 2; x.beginPath();
    for (let i = 0; i <= w; i += 3) { const y = hh / 2 + Math.sin(i * .045 + t * 6) * hh * .32 * clean + (Math.random() - .5) * hh * .85 * (1 - clean) * (1 - clean); i ? x.lineTo(i, y) : x.moveTo(i, y); }
    x.stroke();
    const st = $('#m4-status');
    if (locked) return;
    if (d <= .025) {
      lockT += dt; st.textContent = `CARRIER DETECTED · LOCKING ${Math.min(100, Math.round(lockT * 100))}%`; st.className = 'status-line ok';
      if (lockT >= 1) { locked = true; fe.classList.add('lock'); st.textContent = `✓ SIGNAL LOCKED · INCOMING TRANSMISSION FROM ${UP(HER)}`; Snd.ok(); setTimeout(() => A.complete(), 1300); }
    } else { lockT = 0; st.className = 'status-line'; st.textContent = clean > .7 ? 'WEAK CARRIER · KEEP TUNING' : clean > .3 ? 'FAINT SIGNAL…' : 'NO CARRIER · STATIC'; }
  });
};

/* ---- M5 · Harmony crew form ---- */
RENDER.m5 = (body, A) => {
  body.innerHTML = `<div class="cpad"><div class="form" id="form"><h5><span>FORM ISS-CREW-${MM}${DDs} · CREW ADDITION REQUEST</span><span>CONFIDENTIAL ♥</span></h5>
    <div class="cand">${img(pget('copilotBadge'), 'Your photo (co-pilot)')}</div><div id="frows"></div><div id="fstep"></div>
    <div class="stamp" id="stamp">ACCEPTED<small>${DD} ${MON[DM - 1]} ${DY} ♥</small></div></div>
    <div class="side" style="max-width:290px;justify-content:center"><div class="lbl-s">Harmony · Crew operations</div>
    <p class="brief-txt">A crew-addition request filed from <b>your dorm room</b> has been sitting in the system since <b>${DATE_LONG}</b>. Review it, give your reasons, and sign it off.</p>
    <div class="kv"><span>REQUEST STATUS</span><b id="m5-st" style="color:var(--amber)">PENDING</b></div><div class="kv"><span>CREW CAPACITY</span><b>2 / 2</b></div><div class="kv"><span>PRIORITY</span><b style="color:var(--pink)">HIGHEST ♥</b></div></div></div>`;
  let alive = true; A.cleanup(() => alive = false);
  const rows = [['REQUESTING OFFICER', `Cdr. ${NAME}`], ['CANDIDATE', HER], ['POSITION', 'Co-pilot · girlfriend · best friend'], ['FILED FROM', 'Dorm room'], ['DATE FILED', DATE_LONG]];
  (async () => {
    for (const [k, v] of rows) {
      if (!alive) return; const r = h(`<div class="frow"><span>${k}</span><b></b></div>`); $('#frows').append(r);
      await typeInto(r.querySelector('b'), v, 26, () => !alive, true); await sleep(120);
    }
    if (!alive) return; reasons();
  })();
  const reasons = () => {
    const R = ['Our walks by the river', 'She scares me on dark benches', 'Great taste in vegan food', 'Way too cute', 'All of the above'];
    $('#fstep').innerHTML = `<div class="lbl-s" style="color:#7b7563;margin-top:12px">REASON FOR REQUEST · select all that apply</div><div class="checks">${R.map((r, i) => `<label><input type="checkbox" data-i="${i}">${r}</label>`).join('')}</div><div style="margin-top:12px;display:flex;align-items:center;gap:12px"><button class="btn" id="f-next">Continue ▸</button><span id="f-err" style="color:#c2255c;font-size:12px;font-family:var(--sans)"></span></div>`;
    const cbs = $$('#fstep input');
    cbs.forEach(c => c.onchange = () => { Snd.tick(); if (+c.dataset.i === 4) cbs.forEach(x => x.checked = c.checked); else cbs[4].checked = cbs.slice(0, 4).every(x => x.checked); });
    $('#f-next').onclick = () => {
      if (!cbs.every(c => c.checked)) { Snd.bad(); $('#f-err').textContent = 'Reason count insufficient. Please re-evaluate, Commander.'; return; }
      Snd.ok(); sign();
    };
  };
  const sign = () => {
    $('#fstep').innerHTML = `<div class="lbl-s" style="color:#7b7563;margin-top:12px">COMMANDER'S SIGNATURE</div><canvas class="sigpad" id="sigc"></canvas><div style="margin-top:10px;display:flex;gap:8px"><button class="btn" id="s-clear">Clear</button><button class="btn pink" id="s-go" disabled>Sign &amp; submit</button></div>`;
    const c = $('#sigc'); c.width = c.clientWidth; c.height = c.clientHeight; const x = c.getContext('2d');
    x.strokeStyle = '#1f3a8a'; x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round';
    let dn = false, lx = 0, ly = 0, len = 0;
    c.addEventListener('pointerdown', e => { dn = true; c.setPointerCapture(e.pointerId); const r = c.getBoundingClientRect(); lx = e.clientX - r.left; ly = e.clientY - r.top; });
    c.addEventListener('pointermove', e => { if (!dn) return; const r = c.getBoundingClientRect(), nx = e.clientX - r.left, ny = e.clientY - r.top; x.beginPath(); x.moveTo(lx, ly); x.lineTo(nx, ny); x.stroke(); len += Math.hypot(nx - lx, ny - ly); lx = nx; ly = ny; if (len > 120) $('#s-go').disabled = false; });
    c.addEventListener('pointerup', () => dn = false);
    $('#s-clear').onclick = () => { x.clearRect(0, 0, c.width, c.height); len = 0; $('#s-go').disabled = true; };
    $('#s-go').onclick = () => {
      $('#s-go').disabled = true; $('#s-clear').disabled = true;
      $('#m5-st').textContent = 'PROCESSING…';
      setTimeout(() => {
        $('#stamp').classList.add('slam'); Snd.thud(); $('#m5-st').textContent = 'ACCEPTED ♥'; $('#m5-st').style.color = 'var(--green)';
        const fr = $('#form').getBoundingClientRect(), br = body.getBoundingClientRect(); hearts(body, fr.left - br.left + fr.width - 140, fr.top - br.top + fr.height - 80, 18);
        setTimeout(() => A.complete(), 2300);
      }, 700);
    };
  };
};

/* ---- M6 · Tranquility life support ---- */
RENDER.m6 = (body, A) => {
  body.innerHTML = `<div class="ls alarm" id="ls"><div class="o2"><div class="lbl-s">K₂ RESERVE</div><div class="tube"><i id="o2i"></i></div><div class="pct" id="o2p">3%</div></div>
    <div class="chamber"><canvas id="chm"></canvas></div>
    <div class="ls-side"><div class="lbl-s" style="color:var(--red)" id="ls-alert">⚠ CRITICAL · KISS RESERVES DEPLETED</div>
    <p class="brief-txt">Tranquility's <b>kiss supply</b> has dropped to critical levels. Crew morale is at risk. Pump the reserves back up to 100%.</p>
    <button class="pump" id="pump">PUMP KISSES<small>click fast · or hold</small></button>
    <div class="kv"><span>CO-PILOT SUPPLY</span><b>UNLIMITED</b></div><div class="kv"><span>DELIVERY RATE</span><b id="rate">0 / s</b></div></div></div>`;
  const cv = $('#chm'); cv.width = cv.clientWidth; cv.height = cv.clientHeight; const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  let lvl = 3, parts = [], holding = false, hacc = 0, klax = 0, done = false, recent = [], lastNow = performance.now();
  const add = n => {
    if (done) return; lvl = Math.min(100, lvl + n); recent.push(performance.now());
    for (let i = 0; i < 2; i++) { const r = Math.random(); parts.push({ x: W / 2 + rand(-40, 40), y: H - 30, vx: rand(-260, 260), vy: -rand(220, 480), r: rand(-.5, .5), vr: rand(-4, 4), s: rand(22, 38), e: r < .65 ? '💋' : r < .85 ? '💗' : '❤️' }); }
    if (parts.length > 160) parts.splice(0, parts.length - 160);
    Snd.tone(500 + lvl * 7, .06, 'sine', .05);
  };
  const pump = $('#pump');
  pump.addEventListener('pointerdown', e => { holding = true; hacc = 0; pump.classList.add('down'); add(3); pump.setPointerCapture(e.pointerId); });
  const rel = () => { holding = false; pump.classList.remove('down'); };
  pump.addEventListener('pointerup', rel); pump.addEventListener('pointercancel', rel);
  A.loop(dt => {
    const nowT = performance.now(); if (holding) { hacc += (nowT - lastNow) / 1000; while (hacc > .12) { hacc -= .12; add(2.2); } } lastNow = nowT;
    klax += dt; if (!done && klax > 1.2) { klax = 0; Snd.tone(760, .18, 'square', .025); Snd.tone(560, .18, 'square', .025, .2); }
    const now = performance.now(); recent = recent.filter(r => now - r < 1000); $('#rate').textContent = recent.length + ' / s';
    $('#o2i').style.height = lvl + '%'; const p = $('#o2p'); p.textContent = Math.floor(lvl) + '%'; p.classList.toggle('ok', lvl >= 100);
    x.clearRect(0, 0, W, H); x.textAlign = 'center'; x.textBaseline = 'middle';
    if (parts.length < 6) { x.fillStyle = 'rgba(255,121,180,.18)'; x.font = '600 14px Space Mono, monospace'; x.fillText('K₂ CHAMBER · EMPTY · PRESS THE BIG RED BUTTON', W / 2, H / 2); }
    for (const q of parts) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; q.vx *= Math.pow(.7, dt); q.vy *= Math.pow(.7, dt);
      if (q.x < q.s / 2) { q.x = q.s / 2; q.vx = Math.abs(q.vx); } if (q.x > W - q.s / 2) { q.x = W - q.s / 2; q.vx = -Math.abs(q.vx); }
      if (q.y < q.s / 2) { q.y = q.s / 2; q.vy = Math.abs(q.vy); } if (q.y > H - q.s / 2) { q.y = H - q.s / 2; q.vy = -Math.abs(q.vy); }
      x.save(); x.translate(q.x, q.y); x.rotate(q.r); x.font = `${q.s}px serif`; x.fillText(q.e, 0, 0); x.restore();
    }
    if (lvl >= 100 && !done) {
      done = true; $('#ls').classList.remove('alarm'); const al = $('#ls-alert'); al.textContent = '✓ LIFE SUPPORT NOMINAL · CREW MORALE: MAXIMUM'; al.style.color = 'var(--green)';
      pump.disabled = true; Snd.success(); setTimeout(() => A.complete(), 1800);
    }
  });
};

/* ---- Airlock / EVA ---- */
RENDER.airlock = (body, A) => {
  if (!allDone()) {
    const left = MIDS.filter(id => !state.done[id]);
    body.innerHTML = `<div class="cpad" style="flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px"><div style="font-size:54px">🔒</div><h3 style="font-family:var(--sans);font-size:30px;color:var(--red)">ACCESS DENIED</h3>
      <p class="brief-txt">EVA is not permitted until every station system is green. ${doneCount()}/6 systems nominal.</p>
      <div style="min-width:440px">${left.map(id => `<div class="kv"><span>M0${MISSIONS[id].n} · ${MISSIONS[id].title.toUpperCase()}</span><b style="color:var(--amber)">${MODULES[modIndex(MISSIONS[id].mod)].name}</b></div>`).join('')}</div></div>`;
    Snd.bad(); return;
  }
  body.innerHTML = `<div class="cpad"><div class="eva-steps">
    <div class="eva active"><span class="en">1</span><div class="et">DON EVA SUIT<small>Helmet, gloves, life-support pack.</small></div><button class="btn" data-s="0">Suit up</button></div>
    <div class="eva"><span class="en">2</span><div class="et">CONNECT SAFETY TETHER<small>Never float anywhere without it.</small></div><button class="btn" data-s="1" disabled>Clip in</button></div>
    <div class="eva"><span class="en">3</span><div class="et">DEPRESSURIZE AIRLOCK<small>Hold until the chamber reads 0.0 psi.</small></div><button class="btn hold" data-s="2" disabled><span class="prog"></span><span class="lbl">Hold to vent</span></button></div>
    <div class="eva"><span class="en">4</span><div class="et">OPEN OUTER HATCH<small>There's something out there for you.</small></div><button class="btn pink" data-s="3" disabled>Open hatch</button></div></div>
    <div class="side" style="max-width:320px;justify-content:center"><div class="lbl-s">Quest · Joint airlock</div><div class="psi" id="psi">14.7 <small>psi</small></div>
    <div class="kv"><span>SUIT</span><b id="ev-suit">STOWED</b></div><div class="kv"><span>TETHER</span><b id="ev-teth">—</b></div><div class="kv"><span>EVA CREW</span><b>CDR ${esc(UP(NAME))}</b></div>
    <div class="status-line" id="ev-st">▸ follow the EVA checklist</div></div></div>`;
  const steps = $$('.eva', body), btn = i => $(`[data-s="${i}"]`, body);
  const adv = i => { steps[i].classList.remove('active'); steps[i].classList.add('done'); btn(i).disabled = true; if (steps[i + 1]) { steps[i + 1].classList.add('active'); btn(i + 1).disabled = false; } Snd.ok(); };
  btn(0).onclick = async () => { btn(0).disabled = true; const s = $('#ev-st'); for (const l of ['Helmet ✓', 'Helmet ✓  Gloves ✓', 'Helmet ✓  Gloves ✓  Life support ✓', 'Helmet ✓  Gloves ✓  Life support ✓  Snacks ✓']) { s.textContent = l; Snd.tick(); await sleep(350); } $('#ev-suit').textContent = 'ON · SEALED'; adv(0); };
  btn(1).onclick = () => { $('#ev-teth').textContent = 'SECURED ♥'; $('#ev-st').textContent = "Tether secured. It's clipped to your co-pilot. It doesn't come off."; Snd.clunk(); adv(1); };
  let hiss = null;
  const hb = holdBtn(btn(2), 3, (v, held) => { $('#psi').firstChild.textContent = (14.7 * (1 - v)).toFixed(1) + ' '; if (held && !hiss) { hiss = Snd.cont('noise', { type: 'highpass', freq: 2500 }); } if (hiss) hiss.set(held ? .06 * (1 - v) + .01 : 0); },
    () => { if (hiss) hiss.stop(); $('#ev-st').textContent = 'Airlock at vacuum. Outer hatch unlocked.'; adv(2); });
  A.loop(hb.f); A.cleanup(() => { hb.cleanup(); if (hiss) hiss.stop(); });
  btn(3).onclick = () => { closeConsole(); $('#hatch-w').style.transform = 'rotate(540deg)'; Snd.clunk(); setTimeout(finale, 1600); };
};

/* =================================================================
   5. FINALE
   ================================================================= */
function finale() {
  state.finaleSeen = true; Snd.stopHum(); Radio.stop(); Snd.whoosh(); Snd.startPad();
  $('#comms').classList.remove('show');
  show('finale');
  const fs = $('#fin-stars'); fs.style.inset = '-4%'; fs.style.width = '108%'; fs.style.height = '108%'; stars(fs, 700, 77);
  Earth.add($('#fin-earth'), 560, () => state.scene === 'finale');
  $('#fin-iss').innerHTML = issSVG('f');
  const L = letter('final');
  $('#fin-from').textContent = `FINAL TRANSMISSION · FROM ${UP(HER)}`; $('#fin-title').textContent = L.title;
  const card = $('#fin-card'); let skip = false;
  card.onclick = () => skip = true;
  setTimeout(async () => {
    card.classList.add('show'); Snd.radio();
    await typeInto($('#fin-text'), L.text, 24, () => skip);
    $('#fin-photo').innerHTML = polaroid(pget('finale'), 'Final photo', -4);
    $('#fin-bottom').classList.add('show');
  }, 2200);
  $('#fin-next').onclick = e => { e.stopPropagation(); showPass(); };
  const sc = $('#scene-finale');
  sc.onpointermove = e => { const dx = (e.clientX / innerWidth - .5), dy = (e.clientY / innerHeight - .5); fs.style.transform = `translate(${-dx * 20}px,${-dy * 20}px)`; $('#fin-earth').style.transform = `translate(${-dx * 40}px,${-dy * 30}px)`; };
  sc.onclick = e => {
    if (e.target.closest('#fin-card')) return;
    for (let i = 0; i < 9; i++) { const s = h(`<span class="spark">${['✦', '💗', '✧', '⭐', '💫'][i % 5]}</span>`); s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; const a = Math.random() * Math.PI * 2, r = rand(40, 120); s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px'); sc.append(s); setTimeout(() => s.remove(), 1700); }
    Snd.tone(rand(900, 1600), .2, 'sine', .04);
  };
}
function showPass() {
  const B = Object.assign({ note: '', date: 'SOMEDAY', seat: '1A', companionSeat: '1B' }, C.boardingPass || {});
  $('#pass-slot').innerHTML = `<div class="pass"><div class="pass-main"><div class="pass-top"><span>✦ ORBITAL AIRWAYS</span><b>BOARDING PASS</b></div>
    <div class="pass-route"><div><small>FROM</small><b>YYZ</b><span>Earth · Toronto</span></div><div class="pass-plane"></div><div class="right"><small>TO</small><b>LEO</b><span>Low Earth Orbit · 408 km</span></div></div>
    <div class="pass-grid"><div><small>PASSENGER</small><b>${esc(UP(NAME))}</b></div><div><small>SEAT</small><b>${esc(B.seat)}</b></div><div><small>GATE</small><b>♥</b></div><div><small>DATE</small><b>${esc(B.date)}</b></div><div><small>CLASS</small><b>FIRST</b></div><div><small>COMPANION</small><b>${esc(UP(HER))} · ${esc(B.companionSeat)}</b></div></div>
    <p class="pass-note">${esc(B.note)}</p></div>
    <div class="pass-stub"><small>ADMIT ONE</small><b>${esc(B.seat)}</b><small>COMMANDER ${esc(UP(NAME))}</small><div class="bars"></div><small>EXP ${EXP}</small></div></div>
    <div class="pass-actions"><button class="btn" id="pass-close">Back to space</button><button class="btn pink" id="pass-station">Return to station</button></div>`;
  $('#pass-wrap').classList.add('show'); Snd.success();
  $('#pass-close').onclick = () => $('#pass-wrap').classList.remove('show');
  $('#pass-station').onclick = () => {
    $('#pass-wrap').classList.remove('show'); $('#log').classList.remove('show');
    if (state.scene !== 'station') { Snd.stopPad(); show('station'); Snd.startHum(); go(modIndex('quest'), true); }
  };
}

/* =================================================================
   global keys, resize, start
   ================================================================= */
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#pass-wrap').classList.contains('show')) $('#pass-wrap').classList.remove('show');
    else if ($('#lightbox').classList.contains('show')) $('#lightbox').classList.remove('show');
    else if (state.letterOpen) closeLetter();
    else if (Con.id) closeConsole();
    else if ($('#log').classList.contains('show')) $('#log').classList.remove('show');
    return;
  }
  if (state.scene === 'station' && !Con.id && !state.letterOpen && !state.locked && !state.briefing) {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') go(state.idx + 1);
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') go(state.idx - 1);
  }
});
$('#seal').addEventListener('click', () => { const env = $('#envelope'); env.classList.add('open'); $('#env-hint').style.visibility = 'hidden'; Snd.tone(900, .15, 'triangle', .05); setTimeout(() => env.classList.add('read'), 700); });
$('#letter-close').addEventListener('click', closeLetter);
$('#c-close').addEventListener('click', closeConsole);
window.addEventListener('pointermove', e => { state.mouse.x = e.clientX; state.mouse.y = e.clientY; }, { passive: true });
let rsz; window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { starCanvases.forEach(cv => { if (cv.offsetParent !== null || cv.closest('.scene.active')) stars(cv, cv._n, cv._seed); }); measureBoxes(); if (Radio.el && Radio.slot) Radio.attach(Radio.slot); }, 200); });

requestAnimationFrame(frame);
setTimeout(() => Earth.init(), 50);

/* dev shortcuts: add ?skip, ?all or ?finale to the URL while testing */
const params = new URLSearchParams(location.search);
if (params.has('all')) MIDS.forEach(id => state.done[id] = true);
if (params.has('finale')) { buildStation(); state.metStart = Date.now(); finale(); }
else if (params.has('skip') || params.has('all')) { $('#scene-boot').classList.remove('active'); enterStation(false); }
else boot();
})();
