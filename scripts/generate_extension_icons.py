from __future__ import annotations

import argparse
import base64
import re
from collections import deque
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "extension" / "icons"
DEFAULT_MASTER = ICONS_DIR / "icon-master.png"
USERSCRIPT_PATH = ROOT / "chatgpt-latex-copy.user.js"
SIZES = (16, 32, 48, 128)


def remove_connected_dark_background(image: Image.Image) -> Image.Image:
    if image.mode == "RGBA" and image.getchannel("A").getextrema()[0] < 255:
        return image

    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def can_remove(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return max(red, green, blue) <= 96 and max(red, green, blue) - min(red, green, blue) <= 42

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or not can_remove(x, y):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    background = Image.new("L", (width, height), 0)
    background.putdata([255 if value else 0 for value in visited])
    background = background.filter(ImageFilter.GaussianBlur(0.9))
    alpha = background.point(lambda value: 255 - value)

    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def resize_icon(master: Image.Image, size: int) -> Image.Image:
    icon = master.resize((size, size), Image.Resampling.LANCZOS)
    if size <= 32:
        icon = ImageEnhance.Contrast(icon).enhance(1.08)
        icon = ImageEnhance.Color(icon).enhance(1.06)
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.55, percent=115, threshold=2))
    elif size <= 48:
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.65, percent=90, threshold=2))
    return icon


def update_userscript_icon(icon_path: Path) -> None:
    source = USERSCRIPT_PATH.read_text(encoding="utf-8")
    encoded = base64.b64encode(icon_path.read_bytes()).decode("ascii")
    replacement = f'const CONTROL_ICON_DATA_URL = "data:image/png;base64,{encoded}";'
    updated, count = re.subn(
        r'const CONTROL_ICON_DATA_URL = "data:image/png;base64,[^"]*";',
        replacement,
        source,
        count=1,
    )
    if count != 1:
        raise RuntimeError("Userscript icon data URL placeholder is missing or duplicated")
    with USERSCRIPT_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(updated)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate optimized Chrome extension icons.")
    parser.add_argument("--source", type=Path, default=DEFAULT_MASTER)
    parser.add_argument("--master", type=Path, default=DEFAULT_MASTER)
    args = parser.parse_args()

    source = args.source.resolve()
    master_path = args.master.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)

    image = remove_connected_dark_background(Image.open(source))
    master = image.resize((512, 512), Image.Resampling.LANCZOS)
    master_path.parent.mkdir(parents=True, exist_ok=True)
    master.save(master_path, optimize=True)

    for size in SIZES:
        output = ICONS_DIR / f"icon-{size}.png"
        resize_icon(master, size).save(output, optimize=True)
        print(output)

    update_userscript_icon(ICONS_DIR / "icon-48.png")
    print(USERSCRIPT_PATH)


if __name__ == "__main__":
    main()
