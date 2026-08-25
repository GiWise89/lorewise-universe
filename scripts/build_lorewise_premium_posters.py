from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


W, H = 1080, 1920
ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
ICONS = BRAND / "icons"

SERIF = Path(r"C:\Windows\Fonts\georgiab.ttf")
SANS = Path(r"C:\Windows\Fonts\arial.ttf")
SANS_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

IVORY = (255, 249, 230, 255)
GOLD = (255, 207, 93, 255)
INK = (18, 8, 42, 238)


def f(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def cover(image: Image.Image) -> Image.Image:
    ratio = max(W / image.width, H / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    x = (resized.width - W) // 2
    y = (resized.height - H) // 2
    return resized.crop((x, y, x + W, y + H)).convert("RGBA")


def clean_asset(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 0 if value < 48 else value)
    image.putalpha(alpha)
    return image


def fit(image: Image.Image, max_w: int, max_h: int) -> Image.Image:
    ratio = min(max_w / image.width, max_h / image.height)
    return image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)


def centered_text(canvas: Image.Image, text: str, y: int, font: ImageFont.FreeTypeFont, fill=IVORY, stroke=4, spacing=8) -> int:
    draw = ImageDraw.Draw(canvas)
    box = draw.multiline_textbbox((0, 0), text, font=font, align="center", spacing=spacing, stroke_width=stroke)
    width = box[2] - box[0]
    height = box[3] - box[1]
    draw.multiline_text(
        ((W - width) / 2, y), text, font=font, fill=fill, align="center", spacing=spacing,
        stroke_width=stroke, stroke_fill=(11, 4, 30, 245),
    )
    return y + height


def base(master: Image.Image, accent: tuple[int, int, int]) -> Image.Image:
    canvas = master.copy()
    shade = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shade)
    for y in range(H):
        top = max(0.0, 1 - y / 560)
        bottom = max(0.0, (y - 1120) / 800)
        alpha = int(120 * max(top, bottom))
        draw.line((0, y, W, y), fill=(8, 3, 26, alpha))
    canvas = Image.alpha_composite(canvas, shade)
    line = ImageDraw.Draw(canvas)
    line.rounded_rectangle((42, 42, W - 42, H - 42), radius=34, outline=(*accent, 170), width=3)
    line.rounded_rectangle((56, 56, W - 56, H - 56), radius=30, outline=(255, 241, 196, 55), width=1)
    return canvas


def place_hero(canvas: Image.Image, image: Image.Image, y: int, max_w: int, max_h: int) -> None:
    hero = fit(image, max_w, max_h)
    x = (W - hero.width) // 2
    shadow_alpha = hero.getchannel("A").filter(ImageFilter.GaussianBlur(22)).point(lambda value: int(value * 0.42))
    shadow = Image.new("RGBA", hero.size, (0, 0, 0, 0))
    shadow.putalpha(shadow_alpha)
    canvas.alpha_composite(shadow, (x + 8, y + 24))
    canvas.alpha_composite(hero, (x, y))


def footer_panel(canvas: Image.Image, description: str, bullets: str, accent: tuple[int, int, int]) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((105, 1310, W - 105, 1695), radius=48, fill=INK, outline=(*accent, 210), width=3)
    centered_text(canvas, description, 1370, f(SANS, 37), fill=IVORY, stroke=2, spacing=12)
    draw.line((190, 1548, W - 190, 1548), fill=(*accent, 170), width=2)
    centered_text(canvas, bullets, 1590, f(SANS_BOLD, 29), fill=(*accent, 255), stroke=2, spacing=7)
    centered_text(canvas, "LOREWISENEXUS.IT", 1780, f(SANS_BOLD, 31), fill=IVORY, stroke=3)


def poster(master: Image.Image, asset: Image.Image, eyebrow: str, title: str, subtitle: str, description: str, bullets: str, accent: tuple[int, int, int], hero_y=530, hero_w=680, hero_h=690) -> Image.Image:
    canvas = base(master, accent)
    centered_text(canvas, eyebrow, 95, f(SANS_BOLD, 24), fill=(*accent, 255), stroke=2)
    centered_text(canvas, title, 180, f(SERIF, 62), fill=GOLD, stroke=5, spacing=4)
    centered_text(canvas, subtitle, 365, f(SANS, 32), fill=IVORY, stroke=3, spacing=8)
    place_hero(canvas, asset, hero_y, hero_w, hero_h)
    footer_panel(canvas, description, bullets, accent)
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--background", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    master = cover(Image.open(args.background))
    logo = clean_asset(BRAND / "lorewise-universe-logo-concept-c.png")
    arte = clean_asset(ICONS / "arte-concept-v1.webp")
    giochi = clean_asset(ICONS / "giochi-concept-v1.webp")
    mondi = clean_asset(ICONS / "dove-nascono-i-mondi-concept-v1.webp")
    codex = clean_asset(ICONS / "enciclopedia-concept-v1.webp")

    posters = [
        poster(
            master, logo, "GIWISE STUDIO PRESENTA", "UN UNIVERSO.\nMOLTE PORTE.",
            "Un progetto creativo in continua espansione.",
            "Arte originale, videogiochi, personaggi,\nmondi, commissioni e contenuti riservati.",
            "ARTE  •  GIOCHI  •  CODEX  •  VIP  •  SHOP", (255, 199, 73), hero_y=500, hero_w=760, hero_h=610,
        ),
        poster(
            master, arte, "ARTE IN VETRINA • COMMISSIONI", "ARTE CHE\nDIVENTA TUA",
            "Opere da scoprire. Idee da trasformare.",
            "Esplora opere originali protette e richiedi\nun ritratto o una scena narrativa su misura.",
            "SCOPRI  •  IMMAGINA  •  CREA", (255, 77, 194), hero_y=505, hero_w=660, hero_h=700,
        ),
        poster(
            master, giochi, "GIOCHI E APP", "GIOCHI CHE\nNASCONO QUI",
            "Tre progetti GiWise. Un’unica visione.",
            "Segui lo sviluppo, scopri le anteprime\ne attraversa mondi pensati per essere giocati.",
            "GIOCA  •  SEGUI  •  PARTECIPA", (69, 221, 255), hero_y=545, hero_w=730, hero_h=610,
        ),
        poster(
            master, mondi, "DIETRO LE QUINTE", "DOVE NASCONO\nI MONDI",
            "Prima della storia esiste una scintilla.",
            "Bozze, idee, personaggi e processi creativi:\ndal primo segno a un universo completo.",
            "IMMAGINA  •  COSTRUISCI  •  RACCONTA", (255, 112, 189), hero_y=505, hero_w=670, hero_h=690,
        ),
        poster(
            master, codex, "ENCICLOPEDIA LOREWISE", "IL CODEX\nÈ VIVO",
            "Ogni personaggio lascia una traccia.",
            "Personaggi, opere e universi collegati\nin un archivio che continua a crescere.",
            "SCOPRI  •  COLLEGA  •  APPROFONDISCI", (81, 225, 255), hero_y=520, hero_w=700, hero_h=650,
        ),
        poster(
            master, logo, "LOREWISE UNIVERSE", "SCEGLI IL TUO\nINGRESSO",
            "Ogni porta conduce allo stesso Universo.",
            "Scopri il progetto, scegli ciò che ami\ne segui la crescita del Nexus.",
            "ENTRA ORA  →  LOREWISENEXUS.IT", (255, 202, 78), hero_y=515, hero_w=760, hero_h=600,
        ),
    ]

    for index, image in enumerate(posters, 1):
        image.convert("RGB").save(args.output_dir / f"locandina-premium-{index:02d}.jpg", quality=95, subsampling=0)

    sheet = Image.new("RGB", (1080, 1280), (10, 4, 26))
    for index, image in enumerate(posters):
        thumb = image.convert("RGB").resize((360, 640), Image.Resampling.LANCZOS)
        sheet.paste(thumb, ((index % 3) * 360, (index // 3) * 640))
    sheet.save(args.output_dir / "anteprima-campagna-premium.jpg", quality=94, subsampling=0)


if __name__ == "__main__":
    main()
