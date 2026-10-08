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
  const DEFAULTS = { name: '', gender: null, voice: 'both', thaiRate: 0.8, pause: 4, mic: false, handsFree: false, peek: false };

  // ---------- storage ----------
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
  store.settings = { ...DEFAULTS, ...(store.settings || {}) };
  store.items = store.items || {};
  store.log = store.log || {};   // day -> cards reviewed
  store.secs = store.secs || {};  // day -> seconds studied
  store.lessons = store.lessons || {}; // unit key -> time the Talk lesson was finished
  store.songs = store.songs || {};     // song id -> time the song was learned
  const UNITS = window.COURSE.units;
  const unitKey = u => UNITS[u].key;
  const unitIndex = key => UNITS.findIndex(x => x.key === key);
  const A1_KEYS = new Set(['greetings','getting-by','numbers','money','food-shopping','want-have-can','question-words','verbs','airport','transport','getting-around','places','hotel','ordering-food','street-food','clothes','about-you','family','friends','small-talk','reactions','time-feelings','days-times','telling-time','weather','health','massage','beaches','temples','phone','comparing']);
  const levelOf = unit => unit.level || (unit.song ? 'Songs' : A1_KEYS.has(unit.key) ? 'A1' : 'A2');
  const LEVEL_NAMES = { A1: 'A1 · Beginner', A2: 'A2 · Elementary', Songs: 'Songs' };
  // v3: lessons used to be keyed by unit number; units now carry a stable key so they can be reordered.
  if (!(store.lessonsV >= 3)) {
    const OLD = ['greetings','getting-by','food-shopping','numbers','money','want-have-can','getting-around','transport','hotel','ordering-food','about-you','time-feelings','health','small-talk','question-words','verbs','days-times','places','street-food','clothes','massage','beaches','temples','phone','friends','reactions','family','telling-time','airport','comparing'];
    const moved = {};
    for (const [k, v] of Object.entries(store.lessons)) moved[/^\d+$/.test(k) ? (OLD[+k] || k) : k] = v;
    store.lessons = moved;
    delete store.settings.focusUnit; delete store.settings.talkUnit;
    store.lessonsV = 3;
  }
  const S = store.settings;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  // A card id is a phrase id (speaking card, EN→TH) or phrase id + "~r" (meaning card, TH→EN).
  const cardOf = cid => { const i = cid.indexOf('~'); const id = i < 0 ? cid : cid.slice(0, i); return { id, it: BY_ID[id], dir: i < 0 ? 'p' : 'r' }; };
  // v2: phrases learned before meaning cards existed get one, on the same schedule.
  if (!(store.v >= 2)) {
    for (const [id, st] of Object.entries(store.items)) {
      if (!id.includes('~') && BY_ID[id] && !store.items[id + '~r']) store.items[id + '~r'] = { ...st, updated: Date.now() };
    }
    store.v = 2; save();
  }

  // ---------- gendered text ----------
  function fill(s, roman) { return fillAs(s, roman, S.gender === 'female'); }
  // Fill placeholders for a given speaker: the female voice always uses the female forms, the male voice the male forms.
  function fillAs(s, roman, f) {
    const forms = female => roman
      ? { Pq: female ? 'khá' : 'khráp', P: female ? 'khâ' : 'khráp', I: female ? 'chǎn' : 'phǒm' }
      : { Pq: female ? 'คะ' : 'ครับ', P: female ? 'ค่ะ' : 'ครับ', I: female ? 'ฉัน' : 'ผม' };
    const me = forms(f), other = forms(!f);
    return s.replace(/\{Pbq\}|\{Pb\}|\{Ib\}|\{Pq\}|\{P\}|\{I\}/g, m => {
      const k = m.slice(1, -1);
      return k === 'Pbq' ? other.Pq : k === 'Pb' ? other.P : k === 'Ib' ? other.I : me[k];
    });
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
  const VOICE_NAMES = { male: 'Niwat (male forms)', female: 'Premwadee (female forms)', both: 'Both: hear each form' };
  const player = new Audio();
  player.preload = 'auto';
  let alt = 0, hush = 0;
  const voiceFolder = () => (S.voice === 'both' ? (alt++ % 2 ? 'female' : 'male') : S.voice === 'female' ? 'female' : 'male');
  function playRecorded(text, folder, rate) {
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
      player.src = `audio/${folder || voiceFolder()}/${id}.mp3`;
      player.preservesPitch = true;
      player.defaultPlaybackRate = player.playbackRate = Math.min(2, Math.max(0.5, (rate || S.thaiRate) / THAI_BASE_RATE));
      player.play().catch(() => fin(false));
    });
  }
  async function speakThai(text, folder, rate) { if (!(await playRecorded(text, folder, rate))) await rawSpeak(text, 'th', rate || S.thaiRate); }
  // Speak a phrase template ({P} {I} …) in a voice, filled with that voice's own gender forms.
  const otherVoice = f => (f === 'male' ? 'female' : 'male');
  async function sayRaw(raw, folder, rate) {
    const text = fillAs(raw, false, folder === 'female');
    currentText = text; currentFolder = folder;
    checkpoint(); await speakThai(text, folder, rate); checkpoint();
  }
  const romFor = (it, folder) => fillAs(it.rom, true, folder === 'female');
  function silence() { hush++; synth?.cancel(); player.pause(); }

  // ---------- run control (pause / stop) ----------
  const STOP = Symbol('stop'), PAUSE = Symbol('pause'), SKIP = Symbol('skip'), GRADE = Symbol('grade'), NEXT = Symbol('next');
  let run = null;
  let recognizer = null;
  const tick = ms => new Promise(r => setTimeout(r, ms));
  function checkpoint() {
    if (!run || run.stopped) throw STOP;
    if (run.paused) throw PAUSE;
    if (run.next) throw NEXT;               // "Next" pressed: skip ahead
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
  async function note(segments, folder) {
    for (const seg of segments) seg.en ? await en(seg.en) : (await sayRaw(seg.th, folder || voiceFolder()), await wait(500));
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
      .filter(([id, s]) => cardOf(id).it && s.due <= now)
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
    else if (first === 'ok') interval = Math.max(interval + 1, Math.ceil(interval * 1.2)); // auto mode: a little further, less than Good
    else interval = interval <= 1 ? 3 : Math.ceil(interval * ease);
    store.items[id] = { ease, interval, lapses, reps: prev.reps + 1, due: startOfToday() + interval * DAY, updated: Date.now() };
  }

  // "I already know this": skip both cards and bring them back in a week.
  function markKnown(id) {
    for (const cid of [id, id + '~r']) {
      const prev = store.items[cid] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
      const interval = Math.max(7, prev.interval);
      store.items[cid] = { ...prev, interval, reps: prev.reps + 1, due: startOfToday() + interval * DAY, updated: Date.now() };
    }
  }

  function pick(s) {
    const now = Date.now();
    const learning = new Set(s.active.filter(a => !a.review).map(a => cardOf(a.id).id)).size;
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
    const v1 = voiceFolder();
    const v2 = S.voice === 'both' ? otherVoice(v1) : v1; // Both: hear the phrase in each speaker's own form
    stage('listen', 'Listen', it.en, romFor(it, v1));
    await en(`Here's how to say: ${it.en}.`);
    await sayRaw(it.th, v1); await wait(700);
    if (it.parts?.length) {
      await en('Repeat each part after me.');
      for (const p of it.parts) {
        const prom = fillAs(p.rom, true, v1 === 'female');
        stage('listen', 'Listen', it.en, prom);
        await sayRaw(p.th, v1);
        stage('speak', 'Repeat', it.en, prom);
        await wait(repeatGap(fillAs(p.th, false, v1 === 'female')) * 0.6); // pieces get a shorter pause than the whole phrase
      }
      await en('Now the whole thing.');
    }
    for (const v of [v1, v2]) {
      stage('listen', 'Listen', it.en, romFor(it, v));
      await sayRaw(it.th, v);
      stage('speak', 'Repeat', it.en, romOf(it));
      await wait(repeatGap(thOf(it)));
    }
    if (it.note) { stage('listen', 'Listen', it.en, romFor(it, v1)); await note(it.note, v1); }
    introduced(s, id);
  }
  // A new phrase has been taught (or skipped with Next): it joins the quiz rotation.
  function introduced(s, id) {
    const qi = s.newQ.indexOf(id);
    if (qi >= 0) s.newQ.splice(qi, 1);
    // Meaning first (easier), then speaking.
    [id + '~r', id].forEach((cid, k) => {
      if (!s.active.some(a => a.id === cid)) s.active.push({ id: cid, nextAt: Date.now() + LADDER[0] * 1000 * (k + 1), review: false });
      commit(cid, 'again', false); // provisional: due tomorrow unless answered this session
    });
    save();
    s.sinceIntro = 0;
    s.last = id;
  }

  async function recall(s, a) {
    const { it, dir } = cardOf(a.id);
    const text = thOf(it);
    if (a.nextAt > Date.now() && s.active.length === 1) await wait(Math.min(a.nextAt - Date.now(), 4000));
    const v1 = voiceFolder();
    const v2 = S.voice === 'both' ? otherVoice(v1) : v1;
    currentText = fillAs(it.th, false, v1 === 'female'); currentFolder = v1;
    run.canGrade = true;
    setBar('grade');
    ui.feedback.textContent = '';
    if (dir === 'r') {
      // Meaning card: hear Thai, say the meaning, then hear the answer and repeat the Thai.
      stage('listen', 'Listen', '');
      await en('What does this mean?');
      await sayRaw(it.th, v1);
      stage('speak', 'Say the meaning', '', romFor(it, v1));
      await wait(S.pause * 1000);
      stage('listen', 'Listen', it.en, romFor(it, v2));
      await en(it.en);
      await sayRaw(it.th, v2);
      stage('speak', 'Repeat', it.en, romOf(it));
      await wait(repeatGap(text));
      grade(s, a, S.handsFree ? 'ok' : await awaitGrade());
      return;
    }
    stage('listen', 'Listen', it.en);
    await en(`How do you say: ${it.en}?`);
    stage('speak', 'Your turn — say it', it.en);
    let heard = null;
    if (S.mic && SR) { ui.orb.classList.add('mic'); heard = await listen(S.pause * 1000 + 3000); ui.orb.classList.remove('mic'); checkpoint(); }
    else await wait(S.pause * 1000);
    const ok = heard ? matches(heard, text) : null;
    if (ok === true) ui.feedback.textContent = '✓ Sounded right';
    else if (ok === false) ui.feedback.textContent = '✗ Sounded different — listen';
    else if (S.mic && SR) ui.feedback.textContent = '… Didn’t catch that';
    stage('listen', 'Listen', it.en, romFor(it, v1));
    await sayRaw(it.th, v1); await wait(400);
    stage('speak', 'Repeat', it.en, romFor(it, v2));
    await sayRaw(it.th, v2); await wait(repeatGap(text));
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
      if (a.review && !a.lapsed && !a.practice) { a.lapsed = true; commit(a.id, 'again', true); } // forgot: due tomorrow
      a.nextAt = now + LADDER[Math.min(a.misses = (a.misses || 0) + 1, LADDER.length) - 1] * 1000;
      save();
      return;
    }
    // Good / Easy: done for this session; the long-term schedule decides when it returns.
    s.active.splice(s.active.indexOf(a), 1);
    if (!a.practice) {
      s.done++;
      if (!a.lapsed) commit(a.id, s.first[a.id], a.review);
    }
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
    if (qi >= 0) { s.newQ.splice(qi, 1); s.done += 2; }
    for (const cid of [id, id + '~r']) {
      const ai = s.active.findIndex(a => a.id === cid);
      if (ai >= 0) { const [a] = s.active.splice(ai, 1); if (!a.practice) s.done++; }
    }
    s.last = id;
    save();
    progress(s);
  }

  // ---------- session: Review (Anki) + Lesson (Pimsleur) ----------
  let sess = null;        // the current round of cards
  let inSession = false;
  let currentText = null, currentFolder = null; // what Replay plays

  // The rating buttons stay on screen for the whole session unless Auto mode is on.
  // Outside a quiz they just move ahead (Easy while a phrase is taught = I know this).
  let barMode = 'none';
  let talkMode = false; // Talk lessons have no self-rating
  function setBar(mode) {
    barMode = mode;
    ui.grades.hidden = !inSession || !!S.handsFree || mode === 'none' || talkMode;
    $('nextLink').hidden = mode === 'none';
    $('knowLink').hidden = !(mode === 'intro' || mode === 'grade');
  }

  // Runs one step; handles pause (the step restarts), Next, I know this and early ratings.
  async function step(fn, on = {}) {
    for (;;) {
      Object.assign(run, { skip: false, grade: null, canGrade: false, next: false });
      let err = null;
      try { await fn(); } catch (e) { err = e; }
      if (err === null) return 'done';
      if (err === NEXT) { silence(); return 'next'; }
      if (err === SKIP) { silence(); on.skip?.(); return 'skip'; }
      if (err === GRADE) { silence(); on.grade?.(run.grade); return 'grade'; }
      if (err !== PAUSE) throw err;
      stage('paused', 'Paused');
      while (run && !run.stopped && run.paused) await tick(150);
      if (!run || run.stopped) throw STOP;
    }
  }
  const narrate = text => step(() => { stage('listen', 'Listen', ''); return en(text); });

  function newRound(active, newQ, unit = -1) {
    return {
      active, newQ, total: active.filter(a => !a.practice).length + newQ.length * 2, done: 0, cards: 0,
      first: {}, last: null, sinceIntro: 0, unit, tick: Date.now(),
    };
  }
  async function runCards(s) {
    sess = s;
    progress(s);
    for (;;) {
      const c = pick(s);
      if (!c) break;
      if (c.kind === 'intro') {
        setBar('intro');
        const r = await step(() => intro(s, c.id), {
          skip: () => { skipItem(s, c.id); ui.feedback.textContent = 'Marked as known. It comes back in a week.'; },
        });
        if (r === 'next') introduced(s, c.id);
      } else {
        setBar('grade');
        const r = await step(() => recall(s, c.a), {
          grade: g => grade(s, c.a, g),
          skip: () => { skipItem(s, cardOf(c.a.id).id); ui.feedback.textContent = 'Marked as known. It comes back in a week.'; },
        });
        if (r === 'next') { c.a.nextAt = Date.now() + LADDER[1] * 1000; s.last = c.a.id; } // skipped: ask again a little later
      }
    }
    sess = null;
  }

  // ----- Words: which unit's vocabulary comes next -----
  const hasNewWords = u => ALL.some(i => i.unit === u && !store.items[i.id]);
  function nextWordsUnit() {
    if (S.focusUnit != null && hasNewWords(S.focusUnit)) return S.focusUnit;
    for (let u = 0; u < window.COURSE.units.length; u++) if (hasNewWords(u)) return u;
    return null;
  }

  // ----- Talk: Pimsleur-style lessons -----
  const DIALOGUES = window.DIALOGUES || {};
  const NATIVE_RATE = 1.0; // the opening and closing conversations play at natural speed
  const TALK_LADDER = [8, 30, 90, 240]; // seconds: graduated interval recall within a lesson
  function nextTalk() {
    if (S.talkUnit != null && DIALOGUES[unitKey(S.talkUnit)] && !store.lessons[unitKey(S.talkUnit)]) return S.talkUnit;
    for (let u = 0; u < UNITS.length; u++) if (DIALOGUES[unitKey(u)] && !store.lessons[unitKey(u)]) return u;
    return null;
  }
  const lessonName = u => `Lesson ${u + 1} · ${window.COURSE.units[u].title.replace(/^Unit \d+ · /, '')}`;
  const voiceOf = who => ((who === 'A') === (S.gender === 'female') ? 'female' : 'male');
  const speakerName = who => (voiceOf(who) === 'male' ? 'Niwat' : 'Premwadee');
  const lineLabel = line => (line.who === 'A' ? `You · ${speakerName('A')}` : speakerName('B'));
  function phase(label, pct) {
    ui.bar.style.width = pct + '%';
    ui.count.textContent = label;
  }
  async function sayLine(line, rate) {
    currentText = fill(line.th); currentFolder = voiceOf(line.who);
    checkpoint();
    await speakThai(currentText, currentFolder, rate);
    checkpoint();
  }
  async function playDialogue(d, showMeaning, rate) {
    for (const line of d.lines) {
      setBar('line');
      await step(async () => {
        stage('listen', lineLabel(line), showMeaning ? line.en : '', fill(line.rom, true));
        await sayLine(line, rate);
        await wait(rate ? 450 : 700);
      });
    }
  }
  async function rolePlay(d) {
    for (const line of d.lines) {
      setBar('line');
      await step(async () => {
        if (line.who === 'B') {
          stage('listen', speakerName('B'), line.en, fill(line.rom, true));
          await sayLine(line);
          await wait(600);
        } else {
          stage('speak', 'Your line', line.en);
          await wait(S.pause * 1000 + fill(line.th).length * 60);
          stage('listen', lineLabel(line), line.en, fill(line.rom, true));
          await sayLine(line);
          await wait(repeatGap(fill(line.th)) * 0.6);
        }
      });
    }
  }
  // Reverse building: the pieces of a line from the end backwards, ending with the whole line.
  // Lines are split at spaces; if the last piece is a course phrase with parts, those come first.
  function buildSteps(line) {
    const text = fill(line.th);
    const chunks = text.split(' ').filter(Boolean);
    const steps = [];
    const strip = t => t.replace(/(ครับ|ค่ะ|คะ)$/, ''); // match a course phrase whichever polite particle it ends with
    const lastIt = ALL.find(i => strip(thOf(i)) === strip(chunks[chunks.length - 1]));
    if (lastIt?.parts?.length) for (const p of lastIt.parts) steps.push({ th: fill(p.th), rom: fill(p.rom, true) });
    for (let i = chunks.length - 1; i >= 0; i--) steps.push({ th: chunks.slice(i).join(' '), rom: i === 0 ? fill(line.rom, true) : '' });
    return steps.filter((st, k) => !k || st.th !== steps[k - 1].th);
  }
  // Breakdown of one line: meaning, the line, then reverse building with the learner repeating each piece.
  async function teachLine(line) {
    setBar('line');
    await step(async () => {
      const text = fill(line.th);
      const folder = voiceOf(line.who);
      stage('listen', lineLabel(line), line.en, fill(line.rom, true));
      await en(line.who === 'A' ? `You say: ${line.en}` : `${speakerName('B')} says: ${line.en}`);
      await sayLine(line);
      await wait(500);
      const steps = buildSteps(line);
      if (steps.length > 1) await en('Repeat after me, starting from the end.');
      else await en('Repeat after me.');
      for (const st of steps) {
        stage('listen', 'Listen', line.en, st.rom);
        currentText = st.th; currentFolder = folder;
        checkpoint(); await speakThai(st.th, folder); checkpoint();
        stage('speak', 'Repeat', line.en, st.rom);
        await wait(repeatGap(st.th) * (st.th === text ? 1 : 0.6));
      }
      stage('listen', 'Listen', line.en, fill(line.rom, true));
      await sayLine(line);
      stage('speak', 'Once more', line.en, fill(line.rom, true));
      await wait(repeatGap(text));
    });
  }
  // Anticipation: say the line (yours) or its meaning (theirs) before hearing the answer.
  async function promptLine(line) {
    setBar('line');
    await step(async () => {
      const text = fill(line.th), rom = fill(line.rom, true);
      if (line.who === 'A') {
        stage('listen', 'Listen', line.en);
        await en(`How do you say: ${line.en}?`);
        stage('speak', 'Your turn — say it', line.en);
        await wait(S.pause * 1000 + text.length * 40);
        stage('listen', 'Listen', line.en, rom);
        await sayLine(line);
      } else {
        stage('listen', 'Listen', '');
        await en(`${speakerName('B')} says:`);
        await sayLine(line);
        stage('speak', 'What does it mean?', '');
        await wait(S.pause * 1000);
        stage('listen', 'Listen', line.en, rom);
        await en(line.en);
        await sayLine(line);
      }
      stage('speak', 'Repeat', line.en, rom);
      await wait(repeatGap(text));
    });
  }
  // Graduated interval recall: each taught line is re-prompted at growing gaps.
  async function recallDue(q, max) {
    const now = Date.now();
    const due = q.filter(e => e.nextAt <= now).sort((a, b) => a.nextAt - b.nextAt).slice(0, max);
    for (const e of due) {
      await promptLine(e.line);
      e.step++;
      e.nextAt = Date.now() + (TALK_LADDER[e.step] || TALK_LADDER[TALK_LADDER.length - 1]) * 1000;
    }
  }
  async function runTalk(u) {
    document.body.dataset.level = levelOf(UNITS[u]);
    const d = DIALOGUES[unitKey(u)];
    const label = lessonName(u);
    const t0 = Date.now();
    talkMode = true;
    ui.unit.textContent = label;
    setBar('line');
    phase('Opening conversation', 2);
    await narrate(`${label.replace('·', '.')}. ${d.scene} Listen to the conversation at natural speed. Don't worry about understanding everything yet.`);
    await playDialogue(d, false, NATIVE_RATE);
    // A few lines from the most recent lesson, so they carry across lessons.
    const prev = Object.keys(store.lessons).filter(k => k !== unitKey(u) && DIALOGUES[k]).sort((a, b) => store.lessons[b] - store.lessons[a])[0];
    if (prev != null) {
      phase('From last time', 8);
      await narrate('First, a few lines from last time.');
      const lines = DIALOGUES[prev].lines.filter(l => l.who === 'A').sort(() => Math.random() - 0.5).slice(0, 3);
      for (const line of lines) await promptLine(line);
    }
    const q = [];
    const n = d.lines.length;
    for (let i = 0; i < n; i++) {
      phase(`Line ${i + 1} of ${n}`, 10 + Math.round((70 * i) / n));
      await teachLine(d.lines[i]);
      q.push({ line: d.lines[i], step: 0, nextAt: Date.now() + TALK_LADDER[0] * 1000 });
      await recallDue(q, 2);
    }
    phase('Putting it together', 80);
    await narrate(`Now let's practise all of it.`);
    // Everyone gets recalled at least twice more; wait for the next due line if nothing is ready.
    while (q.some(e => e.step < 3)) {
      const next = q.filter(e => e.step < 3).sort((a, b) => a.nextAt - b.nextAt)[0];
      if (next.nextAt > Date.now()) await step(() => wait(Math.min(next.nextAt - Date.now(), 12000))); // pause/next-safe
      next.nextAt = 0;
      await recallDue(q, 1);
    }
    phase('Your turn', 90);
    await narrate(`Now you are ${d.you}. Say your lines in the pause, then listen.`);
    await rolePlay(d);
    phase('Closing conversation', 96);
    await narrate(`Here's the conversation again at natural speed. Notice how much more you understand now.`);
    await playDialogue(d, true, NATIVE_RATE);
    store.lessons[unitKey(u)] = Date.now();
    if (S.talkUnit === u) delete S.talkUnit;
    store.log[dayKey()] = (store.log[dayKey()] || 0) + n;
    store.secs[dayKey()] = (store.secs[dayKey()] || 0) + Math.round((Date.now() - t0) / 1000);
    save();
    phase('Lesson complete', 100);
  }

  function beginSession() {
    inSession = true;
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
    ui.feedback.textContent = '';
    synth.cancel();
  }

  // Words: due cards (both directions), then the next unit's new words.
  async function startWords(mode = 'both') {
    if (!synth) return alert('This browser has no speech support. Try Chrome or Edge.');
    const due = dueIds().slice(0, 30);
    const unit = nextWordsUnit();
    const doReview = mode !== 'new' && due.length > 0;
    const doNew = mode !== 'review' && unit != null;
    if (!doReview && !doNew) return alert(mode === 'review' ? 'No reviews are due right now.' : mode === 'new' ? 'Every word has been learned. Keep reviewing!' : 'Nothing to study right now. Come back tomorrow!');
    beginSession();
    talkMode = false;
    try {
      if (doReview) {
        ui.unit.textContent = 'Review';
        setBar('line');
        await narrate(`Let's start with a review.`);
        await runCards(newRound(due.map(id => ({ id, nextAt: 0, review: true })), []));
      }
      if (doNew) {
        const fresh = ALL.filter(i => i.unit === unit && !store.items[i.id]).map(i => i.id);
        document.body.dataset.level = levelOf(UNITS[unit]);
        setBar('line');
        await narrate('Now some new words.');
        await runCards(newRound([], fresh));
        if (S.focusUnit === unit && !hasNewWords(unit)) delete S.focusUnit;
      }
      stage('listen', 'Done!', '');
      setBar('none');
      await narrate(`Great work. That's the end of this session.`);
    } catch (e) { if (e !== STOP) console.error(e); }
    finish();
  }

  async function startTalk(u) {
    if (!synth) return alert('This browser has no speech support. Try Chrome or Edge.');
    if (u == null) u = nextTalk();
    if (u == null || !DIALOGUES[unitKey(u)]) return alert('Every lesson is done. Replay any of them from the list.');
    beginSession();
    try {
      await runTalk(u);
      stage('listen', 'Done!', '');
      setBar('none');
      await narrate(`Great work. That's the end of the lesson.`);
    } catch (e) { if (e !== STOP) console.error(e); }
    finish();
  }

  function finish() {
    if (!inSession) return;
    inSession = false;
    talkMode = false;
    delete document.body.dataset.level;
    save();
    sess = null; run = null; currentText = null;
    synth.cancel();
    setBar('none');
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

  const TABS = ['words', 'talk', 'song', 'more'];
  let tab = 'words';
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
    const nUnits = window.COURSE.units.length;
    // Words
    $('statLearned').textContent = Object.keys(store.items).filter(k => !k.includes('~') && BY_ID[k]).length;
    const due = Math.min(dueIds().length, 30);
    $('statDue').textContent = due;
    $('statStreak').textContent = streak();
    const unit = nextWordsUnit();
    const fresh = unit != null ? ALL.filter(i => i.unit === unit && !store.items[i.id]).length : 0;
    $('statNew').textContent = fresh;
    $('nextUp').textContent = unit != null ? `${levelOf(UNITS[unit])} · ${UNITS[unit].title}` : 'All words learned';
    const reviewMin = Math.round(due * 0.4), newMin = Math.round(fresh * 1.1);
    $('start').textContent = due && fresh ? '▶  Start: review + new words' : due ? '▶  Start review' : fresh ? '▶  Learn new words' : '▶  Start';
    $('startReview').textContent = due ? `Review only · ${due} cards` : 'No reviews due';
    $('startNew').textContent = fresh ? `New words only · ${fresh}` : 'No new words';
    $('estimate').textContent = due || fresh
      ? `About ${Math.max(1, reviewMin + newMin)} min` + (due ? ` · review ${reviewMin} min` : '') + (fresh ? ` · new words ${newMin} min` : '')
      : 'All done for today. Come back tomorrow.';
    // Talk
    const t = nextTalk();
    const doneTalk = Object.keys(store.lessons).filter(k => DIALOGUES[k]).length;
    $('statTalk').textContent = `${doneTalk} of ${UNITS.filter(x => DIALOGUES[x.key]).length}`;
    $('talkNext').textContent = t != null ? lessonName(t) : 'All lessons done';
    $('talkScene').textContent = t != null ? DIALOGUES[unitKey(t)].scene : 'Replay any lesson from the list below.';
    $('startTalk').hidden = t == null;
    $('talkEstimate').textContent = t != null ? `About ${8 + DIALOGUES[unitKey(t)].lines.length * 2} min · no buttons needed, just listen and speak` : '';
    renderLessons();
    renderSongs();
    renderProgress();
    renderVocab();
    renderChip();
    syncSettings();
  }
  function renderLessons() {
    const list = $('lessonList');
    list.innerHTML = '';
    let lastLevel = null;
    UNITS.forEach((unit, u) => {
      const d = DIALOGUES[unit.key];
      if (!d) return;
      if (levelOf(unit) !== lastLevel) {
        lastLevel = levelOf(unit);
        const h = document.createElement('p');
        h.className = 'level-head';
        h.textContent = LEVEL_NAMES[lastLevel] || lastLevel;
        list.appendChild(h);
      }
      const done = store.lessons[unit.key];
      const row = document.createElement('div');
      row.className = 'lesson-row level-' + levelOf(unit) + (done ? ' done' : '');
      const text = document.createElement('div');
      text.className = 'lesson-text';
      const title = document.createElement('b');
      title.textContent = (done ? '✓ ' : '') + lessonName(u);
      const scene = document.createElement('span');
      scene.className = 'muted small';
      scene.textContent = d.scene;
      text.append(title, scene);
      const b = document.createElement('button');
      b.className = 'study-next';
      b.textContent = done ? 'Replay' : 'Play';
      b.onclick = () => startTalk(u);
      row.append(text, b);
      list.appendChild(row);
    });
  }

  // ---------- Song: learn lyrics line by line ----------
  const SONGS = window.SONGS || [];
  async function sayText(text, folder, rate) {
    currentText = text; currentFolder = folder;
    checkpoint(); await speakThai(text, folder, rate); checkpoint();
  }
  async function runSong(song) {
    const folder = voiceOf('A');
    const t0 = Date.now();
    talkMode = true;
    ui.unit.textContent = song.title;
    setBar('line');
    const lines = song.sections.flatMap(sec => sec.lines.map(l => ({ ...l, section: sec.name })));
    phase('Key words', 2);
    await narrate(`${song.titleEn}. First, the key words.`);
    for (const w of song.words) {
      await step(async () => {
        stage('listen', 'Listen', w.en, w.rom);
        await en(w.en);
        await sayText(w.th, folder);
        stage('speak', 'Repeat', w.en, w.rom);
        await wait(repeatGap(w.th));
      });
    }
    await narrate('Now the lines, one at a time. Spoken, not sung, so you hear every word.');
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      phase(`${L.section} · line ${i + 1} of ${lines.length}`, 10 + Math.round((75 * i) / lines.length));
      await step(async () => {
        stage('listen', L.section, L.en, L.rom);
        await en(L.en);
        await sayText(L.th, folder);
        await wait(400);
        const chunks = L.th.split(' ').filter(Boolean);
        const steps = [];
        for (let k = chunks.length - 1; k >= 0; k--) steps.push(chunks.slice(k).join(' '));
        if (steps.length > 1) await en('From the end.');
        for (const st of steps) {
          const rom = st === L.th ? L.rom : '';
          stage('listen', 'Listen', L.en, rom);
          await sayText(st, folder);
          stage('speak', 'Repeat', L.en, rom);
          await wait(repeatGap(st) * (st === L.th ? 1 : 0.6));
        }
      });
      if (i > 0) {
        // Chaining: songs are remembered in order, so hear the previous line and say this one.
        await step(async () => {
          stage('listen', 'Listen', '');
          await en('What comes next?');
          await sayText(lines[i - 1].th, folder);
          stage('speak', 'Say the next line', lines[i - 1].en);
          await wait(S.pause * 1000 + L.th.length * 50);
          stage('listen', 'Listen', L.en, L.rom);
          await sayText(L.th, folder);
          stage('speak', 'Repeat', L.en, L.rom);
          await wait(repeatGap(L.th));
        });
      }
      if ((i + 1) % 3 === 0 || i === lines.length - 1) {
        await narrate('From the top.');
        for (let k = 0; k <= i; k++) {
          await step(async () => {
            stage('speak', 'Say it', lines[k].en);
            await wait(S.pause * 750 + lines[k].th.length * 40);
            stage('listen', 'Listen', lines[k].en, lines[k].rom);
            await sayText(lines[k].th, folder);
            await wait(300);
          });
        }
      }
    }
    phase('All together', 92);
    await narrate('The whole song, spoken. Then sing it with the recording.');
    for (const L of lines) await step(async () => { stage('listen', L.section, L.en, L.rom); await sayText(L.th, folder); await wait(500); });
    store.songs[song.id] = Date.now();
    store.log[dayKey()] = (store.log[dayKey()] || 0) + lines.length;
    store.secs[dayKey()] = (store.secs[dayKey()] || 0) + Math.round((Date.now() - t0) / 1000);
    save();
    phase('Done', 100);
  }
  async function startSong(id) {
    if (!synth) return alert('This browser has no speech support. Try Chrome or Edge.');
    const song = SONGS.find(x => x.id === id);
    if (!song) return;
    beginSession();
    try {
      await runSong(song);
      stage('listen', 'Done!', '');
      setBar('none');
      await narrate('Now open the recording and sing along.');
    } catch (e) { if (e !== STOP) console.error(e); }
    finish();
  }
  function renderSongs() {
    const box = $('songList');
    box.innerHTML = '';
    const showRom = $('songRom').checked;
    for (const song of SONGS) {
      const card = document.createElement('div');
      card.className = 'card song';
      const h = document.createElement('h2');
      h.className = 'card-title';
      h.textContent = `${store.songs[song.id] ? '✓ ' : ''}${song.title} · ${song.titleEn}`;
      const artist = document.createElement('p');
      artist.className = 'muted small';
      artist.textContent = song.artist;
      const about = document.createElement('p');
      about.className = 'small';
      about.textContent = song.about || '';
      const row = document.createElement('div');
      row.className = 'row';
      const learn = document.createElement('button');
      learn.className = 'primary';
      learn.textContent = store.songs[song.id] ? 'Learn it again' : 'Learn the song';
      learn.onclick = () => startSong(song.id);
      row.appendChild(learn);
      if (song.video) {
        const sing = document.createElement('button');
        sing.textContent = 'Sing along';
        sing.onclick = () => {
          const old = card.querySelector('.video');
          if (old) { old.remove(); return; }
          const wrap = document.createElement('div');
          wrap.className = 'video';
          wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.video)}" title="${song.titleEn}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
          card.insertBefore(wrap, lyrics);
        };
        row.appendChild(sing);
      }
      if (song.source) {
        const a = document.createElement('a');
        a.href = song.source; a.target = '_blank'; a.rel = 'noopener';
        a.className = 'link-btn';
        a.textContent = song.video ? 'MP3 and chords' : 'Recording, MP3 and chords';
        row.appendChild(a);
      }
      const lyrics = document.createElement('div');
      lyrics.className = 'lyrics';
      for (const sec of song.sections) {
        const sh = document.createElement('p');
        sh.className = 'muted small section-name';
        sh.textContent = sec.name;
        lyrics.appendChild(sh);
        for (const L of sec.lines) {
          const line = document.createElement('div');
          line.className = 'lyric-row';
          const play = document.createElement('button');
          play.className = 'play';
          play.textContent = '▶';
          play.setAttribute('aria-label', `Play: ${L.en}`);
          play.onclick = () => { if (run && !run.paused) togglePause(); silence(); speakThai(L.th, voiceOf('A')); };
          const txt = document.createElement('div');
          txt.className = 'lyric-text';
          const th = document.createElement('span');
          th.className = 'thai';
          th.textContent = L.th;
          txt.appendChild(th);
          if (showRom) {
            const r = document.createElement('span');
            r.className = 'muted small vocab-rom';
            r.textContent = `${L.rom} · ${L.en}`;
            txt.appendChild(r);
          }
          line.append(play, txt);
          lyrics.appendChild(line);
        }
      }
      const words = document.createElement('details');
      const ws = document.createElement('summary');
      ws.textContent = `Key words (${song.words.length}) · also in Words as "Song · ${song.titleEn}"`;
      words.appendChild(ws);
      for (const w of song.words) {
        const wr = document.createElement('div');
        wr.className = 'vocab-row';
        const play = document.createElement('button');
        play.className = 'play'; play.textContent = '▶';
        play.onclick = () => { silence(); speakThai(w.th, voiceOf('A')); };
        const t = document.createElement('span');
        t.className = 'vocab-text';
        t.textContent = `${w.th} · ${w.en}`;
        const r = document.createElement('span');
        r.className = 'muted small vocab-rom';
        r.textContent = w.rom;
        t.appendChild(r);
        wr.append(play, t);
        words.appendChild(wr);
      }
      card.append(h, artist, about, row, lyrics, words);
      box.appendChild(card);
    }
    $('songIntro').hidden = SONGS.length > 0;
  }
  $('songRom').onchange = renderSongs;

  // ---------- vocabulary list ----------
  const vocabOpen = new Set();
  function renderVocab() {
    const q = $('vocabSearch').value.trim().toLowerCase();
    const learnedOnly = $('vocabLearned').checked;
    const showRom = $('vocabRom').checked;
    const list = $('vocabList');
    list.innerHTML = '';
    const current = nextWordsUnit() ?? 0;
    let lastLevel = null;
    window.COURSE.units.forEach((u, ui_) => {
      const items = ALL.filter(i => i.unit === ui_)
        .filter(i => !learnedOnly || store.items[i.id])
        .filter(i => !q || i.en.toLowerCase().includes(q) || romOf(i).toLowerCase().includes(q));
      if (!items.length) return;
      if (levelOf(u) !== lastLevel) {
        lastLevel = levelOf(u);
        const h = document.createElement('p');
        h.className = 'level-head';
        h.textContent = LEVEL_NAMES[lastLevel] || lastLevel;
        list.appendChild(h);
      }
      const det = document.createElement('details');
      det.className = 'level-' + levelOf(u);
      det.open = q ? true : vocabOpen.size ? vocabOpen.has(ui_) : ui_ === current;
      det.ontoggle = () => (det.open ? vocabOpen.add(ui_) : vocabOpen.delete(ui_));
      const sum = document.createElement('summary');
      const name = document.createElement('span');
      name.className = 'unit-name';
      name.textContent = `${u.title} (${items.length})`;
      sum.appendChild(name);
      if (!inSession && hasNewWords(ui_)) {
        const on = S.focusUnit === ui_;
        const b = document.createElement('button');
        b.className = 'study-next' + (on ? ' on' : '');
        b.textContent = on ? '✓ Learning next' : 'Learn next';
        b.onclick = e => {
          e.preventDefault();
          if (on) delete S.focusUnit; else S.focusUnit = ui_;
          save();
          on ? renderVocab() : show('words');
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
        play.onclick = () => playVocab(it);
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
  function playVocab(it) {
    if (run && !run.paused) togglePause(); // listening to the list pauses the lesson
    silence();
    sayRaw(it.th, voiceFolder()).catch(() => {});
  }

  // Strength of a phrase, from its review interval.
  function strength(id) {
    const cards = [store.items[id], store.items[id + '~r']].filter(Boolean);
    if (!cards.length) return 'new';
    const iv = Math.min(...cards.map(c => c.interval));
    return iv >= 21 ? 'mastered' : iv >= 7 ? 'known' : 'learning';
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
      row.querySelector('.unit-head span').textContent = u.title + (store.lessons[u.key] ? '  ✓' : '');
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
    $('setMic').checked = S.mic && !!SR; $('setMic').disabled = !SR;
    $('micNote').textContent = SR ? '' : '(not supported in this browser — try Chrome)';
    $('setHands').checked = S.handsFree;
    if (inSession) setBar(barMode);
    renderAuto();
    $('setPeek').checked = S.peek;
  }

  $('setGender').onchange = e => { S.gender = e.target.value; save(); };
  $('setRate').oninput = e => { S.thaiRate = +e.target.value; $('rateVal').textContent = S.thaiRate.toFixed(2) + '×'; save(); };
  $('setPause').oninput = e => { S.pause = +e.target.value; $('pauseVal').textContent = S.pause + ' s'; save(); };
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
    if (inSession) setBar(barMode);
    if (S.handsFree && run?.canGrade && !run.paused && ui.orb.dataset.stage === 'grade') { run.grade = 'ok'; } // waiting on a rating right now: move on
  };
  $('setPeek').onchange = e => { S.peek = e.target.checked; save(); };
  $('testVoice').onclick = () => { silence(); sayRaw('สวัสดี{P}', voiceFolder()).catch(() => {}); };
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
  const REPO = 'NewhopeLaw/learn-thai';
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
    for (const k of ['lessons', 'songs']) {
      for (const [id, v] of Object.entries(remote[k] || {})) if (!/^\d+$/.test(id)) store[k][id] = Math.max(store[k][id] || 0, v);
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
    const content = JSON.stringify({ name: S.name, items: store.items, log: store.log, secs: store.secs, lessons: store.lessons, songs: store.songs, settings: S, saved: new Date().toISOString() }, null, 1);
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
      if (!inSession && ui.session.hidden && ui.setup.hidden) renderHome();
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
  $('start').onclick = () => startWords('both');
  $('startReview').onclick = () => startWords('review');
  $('startNew').onclick = () => startWords('new');
  $('startTalk').onclick = () => startTalk();
  $('stop').onclick = stopSession;
  ui.pause.onclick = togglePause;
  function interrupt() { silence(); try { recognizer?.abort(); } catch {} }
  function pressGrade(g) {
    if (!run || run.paused) return;
    if (run.canGrade) { run.grade = g; interrupt(); }
    else if (g === 'easy' && barMode === 'intro') pressKnow();
    else pressNext();
  }
  function pressKnow() { if (run && !run.paused) { run.skip = true; interrupt(); } }
  document.querySelectorAll('[data-grade]').forEach(b => b.onclick = () => pressGrade(b.dataset.grade));
  $('knowLink').onclick = pressKnow;
  function pressNext() { if (run && !run.paused) { run.next = true; interrupt(); } }
  $('nextLink').onclick = pressNext;
  $('replay').onclick = () => { if (currentText) { silence(); speakThai(currentText, currentFolder); } };
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
    else if (e.key === 'n' || e.key === 'ArrowRight') pressNext();
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
