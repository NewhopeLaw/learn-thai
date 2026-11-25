// Checks app/tones.js against the course: every one-syllable word whose romanization is known must
// come out with the tone its romanization shows. Run: node tools/check_tones.js
global.window = {};
require('../app/course.js'); require('../app/dialogues.js'); require('../app/songs.js');
require('../app/letters.js'); require('../app/etymology.js'); require('../app/audio-manifest.js');
const T = require('../app/tones.js');
const fill = s => s.replace(/\{Pbq\}|\{Pb\}|\{Pq\}|\{P\}/g, '').replace(/\{Ib\}|\{I\}/g, '').trim();
const pairs = new Map();
const add = (th, rom) => {
  th = fill(th || ''); rom = fill(rom || '').replace(/[,.?!…]/g, '').trim();
  if (!th || !rom || /\s/.test(th) || /[\s-]/.test(rom) || !/^[\u0E00-\u0E7F]+$/.test(th)) return;
  if (!pairs.has(th)) pairs.set(th, rom);
};
for (const u of window.COURSE.units) for (const it of u.items) { add(it.th, it.rom); for (const p of it.parts || []) add(p.th, p.rom); }
for (const e of Object.values(window.ETYMOLOGY)) for (const [th, rom] of e.parts || []) add(th, rom);
for (const g of window.LETTERS.groups) for (const it of g.items) if (it.example) add(it.example.th, it.example.rom);
for (const s of window.SONGS || []) for (const w of [...s.words, ...(s.more || [])]) add(w.th, w.rom);
for (const set of [...T.CONTRASTS, ...T.SOUNDS]) for (const [th, rom] of set.words) add(th, rom);
for (const row of Object.values(T.CHART.rows)) for (const cell of Object.values(row)) for (const [th, rom] of cell) add(th, rom);
let ok = 0, none = [], bad = [];
for (const [th, rom] of pairs) {
  const a = T.analyze(th), want = T.toneOfRom(rom);
  if (!a) none.push(`${th} ${rom}`);
  else if (a.tone !== want) bad.push(`${th} ${rom}: got ${a.tone} (${a.why})`);
  else ok++;
}
console.log(`${ok} of ${pairs.size} one-syllable words agree with their romanization`);
if (none.length) console.log(`Not analysed (${none.length}): ${none.join(' · ')}`);
if (bad.length) console.log(`Disagree (${bad.length}):\n  ${bad.join('\n  ')}`);
if (process.argv.includes('--audio')) {
  const miss = [...T.CONTRASTS, ...T.SOUNDS].flatMap(s => s.words.map(w => w[0])).filter(w => !window.AUDIO[w]);
  console.log('No recording yet:', [...new Set(miss)].join(' ') || 'none');
}
if (process.argv.includes('--dump')) for (const [th, rom] of pairs) console.log(th, rom, T.analyze(th)?.chars.map(c => c.ch + ':' + (c.role || '?')[0]).join(' '));
for (const s of T.SOUNDS) { const ts = new Set(s.words.map(w => T.toneOfRom(w[1]))); if (ts.size > 1) console.log('Sound pair with different tones:', s.key); }
