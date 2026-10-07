# Learn Thai by Ear

A free, audio-first Thai course for English speakers. It works like Pimsleur and Anki combined: **you learn by listening and speaking, with no reading required at the start.**

**Start learning:** https://wonilsart.github.io/learn-thai/

## The method

Each day has two parts:

- **Review (like Anki):** phrases that are due come back as audio flashcards. Say the answer out loud, hear it, then rate it: Again / OK / Good / Easy.
- **Lesson (like Pimsleur):** each of the 26 units is a lesson built around a short conversation between Niwat and Premwadee ([app/dialogues.js](app/dialogues.js)). You listen to the conversation first, learn its phrases (with a few old ones recycled), role-play your side in the pauses, then listen once more.

### Inside a phrase drill

1. **Listen.** A new phrase is introduced by ear. Long phrases are *back-chained* (built from the last syllable forward) so you can say them with natural rhythm and tones.
2. **Recall out loud (anticipation).** The narrator asks “How do you say…?” in English. You answer out loud in Thai during the pause, *before* you hear the answer.
3. **Check and repeat.** The correct answer plays twice. Copy it.
4. **Rate yourself** (Again / Good / Easy), like Anki audio flashcards.
5. **Spaced repetition.**
   - *Within a session*: Good/Easy finishes a phrase for the day; Again brings it back after ~8 s, 30 s, 90 s, 4 min until you get it.
   - *Across days*: an SM-2-style schedule brings each phrase back just before you'd forget it.

Optional extras:
- **Microphone check:** speech recognition confirms whether your answer sounded right (Chrome/Edge).
- **Hands-free mode:** no rating buttons, for walking or driving.
- **Gendered politeness:** the course teaches ครับ/ค่ะ and ผม/ฉัน to match you.

**Screens:** *Today* (start button, reviews due, new today, streak), *Progress*, *Words* (play any phrase, choose the next unit) and *More* (install, sync, settings, backup).

**Tracking progress:** the *Progress* tab shows each unit's phrases as learning / known / mastered, the last 14 days of practice, and totals. Progress is saved in your browser (no account needed); use *Back up progress* / *Restore from backup* to move it between devices.

Course: 26 units, 359 phrases. Core travel units 1–14 (greetings through small talk), then extras: question words, everyday verbs, days and times, places, street food, clothes, massage, beaches, temples, phone and internet, making friends, reactions. Pick any unit with **Study next** in the Words tab. A suggested month-long schedule is in [30-DAY-PLAN.md](30-DAY-PLAN.md).

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
