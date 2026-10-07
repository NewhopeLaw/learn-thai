// Learn Thai — audio-first spaced-repetition trainer.
//
// Session flow (Pimsleur-style):
//   intro:  narrator names the meaning → Thai played → back-chained parts → learner repeats
//   recall: narrator asks "How do you say …?" → learner answers out loud in the pause →
//           Thai played twice (second time to repeat) → learner grades (Again / Good / Easy)
// Within a session each new item climbs a graduated-interval ladder; across days, a
// simplified SM-2 schedule decides when it comes back.
(() => {
  'use strict';

  const ALL = window.COURSE.units.flatMap((u, unit) => u.items.map(it => ({ ...it, unit })));
  const BY_ID = Object.fromEntries(ALL.map(i => [i.id, i]));
  const KEY = 'learn-thai-audio.v1';
  const DAY = 86400000;
  const LADDER = [8, 30, 90, 240]; // seconds between in-session recalls
  const DEFAULTS = { gender: null, thaiRate: 0.8, pause: 4, maxNew: 6, mic: false, handsFree: false, peek: false };

  // ---------- storage ----------
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
  store.settings = { ...DEFAULTS, ...(store.settings || {}) };
  store.items = store.items || {};
  store.log = store.log || {};
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

  // ---------- run control (pause / stop) ----------
  const STOP = Symbol('stop'), PAUSE = Symbol('pause');
  let run = null;
  let recognizer = null;
  const tick = ms => new Promise(r => setTimeout(r, ms));
  function checkpoint() { if (!run || run.stopped) throw STOP; if (run.paused) throw PAUSE; }
  async function wait(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { checkpoint(); await tick(Math.min(100, end - Date.now())); }
    checkpoint();
  }
  async function en(text) { checkpoint(); await rawSpeak(text, 'en', 1); checkpoint(); }
  async function th(text) { checkpoint(); await rawSpeak(text, 'th', S.thaiRate); checkpoint(); }
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

  function commit(id, first, wasReview) {
    const prev = store.items[id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
    let { ease, interval, lapses } = prev;
    if (!wasReview) interval = first === 'easy' ? 3 : 1;
    else if (first === 'again') { interval = 1; ease = Math.max(1.3, ease - 0.2); lapses++; }
    else if (first === 'easy') { interval = Math.ceil(Math.max(interval, 1) * ease * 1.3); ease += 0.15; }
    else interval = interval <= 1 ? 3 : Math.ceil(interval * ease);
    store.items[id] = { ease, interval, lapses, reps: prev.reps + 1, due: startOfToday() + interval * DAY };
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
    s.sinceIntro = 0;
    s.last = id;
  }

  async function recall(s, a) {
    const it = BY_ID[a.id];
    const text = thOf(it);
    if (a.nextAt > Date.now() && s.active.length === 1) await wait(Math.min(a.nextAt - Date.now(), 4000));
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
    s.current = text;
    const g = S.handsFree ? (ok === false ? 'again' : 'good') : await awaitGrade();
    s.current = null;
    grade(s, a, g);
  }

  function grade(s, a, g) {
    if (!(a.id in s.first)) s.first[a.id] = g;
    s.cards++;
    s.last = a.id;
    s.sinceIntro++;
    if (g === 'again') { a.step = 0; a.nextAt = Date.now() + LADDER[0] * 1000; return; }
    a.step += g === 'easy' ? 2 : 1;
    if (a.step >= LADDER.length) {
      s.active.splice(s.active.indexOf(a), 1);
      s.done++;
      commit(a.id, s.first[a.id], a.review);
      save();
    } else a.nextAt = Date.now() + LADDER[a.step] * 1000;
    progress(s);
  }

  let pendingGrade = null;
  async function awaitGrade() {
    pendingGrade = null;
    stage('grade', 'How did you do?');
    ui.grades.hidden = false;
    try {
      for (;;) {
        checkpoint();
        if (pendingGrade) return pendingGrade;
        await tick(80);
      }
    } finally { ui.grades.hidden = true; pendingGrade = null; }
  }

  // ---------- session ----------
  let sess = null;
  async function startSession() {
    if (!synth) return alert('This browser has no speech support. Try Chrome or Edge.');
    const due = dueIds().slice(0, 30);
    const fresh = unseen().slice(0, S.maxNew).map(i => i.id);
    if (!due.length && !fresh.length) return alert('Nothing to study right now — come back tomorrow!');
    sess = {
      active: due.map(id => ({ id, step: LADDER.length - 1, nextAt: 0, review: true })),
      newQ: fresh, total: due.length + fresh.length, done: 0, cards: 0,
      first: {}, last: null, sinceIntro: 0, unit: -1, current: null,
    };
    run = { stopped: false, paused: false };
    show('session');
    ui.unit.textContent = due.length ? 'Review' : '';
    progress(sess);
    synth.cancel();
    try {
      await en(due.length ? `Let's begin with a review.` : `Let's begin.`);
      for (;;) {
        const c = pick(sess);
        if (!c) break;
        for (;;) {
          try { c.kind === 'intro' ? await intro(sess, c.id) : await recall(sess, c.a); break; }
          catch (e) {
            if (e !== PAUSE) throw e;
            stage('paused', 'Paused');
            while (run && !run.stopped && run.paused) await tick(150);
            checkpoint();
          }
        }
      }
      stage('listen', 'Done!');
      await en(`Great work. That's the end of this session.`);
    } catch (e) { if (e !== STOP) console.error(e); }
    finish();
  }

  function finish() {
    if (!sess) return;
    for (const a of sess.active) {
      if (!a.review) commit(a.id, 'again', false); // introduced but not mastered: see it tomorrow
      else if (sess.first[a.id] === 'again') commit(a.id, 'again', true);
    }
    if (sess.cards) store.log[dayKey()] = (store.log[dayKey()] || 0) + sess.cards;
    save();
    sess = null; run = null;
    synth.cancel();
    show('home');
  }

  function stopSession() { if (run) { run.stopped = true; synth.cancel(); try { recognizer?.abort(); } catch {} } }
  function togglePause() {
    if (!run) return;
    run.paused = !run.paused;
    if (run.paused) { synth.cancel(); try { recognizer?.abort(); } catch {} }
    ui.pause.textContent = run.paused ? 'Resume' : 'Pause';
  }

  // ---------- UI ----------
  const $ = id => document.getElementById(id);
  const ui = {
    home: $('home'), session: $('session'), setup: $('setup'),
    orb: $('orb'), orbLabel: $('orbLabel'), prompt: $('prompt'), peek: $('peek'), feedback: $('feedback'),
    grades: $('grades'), unit: $('unit'), bar: $('bar'), count: $('count'), pause: $('pause'),
  };

  function show(view) {
    ui.setup.hidden = view !== 'setup';
    ui.home.hidden = view !== 'home';
    ui.session.hidden = view !== 'session';
    if (view === 'home') renderHome();
    ui.pause.textContent = 'Pause';
  }
  function stage(kind, label, prompt, rom) {
    ui.orb.dataset.stage = kind;
    ui.orbLabel.textContent = label;
    if (prompt !== undefined) ui.prompt.textContent = prompt ? `“${prompt}”` : '';
    ui.peek.textContent = S.peek && rom ? rom : '';
  }
  function progress(s) {
    const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
    ui.bar.style.width = pct + '%';
    ui.count.textContent = `${s.done} / ${s.total} learned this session`;
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
    $('statNew').textContent = unseen().length;
    $('statStreak').textContent = streak();
    const nxt = unseen()[0];
    $('nextUp').textContent = nxt ? `Next new material: ${window.COURSE.units[nxt.unit].title}` : 'You have started every unit — keep reviewing!';
    syncSettings();
  }
  function renderVoiceInfo() {
    const el = document.getElementById('voiceInfo');
    if (!el) return;
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
    $('setPeek').checked = S.peek;
  }

  $('setGender').onchange = e => { S.gender = e.target.value; save(); };
  $('setRate').oninput = e => { S.thaiRate = +e.target.value; $('rateVal').textContent = S.thaiRate.toFixed(2) + '×'; save(); };
  $('setPause').oninput = e => { S.pause = +e.target.value; $('pauseVal').textContent = S.pause + ' s'; save(); };
  $('setNew').oninput = e => { S.maxNew = +e.target.value; $('newVal').textContent = S.maxNew; save(); };
  $('setMic').onchange = e => { S.mic = e.target.checked; save(); };
  $('setHands').onchange = e => { S.handsFree = e.target.checked; save(); };
  $('setPeek').onchange = e => { S.peek = e.target.checked; save(); };
  $('testVoice').onclick = () => { synth?.cancel(); rawSpeak(fill('สวัสดี{P}'), 'th', S.thaiRate); };
  $('reset').onclick = () => {
    if (!confirm('Erase all progress on this device?')) return;
    store.items = {}; store.log = {}; save(); renderHome();
  };
  document.querySelectorAll('[data-gender]').forEach(b => b.onclick = () => {
    S.gender = b.dataset.gender; save(); show('home');
  });
  $('start').onclick = startSession;
  $('stop').onclick = stopSession;
  ui.pause.onclick = togglePause;
  document.querySelectorAll('[data-grade]').forEach(b => b.onclick = () => { pendingGrade = b.dataset.grade; });
  $('replay').onclick = () => { if (sess?.current) { synth.cancel(); rawSpeak(sess.current, 'th', S.thaiRate); } };

  document.addEventListener('keydown', e => {
    if (ui.session.hidden || e.target.closest('input,select,button')) return;
    if (e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key === 'Escape') stopSession();
    else if (!ui.grades.hidden && ['1', '2', '3'].includes(e.key)) pendingGrade = ['again', 'good', 'easy'][+e.key - 1];
    else if (!ui.grades.hidden && e.key.toLowerCase() === 'r') $('replay').click();
  });

  renderVoiceInfo();
  show(S.gender ? 'home' : 'setup');
})();
