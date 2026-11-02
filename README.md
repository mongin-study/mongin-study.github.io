# Học vui

Math practice for two children on a shared pair of iPads. The whole site is static HTML, CSS, and JavaScript: open `index.html` with any static server, or host it on GitHub Pages. There is no build step.

- **Mon** (6) — ice, snow, and a golden puppy. Addition and subtraction, number bonds, sequences, odd and even, shapes.
- **Gin** (3) — cars and animals. Counting, matching, bigger and smaller, simple patterns. Prompts can be read aloud in Vietnamese.

Live site: [https://mongin-study.github.io](https://mongin-study.github.io)

## Run locally

```bash
python3 -m http.server 8743
```

Open `http://127.0.0.1:8743`. A plain file open (`file://`) will not load the daily JSON, the service worker, or Firebase.

On an iPad, use Safari → Share → Add to Home Screen. The app is a standalone PWA (`manifest.webmanifest` and `sw.js`).

## How a round works

The home screen is two big cards. There is no password. Each child has four categories:

| Category | Vietnamese |
| --- | --- |
| Arithmetic | Số học |
| Logical thinking | Tư duy logic |
| Number theory | Lý thuyết số |
| Geometry | Hình học |

Exercises live in `js/catalog.js`. Each entry points at a generator in `js/generators.js` plus a small `config`, so a new exercise is usually a few lines of data. Questions are objects (`choice`, `keypad`, `maker`, `select`, `order`) drawn by `js/engine.js`.

Stars are saved when a round is finished (not if it is quit halfway):

- 3 stars: every question right on the first try
- 2 stars: at least 60% right on the first try
- 1 star: at least one first-try correct
- 0 stars: finished, but none right on the first try

Gin gets a second try on a question. Only the first try counts toward stars.

## Scores on two iPads

Both tablets sign in with Firebase Anonymous Auth and share one family notebook:

```
families/nguyen/kids/{mon|gin}                         resetEpoch
families/nguyen/kids/{mon|gin}/days/{YYYY-MM-DD}       items[] for that day
families/nguyen/kids/{mon|gin}/weeks/{YYYY-MM-DD}      Monday–Sunday totals
families/nguyen/settings/rewards                       star targets [low, mid, high]
```

`js/firebase-sync.js` loads Firebase JS SDK 10 from `gstatic` (ES modules, no build). Firestore uses a persistent local cache, so a finished round is written locally and syncs when the network is back. `localStorage` key `hoc-vui-v1` is the offline copy. The leaderboard (Bảng xếp hạng) and the parent screen read that copy after it has been merged from Firestore, so either iPad shows both children’s stars.

Week boundaries are Monday through Sunday on the device clock.

Reward names are fixed (ice-tower milestones for Mon, race-track milestones for Gin). The three star targets are editable on the parent screen and stored in `families/nguyen/settings/rewards`.

The parent screen can download or copy a JSON backup and import one. Import **adds** rounds; it does not delete stars already in the notebook.

Security rules are in `firestore.rules` (deploy with the Firebase CLI when you are logged in):

```bash
firebase deploy --only firestore:rules --project mongin-study
```

In Firebase console → Authentication → Settings → Authorized domains, include `mongin-study.github.io` (and `localhost` for local testing). Anonymous sign-in must stay enabled.

## Add today’s exercises

Drop a file at `content/daily/YYYY-MM-DD.json`. The menu section **Bài mới hôm nay** loads the file for the device’s local date. No code change is required. A daily job can commit that file.

```json
{
  "date": "2026-11-02",
  "exercises": [
    {
      "id": "daily-2026-11-02-mon-snow",
      "child": "mon",
      "category": "arithmetic",
      "title": "Cộng bông tuyết",
      "icon": "❄️",
      "questions": [
        {
          "kind": "choice",
          "prompt": "5 + 3 = ?",
          "speak": "Năm cộng ba bằng mấy?",
          "choices": [
            { "text": "8", "correct": true },
            { "text": "7", "correct": false }
          ]
        }
      ]
    },
    {
      "id": "daily-2026-11-02-mon-seq",
      "child": "mon",
      "category": "logic",
      "title": "Dãy số băng",
      "icon": "➡️",
      "generator": "sequence",
      "config": { "count": 4, "steps": [2, 5, 10], "max": 80, "input": "choice" }
    }
  ]
}
```

`child` is `mon` or `gin`. `category` is `arithmetic`, `logic`, `number`, or `geometry`. Use either a `questions` array or a `generator` name plus `config`.

Generator names: `addition`, `subtraction`, `nextPrev`, `wordProblem`, `numberBond`, `missingPart`, `sequence`, `oddOneOut`, `compareExpr`, `orderNumbers`, `oddEven`, `compareNumbers`, `skipCount`, `placeValue`, `shapeName`, `countSides`, `countVertices`, `symmetry`, `position`, `moreSides`, `countObjects`, `matchNumberGroup`, `maker`, `moreLess`, `sizeCompare`, `patternNext`, `findShape`, `matchShape`, `colorMatch`, `sameColor`.

Question kinds:

- `choice` — `choices[]` with exactly one `correct: true`. Optional `shape`, `color`, `size`, `emojis`, `scene`.
- `keypad` — numeric `answer`.
- `maker` — tap until `answer` icons exist.
- `select` — `mode: "targets"` and `items[]` with `target: true`.
- `order` — `tokens[]` with `order` starting at 0.

`scene.layout` may be `equation`, `digit`, `emojis`, `shapes`, `pattern`, `mirror`, `zones`, `sides`, `blocks`, `pairs`, or `bond`. Text is shown as text, not HTML.

The speaker button plays recorded Vietnamese (voice HoaiMy) from `assets/audio/`. Questions are full clips or stitched from number and phrase clips, so an iPad does not read Vietnamese with an English voice. If a line cannot be built from clips, the app waits for `speechSynthesis` voices and speaks only with a `vi` voice (iOS: Linh). `+`, `−`, `=`, `?`, emoji, and digits are turned into Vietnamese words before anything is spoken. Other sounds use the Web Audio API.

## GitHub Pages

The site is the root of [mongin-study/mongin-study.github.io](https://github.com/mongin-study/mongin-study.github.io), branch `main`. `.nojekyll` is present so Pages serves the files as-is.

1. Push `main`.
2. In the repo: Settings → Pages → Deploy from branch `main` / `/ (root)`.
3. Wait until `https://mongin-study.github.io` serves `index.html`.

## Layout

```
index.html              shell
css/app.css             layout, both themes
js/catalog.js           exercise list
js/generators.js        procedural questions
js/engine.js            play UI
js/app.js               screens
js/firebase-sync.js     Anonymous Auth + Firestore
js/storage.js           local cache, weeks, backup
content/daily/          one JSON file per date
firestore.rules         read/write for signed-in users under /families/{fam}/**
sw.js                   offline cache
```

Mon and Gin’s photos are the round avatars on the choose-child screen, in each child’s header, and on the leaderboard (`assets/kids/mon.webp`, `assets/kids/gin.webp`). The golden puppy and the tower stay with Mon, and the toy car stays with Gin. The ice princess and the tiger still show when a round is finished. No studio artwork.

Nunito is under the SIL Open Font License (`fonts/OFL.txt`).

## Thêm bài mỗi ngày

Tạo file `content/daily/năm-tháng-ngày.json` (ví dụ `2026-11-02.json`). Sáng hôm đó, vào **Bài mới hôm nay**. Không cần sửa code.

Phần **Phụ huynh xem sao** có sao từng ngày, tổng tuần (thứ Hai–Chủ nhật), mốc thưởng, và nút tải hoặc dán bản sao JSON. Hai iPad nhìn chung một sổ khi có mạng.
