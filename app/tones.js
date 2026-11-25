// How Thai spelling gives the tone: works out one syllable's tone from its letters, and says which
// letters decided it, so the app can colour them (Letters › Tones, the word card, the tone drills).
//
// Three things decide the tone of a syllable:
//   1. the class of its first consonant (middle / high / low; a silent ห or อ in front lends its class)
//   2. the tone mark above it, if any
//   3. with no mark: how it ends. "Live" (a long vowel, or n, m, ng, y, w) or "dead" (a short vowel,
//      or k, t, p); for low class dead syllables, also whether the vowel is short or long.
//
// TONES.analyze('ไม่') -> { tone: 'falling', cls: 'low', mark: '่', live, long, chars: [{ ch, role }], why }
//   roles: lead (silent letter that sets the class) · init (first consonant) · init2 (second of a pair)
//          mark (tone mark) · vowel · final · silent
// Only single syllables are handled, and only regular ones; anything else returns null. The app also
// checks the result against the word's romanization before showing it (TONES.check).
(() => {
  const MID = 'กจดตบปอฎฏ', HIGH = 'ขฃฉฐถผฝศษสห';
  const CONS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ';
  const STOPS = 'กขคฆดตจชซสศษทธถฐฏฎฑฒฌบปพฟภ'; // said k, t or p at the end of a syllable
  const PRE = 'เแโไใ';
  const MARKS = '่้๊๋';
  const SIGNS = 'ัิีึืุู็ํ'; // vowel signs written above or below a consonant
  const isCons = c => !!c && CONS.includes(c);
  const classOf = c => (MID.includes(c) ? 'mid' : HIGH.includes(c) ? 'high' : 'low');

  const MARK_NAMES = { '่': 'mái èek', '้': 'mái thoo', '๊': 'mái trii', '๋': 'mái jàt-ta-waa' };
  const TONE_NAMES = { mid: 'mid', low: 'low', falling: 'falling', high: 'high', rising: 'rising' };
  const CLASS_NAMES = { mid: 'middle', high: 'high', low: 'low' };
  // The chart itself: class x (mark | ending) -> tone.
  const RULE = {
    mid:  { '': 'mid', dead: 'low', '่': 'low', '้': 'falling', '๊': 'high', '๋': 'rising' },
    high: { '': 'rising', dead: 'low', '่': 'low', '้': 'falling' },
    low:  { '': 'mid', short: 'high', long: 'falling', '่': 'falling', '้': 'high' },
  };
  // Written one way, said another: the chart does not explain these.
  const IRREGULAR = new Set(['ก็']);

  function analyze(word) {
    let s = String(word || '').replace(/[ๆ\s]/g, '');
    if (!s || IRREGULAR.has(s)) return null;
    const chars = [...s].map(ch => ({ ch, role: null }));
    const n = chars.length;
    // Letters cancelled by ์ (and the ท or ต before a cancelled ร: จันทร์, ศาสตร์) are not said.
    for (let k = 0; k < n; k++) if (chars[k].ch === '์') {
      chars[k].role = 'silent';
      if (k > 0) chars[k - 1].role = 'silent';
      if (k > 1 && chars[k - 1].ch === 'ร' && 'ทตด'.includes(chars[k - 2].ch)) chars[k - 2].role = 'silent';
    }
    const live_ = chars.filter(c => c.role !== 'silent');
    const at = k => live_[k]?.ch;
    let i = 0, pre = '';
    if (PRE.includes(at(0))) { pre = at(0); live_[0].role = 'vowel'; i = 1; }
    const c1 = live_[i];
    if (!c1 || !isCons(c1.ch)) return null;
    const next = at(i + 1), after = at(i + 2), last = live_.length - 1;
    let cls = classOf(c1.ch), clsFrom = c1.ch, j = i + 1;
    c1.role = 'init';
    const rest = live_.slice(i + 1).map(c => c.ch).filter(ch => !MARKS.includes(ch)).join('');
    const uaVowel = !pre && rest.length === 2 && rest[0] === 'ว' && isCons(rest[1]); // สวย, ขวด, รวม
    if (uaVowel) { /* ว is the vowel here, not part of the first sound */ }
    else if (c1.ch === 'ห' && next && 'งญนมยรลว'.includes(next) && (i + 1 < last || pre)) {
      c1.role = 'lead'; live_[i + 1].role = 'init'; j = i + 2; // silent ห: the syllable becomes high class
    } else if (c1.ch === 'อ' && next === 'ย' && ['อย่า', 'อยู่', 'อย่าง', 'อยาก'].includes(s)) {
      c1.role = 'lead'; live_[i + 1].role = 'init'; j = i + 2; // silent อ: middle class
    } else if (next && 'รลว'.includes(next) && c1.ch !== 'อ' && i + 1 < last) {
      // Two consonants said together (กล, คร, ปล, ขว …) or with a silent ร (จริง, สร้าง): the first sets the class.
      if (!(next === 'ว' && isCons(after) && !pre)) { live_[i + 1].role = 'init2'; j = i + 2; }
    }
    // Marks and vowel signs sitting on the first sound.
    let mark = '', signs = '';
    while (j < live_.length && (MARKS + SIGNS).includes(at(j))) {
      if (MARKS.includes(at(j))) { mark = at(j); live_[j].role = 'mark'; } else { signs += at(j); live_[j].role = 'vowel'; }
      j++;
    }
    // What is left: vowel letters and the final consonant. The last consonant ends the syllable
    // (อ is always a vowel here; ย and ว can be either, which does not change the tone).
    const tail = live_.slice(j);
    if (tail.some(c => (MARKS + SIGNS).includes(c.ch) || PRE.includes(c.ch))) return null; // more than one syllable
    let fin = null;
    for (let k = tail.length - 1; k >= 0; k--) {
      const ch = tail[k].ch;
      if (isCons(ch) && ch !== 'อ') { fin = tail[k]; break; }
      if (!'าะำอ'.includes(ch)) return null;
    }
    const tailStr = tail.map(c => c.ch).join('');
    if (fin && tail.length === 1) {
      if (fin.ch === 'ว' && signs.includes('ั')) fin = null;               // ัว: ua
      else if (fin.ch === 'ย' && (pre === 'ไ' || pre === 'ใ' || (pre === 'เ' && signs.includes('ี')))) fin = null; // ไทย, เมีย
    }
    for (const c of tail) c.role = c === fin ? 'final' : 'vowel';
    if (tail.filter(c => isCons(c.ch) && c.ch !== 'อ').length > 2) return null;
    if (!pre && !signs && !tailStr && !mark) return null; // a bare consonant

    // Live or dead, short or long.
    const openShort = !fin && (tailStr.endsWith('ะ') || (!tailStr && /[ิึุ็]$/.test(signs) && !pre));
    const dead = fin ? STOPS.includes(fin.ch) : openShort;
    const noVowel = !pre && !signs && !tail.some(c => c.role === 'vowel');
    const short = tailStr.endsWith('ะ') || signs.includes('็') || noVowel
      || (/[ัิึุ]/.test(signs) && !(pre === 'เ' && signs.includes('ิ')) && !(signs.includes('ั') && tailStr.startsWith('ว') && !fin));
    const long = !short;
    if (pre === 'ไ' || pre === 'ใ' || tailStr.includes('ำ')) { /* ai, am: live */ }

    let tone, how;
    const row = RULE[cls];
    if (mark) { tone = row[mark]; how = 'mark'; }
    else if (!dead) { tone = row['']; how = 'live'; }
    else if (cls === 'low') { tone = row[short ? 'short' : 'long']; how = short ? 'dead-short' : 'dead-long'; }
    else { tone = row.dead; how = 'dead'; }
    if (!tone) return null; // e.g. mái trii on a low class letter: not a regular spelling

    const lead = live_.find(c => c.role === 'lead');
    if (lead) { cls = lead.ch === 'ห' ? 'high' : 'mid'; clsFrom = lead.ch; tone = mark ? RULE[cls][mark] : !dead ? RULE[cls][''] : RULE[cls].dead; }
    if (!tone) return null;
    const ending = how === 'mark' ? null
      : how === 'live' ? 'live ending' : how === 'dead' ? 'dead ending' : how === 'dead-short' ? 'dead ending, short vowel' : 'dead ending, long vowel';
    const why = `${CLASS_NAMES[cls]} class + ${mark ? MARK_NAMES[mark] : `no mark, ${ending}`} = ${TONE_NAMES[tone]} tone`;
    return { word: s, tone, cls, clsFrom, lead: !!lead, mark, live: !dead, long, how, ending, chars, why };
  }

  // The tone a romanization shows on its (first) syllable: à low, â falling, á high, ǎ rising, a mid.
  function toneOfRom(rom) {
    const d = String(rom || '').normalize('NFD');
    if (/[\s-]/.test(d.trim())) return null; // more than one syllable
    return /̀/.test(d) ? 'low' : /̂/.test(d) ? 'falling' : /́/.test(d) ? 'high' : /̌/.test(d) ? 'rising' : 'mid';
  }
  // The analysis, only if it agrees with how the word is romanized in the course.
  function check(word, rom) {
    const a = analyze(word), t = toneOfRom(rom);
    return a && t && a.tone === t ? a : null;
  }

  // The chart as example words, all real and all recorded: [Thai, romanization, meaning].
  const CHART = {
    cols: [
      { key: 'live', label: 'no mark', sub: 'live ending' },
      { key: 'dead', label: 'no mark', sub: 'dead ending' },
      { key: '่', label: '◌่', sub: 'mái èek' },
      { key: '้', label: '◌้', sub: 'mái thoo' },
      { key: '๊', label: '◌๊', sub: 'mái trii' },
      { key: '๋', label: '◌๋', sub: 'mái jàt-ta-waa' },
    ],
    rows: {
      mid: { live: [['กิน', 'kin', 'eat']], dead: [['จาก', 'jàak', 'from']], '่': [['ไก่', 'kài', 'chicken']], '้': [['ได้', 'dâi', 'can']], '๊': [['โต๊ะ', 'tó', 'table']], '๋': [['เดี๋ยว', 'dǐao', 'in a moment']] },
      high: { live: [['ขา', 'khǎa', 'leg']], dead: [['สิบ', 'sìp', 'ten']], '่': [['ไข่', 'khài', 'egg']], '้': [['ข้าว', 'khâao', 'rice']] },
      low: { live: [['มา', 'maa', 'come']], dead: [['รัก', 'rák', 'love'], ['มาก', 'mâak', 'very']], '่': [['ไม่', 'mâi', 'not']], '้': [['ม้า', 'máa', 'horse']] },
    },
  };

  // Words that differ in one written part, and so in tone: the heart of Letters › Tones and of the
  // tone drills. Each set: what changes, then [Thai, romanization, meaning] for each word.
  const CONTRASTS = [
    { key: 'mai-ek', title: 'The same mark, a different class', note: 'Mái èek ( ◌่ ) gives a low tone on middle and high class letters, but a falling tone on low class letters.',
      words: [['ไก่', 'kài', 'chicken'], ['ไข่', 'khài', 'egg'], ['ไม่', 'mâi', 'not']] },
    { key: 'mai-tho', title: 'Mái thoo on each class', note: 'Mái thoo ( ◌้ ) gives a falling tone on middle and high class letters, but a high tone on low class letters.',
      words: [['ได้', 'dâi', 'can'], ['ข้าว', 'khâao', 'rice'], ['ม้า', 'máa', 'horse']] },
    { key: 'maa', title: 'One sound, three spellings', note: 'A silent ห in front makes a low class letter behave as high class. That is the only way to write a rising tone on m, n, ng, y, r, l, w.',
      words: [['มา', 'maa', 'come'], ['ม้า', 'máa', 'horse'], ['หมา', 'mǎa', 'dog']] },
    { key: 'khao', title: 'Add a mark, change the word', note: 'High class ข rises with no mark, is low with mái èek and falls with mái thoo.',
      words: [['ขาว', 'khǎao', 'white'], ['ข่าว', 'khàao', 'news'], ['ข้าว', 'khâao', 'rice']] },
    { key: 'mai', title: 'The tongue twister', note: 'Four spellings, four tones. ใหม่ and ไหม borrow high class from the silent ห.',
      words: [['ไม้', 'máai', 'wood'], ['ใหม่', 'mài', 'new'], ['ไม่', 'mâi', 'not'], ['ไหม', 'mǎi', 'question word']] },
    { key: 'klai', title: 'Near and far', note: 'Only the mark is different. Middle class with no mark is mid; with mái thoo it falls.',
      words: [['ไกล', 'klai', 'far'], ['ใกล้', 'klâi', 'near']] },
    { key: 'suea', title: 'Tiger, mat, shirt', note: 'High class ส: rising with no mark, low with mái èek, falling with mái thoo.',
      words: [['เสือ', 'sǔea', 'tiger'], ['เสื่อ', 'sùea', 'mat'], ['เสื้อ', 'sûea', 'shirt']] },
    { key: 'sii', title: 'Colour and four', note: 'The number four is the word for colour with mái èek on it.',
      words: [['สี', 'sǐi', 'colour'], ['สี่', 'sìi', 'four']] },
    { key: 'suai', title: 'A class apart', note: 'ส is high class and ซ is low class. The same sound, but no mark means rising for one and mid for the other.',
      words: [['สวย', 'sǔai', 'pretty'], ['ซวย', 'suai', 'unlucky']] },
    { key: 'dead', title: 'No mark, but it ends in k, t or p', note: 'A dead ending changes the tone by itself: low for middle and high class. For low class it is high after a short vowel and falling after a long one.',
      words: [['จาก', 'jàak', 'from'], ['หก', 'hòk', 'six'], ['รัก', 'rák', 'love'], ['มาก', 'mâak', 'very']] },
    { key: 'naa', title: 'Rice field, face, aunt', note: 'น is low class: mid with no mark. With the silent ห it is high class, so mái thoo makes it fall; without the ห, mái thoo makes it high.',
      words: [['นา', 'naa', 'rice field'], ['หน้า', 'nâa', 'face'], ['น้า', 'náa', 'aunt, uncle']] },
    { key: 'pa', title: 'Aunt and forest', note: 'Middle class ป: mái thoo falls, mái èek is low.',
      words: [['ป้า', 'pâa', 'aunt'], ['ป่า', 'pàa', 'forest']] },
  ];

  // Sounds that English speakers mix up. Each pair differs in one thing only (not the tone):
  //   puff: with or without a puff of air · start: the first sound · length: short or long vowel ·
  //   vowel: which vowel · end: the last sound. The two words of a pair always share a tone.
  const SOUNDS = [
    { key: 'k-kh', kind: 'puff', title: 'k or kh: is there a puff of air?', words: [['ไก่', 'kài', 'chicken'], ['ไข่', 'khài', 'egg']] },
    { key: 'p-ph', kind: 'puff', title: 'p or ph: is there a puff of air?', words: [['ปา', 'paa', 'to throw'], ['พา', 'phaa', 'to take along']] },
    { key: 't-th', kind: 'puff', title: 't or th: is there a puff of air?', words: [['ตา', 'taa', 'eye'], ['ทา', 'thaa', 'to spread on, to paint']] },
    { key: 'j-ch', kind: 'puff', title: 'j or ch', words: [['จาม', 'jaam', 'to sneeze'], ['ชาม', 'chaam', 'bowl']] },
    { key: 'b-p', kind: 'start', title: 'b or p', words: [['ใบ', 'bai', 'leaf'], ['ไป', 'pai', 'to go']] },
    { key: 'd-t', kind: 'start', title: 'd or t', words: [['ดี', 'dii', 'good'], ['ตี', 'tii', 'to hit']] },
    { key: 'ng-n', kind: 'start', title: 'ng or n at the start', words: [['งาน', 'ngaan', 'work'], ['นาน', 'naan', 'a long time']] },
    { key: 'ao-len', kind: 'length', title: 'short or long vowel', words: [['เข้า', 'khâo', 'to enter'], ['ข้าว', 'khâao', 'rice']] },
    { key: 'a-len', kind: 'length', title: 'short or long vowel', words: [['วัน', 'wan', 'day'], ['วาน', 'waan', 'yesterday (in เมื่อวาน)']] },
    { key: 'a-len-2', kind: 'length', title: 'short or long vowel', words: [['ปัก', 'pàk', 'to stick in, to embroider'], ['ปาก', 'pàak', 'mouth']] },
    { key: 'a-len-3', kind: 'length', title: 'short or long vowel', words: [['ยัง', 'yang', 'still, yet'], ['ยาง', 'yaang', 'rubber']] },
    { key: 'u-len', kind: 'length', title: 'short or long vowel', words: [['คุณ', 'khun', 'you'], ['คูณ', 'khuun', 'to multiply']] },
    { key: 'uu-ue', kind: 'vowel', title: 'uu or ue', words: [['ถู', 'thǔu', 'to rub'], ['ถือ', 'thǔue', 'to hold']] },
    { key: 'e-ae', kind: 'vowel', title: 'e or ɛ', words: [['เล่น', 'lên', 'to play'], ['แล่น', 'lɛ̂n', 'to sail, to run']] },
    { key: 'o-aw', kind: 'vowel', title: 'o or ɔ', words: [['โต', 'too', 'big, grown'], ['ตอ', 'tɔɔ', 'stump']] },
    { key: 'ia-uea', kind: 'vowel', title: 'ia or uea', words: [['เสีย', 'sǐa', 'broken, spoiled'], ['เสือ', 'sǔea', 'tiger']] },
    { key: 'n-ng', kind: 'end', title: 'n or ng at the end', words: [['บ้าน', 'bâan', 'house'], ['บ้าง', 'bâang', 'some']] },
    { key: 'n-ng-2', kind: 'end', title: 'n or ng at the end', words: [['วัน', 'wan', 'day'], ['วัง', 'wang', 'palace']] },
    { key: 'k-t-p', kind: 'end', title: 'k, t or p at the end (cut short, not released)', words: [['รัก', 'rák', 'to love'], ['รัด', 'rát', 'to tighten'], ['รับ', 'ráp', 'to receive']] },
  ];

  // Signs that are not vowels of their own in the Letters tab: [Thai name, romanization, what it does].
  const SIGN_NAMES = {
    'ั': ['ไม้หันอากาศ', 'mái hǎn-aa-kàat', 'short a, written when a consonant follows'],
    '็': ['ไม้ไต่คู้', 'mái tài-khúu', 'makes the vowel short'],
    '์': ['การันต์', 'kaa-ran', 'the letter under it is not said'],
    'ํ': ['นิคหิต', 'ní-khá-hìt', 'the little circle of am'],
  };

  const api = { SIGN_NAMES, analyze, toneOfRom, check, classOf, CHART, CONTRASTS, SOUNDS, MARK_NAMES, TONE_NAMES, CLASS_NAMES, RULE };
  if (typeof window !== 'undefined') window.TONES = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
