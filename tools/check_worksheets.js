// Check worksheet content before printing:   node tools/check_worksheets.js [extra-data.js ...]
// Loads printables/worksheets.js (plus any extra files, which may push more sheets and sound labels)
// and reports anything that would print badly: missing sound labels, label counts that don't match
// the letters, and text likely to overflow its box.
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'printables', 'worksheets.js'));
for (const f of process.argv.slice(2)) require(path.resolve(f));
const { SHEETS, SOUNDS } = window;

const MARKS = 'ัิ-ฺ็-๎';
const PIECES = new RegExp(`[^${MARKS}][${MARKS}]*`, 'g');
const keys = Object.keys(SOUNDS).sort((a, b) => b.length - a.length);
const problems = [];
const say = (where, msg) => problems.push(`${where}: ${msg}`);

for (const [w, l] of Object.entries(SOUNDS)) {
  const n = w.match(PIECES).length, m = l.trim().split(/ +/).length;
  if (n !== m) say(`SOUNDS ${w}`, `${n} written pieces (${w.match(PIECES).join('|')}) but ${m} labels "${l}"`);
}

// Width of Thai text in written pieces that take up space (marks above/below don't).
const width = t => (t.replace(/&nbsp;/g, ' ').match(new RegExp(`[^${MARKS}]`, 'g')) || []).length;
const segment = t => {
  t = t.replace(/&nbsp;/g, ' ');
  for (let i = 0; i < t.length;) {
    if (/\s/.test(t[i])) { i++; continue; }
    const k = keys.find(k => t.startsWith(k, i));
    if (!k) return t.slice(i);
    i += k.length;
  }
  return null;
};

const files = new Set();
for (const s of SHEETS) {
  const at = s.file || '(no file)';
  if (files.has(s.file)) say(at, 'duplicate file name');
  files.add(s.file);
  for (const f of ['file', 'title', 'sentences', 'notes', 'words', 'practice']) if (!s[f]) say(at, `missing ${f}`);
  if (!s.sentences || !s.words || !s.practice || !s.notes) continue;
  if (s.sentences.length !== 2) say(at, `${s.sentences.length} sentences, expected 2`);
  if (s.notes.length !== 2) say(at, `${s.notes.length} notes, expected 2`);
  if (s.words.length !== 9) say(at, `${s.words.length} words, expected 9`);
  if (s.practice.length !== 4) say(at, `${s.practice.length} practice phrases, expected 4`);
  s.sentences.forEach((x, i) => {
    if (x.chunks.length > 8) say(at, `sentence ${i + 1} has ${x.chunks.length} chunks (max 8)`);
    x.chunks.forEach(c => { if (c.length !== 4) say(at, `chunk ${JSON.stringify(c)} needs [thai, rom, meaning, role]`); });
    const bad = x.chunks.find(c => !['pro', 'verb', 'noun', 'num', 'mod', 'q', 'pol', 'req', 'key'].includes(c[3]));
    if (bad) say(at, `unknown role "${bad[3]}" on ${bad[0]}`);
  });
  for (const n of s.notes) if (n.replace(/<[^>]+>/g, '').length > 260) say(at, `note too long (keep under 260 characters): ${n.slice(0, 50)}…`);
  for (const [th, rom, mean, tip] of s.words) {
    const miss = segment(th);
    if (miss !== null) say(at, `word ${th}: no sound label for "${miss}"`);
    if (width(th) > 10) say(at, `word ${th} is too wide (${width(th)} letters, max 10)`);
    if ((rom + mean + (tip || '')).length > 75) say(at, `word ${th}: romanization + meaning + tip too long (max 75 characters)`);
  }
  for (const [th, rom, mean, label] of s.practice) {
    const miss = segment(th);
    if (miss !== null) say(at, `phrase ${th}: no sound label for "${miss}"`);
    if (width(th) > 18) say(at, `phrase ${th} is too wide (${width(th)} letters, max 18): split it into parts A and B`);
    if ((label + rom + mean).length > 95) say(at, `phrase ${th}: label + romanization + meaning too long (max 95 characters)`);
  }
}

console.log(problems.length ? problems.join('\n') + `\n${problems.length} problems` : `OK: ${SHEETS.length} sheets, ${Object.keys(SOUNDS).length} sound labels`);
process.exitCode = problems.length ? 1 : 0;
