// Prints every Thai string the app can speak, as a JSON array (both polite-speech variants).
global.window = {};
require('../app/course.js');
require('../app/dialogues.js');
require('../app/songs.js'); // adds each song's key words as a unit
require('../app/letters.js');
require('../app/drills.js'); // new sentences for the listening drill
const TONES = require('../app/tones.js'); // example words for the tone chart and the ear drills

const MALE = { P: 'ครับ', Pq: 'ครับ', I: 'ผม' };
const FEMALE = { P: 'ค่ะ', Pq: 'คะ', I: 'ฉัน' };
// A learner's own lines use their gender; the other speaker (B) is the opposite gender.
const fill = (s, me, other) => s.replace(/\{Pbq\}|\{Pb\}|\{Ib\}|\{Pq\}|\{P\}|\{I\}/g, m => {
  const k = m.slice(1, -1);
  return k.endsWith('b') || k === 'Pbq' ? other[k.replace('b', '')] : me[k];
});
const texts = new Set();
// Every "from the end" piece used by reverse building (suffixes at spaces).
const addWithSuffixes = text => {
  const chunks = text.split(' ').filter(Boolean);
  for (let i = 0; i < chunks.length; i++) texts.add(chunks.slice(i).join(' '));
};

for (const unit of window.COURSE.units) {
  for (const it of unit.items) {
    const raw = [it.th, ...(it.parts || []).map(p => p.th), ...(it.note || []).filter(n => n.th).map(n => n.th)];
    for (const [me, other] of [[MALE, FEMALE], [FEMALE, MALE]]) for (const t of raw) texts.add(fill(t, me, other));
  }
}
for (const d of Object.values(window.DIALOGUES)) {
  for (const line of d.lines) {
    for (const [me, other] of [[MALE, FEMALE], [FEMALE, MALE]]) addWithSuffixes(fill(line.th, me, other));
  }
}
for (const song of window.SONGS) {
  for (const sec of song.sections || []) for (const line of sec.lines) addWithSuffixes(line.th);
}
// Letter names and example words for the Letters tab.
for (const g of window.LETTERS.groups) for (const it of g.items) { texts.add(it.name); if (it.example) texts.add(it.example.th); }
// New sentences (Listen > New sentences), in both speakers' forms.
for (const set of window.SENTENCES) for (const [th] of set.items) {
  for (const [me, other] of [[MALE, FEMALE], [FEMALE, MALE]]) texts.add(fill(th, me, other));
}
// Words of the tone chart, the tone contrasts and the sound pairs.
for (const set of [...TONES.CONTRASTS, ...TONES.SOUNDS]) for (const [th] of set.words) texts.add(th);
for (const row of Object.values(TONES.CHART.rows)) for (const cell of Object.values(row)) for (const [th] of cell) texts.add(th);
for (const [name] of Object.values(TONES.SIGN_NAMES)) texts.add(name);
process.stdout.write(JSON.stringify([...texts]));
