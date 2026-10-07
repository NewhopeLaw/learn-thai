// Songs for the Song tab. Lyrics are the property of their writers; keep this to songs you have the right to use.
//   sections: lines of th (Thai, spaces mark the pieces used for reverse building), rom, en (meaning)
//   words: key vocabulary; also added to the Words tab as a unit so it enters spaced repetition
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
          { th: 'ใจที่กระหายและเหนื่อย', rom: 'jai thîi kra-hǎai lɛ́ nùeai', en: 'A heart that is thirsty and tired' },
          { th: 'ใจที่ทนทุกข์ลำบาก', rom: 'jai thîi thon thúk lam-bàak', en: 'A heart that bears suffering and hardship' },
          { th: 'ใจที่หมดหวังทุกอย่าง จงเข้ามา', rom: 'jai thîi mòt wǎng thúk yàang, jong khâo maa', en: 'A heart that has lost all hope: come' },
        ],
      },
      {
        name: 'Chorus',
        lines: [
          { th: 'พระองค์เป็นน้ำแห่งชีวิต', rom: 'phrá-ong pen náam hɛ̀ng chii-wít', en: 'He is the water of life' },
          { th: 'ให้เราดื่มน้ำแห่งชีวิต', rom: 'hâi rao dùuem náam hɛ̀ng chii-wít', en: 'Let us drink the water of life' },
          { th: 'หล่อเลี้ยงหัวใจ ให้ชีวิตใหม่', rom: 'lɔ̀ɔ-líang hǔa-jai, hâi chii-wít mài', en: 'Nourishing the heart, giving new life' },
          { th: 'แม่น้ำแห่งชีวิตจะรินไหล มาจากใจ', rom: 'mɛ̂ɛ-náam hɛ̀ng chii-wít jà rin lǎi, maa jàak jai', en: 'The river of life will flow from the heart' },
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
  },
];

// Each song's key words become a Words unit, so they get spaced repetition like everything else.
for (const song of window.SONGS) {
  window.COURSE.units.push({ title: `Song · ${song.titleEn}`, items: song.words, song: song.id });
}
