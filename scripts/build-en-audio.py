#!/usr/bin/env python3
"""Record English prompts with en-US-AnaNeural.

  python3 scripts/build-en-audio.py /tmp/en-lines.json
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
OUT = ROOT / "assets" / "audio" / "en"
VOICE = "en-US-AnaNeural"
RATE = "-5%"


def normalize(text):
    s = str(text or "")
    s = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\U0001F1E6-\U0001F1FF\uFE0F\u200D]", " ", s)
    s = re.sub(r"[?？!！.,;:\"'“”‘’()\[\]{}]", " ", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def fid(key):
    return hashlib.sha1(("en:" + key).encode("utf-8")).hexdigest()[:12]


def trim(path: Path):
    tmp = path.with_suffix(".trim.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(path), "-af",
         "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-38dB:detection=peak,areverse,"
         "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-38dB:detection=peak,areverse",
         "-ar", "24000", "-ac", "1", "-b:a", "48k", str(tmp)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
    )
    dur = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(tmp)],
        text=True,
    ).strip()
    try:
        if float(dur) < 0.2:
            tmp.unlink(missing_ok=True)
            return
    except ValueError:
        pass
    tmp.replace(path)


async def synth(text, dest, sem):
    if dest.exists() and dest.stat().st_size > 800:
        return "skip"
    try:
        async with sem:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(dest))
        trim(dest)
        return "ok"
    except Exception as exc:
        print("FAIL", text, exc, flush=True)
        dest.unlink(missing_ok=True)
        return "fail"


async def main():
    lines = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    clips = {}
    manifest_path = OUT / "manifest.json"
    if manifest_path.exists():
        prev = json.loads(manifest_path.read_text(encoding="utf-8"))
        for key, rel in (prev.get("clips") or {}).items():
            clips[key] = key
            # Keep the previous spoken line only as a fallback; new lines overwrite.
            clips[key] = key
    for line in lines:
        key = normalize(line)
        if key:
            clips[key] = line.strip()
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = []
    manifest = {}
    for key, say in sorted(clips.items()):
        name = fid(key) + ".mp3"
        manifest[key] = "assets/audio/en/" + name
        jobs.append((say, OUT / name))
    sem = asyncio.Semaphore(6)
    counts = {"ok": 0, "skip": 0, "fail": 0}

    async def run(say, dest):
        status = await synth(say, dest, sem)
        counts[status] = counts.get(status, 0) + 1

    print("jobs", len(jobs), flush=True)
    await asyncio.gather(*(run(s, d) for s, d in jobs))
    manifest = {k: v for k, v in manifest.items() if (OUT / Path(v).name).exists()}
    (OUT / "manifest.json").write_text(
        json.dumps({"voice": VOICE, "rate": RATE, "clips": manifest}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("clips", len(manifest), counts, flush=True)


if __name__ == "__main__":
    asyncio.run(main())
