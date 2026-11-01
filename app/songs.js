// Songs for the Song tab. Lyrics are the property of their writers; keep this to songs you have the right to use.
//   sections: lines of th (Thai, spaces mark the pieces used for reverse building), rom, en (meaning),
//             gloss: [English, Thai] pairs in English order, so the meaning lights up word by word with the Thai
//             (Thai can be a list when several Thai words make one English word)
//   words: key vocabulary, taught at the start of the song lesson
//   more:  every other word in the lyrics, small grammar words and particles included, taught next
//   Both lists are also added to the Words tab as a unit, so they enter spaced repetition.
//   video: YouTube video id for sing-along (empty = link to the source page only)
window.SONGS = [
  {
    id: 'water-of-life',
    title: 'น้ำแห่งชีวิต',
    titleEn: 'Water of Life',
    artist: 'W501 Worship Jam 04 · words and music by Rueangkit Yongpiyakul',
    source: 'http://w501.org/song/water-of-life',
    video: '',
    about: 'Based on John 4:14: whoever drinks the water Jesus gives will never thirst again.',
    sections: [
      {
        name: 'Verse',
        lines: [
          { th: 'ใจที่กระหายและเหนื่อย', rom: 'jai thîi kra-hǎai lɛ́ nùeai', en: 'A heart that is thirsty and tired',
            gloss: [['A heart', 'ใจ'], ['that is', 'ที่'], ['thirsty', 'กระหาย'], ['and', 'และ'], ['tired', 'เหนื่อย']] },
          { th: 'ใจที่ทนทุกข์ลำบาก', rom: 'jai thîi thon thúk lam-bàak', en: 'A heart that bears suffering and hardship',
            gloss: [['A heart', 'ใจ'], ['that', 'ที่'], ['bears', 'ทน'], ['suffering', 'ทุกข์'], ['and hardship', 'ลำบาก']] },
          { th: 'ใจที่หมดหวังทุกอย่าง จงเข้ามา', rom: 'jai thîi mòt wǎng thúk yàang, jong khâo maa', en: 'A heart that has lost all hope: come',
            gloss: [['A heart', 'ใจ'], ['that', 'ที่'], ['has lost', 'หมด'], ['all', 'ทุกอย่าง'], ['hope', 'หวัง'], ['come', ['จง', 'เข้ามา']]] },
        ],
      },
      {
        name: 'Chorus',
        lines: [
          { th: 'พระองค์เป็นน้ำแห่งชีวิต', rom: 'phrá-ong pen náam hɛ̀ng chii-wít', en: 'He is the water of life',
            gloss: [['He', 'พระองค์'], ['is', 'เป็น'], ['the water', 'น้ำ'], ['of', 'แห่ง'], ['life', 'ชีวิต']] },
          { th: 'ให้เราดื่มน้ำแห่งชีวิต', rom: 'hâi rao dùuem náam hɛ̀ng chii-wít', en: 'Let us drink the water of life',
            gloss: [['Let', 'ให้'], ['us', 'เรา'], ['drink', 'ดื่ม'], ['the water', 'น้ำ'], ['of', 'แห่ง'], ['life', 'ชีวิต']] },
          { th: 'หล่อเลี้ยงหัวใจ ให้ชีวิตใหม่', rom: 'lɔ̀ɔ-líang hǔa-jai, hâi chii-wít mài', en: 'Nourishing the heart, giving new life',
            gloss: [['Nourishing', 'หล่อเลี้ยง'], ['the heart', 'หัวใจ'], ['giving', 'ให้'], ['new', 'ใหม่'], ['life', 'ชีวิต']] },
          { th: 'แม่น้ำแห่งชีวิตจะรินไหล มาจากใจ', rom: 'mɛ̂ɛ-náam hɛ̀ng chii-wít jà rin lǎi, maa jàak jai', en: 'The river of life will flow from the heart',
            gloss: [['The river', 'แม่น้ำ'], ['of', 'แห่ง'], ['life', 'ชีวิต'], ['will', 'จะ'], ['flow', 'รินไหล'], ['from', ['มา', 'จาก']], ['the heart', 'ใจ']] },
        ],
      },
    ],
    words: [
      { id: 'song1-jai', en: 'heart, mind (the feeling one)', th: 'ใจ', rom: 'jai' },
      { id: 'song1-thirsty', en: 'thirsty', th: 'กระหาย', rom: 'kra-hǎai' },
      { id: 'song1-endure', en: 'to bear suffering', th: 'ทนทุกข์', rom: 'thon thúk' },
      { id: 'song1-hardship', en: 'hardship', th: 'ลำบาก', rom: 'lam-bàak' },
      { id: 'song1-hopeless', en: 'to lose hope', th: 'หมดหวัง', rom: 'mòt wǎng' },
      { id: 'song1-everything', en: 'everything', th: 'ทุกอย่าง', rom: 'thúk yàang' },
      { id: 'song1-come', en: 'come (a call, as in a hymn)', th: 'จงเข้ามา', rom: 'jong khâo maa' },
      { id: 'song1-he-god', en: 'He (used for God, royalty, monks)', th: 'พระองค์', rom: 'phrá-ong' },
      { id: 'song1-life', en: 'life', th: 'ชีวิต', rom: 'chii-wít' },
      { id: 'song1-of', en: 'of (formal, poetic)', th: 'แห่ง', rom: 'hɛ̀ng' },
      { id: 'song1-water-of-life', en: 'water of life', th: 'น้ำแห่งชีวิต', rom: 'náam hɛ̀ng chii-wít' },
      { id: 'song1-nourish', en: 'to nourish', th: 'หล่อเลี้ยง', rom: 'lɔ̀ɔ-líang' },
      { id: 'song1-heart', en: 'heart', th: 'หัวใจ', rom: 'hǔa-jai' },
      { id: 'song1-new-life', en: 'new life', th: 'ชีวิตใหม่', rom: 'chii-wít mài' },
      { id: 'song1-river', en: 'river', th: 'แม่น้ำ', rom: 'mɛ̂ɛ-náam' },
      { id: 'song1-flow', en: 'to flow', th: 'รินไหล', rom: 'rin lǎi' },
      { id: 'song1-from-heart', en: 'from the heart', th: 'มาจากใจ', rom: 'maa jàak jai' },
    ],
    more: [
      { id: 'song1-thii', en: 'that, which, who (ใจที่… a heart that…)', th: 'ที่', rom: 'thîi',
        note: [{ en: 'It joins a description to a word. Heart, that is thirsty:' }, { th: 'ใจที่กระหาย' }] },
      { id: 'song1-lae', en: 'and', th: 'และ', rom: 'lɛ́' },
      { id: 'song1-tired', en: 'tired', th: 'เหนื่อย', rom: 'nùeai' },
      { id: 'song1-thon', en: 'to endure, to put up with', th: 'ทน', rom: 'thon' },
      { id: 'song1-suffering', en: 'suffering', th: 'ทุกข์', rom: 'thúk' },
      { id: 'song1-mot', en: 'to run out, to be all gone', th: 'หมด', rom: 'mòt' },
      { id: 'song1-wang', en: 'to hope, hope', th: 'หวัง', rom: 'wǎng' },
      { id: 'song1-every', en: 'every', th: 'ทุก', rom: 'thúk',
        note: [{ en: 'It sounds just like the word for suffering, but is spelled differently.' }] },
      { id: 'song1-yaang', en: 'kind, sort, way', th: 'อย่าง', rom: 'yàang',
        note: [{ en: 'Every kind means everything:' }, { th: 'ทุกอย่าง' }] },
      { id: 'song1-jong', en: 'do…! (a solemn command word, in prayers and hymns)', th: 'จง', rom: 'jong' },
      { id: 'song1-come-in', en: 'to come in, to come near', th: 'เข้ามา', rom: 'khâo maa' },
      { id: 'song1-pen', en: 'to be (is, are)', th: 'เป็น', rom: 'pen' },
      { id: 'song1-water', en: 'water', th: 'น้ำ', rom: 'náam' },
      { id: 'song1-hai', en: 'to let; to give', th: 'ให้', rom: 'hâi' },
      { id: 'song1-rao', en: 'we, us', th: 'เรา', rom: 'rao' },
      { id: 'song1-drink', en: 'to drink', th: 'ดื่ม', rom: 'dùuem' },
      { id: 'song1-new', en: 'new', th: 'ใหม่', rom: 'mài' },
      { id: 'song1-head', en: 'head', th: 'หัว', rom: 'hǔa',
        note: [{ en: 'Head and heart together make the word for the heart itself:' }, { th: 'หัวใจ' }] },
      { id: 'song1-mother', en: 'mother', th: 'แม่', rom: 'mɛ̂ɛ',
        note: [{ en: 'A river is the mother of waters:' }, { th: 'แม่น้ำ' }] },
      { id: 'song1-ja', en: 'will (the future)', th: 'จะ', rom: 'jà' },
      { id: 'song1-rin', en: 'to pour gently, to trickle', th: 'ริน', rom: 'rin' },
      { id: 'song1-lai', en: 'to flow', th: 'ไหล', rom: 'lǎi' },
      { id: 'song1-maa', en: 'to come; toward here', th: 'มา', rom: 'maa' },
      { id: 'song1-jaak', en: 'from', th: 'จาก', rom: 'jàak' },
    ],
  },
];

// Each song's words become a Words unit (key words first), so they get spaced repetition like everything else.
for (const song of window.SONGS) {
  song.more = song.more || [];
  window.COURSE.units.push({ key: `song-${song.id}`, title: `Song · ${song.titleEn}`, items: [...song.words, ...song.more], song: song.id });
}
