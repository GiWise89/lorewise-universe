from __future__ import annotations

import argparse
import math
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


WIDTH, HEIGHT = 1080, 1920
FPS = 30
SCENE_SECONDS = 3.0
SCENE_COUNT = 6
DURATION = SCENE_SECONDS * SCENE_COUNT

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
ICONS = BRAND / "icons"

DISPLAY_FONT = Path(r"C:\Windows\Fonts\georgiab.ttf")
BODY_FONT = Path(r"C:\Windows\Fonts\arial.ttf")
BODY_BOLD_FONT = Path(r"C:\Windows\Fonts\arialbd.ttf")

IVORY = (255, 250, 232, 255)
GOLD = (255, 205, 79, 255)
PINK = (255, 75, 196, 255)
CYAN = (83, 230, 255, 255)
INK = (15, 12, 49, 230)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    ratio = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def fit_rgba(image: Image.Image, max_w: int, max_h: int) -> Image.Image:
    image = image.convert("RGBA")
    ratio = min(max_w / image.width, max_h / image.height)
    return image.resize((max(1, round(image.width * ratio)), max(1, round(image.height * ratio))), Image.Resampling.LANCZOS)


def center_x(image: Image.Image) -> int:
    return (WIDTH - image.width) // 2


def add_icon(canvas: Image.Image, icon: Image.Image, xy: tuple[int, int], glow=(255, 94, 210, 150), glow_radius=34) -> None:
    x, y = xy
    if glow_radius > 0:
        alpha = icon.getchannel("A")
        glow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        blurred = alpha.filter(ImageFilter.GaussianBlur(glow_radius))
        outer_glow = ImageChops.subtract(blurred, alpha)
        outer_glow = outer_glow.point(lambda value: min(255, value * 3))
        glow_shape = Image.new("RGBA", icon.size, glow)
        glow_shape.putalpha(outer_glow)
        glow_layer.alpha_composite(glow_shape, (x, y))
        canvas.alpha_composite(glow_layer)
    canvas.alpha_composite(icon, (x, y))


def text_width(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=text_font, stroke_width=0)
    return box[2] - box[0]


def draw_centered(
    canvas: Image.Image,
    text: str,
    y: int,
    text_font: ImageFont.FreeTypeFont,
    fill=IVORY,
    stroke=5,
    spacing=8,
) -> int:
    draw = ImageDraw.Draw(canvas)
    box = draw.multiline_textbbox((0, 0), text, font=text_font, align="center", spacing=spacing, stroke_width=stroke)
    w = box[2] - box[0]
    h = box[3] - box[1]
    draw.multiline_text(
        ((WIDTH - w) / 2, y),
        text,
        font=text_font,
        fill=fill,
        align="center",
        spacing=spacing,
        stroke_width=stroke,
        stroke_fill=(18, 9, 48, 230),
    )
    return y + h


def draw_pill(canvas: Image.Image, text: str, y: int, text_font: ImageFont.FreeTypeFont, accent=PINK) -> None:
    draw = ImageDraw.Draw(canvas)
    w = text_width(draw, text, text_font) + 68
    x = (WIDTH - w) // 2
    draw.rounded_rectangle((x, y, x + w, y + 62), radius=31, fill=(27, 13, 64, 220), outline=accent, width=2)
    draw.text((WIDTH / 2, y + 31), text, font=text_font, fill=IVORY, anchor="mm")


def add_readability(canvas: Image.Image, strength: int = 120) -> None:
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    pixels = overlay.load()
    for y in range(HEIGHT):
        top = max(0.0, 1.0 - y / 700)
        bottom = max(0.0, (y - 1200) / 720)
        alpha = int(strength * max(top, bottom))
        for x in range(WIDTH):
            pixels[x, y] = (10, 6, 40, alpha)
    canvas.alpha_composite(overlay)


def base_scene(background: Image.Image, tint=(0, 0, 0, 0)) -> Image.Image:
    canvas = background.copy().convert("RGBA")
    if tint[3]:
        layer = Image.new("RGBA", canvas.size, tint)
        canvas = Image.alpha_composite(canvas, layer)
    add_readability(canvas)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((34, 34, WIDTH - 34, HEIGHT - 34), radius=34, outline=(255, 213, 102, 150), width=3)
    draw.rounded_rectangle((48, 48, WIDTH - 48, HEIGHT - 48), radius=30, outline=(255, 255, 255, 50), width=1)
    return canvas


def label_under(canvas: Image.Image, text: str, cx: int, y: int, accent) -> None:
    draw = ImageDraw.Draw(canvas)
    f = font(BODY_BOLD_FONT, 32)
    w = text_width(draw, text, f) + 44
    draw.rounded_rectangle((cx - w // 2, y, cx + w // 2, y + 58), radius=29, fill=(19, 10, 51, 225), outline=accent, width=2)
    draw.text((cx, y + 29), text, font=f, fill=IVORY, anchor="mm")


def load_assets() -> dict[str, Image.Image]:
    paths = {
        "logo": BRAND / "lorewise-universe-logo-concept-c.png",
        "arte": ICONS / "arte-concept-v1.webp",
        "commissioni": ICONS / "commissioni-concept-v1.webp",
        "giochi": ICONS / "giochi-concept-v1.webp",
        "mondi": ICONS / "dove-nascono-i-mondi-concept-v1.webp",
        "codex": ICONS / "enciclopedia-concept-v1.webp",
        "vip": ICONS / "lorewise-vip-official-v1.webp",
        "shop": ICONS / "shop-concept-v1.webp",
        "social": ICONS / "social-assistenza-concept-v1.webp",
    }
    cleaned: dict[str, Image.Image] = {}
    for name, path in paths.items():
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A").point(lambda value: 0 if value < 48 else value)
        image.putalpha(alpha)
        cleaned[name] = image
    return cleaned


def scene_intro(background: Image.Image, assets: dict[str, Image.Image]) -> Image.Image:
    canvas = base_scene(background, (34, 7, 68, 55))
    logo = fit_rgba(assets["logo"], 860, 650)
    add_icon(canvas, logo, (center_x(logo), 170), glow=(255, 176, 55, 160), glow_radius=55)
    draw_pill(canvas, "GIWISE STUDIO PRESENTA", 775, font(BODY_BOLD_FONT, 27), GOLD)
    draw_centered(canvas, "NON È SOLTANTO\nUN SITO.", 900, font(DISPLAY_FONT, 69), fill=IVORY, stroke=6)
    draw_centered(canvas, "È UN INTERO UNIVERSO.", 1130, font(DISPLAY_FONT, 55), fill=GOLD, stroke=5)
    draw_centered(canvas, "Arte, giochi, personaggi e mondi\ncollegati in un unico progetto.", 1325, font(BODY_FONT, 37), stroke=3, spacing=12)
    draw_pill(canvas, "SCORRI OLTRE IL PORTALE", 1605, font(BODY_BOLD_FONT, 29), CYAN)
    return canvas


def scene_pair(background: Image.Image, assets: dict[str, Image.Image], title: str, subtitle: str, left_key: str, left_label: str, right_key: str, right_label: str, accent_left=PINK, accent_right=CYAN) -> Image.Image:
    canvas = base_scene(background, (15, 8, 55, 75))
    draw_centered(canvas, title, 125, font(DISPLAY_FONT, 62), fill=GOLD, stroke=5)
    draw_centered(canvas, subtitle, 265, font(BODY_FONT, 34), stroke=3)
    left = fit_rgba(assets[left_key], 455, 545)
    right = fit_rgba(assets[right_key], 455, 545)
    add_icon(canvas, left, (65 + (455 - left.width) // 2, 500 + (545 - left.height) // 2), glow_radius=0)
    add_icon(canvas, right, (560 + (455 - right.width) // 2, 500 + (545 - right.height) // 2), glow_radius=0)
    label_under(canvas, left_label, 292, 1075, accent_left[:3] + (255,))
    label_under(canvas, right_label, 788, 1075, accent_right[:3] + (255,))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((105, 1245, WIDTH - 105, 1545), radius=44, fill=INK, outline=(255, 216, 111, 170), width=3)
    draw_centered(canvas, "OGNI PORTA È DIVERSA.\nTUTTE FANNO PARTE\nDELLO STESSO UNIVERSO.", 1310, font(DISPLAY_FONT, 43), fill=IVORY, stroke=3, spacing=11)
    draw_pill(canvas, "LOREWISENEXUS.IT", 1660, font(BODY_BOLD_FONT, 32), GOLD)
    return canvas


def scene_codex(background: Image.Image, assets: dict[str, Image.Image]) -> Image.Image:
    canvas = base_scene(background, (22, 8, 65, 70))
    draw_centered(canvas, "PERSONAGGI, CODEX\nE CONTENUTI ESCLUSIVI", 110, font(DISPLAY_FONT, 54), fill=GOLD, stroke=5)
    codex = fit_rgba(assets["codex"], 610, 600)
    add_icon(canvas, codex, (center_x(codex), 390), glow_radius=0)
    vip = fit_rgba(assets["vip"], 300, 300)
    shop = fit_rgba(assets["shop"], 300, 300)
    add_icon(canvas, vip, (105, 1040), glow_radius=0)
    add_icon(canvas, shop, (675, 1040), glow_radius=0)
    label_under(canvas, "LOREWISE VIP", 255, 1340, (190, 80, 255, 255))
    label_under(canvas, "GIWISE SHOP", 825, 1340, (255, 90, 190, 255))
    draw_centered(canvas, "Scopri le storie. Segui la crescita.\nSostieni ciò che ami.", 1495, font(BODY_FONT, 38), stroke=3, spacing=12)
    return canvas


def scene_orbit(background: Image.Image, assets: dict[str, Image.Image]) -> Image.Image:
    canvas = base_scene(background, (28, 5, 64, 70))
    draw_centered(canvas, "SCEGLI IL TUO INGRESSO", 125, font(DISPLAY_FONT, 61), fill=GOLD, stroke=5)
    logo = fit_rgba(assets["logo"], 480, 350)
    add_icon(canvas, logo, (center_x(logo), 715), glow=(255, 184, 66, 170), glow_radius=50)
    names = ["arte", "commissioni", "giochi", "mondi", "codex", "vip", "shop", "social"]
    positions = [(85, 360), (390, 300), (695, 360), (735, 755), (695, 1160), (390, 1250), (85, 1160), (40, 755)]
    colors = [(255, 70, 194), (255, 166, 55), (73, 220, 255), (130, 110, 255), (74, 235, 255), (190, 80, 255), (255, 88, 184), (255, 205, 79)]
    for name, pos, color in zip(names, positions, colors):
        icon = fit_rgba(assets[name], 260, 260)
        x = pos[0] + (260 - icon.width) // 2
        y = pos[1] + (260 - icon.height) // 2
        add_icon(canvas, icon, (x, y), glow_radius=0)
    draw_centered(canvas, "ARTE • GIOCHI • MONDI • CODEX", 1570, font(BODY_BOLD_FONT, 34), stroke=3)
    draw_pill(canvas, "DA QUALE PORTA COMINCI?", 1665, font(BODY_BOLD_FONT, 31), PINK)
    return canvas


def scene_cta(background: Image.Image, assets: dict[str, Image.Image]) -> Image.Image:
    canvas = base_scene(background, (24, 4, 58, 72))
    logo = fit_rgba(assets["logo"], 825, 610)
    add_icon(canvas, logo, (center_x(logo), 210), glow=(255, 176, 55, 180), glow_radius=60)
    draw_centered(canvas, "ENTRA NEL\nLOREWISE UNIVERSE", 865, font(DISPLAY_FONT, 68), fill=GOLD, stroke=6, spacing=7)
    draw_centered(canvas, "Tre giochi. Un Codex in crescita.\nArte originale. Infinite storie.", 1130, font(BODY_FONT, 39), stroke=3, spacing=12)
    draw_pill(canvas, "SCOPRI IL PROGETTO", 1405, font(BODY_BOLD_FONT, 32), CYAN)
    draw_centered(canvas, "LOREWISENEXUS.IT", 1530, font(DISPLAY_FONT, 54), fill=IVORY, stroke=5)
    draw_centered(canvas, "IL TUO INGRESSO TI ASPETTA", 1705, font(BODY_BOLD_FONT, 27), fill=(255, 220, 123, 255), stroke=3)
    return canvas


def make_audio(path: Path) -> None:
    rate = 44100
    frames = int(DURATION * rate)
    chord = (130.81, 164.81, 196.00, 261.63)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        payload = bytearray()
        for i in range(frames):
            t = i / rate
            fade_in = min(1.0, t / 1.5)
            fade_out = min(1.0, (DURATION - t) / 1.8)
            envelope = max(0.0, fade_in * fade_out)
            pad = sum(math.sin(2 * math.pi * f * t + idx * 0.7) for idx, f in enumerate(chord)) / len(chord)
            shimmer = math.sin(2 * math.pi * (523.25 + 20 * math.sin(t * 0.35)) * t) * 0.08
            bell = 0.0
            for start in (0.0, 3.0, 6.0, 9.0, 12.0, 15.0):
                dt = t - start
                if 0 <= dt < 1.6:
                    bell += math.sin(2 * math.pi * 783.99 * dt) * math.exp(-2.8 * dt) * 0.22
            sample = max(-1.0, min(1.0, envelope * (pad * 0.22 + shimmer + bell)))
            left = int(sample * 32767)
            right = int(sample * 0.94 * 32767)
            payload += left.to_bytes(2, "little", signed=True)
            payload += right.to_bytes(2, "little", signed=True)
        wav.writeframes(payload)


def animate_scene(scene: Image.Image, progress: float) -> Image.Image:
    scale = 1.0 + 0.018 * progress
    enlarged = scene.resize((round(WIDTH * scale), round(HEIGHT * scale)), Image.Resampling.LANCZOS)
    x = (enlarged.width - WIDTH) // 2
    y = (enlarged.height - HEIGHT) // 2
    return enlarged.crop((x, y, x + WIDTH, y + HEIGHT))


def build_video(scenes: list[Image.Image], audio_path: Path, output_path: Path, ffmpeg_path: Path) -> None:
    command = [
        str(ffmpeg_path), "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
        "-i", str(audio_path),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(output_path),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    total_frames = round(DURATION * FPS)
    transition = 0.55
    for frame_index in range(total_frames):
        t = frame_index / FPS
        scene_index = min(SCENE_COUNT - 1, int(t // SCENE_SECONDS))
        local_t = t - scene_index * SCENE_SECONDS
        progress = local_t / SCENE_SECONDS
        frame = animate_scene(scenes[scene_index], progress)
        if scene_index < SCENE_COUNT - 1 and local_t > SCENE_SECONDS - transition:
            blend_amount = (local_t - (SCENE_SECONDS - transition)) / transition
            next_frame = animate_scene(scenes[scene_index + 1], max(0.0, blend_amount * 0.15))
            frame = Image.blend(frame, next_frame, blend_amount)
        process.stdin.write(frame.convert("RGB").tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg non ha completato il Reel")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--background", type=Path, required=True)
    parser.add_argument("--ffmpeg", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    background = cover(Image.open(args.background).convert("RGB"), (WIDTH, HEIGHT))
    assets = load_assets()
    scenes = [
        scene_intro(background, assets),
        scene_pair(background, assets, "ARTE CHE PRENDE VITA", "Opere originali e commissioni create su misura.", "arte", "ARTE IN VETRINA", "commissioni", "COMMISSIONI"),
        scene_pair(background, assets, "GIOCHI E MONDI\nDA SCOPRIRE", "Esperienze GiWise e universi ancora in costruzione.", "giochi", "GIOCHI E APP", "mondi", "DOVE NASCONO I MONDI", CYAN, PINK),
        scene_codex(background, assets),
        scene_orbit(background, assets),
        scene_cta(background, assets),
    ]

    for index, scene in enumerate(scenes, 1):
        scene.convert("RGB").save(args.output_dir / f"scena-{index:02d}.jpg", quality=94, subsampling=0)
    preview = Image.new("RGB", (540, 960 * SCENE_COUNT), "black")
    for index, scene in enumerate(scenes):
        preview.paste(scene.convert("RGB").resize((540, 960), Image.Resampling.LANCZOS), (0, index * 960))
    preview.save(args.output_dir / "storyboard-lorewise-reel.jpg", quality=92)

    audio_path = args.output_dir / "lorewise-original-ambient.wav"
    make_audio(audio_path)
    build_video(scenes, audio_path, args.output_dir / "lorewise-scegli-il-tuo-ingresso-v1.mp4", args.ffmpeg)


if __name__ == "__main__":
    main()
