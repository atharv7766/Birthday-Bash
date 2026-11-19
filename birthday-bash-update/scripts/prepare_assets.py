#!/usr/bin/env python3
"""
Run ONCE from the repo root:   python3 scripts/prepare_assets.py

What it does
  public/images/person/*   ->  public/photos/her-01.jpg ... her-14.jpg   (clean names, <=1200px, ~150-250 KB each)
  public/images/together/* ->  public/photos/us-01.jpg  ... us-11.jpg    (clean names, <=1100px, ~100-200 KB each)
  public/*.mp3             ->  public/audio/theme.mp3                    (re-encoded to 160 kbps if ffmpeg exists)

Why: the original files have emoji / spaces / brackets in their names (they break as URLs) and
the "together" photos are 1.5-8 MB each, which makes the site very slow on a phone.

Needs:  pip install pillow      (ffmpeg is optional)
Originals are left untouched. Once everything works you can delete them:
        rm -rf public/images public/*.mp3
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT_PHOTOS = PUB / "photos"
OUT_AUDIO = PUB / "audio"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def optimise(src: Path, dst: Path, max_side: int, quality: int) -> None:
    im = ImageOps.exif_transpose(Image.open(src))
    if im.mode in ("RGBA", "LA", "P"):
        rgba = im.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)


def collect(folder: Path, expected: int) -> list[Path]:
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in EXTS)
    if len(files) != expected:
        sys.exit(f"Expected {expected} images in {folder}, found {len(files)}. "
                 "Captions in src/data.ts are matched to the original 14 + 11 photos, so stopping.")
    return files


def main() -> None:
    OUT_PHOTOS.mkdir(parents=True, exist_ok=True)
    OUT_AUDIO.mkdir(parents=True, exist_ok=True)

    for i, src in enumerate(collect(PUB / "images" / "person", 14), 1):
        dst = OUT_PHOTOS / f"her-{i:02d}.jpg"
        optimise(src, dst, 1200, 82)
        print(f"{dst.name:12} <- {src.name}")

    for i, src in enumerate(collect(PUB / "images" / "together", 11), 1):
        dst = OUT_PHOTOS / f"us-{i:02d}.jpg"
        optimise(src, dst, 1100, 80)
        print(f"{dst.name:12} <- {src.name}")

    mp3s = sorted(PUB.glob("*.mp3"))
    target = OUT_AUDIO / "theme.mp3"
    if not mp3s:
        print("No .mp3 found in public/ - skipping audio.")
    elif target.exists():
        print("public/audio/theme.mp3 already exists - skipping audio.")
    elif shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3s[0]), "-vn",
                        "-ac", "2", "-b:a", "160k", str(target)], check=True)
        print(f"theme.mp3 re-encoded at 160 kbps ({target.stat().st_size / 1e6:.1f} MB)")
    else:
        shutil.copy(mp3s[0], target)
        print("ffmpeg not found - copied the song as-is (works, just a bigger download).")

    print("\nDone. Now run: npm install && npm run dev")


if __name__ == "__main__":
    main()
