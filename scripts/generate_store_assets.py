from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "extension" / "icons"
STORE_DIR = ROOT / "chrome-store"


def font(size: int, bold: bool = False, math: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if math:
        candidates.append(Path("C:/Windows/Fonts/cambria.ttc"))
    if bold:
        candidates.extend([
            Path("C:/Windows/Fonts/msyhbd.ttc"),
            Path("C:/Windows/Fonts/segoeuib.ttf"),
        ])
    else:
        candidates.extend([
            Path("C:/Windows/Fonts/msyh.ttc"),
            Path("C:/Windows/Fonts/segoeui.ttf"),
        ])
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def normalize_logo(master: Image.Image, size: int) -> Image.Image:
    master = master.convert("RGBA")
    alpha_box = master.getchannel("A").getbbox()
    if not alpha_box:
        raise ValueError("Logo has no visible pixels")
    cropped = master.crop(alpha_box)
    target_subject = int(size * 0.86)
    scale = min(target_subject / cropped.width, target_subject / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def make_icon(size: int, master: Image.Image | None = None) -> Image.Image:
    if master is not None:
        return normalize_logo(master, size)

    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    radius = int(canvas_size * 0.23)
    for y in range(canvas_size):
        t = y / max(canvas_size - 1, 1)
        color = (int(18 + 8 * t), int(185 - 45 * t), int(129 - 20 * t), 255)
        draw.line((0, y, canvas_size, y), fill=color)
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, canvas_size - 1, canvas_size - 1), radius=radius, fill=255)
    image.putalpha(mask)

    sigma_font = font(int(canvas_size * 0.62), bold=True, math=True)
    sigma = "Σ"
    box = draw.textbbox((0, 0), sigma, font=sigma_font)
    sigma_x = int(canvas_size * 0.42 - (box[2] - box[0]) / 2)
    sigma_y = int(canvas_size * 0.43 - (box[3] - box[1]) / 2 - box[1])
    draw.text((sigma_x, sigma_y), sigma, font=sigma_font, fill="white")

    line_width = max(2, int(canvas_size * 0.045))
    rear = (int(canvas_size * 0.55), int(canvas_size * 0.50), int(canvas_size * 0.78), int(canvas_size * 0.73))
    front = (int(canvas_size * 0.65), int(canvas_size * 0.62), int(canvas_size * 0.88), int(canvas_size * 0.85))
    draw.rounded_rectangle(rear, radius=int(canvas_size * 0.04), outline=(220, 252, 231, 230), width=line_width)
    draw.rounded_rectangle(front, radius=int(canvas_size * 0.04), fill=(6, 78, 59, 255), outline="white", width=line_width)
    return image.resize((size, size), Image.Resampling.LANCZOS)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def rounded_paste(canvas: Image.Image, source: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    width, height = box[2] - box[0], box[3] - box[1]
    fitted = cover(source, (width, height))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=255)
    canvas.paste(fitted, (box[0], box[1]), mask)


def make_store_screenshot(source: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (1280, 800), "#08110f")
    draw = ImageDraw.Draw(canvas)
    draw.text((54, 30), "框选整段，公式自动复制为 LaTeX", font=font(30, bold=True), fill="#f8fafc")
    draw.text((54, 72), "普通文字保持原顺序 · 支持 Ctrl+C 与右键复制", font=font(18), fill="#86efac")
    clean_source = source.crop((0, 0, source.width, int(source.height * 0.78)))
    rounded_paste(canvas, clean_source, (42, 112, 1238, 775), 18)
    draw.rounded_rectangle((42, 112, 1238, 775), radius=18, outline="#34d399", width=2)
    return canvas


def make_promo(
    size: tuple[int, int],
    title_size: int,
    subtitle_size: int,
    logo_master: Image.Image | None = None,
) -> Image.Image:
    width, height = size
    canvas = Image.new("RGB", size, "#07140f")
    draw = ImageDraw.Draw(canvas)
    for x in range(width):
        t = x / max(width - 1, 1)
        draw.line((x, 0, x, height), fill=(5, int(24 + 25 * t), int(18 + 18 * t)))
    icon_size = int(height * 0.52)
    icon = make_icon(icon_size, logo_master)
    canvas.paste(icon, (int(width * 0.08), (height - icon_size) // 2), icon)
    text_x = int(width * 0.42)
    draw.text((text_x, int(height * 0.28)), "ChatGPT 公式复制", font=font(title_size, bold=True), fill="#ffffff")
    draw.text((text_x, int(height * 0.58)), "框选文字 · 自动 LaTeX", font=font(subtitle_size), fill="#86efac")
    return canvas


def make_share(source: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (1200, 675), "#07140f")
    draw = ImageDraw.Draw(canvas)
    draw.text((54, 42), "ChatGPT 公式复制", font=font(42, bold=True), fill="#ffffff")
    draw.text((54, 100), "像复制普通文字一样，自动得到 LaTeX", font=font(25), fill="#86efac")
    clean_source = source.crop((0, 0, source.width, int(source.height * 0.78)))
    rounded_paste(canvas, clean_source, (54, 160, 1146, 635), 20)
    draw.rounded_rectangle((54, 160, 1146, 635), radius=20, outline="#34d399", width=2)
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--screenshot", type=Path, required=True)
    parser.add_argument("--logo", type=Path)
    args = parser.parse_args()

    if not args.screenshot.exists():
        raise FileNotFoundError(args.screenshot)
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    logo_master = Image.open(args.logo) if args.logo else None

    for size in (16, 32, 48, 128):
        make_icon(size, logo_master).save(ICON_DIR / f"icon-{size}.png", optimize=True)

    source = Image.open(args.screenshot)
    make_store_screenshot(source).save(STORE_DIR / "screenshot-1-1280x800.png", optimize=True)
    make_promo((440, 280), 27, 17, logo_master).save(STORE_DIR / "promo-small-440x280.png", optimize=True)
    make_promo((1400, 560), 64, 34, logo_master).save(STORE_DIR / "promo-marquee-1400x560.png", optimize=True)
    make_share(source).save(STORE_DIR / "share-zhihu-groups-1200x675.png", optimize=True)

    print(f"Generated assets in {STORE_DIR}")


if __name__ == "__main__":
    main()
