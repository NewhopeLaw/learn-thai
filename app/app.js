// Learn Thai — audio-first spaced-repetition trainer.
//
// Session flow (Pimsleur-style):
//   intro:  narrator names the meaning → Thai played → back-chained parts → learner repeats
//   recall: narrator asks "How do you say …?" → learner answers out loud in the pause →
//           Thai played twice (second time to repeat) → learner grades (Again / Good / Easy)
// Within a session, missed items come back at growing gaps (Good/Easy retires them); across days, a
// simplified SM-2 schedule decides when it comes back.
(() => {
  'use strict';

  const ALL = window.COURSE.units.flatMap((u, unit) => u.items.map(it => ({ ...it, unit })));
  const BY_ID = Object.fromEntries(ALL.map(i => [i.id, i]));
  // Learner profiles (no passwords): the chosen name is remembered in this browser.
  const BASE_KEY = 'learn-thai-audio.v1';
  const PROFILE_KEY = 'learn-thai-profile';
  const PROFILES_KEY = 'learn-thai-profiles';
  let profile = null, profiles = [];
  // Opened from the "Connect my phone" QR code: #link=<base64url {t: token, p: slug, n: name, g: gender}>.
  // Sets up the learner and GitHub sync on this device, then removes the key from the address bar.
  let linkedDevice = false;
  try {
    const m = location.hash.match(/^#link=([\w-]+)$/);
    if (m) {
      const d = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))));
      history.replaceState(null, '', location.pathname + location.search);
      if (d.t && /^[a-z0-9-]+$/.test(d.p)) {
        localStorage.setItem('learn-thai-sync', JSON.stringify({ token: d.t }));
        const list = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
        if (!list.some(p => p.slug === d.p)) list.push({ slug: d.p, name: d.n || d.p });
        localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
        const key = `${BASE_KEY}:${d.p}`;
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ settings: { name: d.n || d.p, gender: d.g || 'male' } }));
        localStorage.setItem(PROFILE_KEY, d.p);
        linkedDevice = true;
      }
    }
  } catch {}
  try { profile = localStorage.getItem(PROFILE_KEY); profiles = JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; } catch {}
  const KEY = profile ? `${BASE_KEY}:${profile}` : BASE_KEY;
  const PROFILE_FILE = `progress/${profile}.json`;
  const DAY = 86400000;
  const LADDER = [8, 30, 90, 240]; // seconds between in-session recalls
  const DEFAULTS = { name: '', gender: null, voice: 'both', thaiRate: 0.8, pause: 4, maxNew: 6, mic: false, handsFree: false, peek: false };

  // ---------- storage ----------
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
  store.settings = { ...DEFAULTS, ...(store.settings || {}) };
  store.items = store.items || {};
  store.log = store.log || {};   // day -> cards reviewed
  store.secs = store.secs || {};  // day -> seconds studied
  const S = store.settings;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  // ---------- gendered text ----------
  function fill(s, roman) {
    const f = S.gender === 'female';
    const map = roman
      ? { '{Pq}': f ? 'khá' : 'khráp', '{P}': f ? 'khâ' : 'khráp', '{I}': f ? 'chǎn' : 'phǒm' }
      : { '{Pq}': f ? 'คะ' : 'ครับ', '{P}': f ? 'ค่ะ' : 'ครับ', '{I}': f ? 'ฉัน' : 'ผม' };
    return s.replace(/\{Pq\}|\{P\}|\{I\}/g, m => map[m]);
  }
  const thOf = it => fill(it.th, false);
  const romOf = it => fill(it.rom, true);

  // ---------- speech ----------
  const synth = window.speechSynthesis;
  const voices = { th: null, en: null };
  function pickVoices() {
    const vs = synth ? synth.getVoices() : [];
    const score = v => (/natural|online|neural/i.test(v.name) ? 2 : 0) + (/google|premwadee|niwat|kanya|pattara/i.test(v.name) ? 1 : 0);
    const best = pre => vs.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(pre)).sort((a, b) => score(b) - score(a))[0] || null;
    voices.th = best('th');
    voices.en = best('en-us') || best('en');
    renderVoiceInfo();
  }
  if (synth) { synth.onvoiceschanged = pickVoices; pickVoices(); setTimeout(pickVoices, 800); }

  function rawSpeak(text, lang, rate) {
    return new Promise(res => {
      if (!synth) return res();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'th' ? 'th-TH' : 'en-US';
      if (voices[lang]) u.voice = voices[lang];
      u.rate = rate;
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(t); res(); } };
      // Some browsers never fire onend; don't hang forever.
      const t = setTimeout(fin, 2500 + (text.length * 220) / rate);
      u.onend = fin; u.onerror = fin;
      synth.speak(u);
    });
  }

  // ---------- recorded Thai voices ----------
  // Neural-voice recordings (tools/generate_audio.py); browser TTS is the fallback for anything missing.
  const AUDIO = window.AUDIO || {};
  const THAI_BASE_RATE = 0.85; // recordings are generated at -15% speed
  const VOICE_ORDER = ['male', 'female', 'both'];
  const VOICE_NAMES = { male: 'Niwat (male)', female: 'Premwadee (female)', both: 'Both, alternating' };
  const player = new Audio();
  player.preload = 'auto';
  let alt = 0, hush = 0;
  const voiceFolder = () => (S.voice === 'both' ? (alt++ % 2 ? 'female' : 'male') : S.voice === 'female' ? 'female' : 'male');
  function playRecorded(text) {
    const id = AUDIO[text];
    if (!id) return Promise.resolve(false);
    const h = hush;
    return new Promise(res => {
      let done = false;
      const fin = ok => {
        if (done) return; done = true; clearTimeout(t);
        player.onended = player.onpause = player.onerror = null;
        res(ok || hush !== h); // interrupted on purpose: don't fall back to TTS
      };
      const t = setTimeout(() => fin(true), 15000);
      player.onended = () => fin(true);
      player.onpause = () => fin(true);
      player.onerror = () => fin(false);
      player.src = `audio/${voiceFolder()}/${id}.mp3`;
      player.preservesPitch = true;
      player.defaultPlaybackRate = player.playbackRate = Math.min(2, Math.max(0.5, S.thaiRate / THAI_BASE_RATE));
      player.play().catch(() => fin(false));
    });
  }
  async function speakThai(text) { if (!(await playRecorded(text))) await rawSpeak(text, 'th', S.thaiRate); }
  function silence() { hush++; synth?.cancel(); player.pause(); }

  // ---------- run control (pause / stop) ----------
  const STOP = Symbol('stop'), PAUSE = Symbol('pause'), SKIP = Symbol('skip'), GRADE = Symbol('grade');
  let run = null;
  let recognizer = null;
  const tick = ms => new Promise(r => setTimeout(r, ms));
  function checkpoint() {
    if (!run || run.stopped) throw STOP;
    if (run.paused) throw PAUSE;
    if (run.skip) throw SKIP;               // "I know this" pressed
    if (run.grade && run.canGrade) throw GRADE; // graded early, no need to wait
  }
  async function wait(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { checkpoint(); await tick(Math.min(100, end - Date.now())); }
    checkpoint();
  }
  async function en(text) { checkpoint(); await rawSpeak(text, 'en', 1); checkpoint(); }
  async function th(text) { checkpoint(); await speakThai(text); checkpoint(); }
  // Time for the learner to repeat a Thai phrase out loud.
  const repeatGap = text => (1600 + text.length * 140) / Math.min(1, S.thaiRate);
  async function note(segments) {
    for (const seg of segments) seg.en ? await en(seg.en) : (await th(fill(seg.th)), await wait(500));
  }

  // ---------- speech recognition (optional) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function listen(ms) {
    return new Promise(res => {
      if (!SR) return res(null);
      const r = new SR();
      recognizer = r;
      r.lang = 'th-TH'; r.interimResults = false; r.maxAlternatives = 5;
      let out = null, done = false;
      const fin = () => {
        if (done) return; done = true; clearTimeout(t); recognizer = null;
        try { r.abort(); } catch {}
        res(out);
      };
      r.onresult = e => { out = Array.from(e.results[0]).map(a => a.transcript); fin(); };
      r.onerror = fin; r.onend = fin;
      const t = setTimeout(fin, ms);
      try { r.start(); } catch { fin(); }
    });
  }
  const norm = s => s.replace(/[\s.,!?ๆ]/g, '').replace(/(ครับ|ค่ะ|คะ|ค่า|คับ)$/, '');
  function lev(a, b) {
    const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = d[j];
        d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return d[b.length];
  }
  function matches(heard, target) {
    const t = norm(target);
    if (!t) return null; // e.g. the particle alone — nothing left to compare
    return heard.some(h => {
      const n = norm(h);
      return n.includes(t) || 1 - lev(n, t) / Math.max(n.length, t.length) >= 0.6;
    });
  }

  // ---------- scheduling ----------
  function dueIds() {
    const now = Date.now();
    return Object.entries(store.items)
      .filter(([id, s]) => BY_ID[id] && s.due <= now)
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => id);
  }
  const unseen = () => ALL.filter(i => !store.items[i.id]);
  // New phrases in the order they'll be taught: the "Study next" unit first, then course order.
  function upcoming() {
    const u = unseen();
    const f = S.focusUnit;
    if (f == null) return u;
    const mine = u.filter(i => i.unit === f);
    if (!mine.length) { delete S.focusUnit; return u; }
    return [...mine, ...u.filter(i => i.unit !== f)];
  }

  function commit(id, first, wasReview) {
    const prev = store.items[id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
    let { ease, interval, lapses } = prev;
    if (!wasReview) interval = first === 'easy' ? 3 : 1;
    else if (first === 'again') { interval = 1; ease = Math.max(1.3, ease - 0.2); lapses++; }
    else if (first === 'easy') { interval = Math.ceil(Math.max(interval, 1) * ease * 1.3); ease += 0.15; }
    else if (first === 'ok') interval = Math.max(interval + 1, Math.ceil(interval * 1.2)); // auto mode: a little further, less than Good
    else interval = interval <= 1 ? 3 : Math.ceil(interval * ease);
    store.items[id] = { ease, interval, lapses, reps: prev.reps + 1, due: startOfToday() + interval * DAY, updated: Date.now() };
  }

  // "I already know this": skip it and bring it back in a week.
  function markKnown(id) {
    const prev = store.items[id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
    const interval = Math.max(7, prev.interval);
    store.items[id] = { ...prev, interval, reps: prev.reps + 1, due: startOfToday() + interval * DAY, updated: Date.now() };
  }

  function pick(s) {
    const now = Date.now();
    const learning = s.active.filter(a => !a.review).length;
    const due = s.active.filter(a => a.nextAt <= now && a.id !== s.last).sort((a, b) => a.nextAt - b.nextAt);
    const canIntro = s.newQ.length > 0 && learning < 4;
    if (canIntro && (due.length === 0 || s.sinceIntro >= 4)) return { kind: 'intro', id: s.newQ[0] };
    if (due.length) return { kind: 'recall', a: due[0] };
    if (canIntro) return { kind: 'intro', id: s.newQ[0] };
    const rest = s.active.filter(a => a.id !== s.last).sort((a, b) => a.nextAt - b.nextAt);
    if (rest.length) return { kind: 'recall', a: rest[0] };
    if (s.active.length) return { kind: 'recall', a: s.active[0] };
    return null;
  }

  // ---------- cards ----------
  async function intro(s, id) {
    const it = BY_ID[id];
    if (it.unit !== s.unit) {
      s.unit = it.unit;
      ui.unit.textContent = window.COURSE.units[it.unit].title;
      await en(window.COURSE.units[it.unit].title.replace('·', '.'));
    }
    const text = thOf(it);
    stage('listen', 'Listen', it.en);
    await en(`Here's how to say: ${it.en}.`);
    await th(text); await wait(700);
    if (it.parts?.length) {
      await en('Repeat each part after me.');
      for (const p of it.parts) {
        stage('listen', 'Listen', it.en, fill(p.rom, true));
        await th(fill(p.th));
        stage('speak', 'Repeat', it.en, fill(p.rom, true));
        await wait(repeatGap(fill(p.th)));
      }
      await en('Now the whole thing.');
    }
    for (let i = 0; i < 2; i++) {
      stage('listen', 'Listen', it.en, romOf(it));
      await th(text);
      stage('speak', 'Repeat', it.en, romOf(it));
      await wait(repeatGap(text));
    }
    if (it.note) { stage('listen', 'Listen', it.en, romOf(it)); await note(it.note); }
    s.newQ.shift();
    s.active.push({ id, step: 0, nextAt: Date.now() + LADDER[0] * 1000, review: false });
    commit(id, 'again', false); // provisional: due tomorrow unless mastered this session
    save();
    s.sinceIntro = 0;
    s.last = id;
  }

  async function recall(s, a) {
    const it = BY_ID[a.id];
    const text = thOf(it);
    if (a.nextAt > Date.now() && s.active.length === 1) await wait(Math.min(a.nextAt - Date.now(), 4000));
    s.current = text;
    run.canGrade = true;
    ui.grades.hidden = false;
    stage('listen', 'Listen', it.en);
    ui.feedback.textContent = '';
    await en(`How do you say: ${it.en}?`);
    stage('speak', 'Your turn — say it', it.en);
    let heard = null;
    if (S.mic && SR) { ui.orb.classList.add('mic'); heard = await listen(S.pause * 1000 + 3000); ui.orb.classList.remove('mic'); checkpoint(); }
    else await wait(S.pause * 1000);
    const ok = heard ? matches(heard, text) : null;
    if (ok === true) ui.feedback.textContent = '✓ Sounded right';
    else if (ok === false) ui.feedback.textContent = '✗ Sounded different — listen';
    else if (S.mic && SR) ui.feedback.textContent = '… Didn’t catch that';
    stage('listen', 'Listen', it.en, romOf(it));
    await th(text); await wait(400);
    stage('speak', 'Repeat', it.en, romOf(it));
    await th(text); await wait(repeatGap(text));
    const g = S.handsFree ? (ok === false ? 'again' : 'ok') : await awaitGrade();
    grade(s, a, g);
  }

  function grade(s, a, g) {
    if (!(a.id in s.first)) s.first[a.id] = g;
    s.cards++;
    s.last = a.id;
    s.sinceIntro++;
    const now = Date.now();
    store.log[dayKey()] = (store.log[dayKey()] || 0) + 1;
    store.secs[dayKey()] = (store.secs[dayKey()] || 0) + Math.round(Math.min(now - s.tick, 120000) / 1000);
    s.tick = now;
    if (g === 'again') {
      // Missed: keep it in rotation, coming back at growing gaps until it's answered.
      if (a.review && !a.lapsed) { a.lapsed = true; commit(a.id, 'again', true); } // forgot: due tomorrow
      a.nextAt = now + LADDER[Math.min(a.misses = (a.misses || 0) + 1, LADDER.length) - 1] * 1000;
      save();
      return;
    }
    // Good / Easy: done for this session; the long-term schedule decides when it returns.
    s.active.splice(s.active.indexOf(a), 1);
    s.done++;
    if (!a.lapsed) commit(a.id, s.first[a.id], a.review);
    save();
    progress(s);
  }

  // Waits until a grade button is pressed; checkpoint() throws GRADE when it is.
  async function awaitGrade() {
    stage('grade', 'How did you do?');
    for (;;) { checkpoint(); await tick(80); }
  }

  function skipItem(s, id) {
    markKnown(id);
    const qi = s.newQ.indexOf(id);
    if (qi >= 0) {
      s.newQ.splice(qi, 1);
      const extra = upcoming().find(x => !s.newQ.includes(x.id)); // keep the session's new material topped up
      if (extra) { s.newQ.push(extra.id); s.total++; }
    }
    const ai = s.active.findIndex(a => a.id === id);
    if (ai >= 0) s.active.splice(ai, 1);
    s.done++;
    s.last = id;
    save();
    progress(s);
  }

  // ---------- session ----------
  let sess = null;
  async function startSession() {
    if (!synth) return alert('This browser has no speech support. Try Chrome or Edge.');
    const due = dueIds().slice(0, 30);
    const fresh = upcoming().slice(0, S.maxNew).map(i => i.id);
    if (!due.length && !fresh.length) return alert('Nothing to study right now — come back tomorrow!');
    sess = {
      active: due.map(id => ({ id, step: LADDER.length - 1, nextAt: 0, review: true })),
      newQ: fresh, total: due.length + fresh.length, done: 0, cards: 0,
      first: {}, last: null, sinceIntro: 0, unit: -1, current: null, tick: Date.now(),
    };
    run = { stopped: false, paused: false };
    // Unlock audio playback on phones while we're still inside the tap.
    const firstId = Object.values(AUDIO)[0];
    if (firstId) {
      player.muted = true;
      player.src = `audio/male/${firstId}.mp3`;
      player.play().then(() => { player.pause(); player.muted = false; }, () => { player.muted = false; });
    }
    show('session');
    $('sessionWords').appendChild($('vocabPanel'));
    ui.unit.textContent = due.length ? 'Review' : '';
    progress(sess);
    synth.cancel();
    try {
      await en(due.length ? `Let's begin with a review.` : `Let's begin.`);
      for (;;) {
        const c = pick(sess);
        if (!c) break;
        const id = c.kind === 'intro' ? c.id : c.a.id;
        for (;;) {
          Object.assign(run, { skip: false, grade: null, canGrade: false });
          ui.grades.hidden = true;
          sess.current = null;
          let err = null;
          try { c.kind === 'intro' ? await intro(sess, c.id) : await recall(sess, c.a); }
          catch (e) { err = e; }
          if (err === null) break;
          if (err === SKIP) { skipItem(sess, id); ui.feedback.textContent = 'Marked as known. It comes back in a week.'; break; }
          if (err === GRADE) { grade(sess, c.a, run.grade); break; }
          if (err !== PAUSE) throw err;
          stage('paused', 'Paused');
          while (run && !run.stopped && run.paused) await tick(150);
          if (!run || run.stopped) throw STOP;
        }
      }
      stage('listen', 'Done!');
      await en(`Great work. That's the end of this session.`);
    } catch (e) { if (e !== STOP) console.error(e); }
    finish();
  }

  function finish() {
    if (!sess) return;
    save();
    sess = null; run = null;
    synth.cancel();
    ui.grades.hidden = true;
    $('wordsHome').appendChild($('vocabPanel'));
    $('sessionWordsBox').open = false;
    show('home');
    syncNow();
  }

  function stopSession() { if (run) { run.stopped = true; silence(); try { recognizer?.abort(); } catch {} } }
  function togglePause() {
    if (!run) return;
    run.paused = !run.paused;
    if (run.paused) { silence(); try { recognizer?.abort(); } catch {} }
    ui.pause.textContent = run.paused ? '▶' : '⏸';
    ui.pause.setAttribute('aria-label', run.paused ? 'Resume' : 'Pause');
  }

  // ---------- UI ----------
  const $ = id => document.getElementById(id);
  const ui = {
    session: $('session'), setup: $('setup'),
    orb: $('orb'), orbLabel: $('orbLabel'), prompt: $('prompt'), peek: $('peek'), feedback: $('feedback'),
    grades: $('grades'), unit: $('unit'), bar: $('bar'), count: $('count'), pause: $('pause'),
  };

  const TABS = ['today', 'progressView', 'words', 'more'];
  let tab = 'today';
  let offlineReady = null; // set by the offline section
  function show(view) {
    if (view === 'home') view = tab;
    if (TABS.includes(view)) tab = view;
    for (const v of ['setup', 'session', ...TABS]) $(v).hidden = v !== view;
    $('tabbar').hidden = !TABS.includes(view);
    document.querySelectorAll('#tabbar [data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === view ? 'page' : 'false'));
    if (TABS.includes(view)) renderHome();
    ui.pause.textContent = '⏸';
    ui.pause.setAttribute('aria-label', 'Pause');
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('#tabbar [data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
  // One-line status on Today; tap it to open More.
  function renderChip() {
    const el = $('statusChip');
    if (!el) return;
    try { void sync; } catch { return; } // sync section not initialised yet
    const parts = [];
    if (sync.token) parts.push(sync.last ? '✓ Synced' : 'Sync on');
    else parts.push('Not backed up');
    if (offlineReady === true) parts.push('offline ready');
    el.textContent = parts.join(' · ');
  }
  $('statusChip').onclick = () => show('more');
  function stage(kind, label, prompt, rom) {
    ui.orb.dataset.stage = kind;
    ui.orbLabel.textContent = label;
    if (prompt !== undefined) ui.prompt.textContent = prompt ? `“${prompt}”` : '';
    ui.peek.textContent = S.peek && rom ? rom : '';
  }
  function progress(s) {
    const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
    ui.bar.style.width = pct + '%';
    ui.count.textContent = `${s.done} of ${s.total} done`;
  }
  function streak() {
    let n = 0, t = Date.now();
    if (!store.log[dayKey(t)]) t -= DAY; // today not done yet doesn't break the streak
    while (store.log[dayKey(t)]) { n++; t -= DAY; }
    return n;
  }
  function renderHome() {
    $('statLearned').textContent = Object.keys(store.items).length;
    $('statDue').textContent = dueIds().length;
    const due = Math.min(dueIds().length, 30);
    const fresh = Math.min(S.maxNew, upcoming().length);
    $('statNewToday').textContent = fresh;
    $('statStreak').textContent = streak();
    const nxt = upcoming()[0];
    $('nextUp').textContent = nxt ? window.COURSE.units[nxt.unit].title : 'Every unit started. Keep reviewing!';
    const mins = Math.max(1, Math.round(due * 0.4 + fresh * 2));
    $('estimate').textContent = due || fresh ? `About ${mins} min · ${due} reviews, ${fresh} new` : 'All done for today. Come back tomorrow.';
    renderProgress();
    renderVocab();
    renderChip();
    syncSettings();
  }

  // ---------- vocabulary list ----------
  const vocabOpen = new Set();
  function renderVocab() {
    const q = $('vocabSearch').value.trim().toLowerCase();
    const learnedOnly = $('vocabLearned').checked;
    const showRom = $('vocabRom').checked;
    const list = $('vocabList');
    list.innerHTML = '';
    const current = upcoming()[0]?.unit ?? 0;
    window.COURSE.units.forEach((u, ui_) => {
      const items = ALL.filter(i => i.unit === ui_)
        .filter(i => !learnedOnly || store.items[i.id])
        .filter(i => !q || i.en.toLowerCase().includes(q) || romOf(i).toLowerCase().includes(q));
      if (!items.length) return;
      const det = document.createElement('details');
      det.open = q ? true : vocabOpen.size ? vocabOpen.has(ui_) : ui_ === current;
      det.ontoggle = () => (det.open ? vocabOpen.add(ui_) : vocabOpen.delete(ui_));
      const sum = document.createElement('summary');
      const name = document.createElement('span');
      name.className = 'unit-name';
      name.textContent = `${u.title} (${items.length})`;
      sum.appendChild(name);
      if (!sess && ALL.some(i => i.unit === ui_ && !store.items[i.id])) {
        const on = S.focusUnit === ui_;
        const b = document.createElement('button');
        b.className = 'study-next' + (on ? ' on' : '');
        b.textContent = on ? '✓ Up next' : 'Study next';
        b.onclick = e => {
          e.preventDefault();
          if (on) delete S.focusUnit; else S.focusUnit = ui_;
          save();
          on ? renderVocab() : show('today');
        };
        sum.appendChild(b);
      }
      det.appendChild(sum);
      for (const it of items) {
        const row = document.createElement('div');
        row.className = 'vocab-row';
        const play = document.createElement('button');
        play.className = 'play';
        play.textContent = '▶';
        play.setAttribute('aria-label', `Play: ${it.en}`);
        play.onclick = () => playVocab(thOf(it));
        const text = document.createElement('span');
        text.className = 'vocab-text';
        text.textContent = it.en;
        if (showRom) {
          const r = document.createElement('span');
          r.className = 'muted small vocab-rom';
          r.textContent = romOf(it);
          text.appendChild(r);
        }
        const dot = document.createElement('span');
        dot.className = `dot ${strength(it.id)}`;
        dot.title = strength(it.id);
        row.append(play, text, dot);
        det.appendChild(row);
      }
      list.appendChild(det);
    });
    if (!list.children.length) list.innerHTML = '<p class="muted small">Nothing here yet. Phrases appear as you learn them.</p>';
  }
  function playVocab(text) {
    if (run && !run.paused) togglePause(); // listening to the list pauses the lesson
    silence();
    speakThai(text);
  }

  // Strength of a phrase, from its review interval.
  function strength(id) {
    const st = store.items[id];
    if (!st) return 'new';
    return st.interval >= 21 ? 'mastered' : st.interval >= 7 ? 'known' : 'learning';
  }
  function renderProgress() {
    const units = $('units');
    units.innerHTML = '';
    window.COURSE.units.forEach((u, ui_) => {
      const items = ALL.filter(i => i.unit === ui_);
      const c = { learning: 0, known: 0, mastered: 0, new: 0 };
      items.forEach(i => c[strength(i.id)]++);
      const pct = k => (c[k] / items.length) * 100 + '%';
      const row = document.createElement('div');
      row.className = 'unit-row';
      row.innerHTML = `<div class="unit-head"><span></span><span class="muted small">${items.length - c.new} / ${items.length}</span></div>
        <div class="stack" role="img" aria-label="${c.mastered} mastered, ${c.known} known, ${c.learning} learning, ${c.new} new">
          <i class="mastered" style="width:${pct('mastered')}"></i><i class="known" style="width:${pct('known')}"></i><i class="learning" style="width:${pct('learning')}"></i></div>`;
      row.querySelector('.unit-head span').textContent = u.title;
      const weak = items.filter(i => ['new', 'learning'].includes(strength(i.id)));
      if (weak.length) {
        const b = document.createElement('button');
        b.className = 'link small';
        b.textContent = 'I know this unit';
        b.onclick = () => {
          if (!confirm(`Mark the ${weak.length} new or learning phrases in "${u.title}" as known? They'll come back for review in a week.`)) return;
          weak.forEach(i => markKnown(i.id));
          save(); renderHome(); syncNow();
        };
        row.querySelector('.unit-head').appendChild(b);
      }
      units.appendChild(row);
    });

    const days = [];
    for (let k = 13; k >= 0; k--) { const t = Date.now() - k * DAY; days.push({ t, n: store.log[dayKey(t)] || 0 }); }
    const max = Math.max(1, ...days.map(d => d.n));
    const act = $('activity');
    act.innerHTML = '';
    days.forEach(d => {
      const b = document.createElement('div');
      b.className = 'day' + (d.n ? '' : ' empty');
      b.style.height = Math.max(4, (d.n / max) * 60) + 'px';
      b.title = `${new Date(d.t).toLocaleDateString()}: ${d.n} cards`;
      act.appendChild(b);
    });

    const totalCards = Object.values(store.log).reduce((a, b) => a + b, 0);
    const totalMin = Math.round(Object.values(store.secs).reduce((a, b) => a + b, 0) / 60);
    const mastered = ALL.filter(i => strength(i.id) === 'mastered').length;
    $('totals').textContent = `${totalCards} cards reviewed · ${totalMin} min studied · ${mastered} phrases mastered · ${Object.keys(store.log).length} days practised`;
  }
  function renderVoiceInfo() {
    const el = document.getElementById('voiceInfo');
    if (!el) return;
    if (Object.keys(window.AUDIO || {}).length) { el.textContent = ''; el.className = ''; return; } // recordings cover Thai
    if (!synth) { el.textContent = 'Your browser can’t speak. Use Chrome, Edge or Safari.'; el.className = 'warn'; return; }
    if (!voices.th) {
      el.innerHTML = 'No Thai voice found on this device. For the best voices open this page in <b>Microsoft Edge</b>, or install Thai speech: Windows Settings → Time & language → Speech; Android/iOS: add Thai text-to-speech.';
      el.className = 'warn';
    } else {
      el.textContent = `Thai voice: ${voices.th.name}`;
      el.className = 'muted';
    }
  }
  function syncSettings() {
    $('setGender').value = S.gender || 'male';
    $('setRate').value = S.thaiRate; $('rateVal').textContent = S.thaiRate.toFixed(2) + '×';
    $('setPause').value = S.pause; $('pauseVal').textContent = S.pause + ' s';
    $('setNew').value = S.maxNew; $('newVal').textContent = S.maxNew;
    $('setMic').checked = S.mic && !!SR; $('setMic').disabled = !SR;
    $('micNote').textContent = SR ? '' : '(not supported in this browser — try Chrome)';
    $('setHands').checked = S.handsFree;
    renderAuto();
    $('setPeek').checked = S.peek;
  }

  $('setGender').onchange = e => { S.gender = e.target.value; save(); };
  $('setRate').oninput = e => { S.thaiRate = +e.target.value; $('rateVal').textContent = S.thaiRate.toFixed(2) + '×'; save(); };
  $('setPause').oninput = e => { S.pause = +e.target.value; $('pauseVal').textContent = S.pause + ' s'; save(); };
  $('setNew').oninput = e => { S.maxNew = +e.target.value; $('newVal').textContent = S.maxNew; save(); };
  $('setMic').onchange = e => { S.mic = e.target.checked; save(); };
  $('setHands').onchange = e => { S.handsFree = e.target.checked; save(); renderAuto(); };
  // Auto: mark every phrase OK and keep going, for listening without using your hands.
  function renderAuto() {
    const b = $('autoBtn');
    b.textContent = S.handsFree ? '✓ Auto' : 'Auto';
    b.classList.toggle('on', !!S.handsFree);
    b.setAttribute('aria-pressed', String(!!S.handsFree));
  }
  $('autoBtn').onclick = () => {
    S.handsFree = !S.handsFree;
    save();
    renderAuto();
    $('setHands').checked = S.handsFree;
    ui.feedback.textContent = S.handsFree ? 'Auto on: phrases are marked OK and the session keeps going.' : 'Auto off: rate each phrase yourself.';
    if (S.handsFree && run?.canGrade && !run.paused && ui.orb.dataset.stage === 'grade') { run.grade = 'ok'; } // waiting on a rating right now: move on
  };
  $('setPeek').onchange = e => { S.peek = e.target.checked; save(); };
  $('testVoice').onclick = () => { silence(); speakThai(fill('สวัสดี{P}')); };
  $('vocabSearch').oninput = renderVocab;
  $('vocabLearned').onchange = renderVocab;
  $('vocabRom').onchange = renderVocab;
  $('reset').onclick = () => {
    if (!confirm('Erase all progress on this device?')) return;
    store.items = {}; store.log = {}; store.secs = {}; save(); renderHome();
  };
  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(store, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `learn-thai-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.items || typeof data.items !== 'object') throw new Error('not a progress file');
      if (!confirm('Replace the progress on this device with the backup?')) return;
      store.items = data.items; store.log = data.log || {}; store.secs = data.secs || {};
      Object.assign(S, data.settings || {});
      save(); renderHome(); syncNow();
    } catch (err) { alert('Could not read that file: ' + err.message); }
  };

  // ---------- GitHub repo sync ----------
  // Each learner's progress (the same JSON as the backup file) is saved as
  // progress/<name>.json on the repo's "progress" branch, so it never triggers a site rebuild.
  const REPO = 'wonilsart/learn-thai';
  const BRANCH = 'progress';
  const SYNC_KEY = 'learn-thai-sync';
  let sync;
  try { sync = JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch { sync = {}; }
  const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch {} };
  let syncing = false;
  const b64 = str => btoa(unescape(encodeURIComponent(str)));
  const unb64 = str => decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));

  // Returns parsed JSON, or null for 404 when allow404 is set.
  async function gh(path, opts = {}, allow404 = false) {
    const r = await fetch('https://api.github.com' + path, {
      ...opts,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${sync.token}`, Accept: 'application/vnd.github+json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (allow404 && r.status === 404) return null;
    if (r.status === 401) throw new Error('GitHub rejected the key. It may have expired. Disconnect and connect again with a new one.');
    if (r.status === 403 || r.status === 404) throw new Error(`the key can't write to ${REPO}. Check it has Contents: Read and write for that repo.`);
    if (!r.ok) { const e = new Error(`GitHub error ${r.status}`); e.status = r.status; throw e; }
    return r.json();
  }
  async function ensureBranch() {
    if (await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`, {}, true)) return;
    const main = await gh(`/repos/${REPO}/git/ref/heads/main`);
    await gh(`/repos/${REPO}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: main.object.sha }) });
  }
  // Newest change wins per phrase; daily activity keeps the larger count.
  function merge(remote) {
    for (const [id, r] of Object.entries(remote.items || {})) {
      const l = store.items[id];
      if (!l || (r.updated || 0) > (l.updated || 0) || ((r.updated || 0) === (l.updated || 0) && r.reps > l.reps)) store.items[id] = r;
    }
    for (const k of ['log', 'secs']) {
      for (const [d, v] of Object.entries(remote[k] || {})) store[k][d] = Math.max(store[k][d] || 0, v);
    }
  }
  function renderSync(msg) {
    $('syncOff').hidden = !!sync.token;
    $('syncOn').hidden = !sync.token;
    if (msg !== undefined) $('syncStatus').textContent = msg;
    else if (sync.token) $('syncStatus').textContent = `Saving to GitHub as ${PROFILE_FILE}` + (sync.last ? ` · last saved ${new Date(sync.last).toLocaleString()}` : '');
    else $('syncStatus').textContent = '';
    renderChip();
  }
  async function syncOnce() {
    await ensureBranch();
    const cur = await gh(`/repos/${REPO}/contents/${PROFILE_FILE}?ref=${BRANCH}`, {}, true);
    if (cur) merge(JSON.parse(unb64(cur.content)));
    const content = JSON.stringify({ name: S.name, items: store.items, log: store.log, secs: store.secs, settings: S, saved: new Date().toISOString() }, null, 1);
    await gh(`/repos/${REPO}/contents/${PROFILE_FILE}`, {
      method: 'PUT',
      body: JSON.stringify({ message: `Progress: ${S.name || profile}`, content: b64(content), branch: BRANCH, ...(cur ? { sha: cur.sha } : {}) }),
    });
  }
  async function syncNow() {
    if (!sync.token || !profile || syncing) return;
    syncing = true;
    renderSync('Saving to GitHub…');
    try {
      try { await syncOnce(); }
      catch (e) { if (e.status === 409 || e.status === 422) await syncOnce(); else throw e; } // file changed on another device: merge again
      sync.last = Date.now();
      saveSync(); save();
      if (!sess && ui.session.hidden && ui.setup.hidden) renderHome();
      renderSync();
    } catch (e) {
      renderSync('Save to GitHub failed: ' + e.message);
    } finally { syncing = false; }
  }
  $('ghConnect').onclick = async () => {
    const token = $('ghToken').value.trim();
    if (!token) return;
    sync = { token };
    renderSync('Connecting…');
    try {
      await gh(`/repos/${REPO}`);
      $('ghToken').value = '';
      saveSync();
      await syncNow();
    } catch (e) { sync = {}; saveSync(); renderSync('Could not connect: ' + e.message); }
  };
  $('syncBtn').onclick = syncNow;
  $('ghDisconnect').onclick = () => {
    if (!confirm('Disconnect GitHub on this device? Progress already saved on GitHub stays there.')) return;
    sync = {}; saveSync(); renderSync();
  };
  // "Connect my phone": a QR code that sets up this learner + sync on another device.
  function loadQrLib() {
    if (window.qrcode) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'app/vendor/qrcode.min.js';
      s.onload = res; s.onerror = () => rej(new Error('could not load the QR code maker'));
      document.head.appendChild(s);
    });
  }
  $('linkPhone').onclick = async () => {
    const box = $('linkBox');
    if (!box.hidden) { box.hidden = true; $('linkQR').innerHTML = ''; return; }
    try {
      await loadQrLib();
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ t: sync.token, p: profile, n: S.name, g: S.gender }))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const url = new URL(location.pathname, location.origin).href + '#link=' + payload;
      const qr = window.qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      $('linkQR').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 3, scalable: true });
      box.hidden = false;
    } catch (e) { renderSync('Could not make the code: ' + e.message); }
  };

  renderSync(linkedDevice ? 'Phone connected! Loading your progress from GitHub…' : undefined);
  syncNow();
  // Coming back to the app (e.g. after practising on the other device): pull the latest.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !run && Date.now() - (sync.last || 0) > 60000) syncNow();
  });
  function useProfile(slug) {
    try { localStorage.setItem(PROFILE_KEY, slug); } catch {}
    location.reload();
  }
  document.querySelectorAll('[data-gender]').forEach(b => b.onclick = () => {
    const name = $('nameInput').value.trim();
    if (!name) { $('nameInput').focus(); $('nameInput').placeholder = 'Type your name first'; return; }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'learner';
    try {
      const key = `${BASE_KEY}:${slug}`;
      let data = JSON.parse(localStorage.getItem(key) || 'null');
      // The first learner inherits any progress made before profiles existed.
      if (!data) data = profiles.length ? {} : JSON.parse(localStorage.getItem(BASE_KEY) || '{}');
      data.settings = { ...(data.settings || {}), name, gender: b.dataset.gender };
      localStorage.setItem(key, JSON.stringify(data));
      if (!profiles.some(p => p.slug === slug)) profiles.push({ slug, name });
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {}
    useProfile(slug);
  });
  for (const p of profiles) {
    const b = document.createElement('button');
    b.className = 'big';
    b.textContent = `I'm ${p.name}`;
    b.onclick = () => useProfile(p.slug);
    $('profileList').appendChild(b);
  }
  $('existing').hidden = !profiles.length;
  $('whoName').textContent = S.name || profile || '';
  $('switchUser').onclick = () => {
    try { localStorage.removeItem(PROFILE_KEY); } catch {}
    location.reload();
  };
  $('start').onclick = startSession;
  $('stop').onclick = stopSession;
  ui.pause.onclick = togglePause;
  function interrupt() { silence(); try { recognizer?.abort(); } catch {} }
  function pressGrade(g) { if (run?.canGrade && !run.paused) { run.grade = g; interrupt(); } }
  function pressKnow() { if (run && !run.paused) { run.skip = true; interrupt(); } }
  document.querySelectorAll('[data-grade]').forEach(b => b.onclick = () => pressGrade(b.dataset.grade));
  $('know').onclick = pressKnow;
  $('replay').onclick = () => { if (sess?.current) { silence(); speakThai(sess.current); } };
  function setVoice(v) {
    S.voice = v; save();
    const label = VOICE_NAMES[v];
    $('voiceBtn').textContent = { male: '♂ Niwat', female: '♀ Premwadee', both: '♂♀ Both' }[v];
    $('voiceBtn').setAttribute('aria-label', `Voice: ${label}`);
    $('setVoice').value = v;
  }
  $('voiceBtn').onclick = () => setVoice(VOICE_ORDER[(VOICE_ORDER.indexOf(S.voice) + 1) % VOICE_ORDER.length]);
  $('setVoice').onchange = e => setVoice(e.target.value);
  setVoice(VOICE_ORDER.includes(S.voice) ? S.voice : 'both');

  document.addEventListener('keydown', e => {
    if (ui.session.hidden || e.target.closest('input,select,button')) return;
    if (e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key === 'Escape') stopSession();
    else if (['1', '2', '3'].includes(e.key)) pressGrade(['again', 'good', 'easy'][+e.key - 1]);
    else if (e.key.toLowerCase() === 'k') pressKnow();
    else if (e.key.toLowerCase() === 'v') $('voiceBtn').click();
    else if (e.key.toLowerCase() === 'a') $('autoBtn').click();
    else if (!ui.grades.hidden && e.key.toLowerCase() === 'r') $('replay').click();
  });

  // ---------- install & offline ----------
  const AUDIO_CACHE = 'learn-thai-audio-v1'; // must match sw.js
  let installEvt = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installEvt = e;
    $('installBtn').hidden = false;
    $('installHint').hidden = true;
  });
  window.addEventListener('appinstalled', () => { installEvt = null; $('installBtn').hidden = true; });
  $('installBtn').onclick = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    installEvt = null;
    $('installBtn').hidden = true;
  };
  if (!standalone()) setTimeout(() => { if (!installEvt) $('installHint').hidden = false; }, 3000);

  const audioUrls = () => [...new Set(Object.values(AUDIO))]
    .flatMap(id => ['male', 'female'].map(v => new URL(`audio/${v}/${id}.mp3`, location.href).href));
  async function offlineState() {
    if (!('caches' in window)) return null;
    const c = await caches.open(AUDIO_CACHE);
    const have = new Set((await c.keys()).map(r => r.url));
    const urls = audioUrls();
    const missing = urls.filter(u => !have.has(u));
    return { total: urls.length, have: urls.length - missing.length, missing };
  }
  async function renderOffline() {
    const st = await offlineState();
    if (!st || !st.total) return;
    if (!st.missing.length) {
      $('offlineStatus').textContent = `✓ Ready offline: all ${st.total} audio files are saved on this device.`;
      $('offlineBtn').hidden = true;
      offlineReady = true; renderChip();
    } else {
      $('offlineStatus').textContent = st.have
        ? `${st.have} of ${st.total} audio files saved. Download the rest to use lessons without internet.`
        : 'Save all the audio (about 9 MB) so lessons work without internet.';
      $('offlineBtn').hidden = false;
      offlineReady = false; renderChip();
    }
  }
  let downloading = false;
  $('offlineBtn').onclick = async () => {
    if (downloading) return;
    downloading = true;
    $('offlineBtn').disabled = true;
    try {
      try { await navigator.storage?.persist?.(); } catch {} // ask the browser not to evict it
      const st = await offlineState();
      const c = await caches.open(AUDIO_CACHE);
      const queue = [...st.missing];
      let done = st.have, failed = 0;
      const worker = async () => {
        while (queue.length) {
          const u = queue.shift();
          try { const r = await fetch(u, { cache: 'no-store' }); if (r.status === 200) await c.put(u, r); else failed++; }
          catch { failed++; }
          done++;
          $('offlineStatus').textContent = `Downloading… ${done} / ${st.total}`;
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      if (failed) $('offlineStatus').textContent = `${failed} files didn't download. Check your connection and press the button again.`;
      else await renderOffline();
    } finally {
      downloading = false;
      $('offlineBtn').disabled = false;
    }
  };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  renderOffline();

  renderVoiceInfo();
  show(profile && S.gender ? 'home' : 'setup');
})();
