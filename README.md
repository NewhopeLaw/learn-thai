# Learn Thai by Ear

A free, audio-first Thai course for English speakers. It works like Pimsleur and Anki combined: **you learn by listening and speaking, with no reading required at the start.**

**Start learning:** https://wonilsart.github.io/learn-thai/

## The method

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

**Tracking progress:** the home screen shows phrases due, learned, new and your streak. The *Your progress* panel shows each unit's phrases as learning / known / mastered, the last 14 days of practice, and totals. Progress is saved in your browser (no account needed); use *Back up progress* / *Restore from backup* to move it between devices.

Course: 8 units, 92 phrases — greetings, getting by, food & shopping, numbers, want/have/can, getting around, about you, time & feelings.

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
