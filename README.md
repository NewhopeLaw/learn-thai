# Learn Thai by Ear

A free, audio-first Thai course for English speakers. It works like Pimsleur and Anki combined: **you learn by listening and speaking, with no reading required at the start.**

**Start learning:** https://newhopelaw.github.io/learn-thai/

## The method

The app has two modes, side by side:

- **Words** is audio flashcards with spaced repetition (like Anki). Every phrase has two cards: *What does this mean?* (Thai → English, trains the ear) and *How do you say…?* (English → Thai, trains the mouth). New words come one unit at a time; due cards come back just before you'd forget them. Rate each one Again / Good / Easy, or turn on Auto to listen hands-free.
- **Talk** is a Pimsleur-style lesson for each unit (about 20–30 minutes, no buttons needed), built around a conversation between Niwat and Premwadee ([app/dialogues.js](app/dialogues.js)):
  1. Opening conversation at natural speed.
  2. Breakdown and reverse building: each line explained, then repeated from its last piece backwards.
  3. Anticipation: say the line (or its meaning) in the pause before the answer.
  4. Graduated interval recall: lines come back at growing intervals, and a few from the previous lesson open the next.
  5. Closing conversation at natural speed.

- **Song** learns lyrics line by line ([app/songs.js](app/songs.js)): key words first (they also join Words as a unit), then each line built from the end, "what comes next?" chaining, run-throughs from the top, and finally the whole song spoken, before singing it with the recording. Lyrics belong to their writers; add only songs you have the right to use.

### Inside a phrase drill

Optional extras:
- **Microphone check:** speech recognition confirms whether your answer sounded right (Chrome/Edge).
- **Hands-free mode:** no rating buttons, for walking or driving.
- **Gendered politeness:** the course teaches ครับ/ค่ะ and ผม/ฉัน to match you.

**Screens:** *Today* (start button, reviews due, new today, streak), *Progress*, *Words* (play any phrase, choose the next unit) and *More* (install, sync, settings, backup).

**Tracking progress:** the *Progress* tab shows each unit's phrases as learning / known / mastered, the last 14 days of practice, and totals. Progress is saved in your browser (no account needed); use *Back up progress* / *Restore from backup* to move it between devices.

Course: 31 units in a travel-shaped order (greetings and basics, numbers and money, arriving and getting around, hotel and food, people, time and weather, health and leisure, culture), 500+ phrases, a Talk lesson for every unit, plus songs. Pick any unit with **Learn next** in the Words tab; replay any lesson from the Talk tab. A suggested month-long schedule is in [30-DAY-PLAN.md](30-DAY-PLAN.md).

Once you're comfortable speaking, **[Stage 2: Reading](lessons/)** teaches the Thai script, vowels and tone rules.

## Project layout

```
index.html        audio app (the home page)
app/course.js     course content: units and phrases  ← add material here
app/app.js        player, scheduling, speech
app/style.css
lessons/          Stage 2 reading lessons (Markdown, built by Jekyll / Just the Docs)
```

GitHub Pages serves everything from `main`, so pushing a change publishes it.

### Adding phrases

Add an item to a unit in `app/course.js`:

```js
{ id: 'good-morning', en: 'good morning', th: 'อรุณสวัสดิ์{P}', rom: 'a-run sa-wàt {P}',
  parts: [{ th: 'สวัสดิ์', rom: 'sa-wàt' }] },
```

`{P}`, `{Pq}` and `{I}` are replaced with the learner's polite ending and pronoun.

### Audio

Speech currently uses the browser's built-in text-to-speech. Voice quality depends on the device. **Microsoft Edge** has very natural Thai voices. A planned improvement is native-speaker recordings.

## License

Content is licensed under [CC BY-SA 4.0](LICENSE).

### Thai voices

Thai audio is pre-recorded with two neural voices, **Niwat (male)** and **Premwadee (female)**, stored in `audio/male/` and `audio/female/`. Learners can pick one or alternate both (button in the session, or `V`). After adding or changing phrases, regenerate the missing files:

```
pip install edge-tts
python tools/generate_audio.py
```

The English narrator uses the browser's built-in voice.

### Install and offline use

The site is an installable web app. In Chrome or Edge (PC or Android), press **Install app** on the home screen, or use the browser menu → *Install app* / *Add to Home screen*. Press **Download for offline** once to save all the audio (about 9 MB) on the device; after that, lessons work with no internet. `sw.js` handles caching (app files network-first, audio cache-first).
