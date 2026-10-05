'use strict';
/* Treino: diário de treino offline.
   Tudo fica no localStorage do aparelho. Nenhum dado sai daqui (veja a CSP no index.html). */
(() => {
  const KEY = 'treino.v1';
  const DAY = 864e5;
  const COMMON = [
    'Supino reto', 'Supino inclinado', 'Crucifixo', 'Desenvolvimento', 'Elevação lateral',
    'Tríceps pulley', 'Tríceps testa', 'Rosca direta', 'Rosca martelo', 'Puxada frente',
    'Remada curvada', 'Remada baixa', 'Agachamento', 'Leg press', 'Cadeira extensora',
    'Mesa flexora', 'Stiff', 'Levantamento terra', 'Panturrilha em pé', 'Abdominal'
  ];
  const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  /* ---------- ícones ---------- */
  const IC = {
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    down: '<polyline points="6 9 12 15 18 9"/>',
    up: '<polyline points="18 15 12 9 6 15"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    flame: '<path d="M12 2c.6 4.2 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.4 2.2-4.4.3 1.6 1 2.4 2 2.4C11 8 10.4 5 12 2z"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10a5 5 0 0 1 8 0"/><path d="M12 10l2-2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'
  };
  const ic = (n, c = '') => `<svg class="ic${c ? ' ' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
  const lbl = (i, t) => `<span class="label">${ic(i)}${t}</span>`;

  /* ---------- utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const pad = n => String(n).padStart(2, '0');
  const last = a => a[a.length - 1];
  const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const isYmd = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseYmd(s));
  const fmtDay = s => { const d = parseYmd(s); return `${WD[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const fmtShort = s => { const d = parseYmd(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const fmtTime = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtDur = ms => { const m = Math.max(1, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}h${pad(m % 60)}` : `${m} min`; };
  const fmt = n => (Math.round(n * 100) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : 0; };
  const cleanName = n => String(n ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const keyOf = n => cleanName(n).toLowerCase();
  const idOf = v => (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/[^\w-]/g, '').slice(0, 24) : '';
  const ago = date => {
    const n = Math.round((parseYmd(ymd()) - parseYmd(date)) / DAY);
    return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
  };
  const weekStart = d => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return ymd(x); };
  const sgn = (n, u) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}${u}`;
  const plural = (n, a, b) => n === 1 ? a : b;

  /* ---------- estado ---------- */
  const blank = () => ({ v: 1, plans: [], sessions: [], weights: [], active: null, settings: { name: '', rest: 90, lastBackup: 0, theme: 'auto' } });

  const cleanSets = a => (Array.isArray(a) ? a : []).slice(0, 60).map(s => ({
    kg: num(s && s.kg), reps: Math.round(num(s && s.reps)), done: !!(s && s.done)
  }));
  const cleanEntries = a => (Array.isArray(a) ? a : []).slice(0, 60)
    .map(e => ({ name: cleanName(e && e.name), sets: cleanSets(e && e.sets) }))
    .filter(e => e.name);
  const cleanSession = s => {
    if (!s || typeof s !== 'object') return null;
    const start = Number(s.start) > 0 ? Number(s.start) : Date.now();
    return {
      id: idOf(s.id) || uid(),
      date: isYmd(s.date) ? s.date : ymd(new Date(start)),
      start,
      end: Number(s.end) > 0 ? Number(s.end) : 0,
      planId: idOf(s.planId),
      planName: cleanName(s.planName).slice(0, 40),
      entries: cleanEntries(s.entries),
      note: String(s.note ?? '').slice(0, 500)
    };
  };
  function clean(d) {
    const o = blank();
    if (!d || typeof d !== 'object') return o;
    const arr = x => (Array.isArray(x) ? x : []);
    o.plans = arr(d.plans).slice(0, 60).map(p => ({
      id: idOf(p && p.id) || uid(),
      name: cleanName(p && p.name).slice(0, 40) || 'Treino',
      exercises: arr(p && p.exercises).map(cleanName).filter(Boolean).slice(0, 60)
    }));
    o.sessions = arr(d.sessions).slice(0, 5000).map(cleanSession).filter(Boolean);
    o.weights = arr(d.weights).slice(0, 5000)
      .map(w => ({ date: w && w.date, kg: num(w && w.kg) }))
      .filter(w => isYmd(w.date) && w.kg > 0);
    o.active = d.active ? cleanSession(d.active) : null;
    if (o.active) o.active.end = 0;
    const st = d.settings || {};
    o.settings = {
      name: String(st.name ?? '').trim().slice(0, 30),
      rest: [0, 30, 60, 90, 120, 180, 240].includes(Number(st.rest)) ? Number(st.rest) : 90,
      lastBackup: Number(st.lastBackup) > 0 ? Number(st.lastBackup) : 0,
      theme: ['auto', 'dark', 'light'].includes(st.theme) ? st.theme : 'auto'
    };
    return o;
  }

  let storageFailed = false;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return clean(JSON.parse(raw));
    } catch (e) { /* dados corrompidos ou storage bloqueado: começa vazio */ }
    return blank();
  }
  let S = load();
  let saveTimer = 0;
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(S)); storageFailed = false; }
    catch (e) { storageFailed = true; }
  }
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); };
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });

  /* ---------- tema ---------- */
  const lightMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;
  function applyTheme() {
    const t = S.settings.theme, root = document.documentElement;
    if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    const dark = t === 'dark' || (t !== 'light' && !(lightMQ && lightMQ.matches));
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
    const m = document.createElement('meta');
    m.name = 'theme-color'; m.content = dark ? '#050505' : '#ffffff';
    document.head.appendChild(m);
  }
  if (lightMQ && lightMQ.addEventListener) lightMQ.addEventListener('change', applyTheme);

  /* ---------- histórico e recordes ---------- */
  function history() {
    const map = new Map();
    const sess = [...S.sessions].sort((a, b) => a.start - b.start);
    for (const s of sess) {
      for (const e of s.entries) {
        const sets = e.sets.filter(x => x.done && (x.kg > 0 || x.reps > 0));
        if (!sets.length) continue;
        const k = keyOf(e.name);
        if (!map.has(k)) map.set(k, { key: k, name: e.name, items: [] });
        const h = map.get(k);
        h.name = e.name;
        h.items.push({
          sid: s.id, date: s.date, start: s.start, sets,
          maxKg: Math.max(0, ...sets.map(x => x.kg)),
          maxReps: Math.max(0, ...sets.map(x => x.reps)),
          e1rm: Math.max(0, ...sets.map(x => x.kg > 0 && x.reps > 0 ? (x.reps === 1 ? x.kg : x.kg * (1 + x.reps / 30)) : 0)),
          vol: sets.reduce((a, x) => a + x.kg * x.reps, 0)
        });
      }
    }
    return map;
  }
  const isBodyweight = h => h.items.every(i => i.maxKg === 0);
  const METRICS = {
    kg: { label: 'Carga', unit: ' kg', get: i => i.maxKg },
    e1rm: { label: '1RM', unit: ' kg', get: i => i.e1rm },
    vol: { label: 'Volume', unit: ' kg', get: i => i.vol },
    reps: { label: 'Repetições', unit: ' reps', get: i => i.maxReps }
  };
  const setsText = sets => sets.map(s => s.kg > 0 ? `${fmt(s.kg)}×${s.reps}` : `${s.reps} reps`).join(' · ');

  function prEvents() {
    const ev = [];
    for (const h of history().values()) {
      const bw = isBodyweight(h);
      let best = 0, bestE = 0;
      h.items.forEach((it, i) => {
        const cur = bw ? it.maxReps : it.maxKg;
        if (i > 0 && best > 0) {
          if (cur > best) ev.push({ sid: it.sid, name: h.name, date: it.date, start: it.start, kind: bw ? 'reps' : 'kg', from: best, to: cur });
          else if (!bw && it.e1rm > bestE * 1.005) ev.push({ sid: it.sid, name: h.name, date: it.date, start: it.start, kind: 'e1rm', from: bestE, to: it.e1rm });
        }
        best = Math.max(best, cur); bestE = Math.max(bestE, it.e1rm);
      });
    }
    return ev.sort((a, b) => b.start - a.start);
  }
  const prText = e => e.kind === 'reps' ? `${e.name}: ${fmt(e.from)} → ${fmt(e.to)} reps`
    : e.kind === 'e1rm' ? `${e.name}: 1RM estimada ${fmt1(e.from)} → ${fmt1(e.to)} kg`
    : `${e.name}: ${fmt(e.from)} → ${fmt(e.to)} kg`;

  function weekStreak() {
    const weeks = new Set(S.sessions.map(s => weekStart(parseYmd(s.date))));
    const d = parseYmd(weekStart(new Date()));
    let n = 0;
    if (!weeks.has(ymd(d))) d.setDate(d.getDate() - 7);
    while (weeks.has(ymd(d))) { n++; d.setDate(d.getDate() - 7); }
    return n;
  }
  function nextPlan() {
    if (!S.plans.length) return null;
    const lastS = [...S.sessions].sort((a, b) => b.start - a.start).find(s => S.plans.some(p => p.id === s.planId));
    if (!lastS) return S.plans[0];
    const i = S.plans.findIndex(p => p.id === lastS.planId);
    return S.plans[(i + 1) % S.plans.length];
  }
  const lastDoneOf = planId => {
    const s = [...S.sessions].filter(x => x.planId === planId).sort((a, b) => b.start - a.start)[0];
    return s ? s.date : null;
  };
  const sessVolume = s => s.entries.reduce((a, e) => a + e.sets.reduce((b, x) => b + x.kg * x.reps, 0), 0);

  /* ---------- gráficos (SVG) ---------- */
  function chart(points, o) {
    if (!points.length) return '';
    const W = 340, H = 170, pl = 40, pr = 12, pt = 12, pb = 24;
    const ys = points.map(p => p.y);
    let min = Math.min(...ys), max = Math.max(...ys);
    if (min === max) { min -= 1; max += 1; }
    const padY = (max - min) * .15;
    min = Math.max(0, min - padY); max += padY;
    const X = i => points.length === 1 ? pl + (W - pl - pr) / 2 : pl + (W - pl - pr) * i / (points.length - 1);
    const Y = v => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
    let g = '';
    for (let k = 0; k < 4; k++) {
      const v = min + (max - min) * k / 3, y = Y(v);
      g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="ax" x="${pl - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end">${fmt1(v)}</text>`;
    }
    const xy = points.map((p, i) => `${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`);
    const area = points.length > 1
      ? `<defs><linearGradient id="${o.id}" x1="0" y1="0" x2="0" y2="1"><stop class="g0" offset="0"/><stop class="g1" offset="1"/></linearGradient></defs>` +
        `<path d="M${X(0).toFixed(1)},${H - pb} L${xy.join(' L')} L${X(points.length - 1).toFixed(1)},${H - pb} Z" fill="url(#${o.id})"/>`
      : '';
    const dots = points.map((p, i) =>
      `<circle class="pt${p.pr ? ' pr' : ''}${i === o.sel ? ' sel' : ''}" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.pr ? 5 : 4}"/>` +
      `<circle data-act="${o.act}" data-i="${i}" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="15" fill="transparent"/>`).join('');
    const xl = points.length > 1
      ? `<text class="ax" x="${pl}" y="${H - 6}">${esc(points[0].short)}</text><text class="ax" x="${W - pr}" y="${H - 6}" text-anchor="end">${esc(last(points).short)}</text>`
      : `<text class="ax" x="${W / 2}" y="${H - 6}" text-anchor="middle">${esc(points[0].short)}</text>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolução">${g}${area}<polyline class="ln" points="${xy.join(' ')}"/>${dots}${xl}</svg>`;
  }
  function spark(vals) {
    if (vals.length < 2) return '<svg class="spark" viewBox="0 0 84 28"></svg>';
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min -= 1; max += 1; }
    const pts = vals.map((v, i) => `${(2 + 80 * i / (vals.length - 1)).toFixed(1)},${(26 - 24 * (v - min) / (max - min)).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 84 28" aria-hidden="true"><polyline points="${pts}"/></svg>`;
  }

  /* ---------- estado da interface ---------- */
  const now = new Date();
  const ui = {
    tab: 'hoje', plan: null, evo: null, metric: 'kg', evoSel: -1, wSel: -1,
    cal: { y: now.getFullYear(), m: now.getMonth() }, day: null, open: null, limit: 20
  };
  let deferredInstall = null;
  let rest = null;

  /* ---------- modal, aviso ---------- */
  function modal({ title, html, actions }) {
    return new Promise(res => {
      const el = $('#sheet');
      el.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${title ? `<h3>${esc(title)}</h3>` : ''}<div>${html || ''}</div>
        <div class="acts">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div></div>`;
      el.hidden = false;
      const done = v => { el.hidden = true; el.innerHTML = ''; el.onclick = null; res(v); };
      el.onclick = e => {
        const b = e.target.closest('button[data-i]');
        if (b) done(actions[+b.dataset.i].value);
        else if (e.target === el) done(null);
      };
    });
  }
  const ask = (text, ok, title) => modal({
    title, html: `<p class="muted">${esc(text)}</p>`,
    actions: [{ label: ok, value: true, cls: 'primary' }, { label: 'Cancelar', value: false, cls: 'ghost' }]
  }).then(v => v === true);
  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
  }

  /* ---------- tela: Hoje ---------- */
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const elapsed = () => { const s = Math.max(0, Math.floor((Date.now() - S.active.start) / 1000)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
  const setsCount = a => a.entries.reduce((r, e) => ({ d: r.d + e.sets.filter(s => s.done).length, t: r.t + e.sets.length }), { d: 0, t: 0 });

  function vHoje() {
    if (S.active) return vWorkout();
    const nxt = nextPlan();
    const wk = weekStart(new Date());
    const week = S.sessions.filter(s => weekStart(parseYmd(s.date)) === wk).length;
    const recent = [...S.sessions].sort((a, b) => b.start - a.start).slice(0, 3);
    const nm = S.settings.name;
    const others = S.plans.filter(p => !nxt || p.id !== nxt.id);
    const ld = nxt && lastDoneOf(nxt.id);
    return `
    <div class="stack">
      <header class="between"><div><div class="eyebrow">${fmtDay(ymd())}</div>
        <h1 class="h1">${greeting()}${nm ? `,<br><span class="red">${esc(nm)}</span>` : ''}</h1></div>
        <div class="mark">${ic('dumbbell')}</div></header>
      <div class="stats">
        <div class="stat">${ic('zap')}<b>${week}</b><span>nesta semana</span></div>
        <div class="stat">${ic('flame')}<b>${weekStreak()}</b><span>semanas seguidas</span></div>
        <div class="stat">${ic('award')}<b>${S.sessions.length}</b><span>treinos no total</span></div>
      </div>
      ${nxt ? `<div class="hero">
        <div class="eyebrow red">Próximo treino</div>
        <div class="hero-title">${esc(nxt.name)}</div>
        <div class="muted small">${nxt.exercises.length} exercício${plural(nxt.exercises.length, '', 's')} · ${ld ? 'último ' + ago(ld) : 'ainda não feito'}</div>
        ${nxt.exercises.length ? `<div class="chips">${nxt.exercises.slice(0, 4).map(n => `<span class="chip">${esc(n)}</span>`).join('')}${nxt.exercises.length > 4 ? `<span class="chip">+${nxt.exercises.length - 4}</span>` : ''}</div>` : '<div class="mt"></div>'}
        <button class="btn primary lg block" data-act="start" data-plan="${esc(nxt.id)}">${ic('play')}Iniciar treino</button>
      </div>` : `<div class="card empty">${ic('clip')}<b>Nenhuma ficha ainda</b>Crie uma ficha com seus exercícios ou comece um treino livre.
        <div class="mt"><button class="btn primary" data-act="tab" data-tab="fichas">${ic('plus')}Criar ficha</button></div></div>`}
      ${others.length ? `<div>${lbl('clip', 'Outras fichas')}<div class="stack">${others.map(p => {
        const d = lastDoneOf(p.id);
        return `<div class="card item"><div class="tile">${ic('clip')}</div>
          <div class="body"><div class="title">${esc(p.name)}</div>
          <div class="muted small">${p.exercises.length} exercício${plural(p.exercises.length, '', 's')} · ${d ? ago(d) : 'nunca feito'}</div></div>
          <button class="btn primary sm" data-act="start" data-plan="${esc(p.id)}">${ic('play')}Iniciar</button></div>`;
      }).join('')}</div></div>` : ''}
      <button class="btn block" data-act="start" data-plan="">${ic('plus')}Treino livre</button>
      ${recent.length ? `<div>${lbl('clock', 'Últimos treinos')}<div class="stack">${recent.map(sessCard).join('')}</div></div>` : ''}
    </div>`;
  }

  function exCard(e, i, H) {
    const h = H.get(keyOf(e.name));
    const lst = h && last(h.items);
    const rec = h ? Math.max(0, ...h.items.map(x => x.maxKg)) : 0;
    const hint = lst
      ? `Última vez (${fmtShort(lst.date)}): ${setsText(lst.sets)}${rec ? ` · recorde ${fmt(rec)} kg` : ''}`
      : 'Primeira vez neste exercício';
    const ph = lst ? lst.sets : [];
    const done = e.sets.filter(s => s.done).length;
    return `<div class="card ex">
      <div class="between"><div class="name">${esc(e.name)}</div>
        <div class="row"><span class="badge" data-cnt="${i}">${done}/${e.sets.length}</span>
        <button class="btn ghost danger sm icon" data-act="rm-ex" data-i="${i}" aria-label="Remover exercício">${ic('trash')}</button></div></div>
      <div class="hint">${esc(hint)}</div>
      <div class="set-head"><span>#</span><span>kg</span><span>reps</span><span></span></div>
      ${e.sets.map((s, j) => {
        const p = ph[j] || last(ph);
        return `<div class="set${s.done ? ' done' : ''}"><span class="n">${j + 1}</span>
          <input inputmode="decimal" autocomplete="off" placeholder="${p && p.kg ? fmt(p.kg) : '0'}" value="${s.kg ? fmt(s.kg).replace(/\./g, '') : ''}" data-in="kg" data-i="${i}" data-j="${j}" aria-label="Carga em kg, série ${j + 1}">
          <input inputmode="numeric" autocomplete="off" placeholder="${p && p.reps ? p.reps : '0'}" value="${s.reps || ''}" data-in="reps" data-i="${i}" data-j="${j}" aria-label="Repetições, série ${j + 1}">
          <button class="chk" data-act="toggle-set" data-i="${i}" data-j="${j}" aria-label="Série feita">${ic('check')}</button></div>`;
      }).join('')}
      <div class="row mt"><button class="btn sm grow" data-act="add-set" data-i="${i}">${ic('plus')}Série</button>
        ${e.sets.length > 1 ? `<button class="btn ghost sm" data-act="rm-set" data-i="${i}">${ic('minus')}Série</button>` : ''}</div>
    </div>`;
  }

  function vWorkout() {
    const a = S.active, H = history(), c = setsCount(a);
    return `<div class="stack">
      <div class="between"><div><div class="eyebrow">${fmtDay(a.date)} · início ${fmtTime(a.start)}</div><h1 class="h1">${esc(a.planName || 'Treino livre')}</h1></div>
        <div class="clock">${ic('clock')}<span id="elapsed">${elapsed()}</span></div></div>
      <div><div class="prog"><i id="wprog" style="width:${c.t ? Math.round(c.d / c.t * 100) : 0}%"></i></div>
        <div class="muted small mt" id="wcnt" style="margin-top:6px">${c.d} de ${c.t} séries</div></div>
      ${a.entries.map((e, i) => exCard(e, i, H)).join('')}
      <div class="card">${lbl('plus', 'Adicionar exercício')}
        <div class="row"><input id="newEx" list="exlist" maxlength="60" placeholder="Nome do exercício" autocomplete="off" data-enter="add-ex">
        <button class="btn" data-act="add-ex">Adicionar</button></div></div>
      <div class="card"><label class="label" for="note">Observações</label>
        <textarea id="note" rows="2" maxlength="500" data-in="note" placeholder="Como foi o treino?">${esc(a.note)}</textarea></div>
      <button class="btn primary lg block" data-act="finish">${ic('check')}Finalizar treino</button>
      <button class="btn ghost danger block" data-act="discard">Descartar treino</button>
    </div>`;
  }
  function updateProgress() {
    const a = S.active;
    if (!a) return;
    const c = setsCount(a);
    a.entries.forEach((e, i) => { const b = $(`[data-cnt="${i}"]`); if (b) b.textContent = `${e.sets.filter(s => s.done).length}/${e.sets.length}`; });
    const bar = $('#wprog'); if (bar) bar.style.width = (c.t ? Math.round(c.d / c.t * 100) : 0) + '%';
    const t = $('#wcnt'); if (t) t.textContent = `${c.d} de ${c.t} séries`;
  }

  function sessCard(s) {
    const open = ui.open === s.id;
    const d = parseYmd(s.date);
    const vol = sessVolume(s);
    const meta = [fmtTime(s.start) + (s.end ? ' · ' + fmtDur(s.end - s.start) : ''), `${s.entries.length} exerc.`, vol ? `${fmt(vol)} kg` : ''].filter(Boolean).join(' · ');
    return `<div class="card stack">
      <div class="between sess-head" data-act="sess-toggle" data-id="${esc(s.id)}">
        <div class="row"><div class="date"><b>${pad(d.getDate())}</b><span>${WD[d.getDay()]}</span></div>
          <div><div class="title">${esc(s.planName || 'Treino livre')}</div><div class="muted small">${esc(meta)}</div></div></div>
        ${ic(open ? 'up' : 'down', 'chev')}</div>
      ${open ? `<div>${s.entries.map(e => `<div class="ex-line"><span class="nm">${esc(e.name)}</span><span class="sets-line">${esc(setsText(e.sets.filter(x => x.done)))}</span></div>`).join('')}</div>
        ${s.note ? `<div class="muted small">“${esc(s.note)}”</div>` : ''}
        <button class="btn ghost danger sm" data-act="sess-del" data-id="${esc(s.id)}">${ic('trash')}Excluir treino</button>` : ''}
    </div>`;
  }

  /* ---------- tela: Fichas ---------- */
  function vFichas() {
    if (ui.plan) return vPlanEdit();
    return `<div class="stack">
      <div class="between"><h1 class="h1">Fichas</h1><button class="btn primary sm" data-act="plan-new">${ic('plus')}Nova ficha</button></div>
      ${S.plans.length ? S.plans.map(p => `<div class="card item" data-act="plan-edit" data-id="${esc(p.id)}">
        <div class="tile">${ic('clip')}</div>
        <div class="body"><div class="title">${esc(p.name)}</div>
        <div class="muted small">${p.exercises.length ? esc(p.exercises.slice(0, 3).join(', ') + (p.exercises.length > 3 ? '…' : '')) : 'Sem exercícios'}</div></div>
        ${ic('right', 'chev')}</div>`).join('')
        : `<div class="card empty">${ic('clip')}<b>Monte sua primeira ficha</b>Ex.: Treino A (peito e tríceps), Treino B (costas e bíceps)...</div>`}
    </div>`;
  }
  function vPlanEdit() {
    const p = S.plans.find(x => x.id === ui.plan);
    if (!p) { ui.plan = null; return vFichas(); }
    return `<div class="stack">
      <div class="between"><button class="btn ghost sm" data-act="plan-back">${ic('back')}Fichas</button>
        <button class="btn ghost danger sm" data-act="plan-del">${ic('trash')}Excluir</button></div>
      <div class="card"><label class="label" for="pname">Nome da ficha</label>
        <input id="pname" maxlength="40" value="${esc(p.name)}" data-in="plan-name"></div>
      <div class="card">${lbl('dumbbell', 'Exercícios')}
        ${p.exercises.length ? p.exercises.map((n, i) => `<div class="ex-row"><span>${esc(n)}</span>
          <button class="btn ghost sm" data-act="plan-up" data-i="${i}" aria-label="Subir"${i === 0 ? ' disabled' : ''}>${ic('up')}</button>
          <button class="btn ghost sm" data-act="plan-down" data-i="${i}" aria-label="Descer"${i === p.exercises.length - 1 ? ' disabled' : ''}>${ic('down')}</button>
          <button class="btn ghost danger sm" data-act="plan-rm-ex" data-i="${i}" aria-label="Remover">${ic('x')}</button></div>`).join('')
          : '<p class="muted small">Nenhum exercício ainda.</p>'}
        <div class="row mt"><input id="newEx" list="exlist" maxlength="60" placeholder="Novo exercício" autocomplete="off" data-enter="plan-add-ex">
        <button class="btn" data-act="plan-add-ex">${ic('plus')}Adicionar</button></div></div>
      <button class="btn primary lg block" data-act="start" data-plan="${esc(p.id)}">${ic('play')}Iniciar esta ficha</button>
    </div>`;
  }

  /* ---------- tela: Evolução ---------- */
  function vEvo() {
    const H = history();
    if (ui.evo && H.has(ui.evo)) return vEvoDetail(H.get(ui.evo));
    ui.evo = null;
    if (!H.size) return `<div class="stack"><h1 class="h1">Evolução</h1><div class="card empty">${ic('trend')}<b>Ainda sem dados</b>Finalize um treino para ver sua evolução por exercício.</div></div>`;
    const list = [...H.values()].sort((a, b) => last(b.items).start - last(a.items).start);
    const prs = prEvents().filter(e => Date.now() - e.start < 30 * DAY).slice(0, 5);
    return `<div class="stack">
      <h1 class="h1">Evolução</h1>
      ${prs.length ? `<div class="card hl">${lbl('award', 'Recordes dos últimos 30 dias')}
        ${prs.map(e => `<div class="ex-line"><span>${esc(prText(e))}</span><span class="muted small">${fmtShort(e.date)}</span></div>`).join('')}</div>` : ''}
      ${list.map(h => {
        const bw = isBodyweight(h), m = bw ? METRICS.reps : METRICS.kg;
        const vals = h.items.map(m.get), cur = last(vals), d = cur - vals[0];
        const badge = h.items.length < 2 ? '<span class="badge">1ª sessão</span>'
          : d > 0 ? `<span class="badge ok">${ic('up')}${sgn(d, m.unit)}</span>` : d < 0 ? `<span class="badge bad">${ic('down')}${sgn(d, m.unit)}</span>` : '<span class="badge">igual</span>';
        return `<div class="card item" data-act="evo-open" data-key="${esc(h.key)}">
          <div class="body"><div class="title">${esc(h.name)}</div>
          <div class="muted small">${fmt(cur)}${m.unit} · ${h.items.length} sessão${plural(h.items.length, '', 'ões')}</div></div>
          ${spark(vals.slice(-12))}${badge}</div>`;
      }).join('')}
    </div>`;
  }
  function vEvoDetail(h) {
    const bw = isBodyweight(h);
    const mk = bw ? 'reps' : (ui.metric === 'reps' ? 'kg' : ui.metric);
    const m = METRICS[mk];
    let best = 0;
    const pts = h.items.map((it, i) => {
      const y = m.get(it), pr = i > 0 && y > best;
      best = Math.max(best, y);
      return { y, pr, short: fmtShort(it.date), label: `${fmtDay(it.date)}: ${fmt(y)}${m.unit}`, it };
    });
    const view = pts.slice(-30);
    const sel = ui.evoSel >= 0 && ui.evoSel < view.length ? ui.evoSel : view.length - 1;
    const first = pts[0], cur = last(pts), prev = pts.length > 1 ? pts[pts.length - 2] : null;
    const top = Math.max(...pts.map(p => p.y));
    const dFirst = cur.y - first.y, dPrev = prev ? cur.y - prev.y : 0;
    const cls = d => d > 0 ? 'up' : d < 0 ? 'down' : 'muted';
    return `<div class="stack">
      <div class="between"><button class="btn ghost sm" data-act="evo-back">${ic('back')}Evolução</button></div>
      <h1 class="h1">${esc(h.name)}</h1>
      <div class="stats">
        <div class="stat">${ic('award')}<b>${fmt(top)}</b><span>recorde (${m.unit.trim()})</span></div>
        <div class="stat">${ic('zap')}<b>${fmt(cur.y)}</b><span>última (${m.unit.trim()})</span></div>
        <div class="stat">${ic('cal')}<b>${h.items.length}</b><span>sessões</span></div>
      </div>
      ${pts.length > 1 ? `<div class="card stack">
        <div class="between"><span>Desde a 1ª vez (${fmtShort(first.it.date)})</span><b class="${cls(dFirst)}">${dFirst === 0 ? 'igual' : sgn(dFirst, m.unit)}</b></div>
        <div class="between"><span>Em relação ao treino anterior</span><b class="${cls(dPrev)}">${dPrev === 0 ? 'igual' : sgn(dPrev, m.unit)}</b></div></div>` : ''}
      ${bw ? '' : `<div class="seg" role="group">${['kg', 'e1rm', 'vol'].map(k => `<button data-act="evo-metric" data-m="${k}" class="${k === mk ? 'on' : ''}">${METRICS[k].label}</button>`).join('')}</div>`}
      <div class="card">${chart(view, { act: 'evo-point', sel, id: 'gEvo' })}
        <div class="muted small" style="text-align:center;margin-top:6px">${esc(view[sel].label)}${view[sel].pr ? ' · recorde' : ''}</div></div>
      <div class="card">${lbl('clock', 'Sessões')}
        ${[...pts].reverse().map(p => `<div class="ex-line"><span class="nm">${fmtDay(p.it.date)}${p.pr ? ' <span class="badge pr">PR</span>' : ''}</span><span class="sets-line">${esc(setsText(p.it.sets))}</span></div>`).join('')}</div>
    </div>`;
  }

  /* ---------- tela: Histórico ---------- */
  function vHist() {
    const { y, m } = ui.cal;
    const dim = new Date(y, m + 1, 0).getDate();
    const off = (new Date(y, m, 1).getDay() + 6) % 7;
    const counts = {};
    S.sessions.forEach(s => { counts[s.date] = (counts[s.date] || 0) + 1; });
    const today = ymd();
    let cells = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<div class="wd">${d}</div>`).join('');
    for (let i = 0; i < off; i++) cells += '<button class="blank" tabindex="-1" aria-hidden="true"></button>';
    let inMonth = 0;
    for (let d = 1; d <= dim; d++) {
      const k = `${y}-${pad(m + 1)}-${pad(d)}`;
      if (counts[k]) inMonth += counts[k];
      cells += `<button data-act="day-pick" data-d="${k}" class="${counts[k] ? 'has ' : ''}${k === today ? 'today ' : ''}${ui.day === k ? 'sel' : ''}" aria-label="${d} de ${MONTHS[m]}${counts[k] ? ', treinou' : ''}">${d}</button>`;
    }
    let list = [...S.sessions].sort((a, b) => b.start - a.start);
    if (ui.day) list = list.filter(s => s.date === ui.day);
    const shown = list.slice(0, ui.limit);
    return `<div class="stack">
      <h1 class="h1">Histórico</h1>
      <div class="card stack">
        <div class="between"><button class="btn ghost sm icon" data-act="cal-prev" aria-label="Mês anterior">${ic('left')}</button>
          <div style="text-align:center"><b>${MONTHS[m]} ${y}</b><div class="muted small">${inMonth} treino${plural(inMonth, '', 's')} no mês</div></div>
          <button class="btn ghost sm icon" data-act="cal-next" aria-label="Próximo mês">${ic('right')}</button></div>
        <div class="cal">${cells}</div>
      </div>
      ${ui.day ? `<div class="between"><b>${fmtDay(ui.day)}</b><button class="btn ghost sm" data-act="day-clear">Ver todos</button></div>` : ''}
      ${shown.length ? shown.map(sessCard).join('') : `<div class="card empty">${ic('cal')}<b>Nenhum treino ${ui.day ? 'neste dia' : 'registrado'}</b></div>`}
      ${list.length > shown.length ? `<button class="btn block" data-act="more">Mostrar mais</button>` : ''}
    </div>`;
  }

  /* ---------- tela: Perfil ---------- */
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  function vPerfil() {
    const ws = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
    const pts = ws.map(w => ({ y: w.kg, short: fmtShort(w.date), label: `${fmtDay(w.date)}: ${fmt(w.kg)} kg` })).slice(-30);
    const sel = ui.wSel >= 0 && ui.wSel < pts.length ? ui.wSel : pts.length - 1;
    const d = ws.length > 1 ? last(ws).kg - ws[0].kg : 0;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const th = S.settings.theme;
    return `<div class="stack">
      <h1 class="h1">Perfil</h1>
      <div class="card stack">
        <div><label class="label" for="pn">Seu nome (opcional)</label><input id="pn" maxlength="30" value="${esc(S.settings.name)}" data-ch="name" autocomplete="off"></div>
        <div><label class="label" for="pr">Descanso entre séries</label>
        <select id="pr" data-ch="rest">${[[0, 'Desligado'], [30, '30 s'], [60, '1 min'], [90, '1 min 30'], [120, '2 min'], [180, '3 min'], [240, '4 min']].map(([v, l]) => `<option value="${v}"${S.settings.rest === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><span class="label">Aparência</span>
        <div class="seg" role="group">${[['auto', 'Auto', 'auto'], ['dark', 'Escuro', 'moon'], ['light', 'Claro', 'sun']].map(([v, l, i]) => `<button data-act="theme" data-v="${v}" class="${th === v ? 'on' : ''}">${ic(i)}${l}</button>`).join('')}</div></div>
      </div>

      <div class="card stack">${lbl('scale', 'Peso corporal')}
        <div class="row"><input id="wkg" inputmode="decimal" placeholder="kg" aria-label="Peso em kg" data-enter="weight-add">
        <input id="wdt" type="date" value="${ymd()}" max="${ymd()}" aria-label="Data" style="max-width:150px">
        <button class="btn primary" data-act="weight-add" aria-label="Salvar peso">${ic('check')}</button></div>
        ${pts.length > 1 ? `${chart(pts, { act: 'wt-point', sel, id: 'gPeso' })}<div class="muted small" style="text-align:center;margin-top:6px">${esc(pts[sel].label)} · variação total ${sgn(d, ' kg')}</div>` : ''}
        ${ws.length ? `<div>${[...ws].reverse().slice(0, 6).map(w => `<div class="ex-line"><span>${fmtDay(w.date)}</span><span>${fmt(w.kg)} kg <button class="btn ghost danger sm icon" data-act="weight-del" data-d="${w.date}" aria-label="Apagar">${ic('x')}</button></span></div>`).join('')}</div>` : '<p class="muted small">Nenhum registro de peso. É opcional.</p>'}
      </div>

      <div class="card stack">${lbl('share', 'Compartilhar')}
        <p class="muted small">Só sai do seu aparelho o que você mandar. O resumo traz treinos e recordes dos últimos 30 dias.</p>
        <button class="btn block" data-act="share-summary">${ic('share')}Enviar resumo para um amigo</button></div>

      <div class="card stack">${lbl('save', 'Backup')}
        <p class="muted small">Seus dados ficam só neste aparelho. Se limpar o navegador ou trocar de celular, eles somem. Exporte de vez em quando e guarde o arquivo (Drive, WhatsApp, e-mail).${S.settings.lastBackup ? ` Último backup: ${fmtShort(ymd(new Date(S.settings.lastBackup)))}.` : ''}</p>
        <div class="row"><button class="btn grow" data-act="export">${ic('download')}Exportar</button><button class="btn grow" data-act="import">${ic('upload')}Importar</button></div></div>

      ${standalone() ? '' : `<div class="card stack">${lbl('phone', 'Instalar no celular')}
        ${deferredInstall ? `<button class="btn primary block" data-act="install">${ic('download')}Instalar app</button>`
          : ios ? '<p class="muted small">No iPhone: abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>'
          : '<p class="muted small">No Android (Chrome): menu ⋮ e depois “Instalar app” ou “Adicionar à tela inicial”.</p>'}</div>`}

      <button class="btn ghost danger block" data-act="wipe">${ic('trash')}Apagar todos os meus dados</button>
      <p class="muted small" style="text-align:center">${ic('shield')} Funciona sem internet. Nenhum dado é enviado a servidor algum.</p>
    </div>`;
  }

  /* ---------- render ---------- */
  const views = { hoje: vHoje, fichas: vFichas, evolucao: vEvo, historico: vHist, perfil: vPerfil };
  function render(anim) {
    const y = window.scrollY, view = $('#view');
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
    view.classList.remove('enter');
    view.innerHTML = views[ui.tab]();
    if (anim) { void view.offsetWidth; view.classList.add('enter'); }
    window.scrollTo(0, anim ? 0 : y);
    renderBanner();
    refreshList();
    syncWake();
  }
  function renderBanner() {
    let h = '';
    if (storageFailed) h += `<div class="card banner"><b>Não consegui salvar.</b> <span class="muted small">Este navegador está bloqueando o armazenamento (aba privada?). Use uma aba normal ou exporte um backup.</span></div>`;
    else if (!S.active && ui.tab === 'hoje' && S.sessions.length >= 3 && Date.now() - S.settings.lastBackup > 14 * DAY)
      h += `<div class="card banner stack"><div><b>Faça um backup</b><div class="muted small">${S.settings.lastBackup ? 'Faz mais de 2 semanas do último backup.' : 'Você ainda não exportou um backup.'} Seus dados só existem neste aparelho.</div></div><button class="btn sm" data-act="export">${ic('download')}Exportar agora</button></div>`;
    $('#banner').innerHTML = h;
  }
  function refreshList() {
    const names = new Set(COMMON);
    S.plans.forEach(p => p.exercises.forEach(n => names.add(n)));
    S.sessions.forEach(s => s.entries.forEach(e => names.add(e.name)));
    $('#exlist').innerHTML = [...names].sort((a, b) => a.localeCompare(b, 'pt-BR')).map(n => `<option value="${esc(n)}">`).join('');
  }

  /* ---------- descanso e tela ligada ---------- */
  function startRest(sec) {
    if (!sec) return;
    rest = { end: Date.now() + sec * 1000, total: sec, fired: false };
    drawRest();
  }
  function drawRest() {
    const el = $('#rest');
    const hide = () => { rest = null; el.hidden = true; el.dataset.mode = ''; };
    if (!rest) return hide();
    const left = Math.ceil((rest.end - Date.now()) / 1000);
    const mode = left > 0 ? 'run' : 'done';
    if (mode === 'done') {
      if (!rest.fired) { rest.fired = true; rest.hideAt = Date.now() + 8000; try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { } }
      if (Date.now() > rest.hideAt) return hide();
    }
    el.hidden = false;
    /* só troca o HTML quando o modo muda, para não perder toques nos botões */
    if (el.dataset.mode !== mode) {
      el.dataset.mode = mode;
      el.innerHTML = mode === 'run'
        ? `${ic('clock')}<span class="t"></span><button data-act="rest-add" data-s="-15">−15</button><button data-act="rest-add" data-s="15">+15</button><button data-act="rest-stop" aria-label="Fechar">${ic('x')}</button><div class="rb"><i></i></div>`
        : `<span class="t">Bora! Descanso acabou</span><button data-act="rest-stop">OK</button>`;
    }
    if (mode === 'run') {
      $('.t', el).textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
      $('.rb i', el).style.width = Math.max(0, Math.min(100, (rest.end - Date.now()) / (rest.total * 10))) + '%';
    }
  }
  setInterval(() => {
    if (rest) drawRest();
    const el = $('#elapsed');
    if (el && S.active) el.textContent = elapsed();
  }, 500);

  let wl = null;
  async function syncWake() {
    try {
      if (S.active && !wl && document.visibilityState === 'visible' && navigator.wakeLock) {
        wl = await navigator.wakeLock.request('screen');
        wl.addEventListener('release', () => { wl = null; });
      } else if (!S.active && wl) { await wl.release(); wl = null; }
    } catch (e) { wl = null; }
  }
  document.addEventListener('visibilitychange', syncWake);

  /* ---------- ações ---------- */
  const A = {};
  const go = tab => { ui.tab = tab; render(true); };
  A.tab = d => { if (d.tab === ui.tab && !ui.plan && !ui.evo) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } if (d.tab === 'fichas') ui.plan = null; if (d.tab === 'evolucao') ui.evo = null; go(d.tab); };

  function newEntry(name, H) {
    const h = H.get(keyOf(name)), lst = h && last(h.items);
    return { name: cleanName(name), sets: lst ? lst.sets.map(s => ({ kg: s.kg, reps: s.reps, done: false })) : [0, 1, 2].map(() => ({ kg: 0, reps: 0, done: false })) };
  }
  A.start = d => {
    if (!S.active) {
      const p = S.plans.find(x => x.id === d.plan), H = history();
      S.active = { id: uid(), date: ymd(), start: Date.now(), end: 0, planId: p ? p.id : '', planName: p ? p.name : 'Treino livre', entries: p ? p.exercises.map(n => newEntry(n, H)) : [], note: '' };
      saveNow();
    }
    go('hoje');
  };
  A.discard = async () => {
    if (!await ask('O que você registrou neste treino será perdido.', 'Descartar', 'Descartar treino?')) return;
    S.active = null; rest = null; drawRest(); saveNow(); render(true);
  };
  A['add-ex'] = () => {
    const inp = $('#newEx'), n = cleanName(inp.value);
    if (!n) return inp.focus();
    S.active.entries.push(newEntry(n, history()));
    saveNow(); render();
    window.scrollTo(0, document.body.scrollHeight);
  };
  A['rm-ex'] = async d => {
    const e = S.active.entries[+d.i];
    if (!await ask(`Remover “${e.name}” deste treino?`, 'Remover')) return;
    S.active.entries.splice(+d.i, 1); saveNow(); render();
  };
  A['add-set'] = d => {
    const e = S.active.entries[+d.i], p = last(e.sets);
    e.sets.push({ kg: p ? p.kg : 0, reps: p ? p.reps : 0, done: false });
    saveNow(); render();
  };
  A['rm-set'] = d => { const e = S.active.entries[+d.i]; if (e.sets.length > 1) e.sets.pop(); saveNow(); render(); };
  A['toggle-set'] = (d, el) => {
    const s = S.active.entries[+d.i].sets[+d.j];
    s.done = !s.done;
    el.closest('.set').classList.toggle('done', s.done);
    if (s.done) {
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      startRest(S.settings.rest);
    }
    updateProgress();
    save();
  };
  A.finish = async () => {
    const a = S.active;
    const entries = a.entries.map(e => ({ name: e.name, sets: e.sets.filter(s => s.done && (s.kg > 0 || s.reps > 0)) })).filter(e => e.sets.length);
    if (!entries.length) {
      if (await ask('Nenhuma série foi marcada como feita. Descartar este treino?', 'Descartar')) { S.active = null; rest = null; drawRest(); saveNow(); render(true); }
      return;
    }
    const skipped = a.entries.reduce((n, e) => n + e.sets.filter(s => !s.done && s.kg > 0 && s.reps > 0).length, 0);
    if (skipped && !await ask(`${skipped} série${plural(skipped, '', 's')} preenchida${plural(skipped, '', 's')} sem marcar ${plural(skipped, 'ficará', 'ficarão')} de fora do registro.`, 'Finalizar assim mesmo', 'Finalizar treino?')) return;
    const s = { id: a.id, date: a.date, start: a.start, end: Date.now(), planId: a.planId, planName: a.planName, entries, note: a.note };
    S.sessions.push(s); S.active = null; rest = null; drawRest(); saveNow(); render(true);
    const prs = prEvents().filter(e => e.sid === s.id);
    const vol = sessVolume(s);
    modal({
      title: 'Treino salvo',
      html: `${prs.length ? `<div class="trophy">${ic('award')}</div>` : ''}
        <p class="muted">${fmtDur(s.end - s.start)} · ${entries.length} exercício${plural(entries.length, '', 's')}${vol ? ` · ${fmt(vol)} kg de volume` : ''}</p>
        ${prs.length ? `<div class="card hl mt">${lbl('award', 'Novos recordes')}${prs.map(e => `<div class="ex-line"><span>${esc(prText(e))}</span></div>`).join('')}</div>` : ''}`,
      actions: [{ label: 'Fechar', value: true, cls: 'primary' }]
    });
  };

  /* fichas */
  A['plan-new'] = () => {
    const p = { id: uid(), name: S.plans.length < 26 ? `Treino ${String.fromCharCode(65 + S.plans.length)}` : 'Treino', exercises: [] };
    S.plans.push(p); ui.plan = p.id; saveNow(); render(true);
  };
  A['plan-edit'] = d => { ui.plan = d.id; render(true); };
  A['plan-back'] = () => { ui.plan = null; render(true); };
  A['plan-del'] = async () => {
    const p = S.plans.find(x => x.id === ui.plan);
    if (!await ask(`Excluir a ficha “${p.name}”? Os treinos já feitos continuam no histórico.`, 'Excluir')) return;
    S.plans = S.plans.filter(x => x.id !== p.id); ui.plan = null; saveNow(); render(true);
  };
  A['plan-add-ex'] = () => {
    const p = S.plans.find(x => x.id === ui.plan), inp = $('#newEx'), n = cleanName(inp.value);
    if (!n) return inp.focus();
    if (!p.exercises.some(x => keyOf(x) === keyOf(n))) p.exercises.push(n);
    saveNow(); render(); $('#newEx').focus();
  };
  A['plan-rm-ex'] = d => { S.plans.find(x => x.id === ui.plan).exercises.splice(+d.i, 1); saveNow(); render(); };
  const move = (d, by) => {
    const a = S.plans.find(x => x.id === ui.plan).exercises, i = +d.i, j = i + by;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; saveNow(); render();
  };
  A['plan-up'] = d => move(d, -1);
  A['plan-down'] = d => move(d, 1);

  /* evolução */
  A['evo-open'] = d => { ui.evo = d.key; ui.evoSel = -1; ui.metric = 'kg'; render(true); };
  A['evo-back'] = () => { ui.evo = null; render(true); };
  A['evo-metric'] = d => { ui.metric = d.m; ui.evoSel = -1; render(); };
  A['evo-point'] = d => { ui.evoSel = +d.i; render(); };
  A['wt-point'] = d => { ui.wSel = +d.i; render(); };

  /* histórico */
  A['cal-prev'] = () => { ui.cal.m--; if (ui.cal.m < 0) { ui.cal.m = 11; ui.cal.y--; } render(); };
  A['cal-next'] = () => { ui.cal.m++; if (ui.cal.m > 11) { ui.cal.m = 0; ui.cal.y++; } render(); };
  A['day-pick'] = d => { ui.day = ui.day === d.d ? null : d.d; ui.limit = 20; render(); };
  A['day-clear'] = () => { ui.day = null; render(); };
  A.more = () => { ui.limit += 20; render(); };
  A['sess-toggle'] = d => { ui.open = ui.open === d.id ? null : d.id; render(); };
  A['sess-del'] = async d => {
    if (!await ask('Esse treino será removido do histórico e da evolução.', 'Excluir', 'Excluir treino?')) return;
    S.sessions = S.sessions.filter(s => s.id !== d.id); ui.open = null; saveNow(); render();
  };

  /* perfil */
  A.theme = d => { S.settings.theme = d.v; saveNow(); applyTheme(); render(); };
  A['weight-add'] = () => {
    const kg = num($('#wkg').value), date = $('#wdt').value;
    if (!kg || kg > 500 || !isYmd(date)) return toast('Informe um peso válido');
    S.weights = S.weights.filter(w => w.date !== date);
    S.weights.push({ date, kg }); saveNow(); ui.wSel = -1; render(); toast('Peso salvo');
  };
  A['weight-del'] = d => { S.weights = S.weights.filter(w => w.date !== d.d); saveNow(); render(); };
  A.install = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => { });
    deferredInstall = null; render();
  };
  A['rest-add'] = d => { if (rest) { rest.end += +d.s * 1000; rest.total = Math.max(rest.total, (rest.end - Date.now()) / 1000); rest.fired = false; drawRest(); } };
  A['rest-stop'] = () => { rest = null; drawRest(); };

  A.export = async () => {
    saveNow();
    const name = `treino-backup-${ymd()}.json`;
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Backup de treinos' });
        S.settings.lastBackup = Date.now(); saveNow(); render(); return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    S.settings.lastBackup = Date.now(); saveNow(); render(); toast('Backup exportado');
  };
  A.import = () => { const f = $('#file'); f.value = ''; f.click(); };
  async function importFile(file) {
    let data;
    try { data = clean(JSON.parse(await file.text())); } catch (e) { return toast('Arquivo inválido'); }
    if (!data.sessions.length && !data.plans.length && !data.weights.length) return toast('Esse arquivo não tem dados de treino');
    const info = `${data.sessions.length} treino${plural(data.sessions.length, '', 's')}, ${data.plans.length} ficha${plural(data.plans.length, '', 's')}, ${data.weights.length} registro${plural(data.weights.length, '', 's')} de peso.`;
    const v = await modal({
      title: 'Importar backup', html: `<p class="muted">O arquivo tem ${esc(info)}</p>`,
      actions: [{ label: 'Mesclar com o que já tenho', value: 'merge', cls: 'primary' }, { label: 'Substituir tudo', value: 'replace', cls: 'danger' }, { label: 'Cancelar', value: null, cls: 'ghost' }]
    });
    if (v === 'replace') { S = data; }
    else if (v === 'merge') {
      const byId = (a, b) => { const m = new Map(a.map(i => [i.id, i])); b.forEach(i => { if (!m.has(i.id)) m.set(i.id, i); }); return [...m.values()]; };
      S.plans = byId(S.plans, data.plans);
      S.sessions = byId(S.sessions, data.sessions);
      const w = new Map(data.weights.map(x => [x.date, x])); S.weights.forEach(x => w.set(x.date, x)); S.weights = [...w.values()];
      if (!S.settings.name) S.settings.name = data.settings.name;
    } else return;
    saveNow(); applyTheme(); render(true); toast('Backup importado');
  }
  A.wipe = async () => {
    if (!await ask('Isso apaga treinos, fichas e peso deste aparelho. Não dá para desfazer (a não ser por um backup).', 'Apagar tudo', 'Apagar tudo?')) return;
    S = blank(); rest = null; drawRest(); saveNow(); applyTheme(); ui.plan = ui.evo = ui.day = ui.open = null; render(true); toast('Dados apagados');
  };
  A['share-summary'] = async () => {
    const since = Date.now() - 30 * DAY;
    const ss = S.sessions.filter(s => s.start >= since);
    const prs = prEvents().filter(e => e.start >= since).slice(0, 6);
    const wk = weekStreak();
    const lines = ['Meus treinos (últimos 30 dias)', `• ${ss.length} treino${plural(ss.length, '', 's')}`, `• ${wk} semana${plural(wk, '', 's')} seguida${plural(wk, '', 's')}`];
    if (prs.length) { lines.push('', 'Recordes:'); prs.forEach(e => lines.push('• ' + prText(e))); }
    const text = lines.join('\n');
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text); toast('Resumo copiado');
    } catch (e) { if (!e || e.name !== 'AbortError') toast('Não consegui compartilhar'); }
  };

  /* ---------- eventos ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t || !A[t.dataset.act]) return;
    A[t.dataset.act](t.dataset, t, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const t = e.target.closest('[data-enter]');
    if (t && A[t.dataset.enter]) { e.preventDefault(); A[t.dataset.enter](t.dataset, t, e); }
  });
  document.addEventListener('focusin', e => {
    const t = e.target;
    if (t.matches && t.matches('.set input')) setTimeout(() => { try { t.select(); } catch (x) { } }, 0);
  });
  document.addEventListener('input', e => {
    const t = e.target, k = t.dataset && t.dataset.in;
    if (!k) return;
    if (k === 'kg' || k === 'reps') {
      const s = S.active.entries[+t.dataset.i].sets[+t.dataset.j];
      s[k] = k === 'reps' ? Math.round(num(t.value)) : num(t.value);
    } else if (k === 'note') S.active.note = t.value.slice(0, 500);
    else if (k === 'plan-name') { const p = S.plans.find(x => x.id === ui.plan); if (p) p.name = cleanName(t.value).slice(0, 40) || 'Treino'; }
    save();
  });
  document.addEventListener('change', e => {
    const t = e.target, k = t.dataset && t.dataset.ch;
    if (k === 'name') S.settings.name = t.value.trim().slice(0, 30);
    else if (k === 'rest') S.settings.rest = Number(t.value);
    else if (t.id === 'file' && t.files[0]) return importFile(t.files[0]);
    else return;
    saveNow();
  });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (ui.tab === 'perfil') render(); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; });

  /* ---------- início ---------- */
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
  applyTheme();
  render(true);
})();
