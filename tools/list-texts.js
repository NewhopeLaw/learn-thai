// Prints every Thai string the app can speak, as a JSON array (both polite-speech variants).
global.window = {};
require('../app/course.js');

const VARIANTS = [
  { P: 'ครับ', Pq: 'ครับ', I: 'ผม' },
  { P: 'ค่ะ', Pq: 'คะ', I: 'ฉัน' },
];
const fill = (s, v) => s.replace(/\{Pq\}|\{P\}|\{I\}/g, m => v[m.slice(1, -1)]);

const texts = new Set();
for (const unit of window.COURSE.units) {
  for (const it of unit.items) {
    const raw = [it.th, ...(it.parts || []).map(p => p.th), ...(it.note || []).filter(n => n.th).map(n => n.th)];
    for (const v of VARIANTS) for (const t of raw) texts.add(fill(t, v));
  }
}
process.stdout.write(JSON.stringify([...texts]));
