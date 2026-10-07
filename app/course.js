// Course content for the audio app.
//
// Each item is one thing the learner learns to SAY.
//   en    – what the English narrator asks for ("How do you say: <en>?")
//   th    – Thai text sent to the Thai voice (never shown unless "peek" is on)
//   rom   – romanization, shown only with "peek" on
//   parts – optional back-chaining steps, played end-first before the whole phrase
//   note  – optional narration after the introduction: segments of {en} or {th}
//
// Placeholders, filled in from the learner's settings:
//   {P}  polite ending for statements  (ครับ khráp / ค่ะ khâ)
//   {Pq} polite ending for questions   (ครับ khráp / คะ khá)
//   {I}  "I"                            (ผม phǒm / ฉัน chǎn)

window.COURSE = {
  units: [
    {
      title: 'Unit 1 · Greetings',
      items: [
        { id: 'hello', en: 'hello', th: 'สวัสดี', rom: 'sa-wàt-dii',
          parts: [{ th: 'ดี', rom: 'dii' }, { th: 'หวัดดี', rom: 'wàt-dii' }],
          note: [{ en: 'Thais use the same word for hello and goodbye.' }] },
        { id: 'particle', en: 'the polite ending word', th: '{P}', rom: '{P}',
          note: [{ en: 'Thais add a polite word to the end of most sentences. It depends on whether the speaker is a man or a woman. For you, it is:' }, { th: '{P}' }] },
        { id: 'hello-polite', en: 'hello, politely', th: 'สวัสดี{P}', rom: 'sa-wàt-dii {P}' },
        { id: 'thanks', en: 'thank you', th: 'ขอบคุณ', rom: 'khɔ̀ɔp-khun',
          parts: [{ th: 'คุณ', rom: 'khun' }] },
        { id: 'thanks-polite', en: 'thank you, politely', th: 'ขอบคุณ{P}', rom: 'khɔ̀ɔp-khun {P}' },
        { id: 'fine', en: "I'm fine", th: 'สบายดี', rom: 'sa-baai-dii',
          parts: [{ th: 'ดี', rom: 'dii' }, { th: 'บายดี', rom: 'baai-dii' }] },
        { id: 'how-are-you', en: 'how are you?', th: 'สบายดีไหม{Pq}', rom: 'sa-baai-dii mǎi {Pq}',
          parts: [{ th: 'ไหม', rom: 'mǎi' }, { th: 'ดีไหม', rom: 'dii mǎi' }],
          note: [{ en: 'The little word at the end turns a sentence into a yes or no question.' }, { th: 'ไหม' }] },
        { id: 'sorry', en: 'sorry, or excuse me', th: 'ขอโทษ{P}', rom: 'khɔ̌ɔ-thôot {P}',
          parts: [{ th: 'โทษ', rom: 'thôot' }] },
        { id: 'no-problem', en: 'no problem, or never mind', th: 'ไม่เป็นไร', rom: 'mâi pen rai',
          parts: [{ th: 'ไร', rom: 'rai' }, { th: 'เป็นไร', rom: 'pen rai' }] },
      ],
    },
    {
      title: 'Unit 2 · Getting by',
      items: [
        { id: 'yes', en: "yes, that's right", th: 'ใช่', rom: 'châi' },
        { id: 'not-right', en: "no, that's not right", th: 'ไม่ใช่', rom: 'mâi châi',
          note: [{ en: 'Putting this word in front makes anything negative.' }, { th: 'ไม่' }] },
        { id: 'understand', en: 'I understand', th: 'เข้าใจ{P}', rom: 'khâo-jai {P}',
          parts: [{ th: 'ใจ', rom: 'jai' }] },
        { id: 'not-understand', en: "I don't understand", th: 'ไม่เข้าใจ{P}', rom: 'mâi khâo-jai {P}' },
        { id: 'slowly', en: 'please speak slowly', th: 'พูดช้าๆ หน่อย{P}', rom: 'phûut cháa-cháa nɔ̀i {P}',
          parts: [{ th: 'หน่อย', rom: 'nɔ̀i' }, { th: 'ช้าๆ หน่อย', rom: 'cháa-cháa nɔ̀i' }] },
        { id: 'pronoun-i', en: 'I, or me', th: '{I}', rom: '{I}',
          note: [{ en: 'Like the polite ending, the word for I depends on the speaker. For you, it is:' }, { th: '{I}' }] },
        { id: 'name-q', en: "what's your name?", th: 'คุณชื่ออะไร{Pq}', rom: 'khun chûue a-rai {Pq}',
          parts: [{ th: 'อะไร', rom: 'a-rai' }, { th: 'ชื่ออะไร', rom: 'chûue a-rai' }] },
        { id: 'nice-to-meet', en: 'nice to meet you', th: 'ยินดีที่ได้รู้จัก{P}', rom: 'yin-dii thîi dâi rúu-jàk {P}',
          parts: [{ th: 'รู้จัก', rom: 'rúu-jàk' }, { th: 'ได้รู้จัก', rom: 'dâi rúu-jàk' }, { th: 'ที่ได้รู้จัก', rom: 'thîi dâi rúu-jàk' }] },
      ],
    },
    {
      title: 'Unit 3 · Food and shopping',
      items: [
        { id: 'water', en: 'water', th: 'น้ำ', rom: 'náam' },
        { id: 'plain-water', en: 'plain drinking water', th: 'น้ำเปล่า', rom: 'náam plàao' },
        { id: 'may-i-have', en: 'may I have', th: 'ขอ', rom: 'khɔ̌ɔ' },
        { id: 'water-please', en: 'may I have plain water, please?', th: 'ขอน้ำเปล่า{P}', rom: 'khɔ̌ɔ náam plàao {P}' },
        { id: 'delicious', en: 'delicious', th: 'อร่อย', rom: 'a-rɔ̀i' },
        { id: 'very-delicious', en: 'very delicious', th: 'อร่อยมาก', rom: 'a-rɔ̀i mâak' },
        { id: 'not-spicy', en: 'not spicy', th: 'ไม่เผ็ด', rom: 'mâi phèt' },
        { id: 'how-much', en: 'how much?', th: 'เท่าไร{Pq}', rom: 'thâo-rài {Pq}' },
        { id: 'this-one', en: 'this one', th: 'อันนี้', rom: 'an níi' },
        { id: 'this-how-much', en: 'how much is this one?', th: 'อันนี้เท่าไร{Pq}', rom: 'an níi thâo-rài {Pq}' },
        { id: 'too-expensive', en: 'too expensive', th: 'แพงไป', rom: 'phɛɛng pai' },
        { id: 'bill', en: 'the bill, please', th: 'เช็คบิลด้วย{P}', rom: 'chék bin dûai {P}' },
        { id: 'toilet', en: 'the toilet', th: 'ห้องน้ำ', rom: 'hɔ̂ng-náam' },
        { id: 'where-toilet', en: 'where is the toilet?', th: 'ห้องน้ำอยู่ที่ไหน{Pq}', rom: 'hɔ̂ng-náam yùu thîi-nǎi {Pq}',
          parts: [{ th: 'ที่ไหน', rom: 'thîi-nǎi' }, { th: 'อยู่ที่ไหน', rom: 'yùu thîi-nǎi' }] },
      ],
    },
    {
      title: 'Unit 4 · Numbers',
      items: [
        { id: 'n1', en: 'one', th: 'หนึ่ง', rom: 'nùeng' },
        { id: 'n2', en: 'two', th: 'สอง', rom: 'sɔ̌ɔng' },
        { id: 'n3', en: 'three', th: 'สาม', rom: 'sǎam' },
        { id: 'n4', en: 'four', th: 'สี่', rom: 'sìi' },
        { id: 'n5', en: 'five', th: 'ห้า', rom: 'hâa' },
        { id: 'n6', en: 'six', th: 'หก', rom: 'hòk' },
        { id: 'n7', en: 'seven', th: 'เจ็ด', rom: 'jèt' },
        { id: 'n8', en: 'eight', th: 'แปด', rom: 'pɛ̀ɛt' },
        { id: 'n9', en: 'nine', th: 'เก้า', rom: 'kâao' },
        { id: 'n10', en: 'ten', th: 'สิบ', rom: 'sìp' },
        { id: 'n20', en: 'twenty', th: 'ยี่สิบ', rom: 'yîi-sìp',
          note: [{ en: 'Twenty is irregular. It is not two-ten.' }] },
        { id: 'n100', en: 'one hundred', th: 'หนึ่งร้อย', rom: 'nùeng rɔ́ɔi' },
        { id: 'baht-100', en: 'one hundred baht', th: 'หนึ่งร้อยบาท', rom: 'nùeng rɔ́ɔi bàat' },
      ],
    },
  ],
};
