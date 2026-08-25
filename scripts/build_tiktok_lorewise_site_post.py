from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "social-assets" / "tiktok" / "lorewise-site-post-v1"
OUT.mkdir(parents=True, exist_ok=True)

BACKGROUND = Path(r"C:\Users\Luigi\.codex\generated_images\01a028a7-bc3c-7c82-9e6b-55cf4523f70e\exec-9cfec728-cf74-4e43-81fc-5888a4d4ce7f.png")
BRAND = ROOT / "public" / "brand"
ICONS = BRAND / "icons"

W, H = 1080, 1920
NAVY = "#15164b"
DEEP = "#242066"
GOLD = "#d89b24"
CREAM = "#fff9ed"
PURPLE = "#7036d8"
PINK = "#d52a98"


def font(name: str, size: int):
    return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)


F_SMALL = font("arialbd.ttf", 29)
F_LABEL = font("arialbd.ttf", 31)
F_BODY = font("arial.ttf", 34)
F_BODY_BOLD = font("arialbd.ttf", 36)
F_TITLE = font("georgiab.ttf", 79)
F_TITLE_SMALL = font("georgiab.ttf", 62)
F_URL = font("arialbd.ttf", 45)


def fit_cover(path: Path):
    im = Image.open(path).convert("RGB")
    ratio = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
    left = (im.width - W) // 2
    top = (im.height - H) // 2
    return im.crop((left, top, left + W, top + H)).convert("RGBA")


def base():
    canvas = fit_cover(BACKGROUND)
    wash = Image.new("RGBA", (W, H), (255, 255, 255, 18))
    return Image.alpha_composite(canvas, wash)


def panel(canvas, box, fill=(255, 255, 255, 202), outline=(218, 155, 36, 145), radius=42):
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x1, y1, x2, y2 = box
    sd.rounded_rectangle((x1 + 10, y1 + 16, x2 + 10, y2 + 16), radius=radius, fill=(43, 26, 96, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(shadow)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=3)


def center_text(draw, xy, text, fnt, fill=NAVY, max_width=930, spacing=8, stroke=0):
    y = xy[1]
    lines = text.split("\n")
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt, stroke_width=stroke)
        width = bbox[2] - bbox[0]
        draw.text(((W - width) / 2, y), line, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=CREAM)
        y += bbox[3] - bbox[1] + spacing
    return y


def paste_contain(canvas, path, box, opacity=255):
    im = Image.open(path).convert("RGBA")
    x1, y1, x2, y2 = box
    im.thumbnail((x2 - x1, y2 - y1), Image.Resampling.LANCZOS)
    if opacity != 255:
        alpha = im.getchannel("A").point(lambda p: p * opacity // 255)
        im.putalpha(alpha)
    x = x1 + (x2 - x1 - im.width) // 2
    y = y1 + (y2 - y1 - im.height) // 2
    canvas.alpha_composite(im, (x, y))


def top_kicker(draw, text):
    bbox = draw.textbbox((0, 0), text, font=F_SMALL)
    width = bbox[2] - bbox[0]
    x1 = (W - width) / 2 - 34
    x2 = (W + width) / 2 + 34
    draw.rounded_rectangle((x1, 86, x2, 142), radius=28, fill=(255, 250, 238, 225), outline=(216, 155, 36, 160), width=2)
    draw.text(((W - width) / 2, 98), text, font=F_SMALL, fill=PURPLE)


def save(canvas, name):
    canvas.convert("RGB").save(OUT / name, quality=96)


# Slide 1
c = base()
d = ImageDraw.Draw(c)
top_kicker(d, "LOREWISE UNIVERSE · GIWISE STUDIO")
center_text(d, (W / 2, 194), "PIÙ DI UN SITO", F_TITLE_SMALL, DEEP)
center_text(d, (W / 2, 281), "UN UNIVERSO\nIN CRESCITA", F_TITLE, NAVY, spacing=0)
panel(c, (110, 555, 970, 1380), fill=(255, 255, 255, 188))
paste_contain(c, BRAND / "lorewise-universe-logo-concept-c.png", (190, 625, 890, 1230))
center_text(d, (W / 2, 1435), "ARTE · GIOCHI · MONDI · CREAZIONE", F_BODY_BOLD, PURPLE)
center_text(d, (W / 2, 1508), "Un progetto di GiWise Studio dove ogni idea\npuò diventare opera, storia o esperienza.", F_BODY, NAVY, spacing=12)
save(c, "01-piu-di-un-sito.png")


# Slide 2
c = base()
d = ImageDraw.Draw(c)
top_kicker(d, "ESPLORA L’UNIVERSO")
center_text(d, (W / 2, 188), "SCEGLI IL TUO\nINGRESSO", F_TITLE_SMALL, NAVY, spacing=0)
entries = [
    ("arte-concept-v1.webp", "ARTE"),
    ("lorewise-vip-official-v1.webp", "VIP"),
    ("commissioni-concept-v1.webp", "COMMISSIONI"),
    ("giochi-concept-v1.webp", "GIOCHI"),
    ("shop-concept-v1.webp", "SHOP"),
    ("social-assistenza-concept-v1.webp", "ASSISTENZA"),
    ("dove-nascono-i-mondi-concept-v1.webp", "DIETRO LE QUINTE"),
    ("enciclopedia-concept-v1.webp", "ENCICLOPEDIA"),
]
start_y = 405
cell_w, cell_h = 420, 280
for idx, (filename, label) in enumerate(entries):
    col, row = idx % 2, idx // 2
    x1 = 95 + col * 470
    y1 = start_y + row * 300
    panel(c, (x1, y1, x1 + cell_w, y1 + cell_h), fill=(255, 255, 255, 194), radius=34)
    paste_contain(c, ICONS / filename, (x1 + 82, y1 + 12, x1 + cell_w - 82, y1 + 205))
    bbox = d.textbbox((0, 0), label, font=F_LABEL)
    d.text((x1 + (cell_w - (bbox[2] - bbox[0])) / 2, y1 + 220), label, font=F_LABEL, fill=DEEP)
center_text(d, (W / 2, 1645), "OGNI PORTA RACCONTA UNA PARTE DEL PROGETTO", F_SMALL, PURPLE)
save(c, "02-scegli-il-tuo-ingresso.png")


# Slide 3
c = base()
d = ImageDraw.Draw(c)
top_kicker(d, "DOVE NASCONO I MONDI")
center_text(d, (W / 2, 190), "DALLE IDEE\nALL’UNIVERSO", F_TITLE_SMALL, NAVY, spacing=0)
panel(c, (90, 430, 990, 1390), fill=(255, 255, 255, 184))
paste_contain(c, ICONS / "dove-nascono-i-mondi-concept-v1.webp", (210, 485, 870, 1130))
center_text(d, (W / 2, 1180), "BOZZE · SVILUPPO · RACCONTI", F_BODY_BOLD, PURPLE)
center_text(d, (W / 2, 1240), "Opere originali, videogiochi e personaggi\nprendono forma davanti a chi li segue.", F_BODY, NAVY, spacing=12)
paste_contain(c, ICONS / "arte-concept-v1.webp", (100, 1460, 330, 1710))
paste_contain(c, ICONS / "giochi-concept-v1.webp", (425, 1460, 655, 1710))
paste_contain(c, ICONS / "enciclopedia-concept-v1.webp", (750, 1460, 980, 1710))
save(c, "03-dalle-idee-all-universo.png")


# Slide 4
c = base()
d = ImageDraw.Draw(c)
top_kicker(d, "IL PROSSIMO MONDO È GIÀ IN APERTURA")
center_text(d, (W / 2, 196), "ENTRA NEL\nLOREWISE UNIVERSE", F_TITLE_SMALL, NAVY, spacing=0)
paste_contain(c, BRAND / "lorewise-universe-logo-concept-c.png", (170, 505, 910, 1170))
panel(c, (95, 1195, 985, 1505), fill=(255, 255, 255, 205))
center_text(d, (W / 2, 1244), "TRE GIOCHI, UN CODEX IN CRESCITA\nE ARTE ORIGINALE", F_BODY_BOLD, DEEP, spacing=10)
center_text(d, (W / 2, 1360), "Scopri le porte, segui i progetti\ne scegli da dove iniziare.", F_BODY, NAVY, spacing=10)
d.rounded_rectangle((145, 1555, 935, 1680), radius=58, fill=(228, 164, 38, 242), outline=(255, 249, 224, 230), width=4)
bbox = d.textbbox((0, 0), "LOREWISENEXUS.IT", font=F_URL)
d.text(((W - (bbox[2] - bbox[0])) / 2, 1592), "LOREWISENEXUS.IT", font=F_URL, fill=NAVY)
save(c, "04-esplora-lorewise.png")

print(OUT)
