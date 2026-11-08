// Where words come from, to help remember them. Shown in a small card when a word is tapped in the
// follow-along text (words with an entry here are marked with a dotted underline).
//   en:    what the whole word means (the meaning to learn)
//   parts: the pieces it is built from: [Thai, romanization, meaning of the piece on its own]
//   note:  optional; the story behind it, or other words built the same way
// A piece's own meaning is only its origin: แม่ in แม่น้ำ is not "mother" in the sentence, the word is "river".
window.ETYMOLOGY = {
  // ---- heart and mind: ใจ makes feelings ----
  'หัวใจ': { en: 'heart', parts: [['หัว', 'hǔa', 'head'], ['ใจ', 'jai', 'heart, mind']], note: 'Said as one word. ใจ on its own also means heart or mind, and it builds many feeling words.' },
  'เข้าใจ': { en: 'to understand', parts: [['เข้า', 'khâo', 'to enter'], ['ใจ', 'jai', 'heart, mind']], note: 'It goes into your mind.' },
  'ใจดี': { en: 'kind', parts: [['ใจ', 'jai', 'heart, mind'], ['ดี', 'dii', 'good']], note: 'A good heart.' },
  'ใจเย็น': { en: 'calm, patient', parts: [['ใจ', 'jai', 'heart, mind'], ['เย็น', 'yen', 'cool']], note: 'A cool heart. Its opposite is ใจร้อน, a hot heart: impatient.' },
  'ใจเย็นๆ': { en: 'calm down, take it easy', parts: [['ใจ', 'jai', 'heart, mind'], ['เย็นๆ', 'yen-yen', 'cool, cool']], note: 'Keep your heart cool. Said to someone upset or in a hurry.' },
  'ใจร้อน': { en: 'impatient, hot-tempered', parts: [['ใจ', 'jai', 'heart, mind'], ['ร้อน', 'rɔ́ɔn', 'hot']], note: 'A hot heart. Its opposite is ใจเย็น, a cool heart.' },
  'ใจกว้าง': { en: 'generous, open-minded', parts: [['ใจ', 'jai', 'heart, mind'], ['กว้าง', 'kwâang', 'wide']], note: 'A wide heart.' },
  'ดีใจ': { en: 'glad, happy', parts: [['ดี', 'dii', 'good'], ['ใจ', 'jai', 'heart, mind']], note: 'Good in the heart. Compare ใจดี, kind: the same two pieces the other way round.' },
  'แน่ใจ': { en: 'sure, certain', parts: [['แน่', 'nɛ̂ɛ', 'certain, firm'], ['ใจ', 'jai', 'heart, mind']] },
  'สนใจ': { en: 'to be interested', parts: [['สน', 'sǒn', 'to thread through (as in สนเข็ม, to thread a needle)'], ['ใจ', 'jai', 'heart, mind']], note: 'Often explained as threading your mind onto something. Interesting is น่าสนใจ: worth being interested in.' },
  'ตั้งใจ': { en: 'to intend; to concentrate', parts: [['ตั้ง', 'tâng', 'to set up'], ['ใจ', 'jai', 'heart, mind']], note: 'To set your mind on something.' },
  'เกรงใจ': { en: 'to be considerate, not wanting to trouble someone', parts: [['เกรง', 'kreeng', 'to be in awe of, to fear'], ['ใจ', 'jai', 'heart, mind']], note: 'A key Thai value: holding back so as not to impose on others.' },

  // ---- water: น้ำ makes liquids ----
  'แม่น้ำ': { en: 'river', parts: [['แม่', 'mɛ̂ɛ', 'mother; also "the main one"'], ['น้ำ', 'náam', 'water']], note: 'The main water that streams flow into. แม่ means "the main one" in other words too: แม่เหล็ก (magnet), แม่ทัพ (army commander). Northern towns such as Mae Sai are named after their rivers.' },
  'น้ำแข็ง': { en: 'ice', parts: [['น้ำ', 'náam', 'water'], ['แข็ง', 'khɛ̌ng', 'hard']], note: 'Hard water.' },
  'น้ำเปล่า': { en: 'plain drinking water', parts: [['น้ำ', 'náam', 'water'], ['เปล่า', 'plàao', 'empty, plain']], note: 'Water with nothing in it.' },
  'น้ำมัน': { en: 'oil; petrol', parts: [['น้ำ', 'náam', 'water, liquid'], ['มัน', 'man', 'fat, grease']] },
  'น้ำมูก': { en: 'snot, nasal mucus', parts: [['น้ำ', 'náam', 'water, liquid'], ['มูก', 'mûuk', 'mucus']], note: 'A runny nose is น้ำมูกไหล: the snot flows.' },
  'น้ำเงิน': { en: 'dark blue', parts: [['น้ำ', 'náam', 'lustre, sheen (as in น้ำเพชร, a diamond\'s sparkle)'], ['เงิน', 'ngoen', 'silver; money']], note: 'Usually explained as the bluish sheen of silver. Light blue is สีฟ้า, the colour of the sky.' },
  'ห้องน้ำ': { en: 'bathroom, toilet', parts: [['ห้อง', 'hɔ̂ng', 'room'], ['น้ำ', 'náam', 'water']], note: 'The water room.' },

  // ---- fire and sky ----
  'ไฟฟ้า': { en: 'electricity', parts: [['ไฟ', 'fai', 'fire, light'], ['ฟ้า', 'fáa', 'sky']], note: 'Fire from the sky: lightning.' },
  'รถไฟ': { en: 'train', parts: [['รถ', 'rót', 'vehicle'], ['ไฟ', 'fai', 'fire']], note: 'The fire vehicle, from the first steam trains.' },
  'รถไฟฟ้า': { en: 'electric train, the Skytrain', parts: [['รถ', 'rót', 'vehicle'], ['ไฟฟ้า', 'fai-fáa', 'electricity']], note: 'Electricity is fire from the sky, so this is the electricity vehicle.' },
  'รถติด': { en: 'traffic jam', parts: [['รถ', 'rót', 'car, vehicle'], ['ติด', 'tìt', 'stuck']] },

  // ---- buildings: โรง is a hall ----
  'โรงพยาบาล': { en: 'hospital', parts: [['โรง', 'roong', 'hall, building'], ['พยาบาล', 'pha-yaa-baan', 'to nurse, to care for the sick']], note: 'The building for nursing.' },
  'โรงแรม': { en: 'hotel', parts: [['โรง', 'roong', 'hall, building'], ['แรม', 'rɛɛm', 'to stay overnight (old word)']], note: 'The building for staying the night.' },
  'โรงเรียน': { en: 'school', parts: [['โรง', 'roong', 'hall, building'], ['เรียน', 'rian', 'to study']], note: 'The building for studying.' },
  'สนามบิน': { en: 'airport', parts: [['สนาม', 'sa-nǎam', 'field, ground'], ['บิน', 'bin', 'to fly']], note: 'The flying field.' },
  'เที่ยวบิน': { en: 'flight', parts: [['เที่ยว', 'thîao', 'a trip'], ['บิน', 'bin', 'to fly']] },

  // ---- time ----
  'วันนี้': { en: 'today', parts: [['วัน', 'wan', 'day'], ['นี้', 'níi', 'this']] },
  'เมื่อวาน': { en: 'yesterday', parts: [['เมื่อ', 'mûea', 'when, at the time'], ['วาน', 'waan', 'yesterday (old word)']] },
  'เที่ยงคืน': { en: 'midnight', parts: [['เที่ยง', 'thîang', 'exact; the exact middle'], ['คืน', 'khuuen', 'night']], note: 'The exact middle of the night. Noon is เที่ยง, or เที่ยงวัน: the exact middle of the day.' },
  'เมื่อไร': { en: 'when?', parts: [['เมื่อ', 'mûea', 'when, at the time'], ['ไร', 'rai', 'what (short for อะไร)']], note: 'At what time.' },
  'เท่าไร': { en: 'how much?', parts: [['เท่า', 'thâo', 'equal to, as much as'], ['ไร', 'rai', 'what (short for อะไร)']], note: 'As much as what.' },
  'ยังไง': { en: 'how?', parts: [['ยัง', 'yang', 'from อย่าง, way, kind'], ['ไง', 'ngai', 'from ไร, what']], note: 'Casual for อย่างไร: in what way.' },

  // ---- people and family ----
  'พี่น้อง': { en: 'brothers and sisters', parts: [['พี่', 'phîi', 'older sibling'], ['น้อง', 'nɔ́ɔng', 'younger sibling']], note: 'Thai sorts brothers and sisters by age first, not by boy or girl.' },
  'ครอบครัว': { en: 'family', parts: [['ครอบ', 'khrɔ̂ɔp', 'to cover'], ['ครัว', 'khrua', 'household (today it means kitchen)']], note: 'Often explained as the household gathered under one roof.' },
  'บ้านเกิด': { en: 'hometown', parts: [['บ้าน', 'bâan', 'home'], ['เกิด', 'kòet', 'to be born']] },
  'เจ้าของ': { en: 'owner', parts: [['เจ้า', 'jâo', 'lord, master'], ['ของ', 'khɔ̌ɔng', 'thing; of']], note: 'Master of the thing.' },
  'นักเรียน': { en: 'student (at school)', parts: [['นัก', 'nák', 'a person who does it'], ['เรียน', 'rian', 'to study']], note: 'นัก makes people: นักศึกษา (university student), นักร้อง (singer).' },
  'หัวหน้า': { en: 'boss, supervisor', parts: [['หัว', 'hǔa', 'head'], ['หน้า', 'nâa', 'front']], note: 'The one at the head, out in front.' },
  'หน้าตา': { en: 'looks, appearance', parts: [['หน้า', 'nâa', 'face'], ['ตา', 'taa', 'eye']] },

  // ---- body and health ----
  'ท้องเสีย': { en: 'diarrhea, an upset stomach', parts: [['ท้อง', 'thɔ́ɔng', 'belly'], ['เสีย', 'sǐa', 'spoiled, broken']] },
  'เจ็บคอ': { en: 'a sore throat', parts: [['เจ็บ', 'jèp', 'to hurt'], ['คอ', 'khɔɔ', 'throat, neck']] },
  'เวียนหัว': { en: 'dizzy', parts: [['เวียน', 'wian', 'to go round'], ['หัว', 'hǔa', 'head']] },

  // ---- ขี้ and น่า: describing people and things ----
  'ขี้อาย': { en: 'shy', parts: [['ขี้', 'khîi', 'prone to (before a word)'], ['อาย', 'aai', 'embarrassed']], note: 'ขี้ in front of a feeling means "always that way": ขี้เกียจ (lazy), ขี้อาย (shy).' },
  'ขี้เกียจ': { en: 'lazy', parts: [['ขี้', 'khîi', 'prone to (before a word)'], ['เกียจ', 'kìat', 'idle']], note: 'ขี้ in front of a feeling means "always that way": ขี้อาย (shy).' },
  'น่ารัก': { en: 'cute, lovely', parts: [['น่า', 'nâa', 'worth, inviting'], ['รัก', 'rák', 'to love']], note: 'Worth loving. น่า works like -able: น่าเบื่อ (boring), น่าสนใจ (interesting).' },
  'น่าเบื่อ': { en: 'boring', parts: [['น่า', 'nâa', 'worth, inviting'], ['เบื่อ', 'bùea', 'bored']], note: 'Making you bored. Compare น่ารัก, cute.' },
  'น่าสนใจ': { en: 'interesting', parts: [['น่า', 'nâa', 'worth, inviting'], ['สนใจ', 'sǒn-jai', 'to be interested']] },

  // ---- doing things ----
  'ได้ยิน': { en: 'to hear', parts: [['ได้', 'dâi', 'to get'], ['ยิน', 'yin', 'to hear (old word)']] },
  'เดินทาง': { en: 'to travel', parts: [['เดิน', 'doen', 'to walk'], ['ทาง', 'thaang', 'way, road']], note: 'To walk the road.' },
  'พักผ่อน': { en: 'to rest, to relax', parts: [['พัก', 'phák', 'to rest, to stop'], ['ผ่อน', 'phɔ̀n', 'to ease, to loosen']] },
  'ตกลง': { en: 'OK, agreed', parts: [['ตก', 'tòk', 'to fall'], ['ลง', 'long', 'down']], note: 'A memory picture: the matter has settled into place.' },
  'แต่งงาน': { en: 'to get married', parts: [['แต่ง', 'tɛ̀ng', 'to arrange, to dress up'], ['งาน', 'ngaan', 'work; an event']], note: 'Literally to arrange the event: the wedding.' },
  'ออกกำลัง': { en: 'to exercise', parts: [['ออก', 'ɔ̀ɔk', 'to put out'], ['กำลัง', 'kam-lang', 'strength']], note: 'Usually with กาย (body): ออกกำลังกาย.' },
  'เห็นด้วย': { en: 'to agree', parts: [['เห็น', 'hěn', 'to see'], ['ด้วย', 'dûai', 'too, with']], note: 'To see it the same way too.' },
  'คิดถึง': { en: 'to miss (someone)', parts: [['คิด', 'khít', 'to think'], ['ถึง', 'thǔeng', 'to reach; about']], note: 'To think about someone.' },
  'ติดต่อ': { en: 'to contact, to keep in touch', parts: [['ติด', 'tìt', 'to stick'], ['ต่อ', 'tɔ̀ɔ', 'to connect, to continue']] },
  'ขอโทษ': { en: 'sorry, excuse me', parts: [['ขอ', 'khɔ̌ɔ', 'to ask for'], ['โทษ', 'thôot', 'fault, blame']], note: 'Asking pardon for a fault.' },
  'สบายดี': { en: 'well, fine', parts: [['สบาย', 'sa-baai', 'comfortable, at ease'], ['ดี', 'dii', 'good']] },
  'โชคดี': { en: 'good luck; lucky', parts: [['โชค', 'chôok', 'luck'], ['ดี', 'dii', 'good']] },
  'เงินทอน': { en: 'change (money given back)', parts: [['เงิน', 'ngoen', 'money'], ['ทอน', 'thɔɔn', 'to give change']] },

  // ---- things ----
  'รองเท้า': { en: 'shoes', parts: [['รอง', 'rɔɔng', 'to put under, to support'], ['เท้า', 'tháao', 'foot']], note: 'What goes under the feet.' },
  'กับข้าว': { en: 'the dishes eaten with rice', parts: [['กับ', 'kàp', 'with'], ['ข้าว', 'khâao', 'rice']], note: 'Rice is the meal; the curries and stir-fries are what comes with it.' },
  'ข้าวเหนียว': { en: 'sticky rice', parts: [['ข้าว', 'khâao', 'rice'], ['เหนียว', 'nǐao', 'sticky, chewy']] },
  'ขนมปัง': { en: 'bread', parts: [['ขนม', 'kha-nǒm', 'snack, sweet'], ['ปัง', 'pang', 'bread (from Portuguese pão)']] },
  'ใบไม้': { en: 'leaf', parts: [['ใบ', 'bai', 'leaf, sheet'], ['ไม้', 'máai', 'wood, tree']] },
  'แผนที่': { en: 'map', parts: [['แผน', 'phɛ̌ɛn', 'plan, sheet'], ['ที่', 'thîi', 'place']], note: 'A plan of places.' },
  'เนื้อสัตว์': { en: 'meat', parts: [['เนื้อ', 'núea', 'flesh; beef'], ['สัตว์', 'sàt', 'animal']] },
  'ครีมกันแดด': { en: 'sunscreen', parts: [['ครีม', 'khriim', 'cream'], ['กัน', 'kan', 'to protect against'], ['แดด', 'dɛ̀ɛt', 'sunshine']] },
  'ภูเขา': { en: 'mountain', parts: [['ภู', 'phuu', 'mountain (formal)'], ['เขา', 'khǎo', 'hill']] },

  // ---- from Sanskrit and Pali, like Latin and Greek in English ----
  'โทรศัพท์': { en: 'telephone', parts: [['โทร', 'thoo-ra', 'far (like tele-)'], ['ศัพท์', 'sàp', 'sound, word']], note: 'Built from Sanskrit the same way English built tele-phone: far sound.' },
  'มหาวิทยาลัย': { en: 'university', parts: [['มหา', 'ma-hǎa', 'great'], ['วิทยา', 'wít-tha-yaa', 'knowledge'], ['ลัย', 'lai', 'from อาลัย, a dwelling']], note: 'The great house of knowledge. วิทยาลัย alone is a college.' },
  'สวัสดี': { en: 'hello; goodbye', note: 'From Sanskrit svasti, well-being. It was promoted as the everyday greeting in the 1930s and 40s.' },
  'ภาษา': { en: 'language', note: 'From Sanskrit bhāṣā, speech.' },
  'หิมะ': { en: 'snow', note: 'From Sanskrit hima, snow, as in Himalaya, the home of snow.' },
  'อาทิตย์': { en: 'the sun; a week', note: 'From Sanskrit āditya, the sun. Sunday is วันอาทิตย์, the sun day, and a week runs from one sun day to the next.' },
  'กรุงเทพ': { en: 'Bangkok', parts: [['กรุง', 'krung', 'capital city'], ['เทพ', 'thêep', 'god, angel']], note: 'The city of angels: the start of Bangkok\'s very long official name.' },
  'เชียงใหม่': { en: 'Chiang Mai', parts: [['เชียง', 'chiang', 'city (northern word)'], ['ใหม่', 'mài', 'new']], note: 'The new city, founded in 1296.' },

  // ---- faith ----
  'พระเจ้า': { en: 'God', parts: [['พระ', 'phrá', 'holy, sacred (a title)'], ['เจ้า', 'jâo', 'lord']] },
  'พระพุทธรูป': { en: 'a Buddha image', parts: [['พระ', 'phrá', 'holy, sacred (a title)'], ['พุทธ', 'phút-tha', 'the Buddha'], ['รูป', 'rûup', 'image, form']] },
  'พระแก้ว': { en: 'the Emerald Buddha', parts: [['พระ', 'phrá', 'holy, sacred (a title)'], ['แก้ว', 'kɛ̂ɛo', 'crystal, glass, gem']], note: 'It is carved from green stone (jade or jasper), not emerald.' },
  'คริสตจักร': { en: 'church (the community)', parts: [['คริสต', 'khrít-tà', 'Christ'], ['จักร', 'jàk', 'wheel; realm, as in อาณาจักร (kingdom)']] },
};
