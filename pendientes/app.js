'use strict';

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Samsung Internet dice que sabe dictar, pero no devuelve nada: allí se graba audio
  const SR = /SamsungBrowser/i.test(navigator.userAgent) ? null : (window.SpeechRecognition || window.webkitSpeechRecognition);
  const CAN_RECORD = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const SPLIT = /\s*\bnueva tarea\b[\s,.;:]*/i;
  const MAX_REC = 5 * 60; // segundos
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const STANDALONE = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const BARS = 28;
  const TAG_RE = /#[\p{L}\p{N}_-]+/gu;
  const PALETTE = ['#007aff', '#af52de', '#ff2d55', '#ff9500', '#30b0c7', '#5856d6', '#34c759', '#a2845e'];
  const REPEAT = { daily: 'Cada día', weekdays: 'Entre semana', weekly: 'Cada semana', monthly: 'Cada mes' };

  const ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l3.8 3.8L18 8"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8l-5.2 2.7 1-5.7-4.2-4.1 5.8-.9z"/></svg>',
    starF: '<svg class="star-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8l-5.2 2.7 1-5.7-4.2-4.1 5.8-.9z"/></svg>',
    play: '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    pause: '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/></svg>',
    // tachar: una raya que cruza un renglón y acaba en check
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12h7.5M13 15.5l2.5 2.5 5-6"/><path d="M3.5 7h9M3.5 17h5" opacity=".55"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14.5 4.5 10 9 5.5M4.5 10h10.25a4.75 4.75 0 0 1 0 9.5H12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M9.25 6.5V5A1.75 1.75 0 0 1 11 3.25h2A1.75 1.75 0 0 1 14.75 5v1.5M6 6.5l.85 12.2a2 2 0 0 0 2 1.8h6.3a2 2 0 0 0 2-1.8L18 6.5M10 10.5v6M14 10.5v6"/></svg>',
    // mañana: amanecer · hoy: sol
    later: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19h18M6.75 19a5.25 5.25 0 0 1 10.5 0M12 3.25v5.5M9.5 5.75 12 3.25l2.5 2.5M4 13.25l1.5.9M20 13.25l-1.5.9"/></svg>',
    today: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.25"/><path d="M12 2.75v2.1M12 19.15v2.1M2.75 12h2.1M19.15 12h2.1M5.45 5.45l1.5 1.5M17.05 17.05l1.5 1.5M5.45 18.55l1.5-1.5M17.05 6.95l1.5-1.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.75" y="5" width="16.5" height="15.25" rx="3.25"/><path d="M3.75 9.75h16.5M8.25 3v4M15.75 3v4"/><path d="M8 13.75h.01M12 13.75h.01M16 13.75h.01M8 17h.01M12 17h.01" stroke-width="2.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="M12 7.5V12l3 2"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 11.5V10a4 4 0 0 1 4-4h11M16.5 3l3 3-3 3M19.5 12.5V14a4 4 0 0 1-4 4h-11M7.5 21l-3-3 3-3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.5 4.2-2 1.4a11 11 0 0 0 6.2 6.2l1.4-2 4.2 1.5v2.6a2.1 2.1 0 0 1-2.3 2.1A16.5 16.5 0 0 1 4.5 5.8a2.1 2.1 0 0 1 2.1-2.3z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-3.6A7.75 7.75 0 1 1 8.6 18.6z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg>',
    fold: '<svg class="fold" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    // libreta de anillas con renglones
    list: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.25" y="3.25" width="14.5" height="17.5" rx="2.75"/><path d="M3.5 7.5h3.5M3.5 12h3.5M3.5 16.5h3.5M10.25 8.5h6M10.25 12h6M10.25 15.5h3.5"/></svg>',
    // sello con check: todo hecho
    party: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.9l2.2 1.6 2.7-.1.8 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.8 2.6-2.7-.1-2.2 1.6-2.2-1.6-2.7.1-.8-2.6-2.2-1.6.9-2.6-.9-2.6 2.2-1.6.8-2.6 2.7.1z"/><path d="M8.6 12.2l2.3 2.3 4.5-4.7"/></svg>',
    // renglones tachados: aún no hay nada hecho
    tray: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4"/><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5" opacity=".45"/><path d="M6.5 9h11"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"/><path d="M15.25 15.25 20 20"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14.5V3.5M7.75 7.75 12 3.5l4.25 4.25M7 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H17"/></svg>',
    plusbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    dots: '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><circle cx="12" cy="5.5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.5" r="1.7"/></svg>',
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4.5 7.5 19.5M16.5 4.5 15 19.5M4.5 9h15M4 15h15"/></svg>',
  };

  const SR_ERR = {
    'not-allowed': 'Da permiso al micrófono para poder dictar.',
    'service-not-allowed': 'El dictado no está disponible aquí.',
    'no-speech': 'No te he oído. Prueba otra vez.',
    'audio-capture': 'No encuentro el micrófono.',
    'network': 'El dictado necesita conexión a internet.',
    'language-not-supported': 'Este móvil no dicta en español.',
  };

  // ---------- Almacenamiento (IndexedDB: tareas y audios) ----------
  const db = (() => {
    let opening;
    const open = () => opening || (opening = new Promise((res, rej) => {
      const r = indexedDB.open('pendientes', 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('tasks', { keyPath: 'id' });
        r.result.createObjectStore('audio');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const run = async (store, mode, fn) => {
      const d = await open();
      return new Promise((res, rej) => {
        const tx = d.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => res(req && req.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
    };
    return {
      all: () => run('tasks', 'readonly', (s) => s.getAll()),
      put: (t) => run('tasks', 'readwrite', (s) => s.put(t)),
      putMany: (ts) => run('tasks', 'readwrite', (s) => { ts.forEach((t) => s.put(t)); }),
      del: (id) => run('tasks', 'readwrite', (s) => s.delete(id)),
      getAudio: (id) => run('audio', 'readonly', (s) => s.get(id)),
      putAudio: (id, a) => run('audio', 'readwrite', (s) => s.put(a, id)),
      delAudio: (id) => run('audio', 'readwrite', (s) => s.delete(id)),
    };
  })();

  const prefs = {
    get(k, d) { try { const v = localStorage.getItem('pendientes.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pendientes.' + k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
  };

  // ---------- Estado ----------
  const el = {
    nav: $('#nav'), bigTitle: $('#bigTitle'), today: $('#today'), summary: $('#summary'),
    ring: $('#ring'), ringTxt: $('#ringTxt'),
    searchBar: $('#searchBar'), search: $('#search'),
    installCard: $('#installCard'), seg: $('#seg'), tags: $('#tags'), sections: $('#sections'), tip: $('#tip'),
    empty: $('#empty'), emptyIc: $('#emptyIc'), emptyTitle: $('#emptyTitle'), emptyText: $('#emptyText'),
    countTodo: $('#countTodo'), countDone: $('#countDone'), clearDone: $('#clearDone'),
    composer: $('#composer'), input: $('#input'), action: $('#action'), hint: $('#hint'),
    rec: $('#rec'), recTitle: $('#recTitle'), recLive: $('#recLive'), recHint: $('#recHint'), wave: $('#wave'),
    toast: $('#toast'), toastMsg: $('#toastMsg'), toastUndo: $('#toastUndo'),
    edit: $('#edit'), editForm: $('#editForm'), editText: $('#editText'), editNote: $('#editNote'),
    editQuick: $('#editQuick'), dueChips: $('#dueChips'), editDate: $('#editDate'), editDateLabel: $('#editDateLabel'),
    editRepeat: $('#editRepeat'), editRepeatLabel: $('#editRepeatLabel'), editStar: $('#editStar'), editInfo: $('#editInfo'),
    menu: $('#menu'), voiceSeg: $('#voiceSeg'), voiceNote: $('#voiceNote'), importFile: $('#importFile'),
    installSheet: $('#installSheet'), installSteps: $('#installSteps'),
  };

  let tasks = [];
  let filter = 'todo';
  let query = '';
  let tagFilter = null;
  let session = null;      // dictado o grabación en curso
  let editing = null;
  let editDue = null;
  const fresh = new Set(); // ids recién creados (animación de entrada)
  let installPrompt = null;
  let lastGesture = 0;
  const fold = Object.assign({ crossed: false, future: true }, prefs.get('fold', {}));

  let voiceMode = prefs.get('voice', SR ? 'dictar' : 'audio');
  if (voiceMode === 'dictar' && !SR) voiceMode = 'audio';
  if (voiceMode === 'audio' && !CAN_RECORD) voiceMode = SR ? 'dictar' : null;

  // ---------- Utilidades ----------
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDur = (sec) => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED ? 0 : ms));
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const hm = (ts) => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dayStart = (ts) => { const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  const today0 = () => dayStart(Date.now());
  const addDays = (ts, n) => { const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime(); };
  const daysAgo = (ts) => Math.round((today0() - dayStart(ts)) / 864e5);
  const weekday = (ts) => new Date(ts).toLocaleDateString('es-ES', { weekday: 'long' });
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const isFuture = (t) => !t.done && t.due && t.due > today0();
  const isToday = (t) => !t.done && !isFuture(t);
  const crossedToday = (t) => t.done && t.doneAt && daysAgo(t.doneAt) === 0;
  const tagsOf = (t) => [...new Set((t.text.match(TAG_RE) || []).map((s) => s.toLowerCase()))];
  const byOrder = (a, b) => ((a.order ?? a.created) - (b.order ?? b.created)) || (a.created - b.created);

  function tagColor(tag) {
    let h = 0;
    for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }

  function vibrate(ms) {
    try {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch { /* nada */ }
  }

  function dayLabel(ts) {
    const n = daysAgo(ts);
    const d = new Date(ts);
    if (n === 0) return 'Hoy';
    if (n === 1) return 'Ayer';
    if (n > 1 && n < 7) return cap(weekday(ts));
    return cap(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).replace('.', ''));
  }

  function futureLabel(ts) {
    const n = -daysAgo(ts);
    if (n === 1) return 'Mañana';
    if (n === 2) return 'Pasado mañana';
    if (n < 7) return cap(weekday(ts));
    return cap(new Date(ts).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''));
  }

  // «para mañana», «para el viernes», «para el 12 nov»
  function whenWords(ts) {
    const n = -daysAgo(ts);
    if (n === 1) return 'mañana';
    if (n === 2) return 'pasado mañana';
    if (n < 7) return 'el ' + weekday(ts);
    return 'el ' + new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }

  // Lo que se quedó sin hacer de otro día
  function ageLabel(t) {
    const base = t.due || dayStart(t.created);
    const n = daysAgo(base);
    if (n < 1) return '';
    if (n === 1) return 'De ayer';
    if (n < 7) return 'Desde el ' + weekday(base);
    return 'Hace ' + n + ' días';
  }

  function bufToB64(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64ToBuf(b64) {
    const s = atob(b64);
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes.buffer;
  }

  // ---------- Entender «mañana», «importante», «todos los días»… ----------
  const WD = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
  const DATE_WORD = '(pasado mañana|mañana|hoy|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)';
  const RE_DATE_START = new RegExp('^(?:para\\s+)?(?:el\\s+)?' + DATE_WORD + '[,:.]?\\s+', 'i');
  const RE_DATE_END = new RegExp('[\\s,]+(?:para\\s+)?(?:el\\s+)?' + DATE_WORD + '[.!]?$', 'i');
  const NOT_BEFORE = /(?:^|\s)(?:de|del|la|esta|este|por|cada|los|las|al|hasta|desde)$/i;
  const RE_STAR = [/^(?:muy\s+)?importante[,:.]?\s+/i, /[\s,]+(?:es\s+)?(?:muy\s+)?importante[.!]?$/i];
  const RE_REPEAT = [
    [/[\s,]+(?:todos los días|cada día|a diario)[.!]?$/i, 'daily'],
    [/[\s,]+(?:entre semana|los días laborables|días laborables|de lunes a viernes)[.!]?$/i, 'weekdays'],
    [/[\s,]+(?:cada semana|todas las semanas)[.!]?$/i, 'weekly'],
    [/[\s,]+(?:cada mes|todos los meses)[.!]?$/i, 'monthly'],
  ];

  function dateFromWord(w) {
    const t = today0();
    const k = norm(w);
    if (k === 'hoy') return t;
    if (k === 'manana') return addDays(t, 1);
    if (k === 'pasado manana') return addDays(t, 2);
    const wd = WD[k];
    if (wd == null) return null;
    return addDays(t, ((wd - new Date(t).getDay() + 7) % 7) || 7);
  }

  function parseQuick(raw) {
    let s = raw.replace(/[ \t]+/g, ' ').trim();
    // las #etiquetas del final no estorban: se apartan y se vuelven a poner
    let tail = (s.match(/(?:\s+#[\p{L}\p{N}_-]+)+$/u) || [''])[0];
    if (tail && s.length > tail.length) s = s.slice(0, -tail.length);
    else tail = '';
    const cut = (m) => (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
    let due = null;
    let star = false;
    let repeat = null;
    for (let pass = 0; pass < 4; pass++) {
      let m;
      if (!star && (m = s.match(RE_STAR[1]) || s.match(RE_STAR[0])) && s.length > m[0].length) { star = true; s = cut(m); continue; }
      const rp = !repeat && RE_REPEAT.find(([re]) => re.test(s));
      if (rp) { const mm = s.match(rp[0]); if (s.length > mm[0].length) { repeat = rp[1]; s = cut(mm); continue; } }
      if (due == null) {
        m = s.match(RE_DATE_END);
        if (m && m.index > 0 && !NOT_BEFORE.test(s.slice(0, m.index))) { due = dateFromWord(m[1]); s = cut(m); continue; }
        m = s.match(RE_DATE_START);
        if (m && s.length > m[0].length) { due = dateFromWord(m[1]); s = cut(m); continue; }
      }
      break;
    }
    s = s.replace(/[.,;]+$/, '').trim();
    if (!s) return { text: raw.trim(), due: null, star: false, repeat: null };
    return { text: cap(s) + tail, due: due && due > today0() ? due : null, star, repeat };
  }

  // ---------- Teléfonos, enlaces y correos dentro de una tarea ----------
  function contactsOf(t) {
    const src = t.text + '\n' + (t.note || '');
    const out = [];
    const ph = (src.match(/\+?\d[\d .-]{7,15}\d/g) || []).find((p) => { const n = p.replace(/\D/g, '').length; return n >= 9 && n <= 13; });
    if (ph) {
      const digits = ph.replace(/[^\d+]/g, '');
      out.push({ kind: 'tel', href: 'tel:' + digits, label: 'Llamar', icon: ICON.phone, c: 'var(--green)' });
      const intl = digits.startsWith('+') ? digits.slice(1) : /^[67]\d{8}$/.test(digits) ? '34' + digits : '';
      if (intl) out.push({ kind: 'wa', href: 'https://wa.me/' + intl, label: 'WhatsApp', icon: ICON.chat, c: 'var(--green)' });
    }
    const url = src.match(/\b(?:https?:\/\/|www\.)[^\s<>"]+/i);
    if (url) out.push({ kind: 'url', href: /^www\./i.test(url[0]) ? 'https://' + url[0] : url[0], label: 'Abrir enlace', icon: ICON.link, c: 'var(--accent)' });
    const mail = src.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
    if (mail) out.push({ kind: 'mail', href: 'mailto:' + mail[0], label: 'Escribir', icon: ICON.mail, c: 'var(--accent)' });
    return out;
  }

  // ---------- Pintar ----------
  function render() {
    const today = today0();
    const pend = tasks.filter(isToday);
    const future = tasks.filter(isFuture);
    const done = tasks.filter((t) => t.done);
    const crossed = done.filter(crossedToday);
    const old = pend.filter((t) => ageLabel(t)).length;

    el.today.textContent = cap(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
    el.countTodo.textContent = pend.length || '';
    el.countDone.textContent = done.length || '';

    const parts = [];
    if (pend.length) parts.push('<b>' + pend.length + ' por hacer</b>');
    if (old) parts.push('<span class="old">' + old + ' de otros días</span>');
    if (future.length && parts.length < 2) parts.push(future.length + (future.length === 1 ? ' programada' : ' programadas'));
    el.summary.innerHTML = parts.length ? parts.join(' · ') : crossed.length ? 'Todo tachado por hoy' : tasks.length ? 'Nada pendiente' : 'Apunta lo primero abajo';

    // Anillo del día: tachadas hoy frente a todo lo de hoy
    const total = pend.length + crossed.length;
    el.ring.hidden = total === 0;
    if (total) {
      el.ring.style.setProperty('--p', String(crossed.length / total));
      const full = !pend.length;
      el.ring.classList.toggle('is-full', full);
      el.ringTxt.innerHTML = full ? ICON.done : '<span>' + crossed.length + '<small>/' + total + '</small></span>';
      el.ring.setAttribute('aria-label', crossed.length + ' de ' + total + ' tachadas hoy');
    }

    // Etiquetas
    const allTags = [...new Set(tasks.filter((t) => (filter === 'done') === !!t.done).flatMap(tagsOf))].sort();
    if (tagFilter && !allTags.includes(tagFilter)) tagFilter = null;
    el.tags.hidden = !allTags.length || !!query;
    if (allTags.length) {
      el.tags.replaceChildren(...[null, ...allTags].map((tag) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'glass';
        b.dataset.tag = tag || '';
        b.textContent = tag || 'Todas';
        if (tag) b.style.setProperty('--tc', tagColor(tag));
        b.setAttribute('aria-pressed', String(tagFilter === tag));
        return b;
      }));
    }

    const match = (t) => (!tagFilter || tagsOf(t).includes(tagFilter))
      && (!query || norm(t.text + ' ' + (t.note || '')).includes(norm(query)));

    const groups = [];
    if (query) {
      const a = tasks.filter((t) => !t.done && match(t)).sort(byOrder);
      const b = done.filter(match).sort((x, y) => (y.doneAt || 0) - (x.doneAt || 0));
      if (a.length) groups.push({ title: 'Por hacer', n: a.length, items: a, kind: 'todo' });
      if (b.length) groups.push({ title: 'Tachadas', n: b.length, items: b, kind: 'done' });
    } else if (filter === 'todo') {
      const p = pend.filter(match).sort(byOrder);
      const stars = p.filter((t) => t.star);
      const rest = p.filter((t) => !t.star);
      if (stars.length) groups.push({ title: 'Importantes', icon: ICON.starF, items: stars, kind: 'todo', drag: true });
      if (rest.length) groups.push({ title: stars.length ? 'El resto' : null, items: rest, kind: 'todo', drag: true });
      const c = crossed.filter(match).sort((x, y) => x.doneAt - y.doneAt);
      if (c.length) groups.push({ title: 'Tachadas hoy', n: c.length, fold: 'crossed', items: c, kind: 'done', quiet: true });
      const f = future.filter(match).sort((x, y) => (x.due - y.due) || byOrder(x, y));
      if (f.length) groups.push({ title: 'Próximos días', icon: ICON.cal, n: f.length, fold: 'future', items: f, kind: 'future', quiet: true });
    } else {
      done.filter(match).sort((x, y) => (y.doneAt || 0) - (x.doneAt || 0)).forEach((t) => {
        const label = dayLabel(t.doneAt || t.created);
        const g = groups[groups.length - 1];
        if (g && g.title === label) { g.items.push(t); g.n++; } else groups.push({ title: label, n: 1, items: [t], kind: 'done' });
      });
    }

    const frag = document.createDocumentFragment();
    if (!query && filter === 'done' && done.length) frag.append(weekCard(done));
    for (const g of groups) {
      const open = !g.fold || !fold[g.fold];
      if (g.title) frag.append(groupHead(g, open));
      if (!open) continue;
      const ul = document.createElement('ul');
      ul.className = 'group glass' + (g.quiet ? ' is-quiet' : '');
      ul.dataset.kind = g.kind;
      if (g.drag && !query) ul.dataset.drag = '1';
      ul.append(...g.items.map((t) => row(t, g.kind)));
      frag.append(ul);
    }
    el.sections.replaceChildren(frag);
    fresh.clear();

    // Vacío
    let empty = null;
    if (query) {
      if (!groups.length) empty = [ICON.search, 'Sin resultados', 'No hay ninguna tarea con «' + query + '».'];
    } else if (filter === 'todo' && !pend.filter(match).length) {
      empty = crossed.length
        ? [ICON.party, '¡Todo tachado!', 'Has terminado todo lo de hoy. Lo tachado sigue aquí abajo hasta mañana.', true]
        : tasks.length
          ? [ICON.party, 'Nada pendiente', tagFilter ? 'Nada con ' + tagFilter + '.' : 'Apunta abajo lo siguiente que tengas que hacer.', true]
          : [ICON.list, 'Tu libreta está vacía', 'Escribe abajo o toca el micrófono y dilo en voz alta. Luego, ve tachando.'];
    } else if (filter === 'done' && !done.length) {
      empty = [ICON.tray, 'Nada tachado aún', 'Toca el círculo de una tarea o deslízala a la derecha cuando la acabes.'];
    }
    el.empty.hidden = !empty;
    if (empty) {
      el.emptyIc.innerHTML = empty[0];
      el.emptyIc.classList.toggle('is-ok', !!empty[3]);
      el.emptyTitle.textContent = empty[1];
      el.emptyText.textContent = empty[2];
    }

    el.tip.hidden = !(!query && filter === 'todo' && pend.length > 1 && !prefs.get('tipSwipe', false));
    el.clearDone.hidden = !(!query && filter === 'done' && done.length > 1);
    el.seg.hidden = !!query;
  }

  function groupHead(g, open) {
    const h = document.createElement(g.fold ? 'button' : 'h2');
    h.className = 'group-h';
    if (g.fold) {
      h.type = 'button';
      h.dataset.fold = g.fold;
      h.setAttribute('aria-expanded', String(open));
    }
    h.innerHTML = g.icon || '';
    h.append(g.title);
    if (g.n != null) {
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = g.n;
      h.append(n);
    }
    if (g.fold) h.insertAdjacentHTML('beforeend', ICON.fold);
    return h;
  }

  function weekCard(done) {
    const today = today0();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
    const counts = days.map((d) => done.filter((t) => t.doneAt && dayStart(t.doneAt) === d).length);
    const sum = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(1, ...counts);
    const best = Math.max(...counts);

    const box = document.createElement('section');
    box.className = 'week glass';
    box.innerHTML = '<div class="week-head"><div><span class="week-k">Últimos 7 días</span>'
      + '<strong>' + sum + ' <small>' + (sum === 1 ? 'tachada' : 'tachadas') + '</small></strong></div>'
      + '<div class="week-side">Hoy <b>' + counts[6] + '</b><br>Mejor día <b>' + best + '</b></div></div>'
      + '<div class="week-bars">' + days.map((d, i) => {
        const letter = 'DLMXJVS'[new Date(d).getDay()];
        return '<div class="wb' + (i === 6 ? ' is-today' : '') + '"><span class="wb-n">' + (counts[i] || '') + '</span>'
          + '<span class="wb-col"><i style="--h:' + (counts[i] / max).toFixed(3) + '"></i></span><span class="wb-d">' + letter + '</span></div>';
      }).join('') + '</div>';
    return box;
  }

  function inkNode(text) {
    const ink = document.createElement('span');
    ink.className = 'ink';
    let last = 0;
    for (const m of text.matchAll(TAG_RE)) {
      if (m.index > last) ink.append(text.slice(last, m.index));
      const s = document.createElement('span');
      s.className = 'tag';
      s.style.setProperty('--tc', tagColor(m[0].toLowerCase()));
      s.textContent = m[0];
      ink.append(s);
      last = m.index + m[0].length;
    }
    ink.append(text.slice(last));
    return ink;
  }

  function row(t, kind) {
    const li = document.createElement('li');
    li.className = 'row' + (t.done ? ' is-done' : '') + (t.star ? ' is-star' : '') + (fresh.has(t.id) ? ' is-new' : '');
    li.dataset.id = t.id;
    li.dataset.kind = kind;

    const actR = document.createElement('div');
    actR.className = 'act act-r' + (t.done ? ' is-undo' : '');
    actR.setAttribute('aria-hidden', 'true');
    actR.innerHTML = '<span>' + (t.done ? ICON.undo + 'Pendiente' : ICON.done + 'Tachar') + '</span>';

    const actL = document.createElement('div');
    actL.className = 'act act-l';
    if (!t.done) {
      actL.innerHTML = '<button type="button" class="b-later" tabindex="-1">' + (kind === 'future' ? ICON.today + '<span>Hoy</span>' : ICON.later + '<span>Mañana</span>') + '</button>';
    }
    actL.insertAdjacentHTML('beforeend', '<button type="button" class="b-del" tabindex="-1">' + ICON.trash + '<span>Borrar</span></button>');

    const fg = document.createElement('div');
    fg.className = 'row-fg';

    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'check';
    check.setAttribute('role', 'checkbox');
    check.setAttribute('aria-checked', String(!!t.done));
    check.setAttribute('aria-label', t.done ? 'Quitar el tachado' : 'Tachar');
    check.innerHTML = '<span>' + ICON.check + '</span>';

    const body = document.createElement('div');
    body.className = 'row-body';
    const tb = document.createElement('button');
    tb.type = 'button';
    tb.className = 'row-text';
    tb.setAttribute('aria-label', 'Editar: ' + t.text);
    const text = document.createElement('span');
    text.className = 'text';
    text.append(inkNode(t.text));
    tb.append(text);

    if (t.note) {
      const n = document.createElement('span');
      n.className = 'note';
      n.textContent = t.note;
      tb.append(n);
    }

    const meta = document.createElement('span');
    meta.className = 'meta';
    const chip = (icon, label, cls) => {
      const s = document.createElement('span');
      if (cls) s.className = cls;
      s.innerHTML = icon || '';
      s.append(label);
      meta.append(s);
    };
    if (t.done) {
      chip(ICON.check, kind === 'done' && !crossedToday(t) && query ? dayLabel(t.doneAt) + ', ' + hm(t.doneAt) : hm(t.doneAt || t.created));
    } else {
      if (isFuture(t)) chip(ICON.cal, futureLabel(t.due), 'due');
      else { const age = ageLabel(t); if (age) chip(ICON.clock, age, 'old'); }
    }
    if (t.repeat && !t.done) chip(ICON.repeat, REPEAT[t.repeat]);
    tb.append(meta);
    body.append(tb);

    if (t.audio) {
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'play' + (player.id === t.id ? ' is-playing' : '');
      play.setAttribute('aria-label', 'Escuchar la nota de voz');
      play.innerHTML = '<i>' + ICON.play + ICON.pause + '</i><span></span>';
      play.lastChild.textContent = fmtDur(t.dur || 0);
      body.append(play);
    }

    fg.append(check, body);

    if (!t.done) {
      const c = contactsOf(t)[0];
      if (c && c.kind !== 'wa') {
        const a = document.createElement('a');
        a.className = 'quick' + (c.kind === 'tel' ? '' : ' is-link');
        a.href = c.href;
        if (c.kind === 'url') { a.target = '_blank'; a.rel = 'noopener'; }
        a.setAttribute('aria-label', c.label);
        a.innerHTML = '<i>' + c.icon + '</i>';
        fg.append(a);
      }
      if (t.star) {
        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'star';
        star.setAttribute('aria-label', 'Quitar de importantes');
        star.innerHTML = ICON.star;
        fg.append(star);
      }
    }

    li.append(actR, actL, fg);
    return li;
  }

  // ---------- Acciones sobre tareas ----------
  const maxOrder = () => tasks.reduce((m, t) => Math.max(m, t.order ?? t.created), 0);

  async function addMany(raws) {
    const parsed = raws.map(parseQuick);
    let order = maxOrder();
    const now = Date.now();
    const added = parsed.map((p, i) => ({
      id: uid(), text: p.text, note: '', done: false, doneAt: null, star: p.star,
      created: now + i, order: ++order, due: p.due, repeat: p.repeat,
    }));
    tasks.push(...added);
    added.forEach((t) => fresh.add(t.id));
    await db.putMany(added);
    if (query) closeSearch();
    tagFilter = null;
    showTab('todo');
    render();

    const first = added[0];
    const li = el.sections.querySelector('[data-id="' + first.id + '"]');
    if (li) li.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });

    let msg = added.length === 1 ? 'Apuntada' : 'Apuntadas ' + added.length;
    if (added.length === 1) {
      if (first.due) msg += ' para ' + whenWords(first.due);
      if (first.star) msg += ' · importante';
      if (first.repeat) msg += ' · ' + REPEAT[first.repeat].toLowerCase();
    }
    toast(msg, async () => {
      for (const t of added) await removeQuiet(t.id);
      render();
    });
  }

  async function removeQuiet(id) {
    tasks = tasks.filter((x) => x.id !== id);
    await db.del(id);
    await db.delAudio(id);
  }

  async function removeTask(t) {
    const audio = t.audio ? await db.getAudio(t.id) : null;
    if (player.id === t.id) stopPlayback();
    await removeQuiet(t.id);
    vibrate(10);
    render();
    toast('Borrada', async () => {
      tasks.push(t);
      await db.put(t);
      if (audio) await db.putAudio(t.id, audio);
      render();
    });
  }

  function nextDue(t) {
    const today = today0();
    const from = Math.max(today, t.due || today);
    const anchor = t.due || dayStart(t.created);
    if (t.repeat === 'daily') return addDays(from, 1);
    if (t.repeat === 'weekdays') {
      let n = addDays(from, 1);
      while ([0, 6].includes(new Date(n).getDay())) n = addDays(n, 1);
      return n;
    }
    if (t.repeat === 'weekly') {
      let n = addDays(anchor, 7);
      while (n <= today) n = addDays(n, 7);
      return n;
    }
    const b = new Date(anchor);
    let n;
    let k = 1;
    do { n = new Date(b.getFullYear(), b.getMonth() + k++, b.getDate()).getTime(); } while (n <= today);
    return n;
  }

  async function setDone(t, value) {
    const prev = { done: t.done, doneAt: t.doneAt, repeat: t.repeat, next: t.next };
    t.done = value;
    t.doneAt = value ? Date.now() : null;

    // Las que se repiten vuelven a aparecer el próximo día que toque
    let clone = null;
    let removed = null;
    if (value && t.repeat) {
      clone = { ...t, id: uid(), done: false, doneAt: null, created: Date.now(), due: nextDue(t), next: null };
      if (t.audio) { const a = await db.getAudio(t.id); if (a) await db.putAudio(clone.id, a); }
      t.next = clone.id;
      t.repeat = null;
      tasks.push(clone);
      await db.put(clone);
    } else if (!value && t.next) {
      const c = tasks.find((x) => x.id === t.next);
      if (c && !c.done) { removed = c; t.repeat = c.repeat; await removeQuiet(c.id); }
      t.next = null;
    }
    await db.put(t);
    if (value) vibrate(12);
    render();

    const left = tasks.filter(isToday).length;
    let msg = value ? 'Tachada' : 'Vuelve a por hacer';
    if (value && clone) msg = 'Tachada · vuelve ' + whenWords(clone.due);
    if (value && !left) msg = '¡Todo tachado por hoy!';
    toast(msg, async () => {
      Object.assign(t, prev);
      if (clone) await removeQuiet(clone.id);
      if (removed) { tasks.push(removed); await db.put(removed); }
      await db.put(t);
      render();
    });
  }

  async function postpone(t) {
    const prev = t.due;
    const toToday = isFuture(t);
    t.due = toToday ? null : addDays(today0(), 1);
    await db.put(t);
    render();
    toast(toToday ? 'Pasada a hoy' : 'Pasada a mañana', async () => { t.due = prev; await db.put(t); render(); });
  }

  // Recoge la fila con una animación antes de volver a pintar la lista
  async function collapse(li) {
    if (REDUCED) return;
    li.style.height = li.offsetHeight + 'px';
    void li.offsetHeight;
    li.style.transition = 'height .3s cubic-bezier(.32,.72,0,1), opacity .2s';
    li.style.height = '0px';
    li.style.opacity = '0';
    await wait(300);
  }

  async function tapCheck(t, li) {
    li.classList.toggle('is-done', !t.done); // la raya cruza el texto
    vibrate(8);
    await wait(520);
    await collapse(li);
    setDone(t, !t.done);
  }

  async function toggleStar(t) {
    t.star = !t.star;
    await db.put(t);
    render();
  }

  async function clearDone() {
    const gone = tasks.filter((t) => t.done);
    if (!gone.length) { toast('No hay tareas hechas.'); return; }
    const audios = new Map();
    for (const t of gone) if (t.audio) audios.set(t.id, await db.getAudio(t.id));
    for (const t of gone) await removeQuiet(t.id);
    render();
    toast(gone.length === 1 ? 'Borrada 1 hecha' : 'Borradas ' + gone.length + ' hechas', async () => {
      for (const t of gone) {
        tasks.push(t);
        await db.put(t);
        if (audios.get(t.id)) await db.putAudio(t.id, audios.get(t.id));
      }
      render();
    });
  }

  // ---------- Gestos: deslizar y mantener pulsado para mover ----------
  let g = null;        // gesto en curso
  let openRow = null;  // fila con los botones de la izquierda a la vista

  function settle(li, x) {
    const fg = $('.row-fg', li);
    li.classList.add('snap');
    fg.style.transition = 'transform .4s cubic-bezier(.32,.72,0,1)';
    fg.style.transform = x ? 'translateX(' + x + 'px)' : '';
    li.style.setProperty('--w', Math.abs(x) + 'px');
    setTimeout(() => {
      li.classList.remove('snap');
      fg.style.transition = '';
      if (!x) li.classList.remove('is-swiping', 'is-open', 'sw-r', 'sw-l', 'is-armed');
    }, 400);
  }

  function closeOpen() {
    if (!openRow) return;
    settle(openRow, 0);
    openRow = null;
  }

  document.addEventListener('pointerdown', (e) => {
    if (openRow && !e.target.closest('.act-l')) {
      closeOpen();
      lastGesture = Date.now();
    }
  }, true);

  el.sections.addEventListener('contextmenu', (e) => { if (e.target.closest('.row')) e.preventDefault(); });

  el.sections.addEventListener('pointerdown', (e) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || g) return;
    const fg = e.target.closest('.row-fg');
    if (!fg || Date.now() - lastGesture < 50) return;
    const li = fg.parentElement;
    g = { fg, li, pid: e.pointerId, x0: e.clientX, y0: e.clientY, y: e.clientY, mode: 'wait', w: fg.offsetWidth, dx: 0, armed: false };
    if (li.parentElement.dataset.drag && !e.target.closest('a')) {
      const mine = g;
      g.timer = setTimeout(() => startDrag(mine), 420);
    }
  });

  el.sections.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.pid) return;
    g.y = e.clientY;
    if (g.mode === 'drag') { e.preventDefault(); dragTo(); return; }
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (g.mode === 'wait') {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(g.timer);
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
      if (Math.abs(dx) < 12) return;
      g.mode = 'swipe';
      g.x0 += Math.sign(dx) * 12;
      try { g.fg.setPointerCapture(e.pointerId); } catch { /* nada */ }
      g.li.classList.add('is-swiping');
      g.fg.style.transition = 'none';
    }
    e.preventDefault();
    let x = e.clientX - g.x0;
    const lim = g.w * 0.75;
    if (Math.abs(x) > lim) x = Math.sign(x) * (lim + (Math.abs(x) - lim) * 0.3);
    g.dx = x;
    g.li.classList.toggle('sw-r', x > 0);
    g.li.classList.toggle('sw-l', x < 0);
    g.fg.style.transform = 'translateX(' + x + 'px)';
    g.li.style.setProperty('--w', Math.abs(x) + 'px');
    const armed = x > 0 ? x > Math.min(120, g.w * 0.3) : -x > g.w * 0.62;
    if (armed !== g.armed) {
      g.armed = armed;
      g.li.classList.toggle('is-armed', armed);
      if (armed) vibrate(8);
    }
  });

  const endGesture = async (e) => {
    if (!g || e.pointerId !== g.pid) return;
    const s = g;
    g = null;
    clearTimeout(s.timer);
    if (s.mode === 'drag') { endDrag(s); return; }
    if (s.mode !== 'swipe') return;
    lastGesture = Date.now();
    const t = tasks.find((x) => x.id === s.li.dataset.id);
    const ok = e.type === 'pointerup' && t;
    if (ok && s.armed) {
      const dir = Math.sign(s.dx);
      s.li.classList.add('is-gone', 'snap');
      s.fg.style.transition = 'transform .25s ease-out';
      s.fg.style.transform = 'translateX(' + dir * (s.w + 40) + 'px)';
      s.li.style.setProperty('--w', s.w + 'px');
      prefs.set('tipSwipe', true);
      await wait(220);
      await collapse(s.li);
      if (dir > 0) setDone(t, !t.done);
      else removeTask(t);
      return;
    }
    if (ok && s.dx < -50) {
      // se queda abierta mostrando «Mañana» y «Borrar»
      const n = $$('.act-l button', s.li).length;
      openRow = s.li;
      s.li.classList.add('is-open');
      s.li.classList.remove('is-armed');
      settle(s.li, -78 * n);
      return;
    }
    settle(s.li, 0);
  };
  el.sections.addEventListener('pointerup', endGesture);
  el.sections.addEventListener('pointercancel', endGesture);

  // Mientras se mueve una fila, la página no se desplaza con el dedo
  document.addEventListener('touchmove', (e) => { if (g && g.mode === 'drag') e.preventDefault(); }, { passive: false });

  function flip(node, from) {
    if (REDUCED || !node.animate) return;
    node.animate([{ transform: 'translateY(' + from + 'px)' }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.32,.72,0,1)' });
  }

  function startDrag(s) {
    if (g !== s || s.mode !== 'wait') return;
    s.mode = 'drag';
    s.ul = s.li.parentElement;
    s.yStart = s.y;
    s.sc0 = window.scrollY;
    s.li.classList.add('is-lifted');
    try { s.fg.setPointerCapture(s.pid); } catch { /* nada */ }
    vibrate(15);
    const loop = () => {
      if (g !== s) return;
      const edge = 110;
      if (s.y < edge) window.scrollBy(0, -Math.ceil((edge - s.y) / 10));
      else if (s.y > innerHeight - edge - 40) window.scrollBy(0, Math.ceil((s.y - innerHeight + edge + 40) / 10));
      dragTo();
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  }

  function dragTo() {
    const s = g;
    if (!s || s.mode !== 'drag') return;
    let dy = s.y - s.yStart + (window.scrollY - s.sc0);
    const h = s.li.offsetHeight;
    let next = s.li.nextElementSibling;
    while (next && dy > next.offsetHeight / 2) {
      const nh = next.offsetHeight;
      s.ul.insertBefore(next, s.li);
      s.yStart += nh;
      dy -= nh;
      flip(next, h);
      next = s.li.nextElementSibling;
    }
    let prev = s.li.previousElementSibling;
    while (prev && -dy > prev.offsetHeight / 2) {
      const ph = prev.offsetHeight;
      s.ul.insertBefore(s.li, prev);
      s.yStart -= ph;
      dy += ph;
      flip(prev, -h);
      prev = s.li.previousElementSibling;
    }
    s.li.style.transform = 'translateY(' + dy + 'px)';
  }

  async function endDrag(s) {
    cancelAnimationFrame(s.raf);
    lastGesture = Date.now();
    s.li.style.transition = 'transform .3s cubic-bezier(.32,.72,0,1)';
    s.li.style.transform = '';
    s.li.classList.remove('is-lifted');
    // El grupo movido ocupa los mismos huecos que antes, en su nuevo orden; luego se renumera todo
    const moved = $$('.row', s.ul).map((li) => tasks.find((t) => t.id === li.dataset.id)).filter(Boolean);
    const inGroup = new Set(moved.map((t) => t.id));
    const seq = tasks.slice().sort(byOrder);
    let k = 0;
    seq.forEach((t, i) => { if (inGroup.has(t.id)) seq[i] = moved[k++]; });
    seq.forEach((t, i) => { t.order = i + 1; });
    await db.putMany(seq);
    prefs.set('tipSwipe', true);
    setTimeout(() => { s.li.style.transition = ''; }, 300);
  }

  el.sections.addEventListener('click', (e) => {
    const head = e.target.closest('[data-fold]');
    if (head) {
      fold[head.dataset.fold] = !fold[head.dataset.fold];
      prefs.set('fold', fold);
      render();
      return;
    }
    const li = e.target.closest('.row');
    if (!li) return;
    const t = tasks.find((x) => x.id === li.dataset.id);
    if (!t) return;
    if (e.target.closest('.act-l')) {
      openRow = null;
      if (e.target.closest('.b-del')) collapse(li).then(() => removeTask(t));
      else if (e.target.closest('.b-later')) collapse(li).then(() => postpone(t));
      return;
    }
    if (Date.now() - lastGesture < 400) { e.preventDefault(); return; }
    if (e.target.closest('.quick')) return; // el enlace hace su trabajo
    if (e.target.closest('.check')) tapCheck(t, li);
    else if (e.target.closest('.star')) toggleStar(t);
    else if (e.target.closest('.play')) togglePlay(t.id);
    else if (e.target.closest('.row-text')) openEdit(t);
  });

  el.tags.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]');
    if (!b) return;
    tagFilter = b.dataset.tag || null;
    render();
  });

  // ---------- Escribir ----------
  function syncAction() {
    const hasText = el.input.value.trim().length > 0;
    const mode = hasText || !voiceMode ? 'send' : 'voice';
    el.action.dataset.mode = mode;
    el.action.disabled = mode === 'send' && !hasText;
    el.action.setAttribute('aria-label', mode === 'send' ? 'Apuntar' : voiceMode === 'audio' ? 'Grabar nota de voz' : 'Dictar tarea');
    syncHint();
  }

  // Muestra encima de la barra lo que se ha entendido («Mañana», «Importante»…)
  function syncHint() {
    const lines = el.input.value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const chips = [];
    if (lines.length > 1) chips.push(['var(--indigo)', ICON.list, lines.length + ' tareas']);
    if (lines.length === 1) {
      const p = parseQuick(lines[0]);
      if (p.due) chips.push(['var(--red)', ICON.cal, futureLabel(p.due)]);
      if (p.star) chips.push(['var(--orange)', ICON.star.replace('<path', '<path class="fill"'), 'Importante']);
      if (p.repeat) chips.push(['var(--indigo)', ICON.repeat, REPEAT[p.repeat]]);
      for (const tag of tagsOf(p)) chips.push([tagColor(tag), '', tag]);
    }
    el.hint.hidden = !chips.length;
    el.hint.innerHTML = chips.map(([c, ic, label]) => '<span style="--c:' + c + '">' + ic + '</span>').join('');
    $$('span', el.hint).forEach((s, i) => s.append(chips[i][2]));
  }

  function autosize() {
    el.input.style.height = 'auto';
    el.input.style.height = Math.min(el.input.scrollHeight, 140) + 'px';
  }

  function submitText() {
    const lines = el.input.value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (!lines.length) return;
    el.input.value = '';
    autosize();
    syncAction();
    addMany(lines);
  }

  // ---------- Onda de la voz ----------
  const bars = [];
  for (let i = 0; i < BARS; i++) {
    const b = document.createElement('span');
    b.style.setProperty('--i', String(i));
    el.wave.append(b);
    bars.push(b);
  }
  const levels = new Array(BARS).fill(0.08);

  function pushLevel(v) {
    levels.shift();
    levels.push(Math.max(0.08, Math.min(1, v)));
    // simétrica desde el centro, como la de Notas de voz
    for (let i = 0; i < BARS; i++) {
      const k = Math.abs(i - (BARS - 1) / 2) / (BARS / 2);
      const src = levels[BARS - 1 - Math.floor(k * (BARS - 1) * 0.5)];
      bars[i].style.transform = 'scaleY(' + (src * (1 - k * 0.45)).toFixed(3) + ')';
    }
  }
  function resetWave() {
    levels.fill(0.08);
    for (const b of bars) b.style.transform = '';
  }

  // ---------- Voz: dictado a texto ----------
  // Explica por qué no se ha podido dictar, con el ajuste concreto a tocar
  function voiceFail(error, gotAudio) {
    if (error === 'not-allowed') {
      if (IS_IOS) return 'Sin permiso de micrófono. Actívalo en Ajustes → Apps → Safari → Micrófono.';
      return STANDALONE
        ? 'Sin permiso de micrófono. Dáselo en Ajustes del móvil → Aplicaciones → Chrome → Permisos.'
        : 'Sin permiso de micrófono. Toca el icono junto a la dirección y permite el micrófono.';
    }
    if (error === 'service-not-allowed' || error === 'language-not-supported') {
      return IS_IOS ? 'El dictado está apagado. Actívalo en Ajustes → General → Teclado → Dictado.' : 'Este navegador no deja dictar. Ábrela en Chrome.';
    }
    if (error === 'no-audio' || (!gotAudio && !error)) {
      return 'El micrófono no se ha encendido.' + (IS_IOS ? ' Revisa Ajustes → General → Teclado → Dictado.' : '');
    }
    return SR_ERR[error] || 'No te he entendido. Prueba otra vez.';
  }

  // Si el dictado falla, el aviso ofrece grabar un audio en su lugar
  const recordInstead = () => (CAN_RECORD ? () => { setVoice('audio'); startRecording(); } : null);

  function startDictation(test) {
    const r = new SR();
    r.lang = 'es-ES';
    r.interimResults = true;
    r.continuous = !IS_IOS; // en iPhone, el modo continuo a veces no devuelve nada
    r.maxAlternatives = 1;

    let heard = '';
    let error = '';
    let cancelled = false;
    let talkTimer = 0;
    let gotAudio = false;

    // Si en unos segundos el micrófono ni se ha encendido, algo lo está impidiendo
    let ended = false;
    const watchdog = setTimeout(() => {
      if (gotAudio || heard) return;
      error = 'no-audio';
      try { r.abort(); } catch { /* nada */ }
      setTimeout(() => r.onend(), 1500); // por si el navegador no avisa de que ha parado
    }, 7000);

    r.onaudiostart = () => {
      gotAudio = true;
      el.recTitle.textContent = test ? 'Prueba: di una frase' : 'Te escucho';
    };
    r.onresult = (e) => {
      // Se reconstruye entero cada vez: algunos Android repiten la frase acumulada en cada resultado.
      const parts = [];
      let interim = '';
      for (const res of e.results) {
        const s = res[0].transcript.trim();
        if (!s) continue;
        const last = parts[parts.length - 1];
        if (last && s.toLowerCase().startsWith(last.toLowerCase())) parts[parts.length - 1] = s;
        else parts.push(s);
        if (!res.isFinal) interim = s;
      }
      heard = parts.join(' ');
      const fixed = interim ? heard.slice(0, heard.length - interim.length) : heard;
      el.recLive.textContent = fixed;
      if (interim) {
        const i = document.createElement('i');
        i.textContent = interim;
        el.recLive.append(i);
      }
      el.wave.classList.add('talk');
      clearTimeout(talkTimer);
      talkTimer = setTimeout(() => el.wave.classList.remove('talk'), 700);
    };
    r.onerror = (e) => { if (e.error !== 'aborted' || !error) error = e.error; };
    r.onend = () => {
      if (ended) return;
      ended = true;
      clearTimeout(watchdog);
      clearTimeout(talkTimer);
      closeRec();
      if (cancelled) return;
      if (test) {
        if (heard) toast('Funciona. He oído: «' + heard + '»');
        else toast(voiceFail(error, gotAudio), recordInstead(), 'Grabar audio');
        return;
      }
      const texts = heard.split(SPLIT).map((s) => s.trim()).filter(Boolean);
      if (texts.length) { addMany(texts); return; }
      toast(voiceFail(error, gotAudio), recordInstead(), 'Grabar audio');
    };

    try {
      r.start();
    } catch {
      clearTimeout(watchdog);
      toast('No se ha podido encender el dictado.', recordInstead(), 'Grabar audio');
      return;
    }
    session = {
      stop: () => { r.stop(); setTimeout(() => r.onend(), 2500); },
      cancel: () => { cancelled = true; r.abort(); setTimeout(() => r.onend(), 800); },
    };
    openRec('dictar');
    el.recTitle.textContent = 'Encendiendo el micrófono…';
  }

  // Ajustes → «Probar el micrófono»: dice si llega sonido y si el dictado entiende algo
  async function testMic() {
    if (voiceMode === 'dictar' && SR) { startDictation(true); return; }
    if (!CAN_RECORD) { toast('Este navegador no deja usar el micrófono. Ábrela en Chrome o en Safari.'); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      toast(voiceFail(e && e.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture', false));
      return;
    }
    let ac;
    let raf = 0;
    let max = 0;
    const t0 = Date.now();
    const finish = () => {
      if (!session) return;
      cancelAnimationFrame(raf);
      if (ac) ac.close().catch(() => {});
      stream.getTracks().forEach((t) => t.stop());
      closeRec();
      toast(max > 0.12 ? 'El micrófono funciona bien.' : 'No llega sonido del micrófono. ¿Lo está usando otra app?');
    };
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.fftSize);
      const loop = () => {
        raf = requestAnimationFrame(loop);
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) * (v - 128);
        const lvl = Math.sqrt(sum / data.length) / 28;
        max = Math.max(max, lvl);
        pushLevel(lvl);
        const left = Math.ceil(5 - (Date.now() - t0) / 1000);
        el.recLive.textContent = left > 0 ? left + ' s' : '';
        if (left <= 0) finish();
      };
      raf = requestAnimationFrame(loop);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      toast('El micrófono responde, pero no se puede medir el sonido aquí.');
      return;
    }
    session = { stop: finish, cancel: finish };
    openRec('audio');
    el.recTitle.textContent = 'Prueba: habla un momento';
  }

  // ---------- Voz: nota de audio ----------
  async function startRecording() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      toast(voiceFail(e && e.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture', false));
      return;
    }
    const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg']
      .find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    let mr;
    try { mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); } catch { mr = new MediaRecorder(stream); }

    // Nivel del micrófono para la onda
    let ac = null;
    let raf = 0;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.fftSize);
      let last = 0;
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        if (now - last < 55) return;
        last = now;
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) * (v - 128);
        pushLevel(Math.sqrt(sum / data.length) / 28);
      };
      raf = requestAnimationFrame(loop);
    } catch { el.wave.classList.add('idle'); }

    const chunks = [];
    const t0 = Date.now();
    let cancelled = false;
    const tick = () => {
      const sec = (Date.now() - t0) / 1000;
      el.recLive.textContent = fmtDur(sec);
      if (sec >= MAX_REC && mr.state === 'recording') mr.stop();
    };
    const timer = setInterval(tick, 250);

    mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = async () => {
      clearInterval(timer);
      cancelAnimationFrame(raf);
      if (ac) ac.close().catch(() => {});
      stream.getTracks().forEach((t) => t.stop());
      closeRec();
      if (cancelled || !chunks.length) return;
      const dur = Math.round((Date.now() - t0) / 1000);
      if (dur < 1) { toast('Demasiado corta. Graba un poco más.'); return; }
      const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' });
      const id = uid();
      await db.putAudio(id, { buf: await blob.arrayBuffer(), type: blob.type });
      const t = { id, text: 'Nota de voz', note: '', done: false, doneAt: null, star: false, created: Date.now(), order: maxOrder() + 1, due: null, repeat: null, audio: true, dur };
      tasks.push(t);
      fresh.add(id);
      await db.put(t);
      showTab('todo');
      render();
      toast('Nota guardada · tócala para ponerle nombre', async () => { await removeQuiet(id); render(); });
    };

    mr.start(1000);
    session = { stop: () => mr.state !== 'inactive' && mr.stop(), cancel: () => { cancelled = true; if (mr.state !== 'inactive') mr.stop(); } };
    openRec('audio');
    tick();
  }

  function startVoice() {
    if (session) { session.stop(); return; }
    stopPlayback();
    if (voiceMode === 'dictar') startDictation();
    else if (voiceMode === 'audio') startRecording();
  }

  function openRec(mode) {
    el.rec.dataset.mode = mode;
    el.recTitle.textContent = mode === 'dictar' ? 'Te escucho' : 'Grabando nota de voz';
    el.recLive.textContent = '';
    el.recLive.dataset.placeholder = mode === 'dictar' ? 'Di lo que tengas pendiente…' : '0:00';
    el.recHint.hidden = mode !== 'dictar';
    resetWave();
    el.wave.classList.toggle('idle', mode === 'dictar');
    el.input.blur();
    el.rec.hidden = false;
    $('#recStop').focus();
  }

  function closeRec() {
    el.rec.hidden = true;
    el.wave.classList.remove('idle', 'talk');
    session = null;
  }

  // ---------- Reproducir notas ----------
  const player = { id: null, audio: null, url: null };

  function playBtn(id) {
    const li = el.sections.querySelector('[data-id="' + CSS.escape(id) + '"]');
    return li && li.querySelector('.play');
  }

  function stopPlayback() {
    if (player.audio) player.audio.pause();
    if (player.url) URL.revokeObjectURL(player.url);
    const b = player.id && playBtn(player.id);
    if (b) { b.classList.remove('is-playing'); b.style.removeProperty('--p'); }
    player.id = player.audio = player.url = null;
  }

  async function togglePlay(id) {
    if (player.id === id) { stopPlayback(); return; }
    stopPlayback();
    const a = await db.getAudio(id);
    if (!a) { toast('No encuentro el audio de esta nota.'); return; }
    player.url = URL.createObjectURL(new Blob([a.buf], { type: a.type }));
    player.audio = new Audio(player.url);
    player.id = id;
    const b = playBtn(id);
    if (b) b.classList.add('is-playing');
    player.audio.ontimeupdate = () => {
      const btn = playBtn(id);
      const d = player.audio && player.audio.duration;
      if (btn && d && isFinite(d)) btn.style.setProperty('--p', String(player.audio.currentTime / d));
    };
    player.audio.onended = stopPlayback;
    player.audio.play().catch(() => { stopPlayback(); toast('Este móvil no puede reproducir esta nota.'); });
  }

  // ---------- Aviso con «Deshacer» ----------
  let toastTimer = 0;
  let undoFn = null;

  function toast(msg, action, label) {
    el.toastMsg.textContent = msg;
    undoFn = action || null;
    el.toastUndo.hidden = !action;
    el.toastUndo.textContent = label || 'Deshacer';
    el.toast.classList.toggle('is-long', msg.length > 38);
    el.toast.hidden = true;
    void el.toast.offsetWidth; // reinicia la animación
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, Math.max(action ? 5000 : 3500, msg.length * 75));
  }
  function hideToast() { el.toast.hidden = true; undoFn = null; }

  // ---------- Hojas (se cierran tocando fuera, con Esc o arrastrando hacia abajo) ----------
  function openSheet(d) {
    d.classList.remove('is-closing');
    d.style.transform = '';
    const body = $('.sheet-body', d);
    d.showModal();
    body.scrollTop = 0;
    $('.sheet-top', d).classList.remove('is-scrolled');
  }

  function closeSheet(d) {
    if (!d.open || d.classList.contains('is-closing')) return;
    if (REDUCED) { d.close(); return; }
    d.classList.add('is-closing');
    setTimeout(() => { d.classList.remove('is-closing'); d.style.transform = ''; d.close(); }, 270);
  }

  function bindSheet(d) {
    d.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(d); });
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) closeSheet(d);
    });
    const top = $('.sheet-top', d);
    const body = $('.sheet-body', d);
    body.addEventListener('scroll', () => top.classList.toggle('is-scrolled', body.scrollTop > 2), { passive: true });
    let y0 = null;
    let dy = 0;
    top.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      y0 = e.clientY;
      dy = 0;
      try { top.setPointerCapture(e.pointerId); } catch { /* nada */ }
      d.style.transition = 'none';
    });
    top.addEventListener('pointermove', (e) => {
      if (y0 == null) return;
      dy = Math.max(0, e.clientY - y0);
      d.style.transform = 'translateY(' + dy + 'px)';
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      d.style.transition = 'transform .3s cubic-bezier(.32,.72,0,1)';
      if (dy > 90) {
        d.style.transform = 'translateY(100%)';
        setTimeout(() => { d.close(); d.style.transform = ''; d.style.transition = ''; }, 300);
      } else {
        d.style.transform = '';
        setTimeout(() => { d.style.transition = ''; }, 300);
      }
    };
    top.addEventListener('pointerup', end);
    top.addEventListener('pointercancel', end);
  }

  // ---------- Editar ----------
  const isoDay = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  function syncDue() {
    const tomorrow = addDays(today0(), 1);
    const other = editDue && editDue !== tomorrow;
    for (const b of $$('[data-due]', el.dueChips)) {
      b.classList.toggle('is-on', b.dataset.due === '0' ? !editDue : editDue === tomorrow);
    }
    $('#dateChip').classList.toggle('is-on', !!other);
    el.editDateLabel.textContent = other ? futureLabel(editDue) : 'Otro día';
    el.editDate.min = isoDay(addDays(today0(), 1));
    el.editDate.value = editDue ? isoDay(editDue) : '';
  }

  function syncQuick() {
    const c = contactsOf({ text: el.editText.value, note: el.editNote.value });
    el.editQuick.hidden = !c.length;
    el.editQuick.replaceChildren(...c.map((x) => {
      const a = document.createElement('a');
      a.href = x.href;
      if (x.kind === 'url' || x.kind === 'wa') { a.target = '_blank'; a.rel = 'noopener'; }
      a.style.setProperty('--c', x.c);
      a.innerHTML = x.icon;
      a.append(x.label);
      return a;
    }));
  }

  function openEdit(t) {
    editing = t;
    el.editText.value = t.text;
    el.editNote.value = t.note || '';
    el.editStar.checked = !!t.star;
    editDue = t.done ? null : t.due && t.due > today0() ? t.due : null;
    el.editRepeat.value = t.repeat || '';
    el.editRepeatLabel.textContent = t.repeat ? REPEAT[t.repeat] : 'Nunca';
    const info = ['Apuntada ' + (daysAgo(t.created) < 2 ? dayLabel(t.created).toLowerCase() : 'el ' + dayLabel(t.created).toLowerCase()) + ' a las ' + hm(t.created)];
    if (t.done && t.doneAt) info.push('tachada ' + dayLabel(t.doneAt).toLowerCase() + ' a las ' + hm(t.doneAt));
    el.editInfo.textContent = info.join(' · ') + '.';
    $('#dueChips').closest('.cell').hidden = !!t.done;
    syncDue();
    syncQuick();
    openSheet(el.edit);
    if (t.audio && t.text === 'Nota de voz') el.editText.select();
  }

  async function saveEdit() {
    const t = editing;
    if (!t) return;
    const text = el.editText.value.trim();
    closeSheet(el.edit);
    if (!text && !t.audio) { removeTask(t); return; }
    t.text = text || 'Nota de voz';
    t.note = el.editNote.value.trim();
    t.star = el.editStar.checked;
    if (!t.done) t.due = editDue;
    t.repeat = el.editRepeat.value || null;
    await db.put(t);
    render();
  }

  // ---------- Buscar ----------
  function openSearch() {
    el.searchBar.hidden = false;
    el.search.focus();
  }
  function closeSearch() {
    query = '';
    el.search.value = '';
    el.searchBar.hidden = true;
    render();
  }

  // ---------- Ajustes ----------
  function setVoice(mode) {
    voiceMode = mode;
    prefs.set('voice', mode);
    syncAction();
    syncMenu();
  }

  function syncMenu() {
    el.voiceSeg.dataset.active = voiceMode || 'dictar';
    for (const b of $$('[data-voice]', el.voiceSeg)) {
      b.setAttribute('aria-checked', String(b.dataset.voice === voiceMode));
      b.disabled = b.dataset.voice === 'dictar' ? !SR : !CAN_RECORD;
    }
    el.voiceNote.textContent = !SR && !CAN_RECORD
      ? 'Este navegador no deja usar el micrófono. Ábrela en Chrome (Android) o Safari (iPhone).'
      : !SR
        ? 'Este navegador no dicta a texto: el micrófono graba notas de voz.'
        : voiceMode === 'dictar'
          ? 'Lo que digas se convierte en texto y se apunta solo. En Android necesita internet.'
          : 'Guarda el audio tal cual, también sin internet. Luego puedes ponerle nombre.';
    $('[data-act="install"]', el.menu).hidden = STANDALONE;
  }

  async function shareTodo() {
    const todo = tasks.filter(isToday).sort((a, b) => (!!b.star - !!a.star) || byOrder(a, b));
    const crossed = tasks.filter(crossedToday);
    if (!todo.length && !crossed.length) { toast('No hay nada que compartir.'); return; }
    const lines = ['Pendientes · ' + new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })];
    lines.push(...todo.map((t) => (t.star ? '★ ' : '☐ ') + t.text));
    if (crossed.length) lines.push('', ...crossed.map((t) => '☑ ' + t.text));
    const text = lines.join('\n');
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); toast('Lista copiada'); } catch { toast('No se ha podido compartir.'); }
  }

  async function exportData() {
    const out = { app: 'pendientes', version: 2, exported: new Date().toISOString(), tasks: [] };
    for (const t of tasks) {
      const x = { ...t };
      if (t.audio) {
        const a = await db.getAudio(t.id);
        if (a) x.audioData = { type: a.type, b64: bufToB64(a.buf) };
      }
      out.tasks.push(x);
    }
    const name = 'pendientes-' + isoDay(Date.now()) + '.json';
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Copia de Pendientes' });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Copia guardada en Descargas');
  }

  async function importData(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch { toast('Ese archivo no es una copia válida.'); return; }
    if (!data || !Array.isArray(data.tasks)) { toast('Ese archivo no es una copia de Pendientes.'); return; }
    const have = new Set(tasks.map((t) => t.id));
    let n = 0;
    for (const x of data.tasks) {
      if (!x || typeof x.text !== 'string' || !x.id || have.has(x.id)) continue;
      const t = {
        id: String(x.id), text: x.text, note: typeof x.note === 'string' ? x.note : '',
        done: !!x.done, star: !!x.star,
        created: Number(x.created) || Date.now(), doneAt: x.doneAt ? Number(x.doneAt) : null,
        order: Number(x.order) || Number(x.created) || Date.now(),
        due: x.due ? Number(x.due) : null, repeat: REPEAT[x.repeat] ? x.repeat : null,
      };
      if (x.audio && x.audioData && x.audioData.b64) {
        try {
          await db.putAudio(t.id, { buf: b64ToBuf(x.audioData.b64), type: String(x.audioData.type || 'audio/webm') });
          t.audio = true;
          t.dur = Number(x.dur) || 0;
        } catch { /* audio dañado: queda solo el texto */ }
      }
      tasks.push(t);
      await db.put(t);
      n++;
    }
    render();
    toast(n ? 'Recuperadas ' + plural(n, 'tarea', 'tareas') : 'Esas tareas ya estaban en la lista.');
  }

  // ---------- Instalar (sin barra del navegador) ----------
  function syncInstallCard() {
    const hiddenAt = prefs.get('installHidden', 0);
    el.installCard.hidden = STANDALONE || Date.now() - hiddenAt < 7 * 864e5;
  }

  async function install() {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => null);
      installPrompt = null;
      if (choice && choice.outcome === 'accepted') el.installCard.hidden = true;
      return;
    }
    const k = (svg) => '<span class="k">' + svg + '</span>';
    const steps = IS_IOS
      ? [
        'Abre esta página en <b>Safari</b>.',
        'Toca ' + k(ICON.share) + ' <b>Compartir</b> en la barra de abajo.',
        'Elige ' + k(ICON.plusbox) + ' <b>Añadir a pantalla de inicio</b>.',
        'Ábrela desde el icono nuevo: ya sin barras.',
      ]
      : [
        'Abre esta página en <b>Chrome</b>.',
        'Toca ' + k(ICON.dots) + ' el menú de arriba a la derecha.',
        'Elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.',
        'Ábrela desde el icono nuevo: ya sin barras.',
      ];
    el.installSteps.innerHTML = steps.map((s) => '<li><i></i><span>' + s + '</span></li>').join('');
    openSheet(el.installSheet);
  }

  function showTab(f) {
    filter = f;
    el.seg.dataset.active = f;
    for (const b of $$('[data-filter]', el.seg)) b.setAttribute('aria-selected', String(b.dataset.filter === f));
  }

  // ---------- Eventos ----------
  el.input.addEventListener('input', () => { autosize(); syncAction(); });
  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      submitText();
    }
  });
  el.composer.addEventListener('submit', (e) => {
    e.preventDefault();
    if (el.input.value.trim()) submitText();
    else startVoice();
  });

  $('#recStop').addEventListener('click', () => session && session.stop());
  $('#recCancel').addEventListener('click', () => { if (session) session.cancel(); else closeRec(); });
  el.rec.addEventListener('click', (e) => { if (e.target === el.rec && session) session.stop(); });

  for (const b of $$('[data-filter]', el.seg)) {
    b.addEventListener('click', () => {
      if (filter === b.dataset.filter) return;
      showTab(b.dataset.filter);
      render();
    });
  }
  el.clearDone.addEventListener('click', clearDone);
  $('#tipClose').addEventListener('click', () => { prefs.set('tipSwipe', true); el.tip.hidden = true; });

  $('#searchBtn').addEventListener('click', () => (el.searchBar.hidden ? openSearch() : closeSearch()));
  $('#searchCancel').addEventListener('click', closeSearch);
  el.search.addEventListener('input', () => { query = el.search.value.trim(); render(); });
  el.search.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Enter') el.search.blur(); });

  el.toastUndo.addEventListener('click', () => {
    const fn = undoFn;
    hideToast();
    if (fn) fn();
  });

  for (const d of [el.edit, el.menu, el.installSheet]) bindSheet(d);
  el.editForm.addEventListener('submit', (e) => { e.preventDefault(); saveEdit(); });
  $('#editDelete').addEventListener('click', () => { const t = editing; closeSheet(el.edit); if (t) removeTask(t); });
  el.edit.addEventListener('close', () => { editing = null; });
  el.editText.addEventListener('input', syncQuick);
  el.editNote.addEventListener('input', syncQuick);
  el.dueChips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-due]');
    if (!b) return;
    editDue = b.dataset.due === '0' ? null : addDays(today0(), 1);
    syncDue();
  });
  $('#dateChip').addEventListener('click', () => { try { el.editDate.showPicker(); } catch { /* lo abre el propio campo */ } });
  el.editDate.addEventListener('change', () => {
    const v = el.editDate.value;
    if (!v) return;
    const [y, m, d] = v.split('-').map(Number);
    const ts = new Date(y, m - 1, d).getTime();
    editDue = ts > today0() ? ts : null;
    syncDue();
  });
  el.editRepeat.addEventListener('change', () => {
    el.editRepeatLabel.textContent = el.editRepeat.value ? REPEAT[el.editRepeat.value] : 'Nunca';
  });

  $('#menuBtn').addEventListener('click', () => { syncMenu(); openSheet(el.menu); });
  for (const b of $$('[data-voice]', el.voiceSeg)) b.addEventListener('click', () => setVoice(b.dataset.voice));
  el.menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'import') { el.importFile.click(); return; }
    closeSheet(el.menu);
    if (act === 'share') shareTodo();
    else if (act === 'export') exportData();
    else if (act === 'clear') clearDone();
    else if (act === 'install') setTimeout(install, 280);
    else if (act === 'testmic') testMic();
  });
  el.importFile.addEventListener('change', () => {
    const f = el.importFile.files && el.importFile.files[0];
    el.importFile.value = '';
    closeSheet(el.menu);
    if (f) importData(f);
  });

  $('#installBtn').addEventListener('click', install);
  $('#installClose').addEventListener('click', () => { prefs.set('installHidden', Date.now()); el.installCard.hidden = true; });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
  window.addEventListener('appinstalled', () => { el.installCard.hidden = true; });

  // Título pequeño en la barra de arriba al bajar
  new IntersectionObserver(([en]) => el.nav.classList.toggle('is-scrolled', !en.isIntersecting), {
    rootMargin: '-' + (54 + 4) + 'px 0px 0px 0px',
  }).observe(el.bigTitle);

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && session) session.cancel(); });

  // Al volver a la app (o al cambiar de día) se repinta: lo de mañana pasa a hoy
  let shownDay = today0();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (session) session.stop(); stopPlayback(); return; }
    render();
    shownDay = today0();
  });
  setInterval(() => { if (today0() !== shownDay && !g && !session) { shownDay = today0(); render(); } }, 60e3);

  // ---------- Arranque ----------
  async function init() {
    try {
      tasks = await db.all();
    } catch {
      tasks = [];
      toast('Este navegador no deja guardar datos (¿modo privado?).');
    }
    // Tareas de la versión anterior: orden de libreta (la primera apuntada, arriba)
    const old = tasks.filter((t) => t.order == null);
    old.forEach((t) => { t.order = t.created; t.note = t.note || ''; });
    if (old.length) db.putMany(old).catch(() => {});

    render();
    syncAction();
    syncMenu();
    syncInstallCard();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
