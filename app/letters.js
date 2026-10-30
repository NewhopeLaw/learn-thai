// The Thai script for the Letters tab: consonants, vowels and tone marks, in the order they are learned.
//
// Each item is one thing the learner learns to READ and WRITE.
//   th      – what is shown big on screen (vowels and tone marks sit on a placeholder consonant)
//   name    – what the Thai voice says: the letter's name, e.g. กอ ไก่ "kɔɔ kài"
//   rom     – the name romanized
//   consonants: word (key word meaning), cls (mid / high / low), sound (at the start of a syllable), note
//   vowels and tone marks: en (shown), say (what the English narrator says), example {th, rom, en}
//
// Letter names are spelled out the way they are said (กอ ไก่, not ก ไก่) so the recorded voices read them
// the same way every time. The two obsolete letters borrow the spelling of their modern twins.

(() => {
  const C = (th, name, rom, word, cls, sound, note) => ({ id: 'L:' + th, th, name, rom, word, cls, sound, note });
  const V = (th, name, rom, en, say, example, note) => ({ id: 'L:' + th, th, name, rom, en, say, example, note });
  const ex = (th, rom, en) => ({ th, rom, en });

  window.LETTERS = {
    groups: [
      {
        key: 'cons-mid', title: 'Letters 1 · Middle class',
        items: [
          C('ก', 'กอ ไก่', 'kɔɔ kài', 'chicken', 'mid', 'k'),
          C('จ', 'จอ จาน', 'jɔɔ jaan', 'plate', 'mid', 'j'),
          C('ด', 'ดอ เด็ก', 'dɔɔ dèk', 'child', 'mid', 'd'),
          C('ต', 'ตอ เต่า', 'tɔɔ tào', 'turtle', 'mid', 't'),
          C('บ', 'บอ ใบไม้', 'bɔɔ bai-máai', 'leaf', 'mid', 'b'),
          C('ป', 'ปอ ปลา', 'pɔɔ plaa', 'fish', 'mid', 'p'),
          C('อ', 'ออ อ่าง', 'ɔɔ àang', 'basin', 'mid', 'silent', 'carries a vowel'),
          C('ฎ', 'ฎอ ชฎา', 'dɔɔ chá-daa', 'headdress', 'mid', 'd', 'rare'),
          C('ฏ', 'ฏอ ปฏัก', 'tɔɔ pà-tàk', 'goad', 'mid', 't', 'rare'),
        ],
      },
      {
        key: 'cons-high', title: 'Letters 2 · High class',
        items: [
          C('ข', 'ขอ ไข่', 'khɔ̌ɔ khài', 'egg', 'high', 'kh'),
          C('ฉ', 'ฉอ ฉิ่ง', 'chɔ̌ɔ chìng', 'small cymbals', 'high', 'ch'),
          C('ถ', 'ถอ ถุง', 'thɔ̌ɔ thǔng', 'bag', 'high', 'th'),
          C('ผ', 'ผอ ผึ้ง', 'phɔ̌ɔ phûeng', 'bee', 'high', 'ph'),
          C('ฝ', 'ฝอ ฝา', 'fɔ̌ɔ fǎa', 'lid', 'high', 'f'),
          C('ส', 'สอ เสือ', 'sɔ̌ɔ sǔea', 'tiger', 'high', 's'),
          C('ห', 'หอ หีบ', 'hɔ̌ɔ hìip', 'chest (box)', 'high', 'h'),
          C('ศ', 'ศอ ศาลา', 'sɔ̌ɔ sǎa-laa', 'pavilion', 'high', 's'),
          C('ษ', 'ษอ ฤๅษี', 'sɔ̌ɔ rue-sǐi', 'hermit', 'high', 's'),
          C('ฐ', 'ฐอ ฐาน', 'thɔ̌ɔ thǎan', 'pedestal', 'high', 'th'),
          C('ฃ', 'ขอ ขวด', 'khɔ̌ɔ khùat', 'bottle', 'high', 'kh', 'no longer used'),
        ],
      },
      {
        key: 'cons-low-1', title: 'Letters 3 · Low class, common',
        items: [
          C('ค', 'คอ ควาย', 'khɔɔ khwaai', 'buffalo', 'low', 'kh'),
          C('ง', 'งอ งู', 'ngɔɔ nguu', 'snake', 'low', 'ng'),
          C('ช', 'ชอ ช้าง', 'chɔɔ cháang', 'elephant', 'low', 'ch'),
          C('ซ', 'ซอ โซ่', 'sɔɔ sôo', 'chain', 'low', 's'),
          C('ท', 'ทอ ทหาร', 'thɔɔ thá-hǎan', 'soldier', 'low', 'th'),
          C('น', 'นอ หนู', 'nɔɔ nǔu', 'mouse', 'low', 'n'),
          C('พ', 'พอ พาน', 'phɔɔ phaan', 'offering tray', 'low', 'ph'),
          C('ฟ', 'ฟอ ฟัน', 'fɔɔ fan', 'tooth', 'low', 'f'),
          C('ม', 'มอ ม้า', 'mɔɔ máa', 'horse', 'low', 'm'),
          C('ย', 'ยอ ยักษ์', 'yɔɔ yák', 'giant', 'low', 'y'),
          C('ร', 'รอ เรือ', 'rɔɔ ruea', 'boat', 'low', 'r'),
          C('ล', 'ลอ ลิง', 'lɔɔ ling', 'monkey', 'low', 'l'),
          C('ว', 'วอ แหวน', 'wɔɔ wɛ̌ɛn', 'ring', 'low', 'w'),
        ],
      },
      {
        key: 'cons-low-2', title: 'Letters 4 · Low class, the rest',
        items: [
          C('ภ', 'ภอ สำเภา', 'phɔɔ sǎm-phao', 'junk (ship)', 'low', 'ph'),
          C('ญ', 'ญอ หญิง', 'yɔɔ yǐng', 'woman', 'low', 'y'),
          C('ธ', 'ธอ ธง', 'thɔɔ thong', 'flag', 'low', 'th'),
          C('ณ', 'ณอ เณร', 'nɔɔ neen', 'novice monk', 'low', 'n'),
          C('ฮ', 'ฮอ นกฮูก', 'hɔɔ nók-hûuk', 'owl', 'low', 'h'),
          C('ฆ', 'ฆอ ระฆัง', 'khɔɔ rá-khang', 'bell', 'low', 'kh'),
          C('ฒ', 'ฒอ ผู้เฒ่า', 'thɔɔ phûu-thâo', 'elder', 'low', 'th'),
          C('ฑ', 'ฑอ มณโฑ', 'thɔɔ mon-thoo', 'Montho (Ramakien)', 'low', 'th', 'sometimes d'),
          C('ฌ', 'ฌอ เฌอ', 'chɔɔ choe', 'tree', 'low', 'ch', 'rare'),
          C('ฬ', 'ฬอ จุฬา', 'lɔɔ jù-laa', 'kite', 'low', 'l', 'rare'),
          C('ฅ', 'คอ คน', 'khɔɔ khon', 'person', 'low', 'kh', 'no longer used'),
        ],
      },
      {
        key: 'vowels-1', title: 'Vowels 1 · a, i, ue, u',
        items: [
          V('อะ', 'สระ อะ', 'sà-rà à', 'short a, as in "father"', 'short a, as in father', ex('จะ', 'jà', 'will')),
          V('อา', 'สระ อา', 'sà-rà aa', 'long a, as in "father"', 'long a, as in father', ex('มา', 'maa', 'come')),
          V('อิ', 'สระ อิ', 'sà-rà ì', 'short i, as in "see"', 'short i, as in see', ex('กิน', 'kin', 'eat')),
          V('อี', 'สระ อี', 'sà-rà ii', 'long i, as in "see"', 'long i, as in see', ex('ดี', 'dii', 'good')),
          V('อึ', 'สระ อึ', 'sà-rà ùe', 'short ue: "oo" with spread lips', 'short ue: an oo with spread lips', ex('หนึ่ง', 'nùeng', 'one')),
          V('อือ', 'สระ อือ', 'sà-rà uue', 'long ue: "oo" with spread lips', 'long ue: an oo with spread lips', ex('มือ', 'muue', 'hand')),
          V('อุ', 'สระ อุ', 'sà-rà ù', 'short u, as in "food"', 'short u, as in food', ex('ถุง', 'thǔng', 'bag')),
          V('อู', 'สระ อู', 'sà-rà uu', 'long u, as in "food"', 'long u, as in food', ex('ดู', 'duu', 'look')),
        ],
      },
      {
        key: 'vowels-2', title: 'Vowels 2 · e, ɛ, o, ɔ',
        items: [
          V('เอะ', 'สระ เอะ', 'sà-rà è', 'short e, as in "they"', 'short e, as in they', ex('เตะ', 'tè', 'kick')),
          V('เอ', 'สระ เอ', 'sà-rà ee', 'long e, as in "they"', 'long e, as in they', ex('เท', 'thee', 'pour')),
          V('แอะ', 'สระ แอะ', 'sà-rà ɛ̀', 'short ɛ, as in "cat"', 'short a, as in cat', ex('แกะ', 'kɛ̀', 'sheep')),
          V('แอ', 'สระ แอ', 'sà-rà ɛɛ', 'long ɛ, as in "cat"', 'long a, as in cat', ex('แม่', 'mɛ̂ɛ', 'mother')),
          V('โอะ', 'สระ โอะ', 'sà-rà ò', 'short o, as in "go"', 'short o, as in go', ex('โต๊ะ', 'tó', 'table')),
          V('โอ', 'สระ โอ', 'sà-rà oo', 'long o, as in "go"', 'long o, as in go', ex('โต', 'too', 'big')),
          V('เอาะ', 'สระ เอาะ', 'sà-rà ɔ̀', 'short ɔ, as in "law"', 'short aw, as in law', ex('เกาะ', 'kɔ̀', 'island')),
          V('ออ', 'สระ ออ', 'sà-rà ɔɔ', 'long ɔ, as in "law"', 'long aw, as in law', ex('พ่อ', 'phɔ̂ɔ', 'father')),
        ],
      },
      {
        key: 'vowels-3', title: 'Vowels 3 · oe, ia, uea, ua',
        items: [
          V('เออะ', 'สระ เออะ', 'sà-rà òe', 'short oe, as in "fur"', 'short er, as in fur', ex('เถอะ', 'thòe', "let's")),
          V('เออ', 'สระ เออ', 'sà-rà ooe', 'long oe, as in "fur"', 'long er, as in fur', ex('เจอ', 'joe', 'meet')),
          V('เอียะ', 'สระ เอียะ', 'sà-rà ìa', 'short ia (ee-a)', 'short ia: ee, a', null, 'rare'),
          V('เอีย', 'สระ เอีย', 'sà-rà iia', 'long ia (ee-a)', 'long ia: ee, a', ex('เมีย', 'mia', 'wife')),
          V('เอือะ', 'สระ เอือะ', 'sà-rà ùea', 'short uea (ue-a)', 'short uea: ue, a', null, 'rare'),
          V('เอือ', 'สระ เอือ', 'sà-rà uuea', 'long uea (ue-a)', 'long uea: ue, a', ex('เรือ', 'ruea', 'boat')),
          V('อัวะ', 'สระ อัวะ', 'sà-rà ùa', 'short ua (oo-a)', 'short ua: oo, a', null, 'rare'),
          V('อัว', 'สระ อัว', 'sà-rà uua', 'long ua (oo-a)', 'long ua: oo, a', ex('วัว', 'wua', 'cow')),
        ],
      },
      {
        key: 'vowels-4', title: 'Vowels 4 · am, ai, ao',
        items: [
          V('อำ', 'สระ อำ', 'sà-rà am', 'am', 'am, as in hum', ex('น้ำ', 'náam', 'water')),
          V('ไอ', 'สระ ไอ ไม้มลาย', 'sà-rà ai (mái má-laai)', 'ai, as in "high" · most words', 'ai, as in high. Used in most words', ex('ไป', 'pai', 'go')),
          V('ใอ', 'สระ ใอ ไม้ม้วน', 'sà-rà ai (mái múan)', 'ai, as in "high" · about 20 words', 'ai, as in high. Used in about twenty words', ex('ใจ', 'jai', 'heart')),
          V('เอา', 'สระ เอา', 'sà-rà ao', 'ao, as in "cow"', 'ao, as in cow', ex('เขา', 'khǎo', 'he, she')),
        ],
      },
      {
        key: 'tones', title: 'Tone marks',
        items: [
          V('ก่', 'ไม้เอก', 'mái èek', 'tone mark 1', 'the first tone mark', ex('ไก่', 'kài', 'chicken')),
          V('ก้', 'ไม้โท', 'mái thoo', 'tone mark 2', 'the second tone mark', ex('ข้าว', 'khâao', 'rice')),
          V('ก๊', 'ไม้ตรี', 'mái trii', 'tone mark 3 · middle class only', 'the third tone mark, used with middle class letters only', ex('โต๊ะ', 'tó', 'table')),
          V('ก๋', 'ไม้จัตวา', 'mái jàt-ta-waa', 'tone mark 4 · middle class only', 'the fourth tone mark, used with middle class letters only', ex('ก๋วยเตี๋ยว', 'kǔai-tǐao', 'noodle soup')),
        ],
      },
    ],
  };
})();
