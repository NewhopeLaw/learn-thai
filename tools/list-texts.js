// Prints every Thai string the app can speak, as a JSON array (both polite-speech variants).
global.window = {};
require('../app/course.js');
require('../app/dialogues.js');

const MALE = { P: 'ครับ', Pq: 'ครับ', I: 'ผม' };
const FEMALE = { P: 'ค่ะ', Pq: 'คะ', I: 'ฉัน' };
// A learner's own lines use their gender; the other speaker (B) is the opposite gender.
const fill = (s, me, other) => s.replace(/\{Pbq\}|\{Pb\}|\{Ib\}|\{Pq\}|\{P\}|\{I\}/g, m => {
  const k = m.slice(1, -1);
  return k.endsWith('b') || k === 'Pbq' ? other[k.replace('b', '')] : me[k];
});

const texts = new Set();
for (const unit of window.COURSE.units) {
  for (const it of unit.items) {
    const raw = [it.th, ...(it.parts || []).map(p => p.th), ...(it.note || []).filter(n => n.th).map(n => n.th)];
    for (const [me, other] of [[MALE, FEMALE], [FEMALE, MALE]]) for (const t of raw) texts.add(fill(t, me, other));
  }
}
// Dialogue lines, plus every "from the end" piece used by reverse building (suffixes at spaces).
for (const d of Object.values(window.DIALOGUES)) {
  for (const line of d.lines) {
    for (const [me, other] of [[MALE, FEMALE], [FEMALE, MALE]]) {
      const text = fill(line.th, me, other);
      const chunks = text.split(' ').filter(Boolean);
      for (let i = 0; i < chunks.length; i++) texts.add(chunks.slice(i).join(' '));
    }
  }
}
process.stdout.write(JSON.stringify([...texts]));
