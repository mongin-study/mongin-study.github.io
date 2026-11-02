#!/usr/bin/env python3
"""Build Vietnamese speech clips for Học vui.

Uses Microsoft edge-tts voice vi-VN-HoaiMyNeural. Re-run from the repo root:

  node scripts/collect-speech.mjs > /tmp/speech-lines.json
  python3 scripts/build-audio.py /tmp/speech-lines.json
"""
import asyncio
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "audio"
VOICE = "vi-VN-HoaiMyNeural"
RATE = "-6%"

NAMES = {
    "mon": "Mon",
    "gin": "Gin",
}


def read_number(n):
    n = int(round(float(n)))
    d = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    if n < 0:
        return "âm " + read_number(-n)
    if n < 10:
        return d[n]
    if n == 10:
        return "mười"
    if n < 20:
        o = n - 10
        if o == 5:
            return "mười lăm"
        return "mười " + d[o]
    if n == 100:
        return "một trăm"
    if n > 100:
        return str(n)
    tens = n // 10
    ones = n % 10
    s = d[tens] + " mươi"
    if ones == 0:
        return s
    if ones == 1:
        return s + " mốt"
    if ones == 4:
        return s + " tư"
    if ones == 5:
        return s + " lăm"
    return s + " " + d[ones]


def normalize(text):
    s = str(text or "")
    s = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\U0001F1E6-\U0001F1FF\uFE0F\u200D]", " ", s)
    s = s.replace("+", " cộng ").replace("＋", " cộng ")
    s = s.replace("−", " trừ ").replace("–", " trừ ").replace("—", " trừ ").replace("-", " trừ ")
    s = s.replace("=", " bằng ")
    s = s.replace("×", " nhân ").replace("✕", " nhân ").replace("÷", " chia ")
    s = re.sub(r"\d+", lambda m: " " + read_number(m.group(0)) + " ", s)
    s = re.sub(r"[?？!！.,;:…\"'“”‘’()\[\]{}]", " ", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def say_for(key, original=None):
    raw = key
    for src, dst in NAMES.items():
        raw = re.sub(rf"\b{src}\b", dst, raw)
    if original and re.search(r"[?？]", original):
        raw += "?"
    return raw


# Phrase clips with natural prosody. Keys are normalize(say).
PHRASES = [
    "cộng",
    "trừ",
    "bằng",
    "bằng mấy?",
    "Số liền sau của",
    "Số liền trước của",
    "là số nào?",
    "Số tiếp theo là số nào?",
    "Tiếp theo là số nào?",
    "Tìm số còn thiếu.",
    "cộng số còn thiếu bằng",
    "Số nào cộng",
    "cộng số nào bằng",
    "Phép nào lớn hơn?",
    "hay",
    "Số",
    "là số chẵn hay số lẻ?",
    "Đếm cách",
    "có",
    "chục và",
    "đơn vị. Đây là số mấy?",
    "Đây là hình gì?",
    "Đếm các cạnh. Hình này có mấy cạnh?",
    "Đếm các đỉnh, là các mũi nhọn. Có mấy đỉnh?",
    "Nhìn hai bên đường kẻ. Chúng có giống nhau không?",
    "Hình nào có nhiều cạnh hơn?",
    "Nhìn các thanh chục. Có bao nhiêu chục?",
    "Nhìn các chấm đơn vị. Có bao nhiêu đơn vị?",
    "Nhìn quy luật màu, chọn màu tiếp theo",
    "Nhìn quy luật hình, chọn hình tiếp theo",
    "Tìm hình giống hình ở trên",
    "Chạm vào màu giống hình này",
    "Chạm vào cái không giống các bạn",
    "Tìm số không cùng nhóm",
    "Chạm số bé trước, rồi đến số lớn hơn",
    "Trong hai số này, số nào nhỏ hơn?",
    "Trong hai số này, số nào lớn hơn?",
    "Bên nào nhiều hơn?",
    "Bên nào ít hơn?",
    "Cái nào to hơn?",
    "Cái nào nhỏ hơn?",
    "Đếm các",
    "Có bao nhiêu?",
    "Tìm nhóm có",
    "Hãy làm đủ",
    "Chạm vào",
    "Chạm vào tất cả hình màu",
    "rồi bấm Xong",
    "Mon có",
    "Gin có",
    "bông tuyết",
    "Cún Vàng mang thêm",
    "bông",
    "Hỏi có tất cả bao nhiêu bông tuyết?",
    "chiếc xe",
    "Bạn tặng thêm",
    "chiếc",
    "Hỏi Gin có tất cả bao nhiêu chiếc xe?",
    "Đĩa có",
    "chiếc bánh",
    "Mẹ để thêm",
    "Hỏi có tất cả bao nhiêu chiếc bánh?",
    "nhãn dán",
    "Mon cho Gin",
    "nhãn",
    "Hỏi Mon còn lại bao nhiêu nhãn?",
    "quả bóng",
    "Các bạn lấy đi",
    "quả",
    "Hỏi còn lại bao nhiêu quả bóng?",
    "Cún Vàng có",
    "Cún ăn",
    "Hỏi còn lại bao nhiêu chiếc bánh?",
    "được thêm",
    "Có tất cả bao nhiêu?",
    "quả táo",
    "ngôi sao",
    "chú cún",
    "bông hoa",
    "quả bóng bay",
    "con cá",
    "hình tròn",
    "hình vuông",
    "hình tam giác",
    "hình chữ nhật",
    "hình ngũ giác",
    "hình lục giác",
    "hình thoi",
    "hình ngôi sao",
    "hình trái tim",
    "đỏ",
    "xanh dương",
    "vàng",
    "xanh lá",
    "cam",
    "tím",
    "hồng",
    "Con chim đang ở đâu?",
    "Đám mây đang ở đâu?",
    "Con bướm đang ở đâu?",
    "Ngôi sao đang ở đâu?",
    "Con mèo đang ở đâu?",
    "Cún đang ở đâu?",
    "Quả bóng đang ở đâu?",
    "Chiếc xe đang ở đâu?",
    "Chiếc xe ở bên nào? Bên trái hay bên phải?",
    "Cún ở bên nào? Bên trái hay bên phải?",
    "Quả táo ở bên nào? Bên trái hay bên phải?",
    "Con mèo ở bên nào? Bên trái hay bên phải?",
    "Ngôi sao ở bên nào? Bên trái hay bên phải?",
    "Quả bóng ở bên nào? Bên trái hay bên phải?",
    "Đúng rồi!",
    "Giỏi quá!",
    "Chính xác!",
    "Tuyệt lắm!",
    "Tuyệt!",
    "Chưa đúng",
    "Thử lại nhé",
    "Chưa đúng, thử lại nhé",
    "Chưa đúng, mình xem đáp án nhé",
    "Chưa đủ, thêm nữa nhé",
    "Hơi nhiều rồi, bớt bớt nhé",
    "Chưa đúng, đếm lại nhé",
    "Chưa đúng thứ tự, thử lại nhé",
    "Đáp án là",
    "Đáp án được tô màu",
    "Cần đúng",
    "Cần chọn đúng",
    "Thứ tự đúng là",
    "Thứ tự đúng đang hiện ở trên.",
    "Số liền sau là",
    "Số liền trước là",
    "Cộng thêm",
    "được",
    "Số tiếp theo là",
    "là số lẻ.",
    "là số chẵn.",
    "Các số kia thì khác.",
    "không thuộc dãy đếm cách",
    "lớn hơn.",
    "nhỏ hơn.",
    "Thêm",
    "chục.",
    "Số là",
    "đơn vị là",
    "Đây là",
    "cạnh.",
    "đỉnh.",
    "Hai bên giống nhau. Đây là đối xứng.",
    "Hai bên không giống nhau.",
    "ở phía trên.",
    "ở phía dưới.",
    "ở bên trái.",
    "ở bên phải.",
    "nhiều hơn.",
    "Nhóm đúng có",
    "Đủ",
    "rồi.",
    "Một bên có",
    "bên kia có",
    "Cái to hơn là cái lớn.",
    "Cái nhỏ hơn là cái bé.",
    "Màu tiếp theo là màu",
    "Hình tiếp theo lặp theo quy luật.",
    "Đó là",
    "Hình giống là",
    "Đây là màu",
    "Những hình màu",
    "được chọn.",
    "Hình khác là",
    "Màu khác là màu",
    "Chạm vào hình tròn",
    "Chạm vào hình vuông",
    "Chạm vào hình tam giác",
    "Chạm vào hình ngôi sao",
    "Chạm vào hình trái tim",
    "Chạm vào tất cả hình màu đỏ, rồi bấm Xong",
    "Chạm vào tất cả hình màu xanh dương, rồi bấm Xong",
    "Chạm vào tất cả hình màu vàng, rồi bấm Xong",
    "Chạm vào tất cả hình màu xanh lá, rồi bấm Xong",
    "Chạm vào tất cả hình màu cam, rồi bấm Xong",
    "Chạm vào tất cả hình màu tím, rồi bấm Xong",
    "Chạm vào tất cả hình màu hồng, rồi bấm Xong",
    "Mon có năm bông tuyết, được thêm ba bông. Có tất cả bao nhiêu?",
    "Cún Vàng mang sáu bông, Mon mang sáu bông. Có tất cả bao nhiêu?",
    "Bảy cộng tám bằng mấy?",
    "Mười bốn trừ năm bằng mấy?",
    "Số tám là số chẵn hay số lẻ?",
    "Số mười một là số chẵn hay số lẻ?",
    "Đếm các chiếc xe. Có bao nhiêu?",
    "Đếm các chú cún. Có bao nhiêu?",
    "Hãy làm đủ ba ngôi sao",
]


def fid(key):
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]


def trim(path: Path):
    tmp = path.with_suffix(".trim.mp3")
    cmd = [
        "ffmpeg", "-y", "-i", str(path),
        "-af",
        "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-38dB:detection=peak,"
        "areverse,"
        "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-38dB:detection=peak,"
        "areverse",
        "-ar", "24000", "-ac", "1", "-b:a", "40k",
        str(tmp),
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    dur = probe(tmp)
    if dur < 0.18:
        tmp.unlink(missing_ok=True)
        return
    tmp.replace(path)


def probe(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        text=True,
    ).strip()
    try:
        return float(out)
    except ValueError:
        return 0


async def synth(text, dest: Path, sem: asyncio.Semaphore):
    if dest.exists() and dest.stat().st_size > 800:
        return "skip"
    try:
        async with sem:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            await comm.save(str(dest))
        trim(dest)
        if dest.stat().st_size < 400:
            raise RuntimeError("too small")
        return "ok"
    except Exception as exc:
        print("FAIL", dest.name, text[:60], exc, flush=True)
        dest.unlink(missing_ok=True)
        return "fail"


async def main():
    corpus = []
    if len(sys.argv) > 1:
        corpus = json.loads(Path(sys.argv[1]).read_text())
    clips = {}

    def add(say):
        key = normalize(say)
        if not key:
            return
        clips[key] = say_for(key, say)

    for n in range(0, 101):
        word = read_number(n)
        clips.setdefault(word, word)
    for phrase in PHRASES:
        add(phrase)
    if len(sys.argv) > 2:
        for phrase in json.loads(Path(sys.argv[2]).read_text(encoding="utf-8")):
            add(phrase)
    # Dynamic lines are composed from number and phrase clips.
    # Keep every word so an unseen sentence can still be spoken from clips.
    for line in corpus:
        for word in normalize(line).split():
            if word and word not in clips:
                clips[word] = say_for(word, word)

    OUT.mkdir(parents=True, exist_ok=True)
    jobs = []
    manifest = {}
    for key, say in sorted(clips.items()):
        name = fid(key) + ".mp3"
        manifest[key] = "assets/audio/" + name
        jobs.append((say, OUT / name))

    sem = asyncio.Semaphore(6)
    made = 0
    skipped = 0
    failed = 0
    async def run(say, dest):
        nonlocal made, skipped, failed
        status = await synth(say, dest, sem)
        if status == "ok":
            made += 1
        elif status == "fail":
            failed += 1
        else:
            skipped += 1
        done = made + skipped + failed
        if done % 80 == 0:
            print(f"progress {done}/{len(jobs)}", flush=True)

    print(f"jobs {len(jobs)}", flush=True)
    await asyncio.gather(*(run(s, d) for s, d in jobs))
    print(f"failed {failed}", flush=True)
    manifest = {k: v for k, v in manifest.items() if (OUT / Path(v).name).exists()}
    doc = {"voice": VOICE, "rate": RATE, "clips": manifest}
    (OUT / "manifest.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    keep = {Path(v).name for v in manifest.values()}
    removed = 0
    for old in OUT.glob("*.mp3"):
        if old.name not in keep:
            old.unlink()
            removed += 1
    print(f"clips {len(manifest)} new {made} skipped {skipped} removed {removed}")


if __name__ == "__main__":
    asyncio.run(main())
