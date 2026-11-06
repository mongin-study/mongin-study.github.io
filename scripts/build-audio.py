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
RATE = "-10%"
PITCH = "+28Hz"

NAMES = {
    "mon": "Mon",
    "gin": "Gin",
    "vy": "Vy",
    "hà": "Hà",
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
    "Tìm hai thẻ giống nhau.",
    "mờ e me nặng mẹ",
    "Âm mờ, vần e, dấu nặng, tiếng mẹ.",
    "Đổi được sticker rồi!",
    "Đếm thêm",
    "Đếm lùi",
    "từ",
    "Mon có",
    "Gin có",
    "Mẹ Vy có",
    "Bố Hà có",
    "ông có",
    "bà có",
    "Pom có",
    "cái kẹo",
    "cái bánh",
    "quả táo",
    "chiếc ô tô đồ chơi",
    "cây bút màu",
    "quả bóng bay",
    "Vậy tổng cộng có bao nhiêu cái kẹo?",
    "Vậy tổng cộng có bao nhiêu cái bánh?",
    "Vậy tổng cộng có bao nhiêu quả táo?",
    "Vậy tổng cộng có bao nhiêu chiếc ô tô đồ chơi?",
    "Vậy tổng cộng có bao nhiêu cây bút màu?",
    "Vậy tổng cộng có bao nhiêu quả bóng bay?",
    "Mon cho Gin",
    "Mẹ Vy cho Mon",
    "Bố Hà cho Gin",
    "Gin cho Mon",
    "Vậy Mon còn bao nhiêu quả táo?",
    "Vậy Mẹ Vy còn bao nhiêu cái kẹo?",
    "Vậy Bố Hà còn bao nhiêu cây bút màu?",
    "Vậy Gin còn bao nhiêu quả bóng bay?",
    "Pom ăn",
    "Gin ăn",
    "Vậy còn lại bao nhiêu cái bánh?",
    "Vậy còn lại bao nhiêu cái kẹo?",
    "Vậy có",
    "Vậy còn",
    "bông tuyết",
    "Pom mang thêm",
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
    "Pom có",
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
    "Pom mang sáu bông, Mon mang sáu bông. Có tất cả bao nhiêu?",
    "Bảy cộng tám bằng mấy?",
    "Mười bốn trừ năm bằng mấy?",
    "Số tám là số chẵn hay số lẻ?",
    "Số mười một là số chẵn hay số lẻ?",
    "Đếm các chiếc xe. Có bao nhiêu?",
    "Đếm các chú cún. Có bao nhiêu?",
    "Hãy làm đủ ba ngôi sao",
    "Elsa có chín bông tuyết, Rapunzel tặng thêm tám bông. Có tất cả bao nhiêu?",
    "Mẹ Vy có chín cái kẹo, Gin có tám cái kẹo. Vậy tổng cộng có bao nhiêu cái kẹo?",
    "Chín cộng tám bằng mười bảy. Vậy có mười bảy cái kẹo.",
    "Bố Hà có mười lăm quả táo, Pom ăn bảy quả táo. Vậy còn lại bao nhiêu quả táo?",
    "Mười lăm trừ bảy bằng tám. Vậy còn tám quả táo.",
    "Mẹ Vy có năm cái bánh, Mon có ba cái bánh. Vậy tổng cộng có bao nhiêu cái bánh?",
    "Năm cộng ba bằng tám. Vậy có tám cái bánh.",
    "Gin có sáu quả bóng bay, ông có sáu quả bóng bay. Vậy tổng cộng có bao nhiêu quả bóng bay?",
    "Sáu cộng sáu bằng mười hai. Vậy có mười hai quả bóng bay.",
    "Gin có những cái kẹo này. Vậy có bao nhiêu cái kẹo?",
    "Có năm cái kẹo.",
    "Mon có những quả bóng bay này. Vậy có bao nhiêu quả bóng bay?",
    "Có bốn quả bóng bay.",
    "Quả bóng bay của Gin đang ở đâu?",
    "Quả bóng bay ở phía trên.",
    "Quả bóng bay của Mon đang ở trên hay ở dưới?",
    "Gin có những chiếc ô tô đồ chơi này. Vậy có bao nhiêu chiếc ô tô đồ chơi?",
    "Có ba chiếc ô tô đồ chơi.",
    "Chiếc ô tô đồ chơi khác với các quả táo.",
    "Nhóm quả táo có năm quả táo, nhiều hơn nhóm cái kẹo.",
    "Chín cộng tám bằng mười bảy.",
    "Pom có mười lăm chiếc xương, ăn bảy chiếc. Còn lại bao nhiêu?",
    "Mười lăm trừ bảy bằng tám.",
    "Mười sáu cộng tám bằng mấy?",
    "Mười sáu cộng tám bằng hai mươi tư.",
    "Đáp án là 24. Mười sáu cộng tám bằng hai mươi tư.",
    "Hai mươi hai trừ năm bằng mấy?",
    "Hai mươi hai trừ năm bằng mười bảy.",
    "Đáp án là 17. Hai mươi hai trừ năm bằng mười bảy.",
    "Chín cộng mấy bằng mười bốn?",
    "Chín cộng năm bằng mười bốn.",
    "Phép nào lớn nhất? Mười hai cộng bảy, chín cộng tám, mười một cộng năm, hay mười cộng sáu?",
    "Mười hai cộng bảy bằng mười chín, lớn nhất.",
    "Sáu, mười, mười bốn, mười tám. Số tiếp theo là số nào?",
    "Dãy tăng thêm bốn. Số tiếp theo là hai mươi hai.",
    "Bốn, tám, mười hai, mười lăm. Số nào không cùng nhóm?",
    "Mười lăm không tăng đều thêm bốn.",
    "Số mười tám là số chẵn hay số lẻ?",
    "Mười tám chia hết thành từng cặp, nên là số chẵn.",
    "Số hai mươi mốt là số chẵn hay số lẻ?",
    "Hai mươi mốt còn thừa một, nên là số lẻ.",
    "Ba mươi lăm có mấy chục?",
    "Ba mươi lăm có ba chục.",
    "Mười lăm, hai mươi, hai mươi lăm. Số tiếp theo là số nào?",
    "Đếm cách năm. Số tiếp theo là ba mươi.",
    "Đây là hình chữ nhật.",
    "Hình ngũ giác có năm cạnh.",
    "Hình lục giác có sáu cạnh, nhiều hơn hình tam giác.",
    "Ngôi sao của Elsa đang ở đâu?",
    "Ngôi sao ở phía trên.",
    "tờ a ta",
    "tờ a ta sắc tá",
    "tờ a ta huyền tà",
    "tờ o to",
    "Đếm các siêu anh hùng. Có bao nhiêu?",
    "Có năm siêu anh hùng.",
    "Đếm các tia sét. Có bao nhiêu?",
    "Có bốn tia sét.",
    "Hãy làm đủ bốn ngôi sao",
    "Đủ bốn ngôi sao rồi.",
    "Cần đúng 4. Đủ bốn ngôi sao rồi.",
    "Hình tiếp theo là ngôi sao.",
    "Chiếc xe khác với các siêu anh hùng.",
    "Nhóm nào nhiều hơn?",
    "Nhóm ngôi sao có năm, nhiều hơn nhóm siêu anh hùng.",
    "Tám và năm. Số nào lớn hơn?",
    "Tám lớn hơn năm.",
    "Hai và bảy. Số nào nhỏ hơn?",
    "Hai nhỏ hơn bảy.",
    "Bốn, năm, sáu. Số tiếp theo là số nào?",
    "Số tiếp theo là bảy.",
    "Đó là hình ngôi sao.",
    "Đó là hình vuông.",
    "Siêu anh hùng đang ở trên hay ở dưới?",
    "Siêu anh hùng ở phía trên.",
    "Chạm vào chữ bờ",
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


# Cheerful praise: a little slower, a little higher, one clip per exclamation.
PRAISE = [
    "Yahoooo!",
    "Ui ôi đỉnh thế!",
    "Yahiii giỏi quá!",
    "Woaaa siêu quá!",
    "Tuyệt cú mèo!",
    "Hoan hô bé!",
    "Đỉnh của chóp!",
    "Giỏi xuất sắc luôn!",
    "Hay quá trời!",
    "Úi giỏi quá đi!",
    "Chuẩn luôn!",
    "Xuất sắc!",
    "Ôi đúng rồi!",
    "Quá đỉnh!",
    "Giỏi quá xá!",
    "Bùng nổ luôn!",
    "Ô kê la!",
    "Tuyệt vời ông mặt trời!",
    "Đúng bài quá!",
    "Mê quá đi!",
    "Siêu luôn!",
    "Giỏi dữ vậy!",
    "Trời ơi giỏi!",
    "Đỉnh thật sự!",
    "Hay không chịu được!",
    "A ha đúng rồi!",
    "Quá đã!",
    "Giỏi hết chỗ nói!",
    "Elsa khen Mon giỏi quá!",
    "Pom vẫy đuôi rồi nè!",
    "Mon ơi giỏi quá!",
    "Mon đúng rồi nè!",
    "Mẹ Vy khen Mon giỏi lắm!",
    "Bố Hà vỗ tay cho Mon!",
    "Pom nhảy lên vì Mon!",
    "Mon làm được rồi!",
    "Siêu anh hùng Gin đỉnh quá!",
    "Gin ơi giỏi quá!",
    "Gin đúng rồi!",
    "Mẹ Vy khen Gin giỏi lắm!",
    "Bố Hà cười với Gin!",
    "Ô tô của Gin kêu bíp bíp!",
    "Gin làm được rồi!",
    "Pom vẫy đuôi cho Gin!",
    "Pom chạy vòng quanh!",
]
PRAISE_RATE = "+8%"
PRAISE_PITCH = "+36Hz"


async def synth(text, dest: Path, sem: asyncio.Semaphore, rate=RATE, pitch="+0Hz", force=False):
    if dest.exists() and dest.stat().st_size > 800 and not force:
        return "skip"
    try:
        async with sem:
            comm = edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch)
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
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        corpus = json.loads(Path(args[0]).read_text(encoding="utf-8"))
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
    praise_says = {}
    for phrase in PRAISE:
        key = normalize(phrase)
        if not key:
            continue
        praise_says[key] = phrase
        clips[key] = phrase
    for path in sorted((ROOT / "content" / "daily").glob("*.json")):
        try:
            daily = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        for line in daily.get("praise") or []:
            if re.match(r"(?i)^(bingo|hurrah|awesome|yay|well done|great job|super|fantastic|nice work|you did it)\b", str(line or "").strip()):
                continue
            key = normalize(line)
            if not key:
                continue
            praise_says[key] = line
            clips[key] = line
        for ex in daily.get("exercises") or []:
            for question in ex.get("questions") or []:
                if not isinstance(question, dict) or question.get("lang") == "en":
                    continue
                add(question.get("speak"))
                add(question.get("explain"))
                add(question.get("prompt"))
    for path in sorted((ROOT / "content" / "weekly").glob("*.json")):
        try:
            paper = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        groups = []
        if isinstance(paper.get("mon"), list):
            groups.append(paper["mon"])
        if isinstance(paper.get("gin"), list):
            groups.append(paper["gin"])
        if isinstance(paper.get("questions"), list):
            groups.append(paper["questions"])
        for group in groups:
            for question in group:
                add(question.get("speak"))
                add(question.get("explain"))
                add(question.get("prompt"))
    if len(args) > 1:
        for phrase in json.loads(Path(args[1]).read_text(encoding="utf-8")):
            add(phrase)
    # Dynamic lines are composed from number and phrase clips.
    # Keep every word so an unseen sentence can still be spoken from clips.
    for line in corpus:
        for word in normalize(line).split():
            if word and word not in clips:
                clips[word] = say_for(word, word)
    prev_path = OUT / "manifest.json"
    if prev_path.exists():
        prev = json.loads(prev_path.read_text(encoding="utf-8"))
        for key in (prev.get("clips") or {}):
            clips.setdefault(key, say_for(key, key))

    OUT.mkdir(parents=True, exist_ok=True)
    jobs = []
    manifest = {}
    for key, say in sorted(clips.items()):
        name = fid(key) + ".mp3"
        manifest[key] = "assets/audio/" + name
        jobs.append((say, OUT / name))

    sem = asyncio.Semaphore(8)
    made = 0
    skipped = 0
    failed = 0
    async def run(say, dest):
        nonlocal made, skipped, failed
        styled = say in praise_says.values() or normalize(say) in praise_says
        status = await synth(
            say,
            dest,
            sem,
            rate=PRAISE_RATE if styled else RATE,
            pitch=PRAISE_PITCH if styled else PITCH,
            force=styled or "--force" in sys.argv,
        )
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
    doc = {"voice": VOICE, "rate": RATE, "pitch": PITCH, "praiseRate": PRAISE_RATE, "praisePitch": PRAISE_PITCH, "clips": manifest}
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
