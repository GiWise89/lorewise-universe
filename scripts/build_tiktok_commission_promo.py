from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "social-assets" / "tiktok" / "commissioni-promo-v1"
OUT.mkdir(parents=True, exist_ok=True)

BACKGROUND = Path(r"C:\Users\Luigi\.codex\generated_images\01a028a7-bc3c-7c82-9e6b-55cf4523f70e\exec-4de703cc-1625-4658-bf27-57f3f177813d.png")
ICON = ROOT / "public" / "brand" / "icons" / "commissioni-concept-v1.webp"

W, H = 1080, 1920
INK = "#fff8e9"
GOLD = "#ffd75c"
GOLD_DARK = "#d99a20"
PINK = "#ff3b9d"
CYAN = "#53ddff"
PURPLE = "#7d42ff"
DEEP = "#251038"


def f(name, size):
    return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)


F_KICKER = f("arialbd.ttf", 27)
F_TITLE = f("georgiab.ttf", 63)
F_SUB = f("arialbd.ttf", 30)
F_BADGE = f("arialbd.ttf", 52)
F_BADGE_LABEL = f("arialbd.ttf", 22)
F_PRICE = f("arialbd.ttf", 49)
F_CARD_TITLE = f("georgiab.ttf", 39)
F_CARD_BODY = f("arial.ttf", 26)
F_CARD_META = f("arialbd.ttf", 24)
F_URL = f("arialbd.ttf", 36)
F_FINE = f("arial.ttf", 21)


def cover(path):
    im = Image.open(path).convert("RGB")
    ratio = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
    x = (im.width - W) // 2
    y = (im.height - H) // 2
    return im.crop((x, y, x + W, y + H)).convert("RGBA")


def center(draw, y, text, font, fill=INK, spacing=5):
    for line in text.split("\n"):
        box = draw.textbbox((0, 0), line, font=font)
        draw.text(((W - (box[2] - box[0])) / 2, y), line, font=font, fill=fill)
        y += box[3] - box[1] + spacing
    return y


def rounded_panel(canvas, box, fill, outline=(255, 215, 92, 170), radius=34, shadow=True):
    if shadow:
        layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        x1, y1, x2, y2 = box
        ld.rounded_rectangle((x1 + 8, y1 + 12, x2 + 8, y2 + 12), radius=radius, fill=(0, 0, 0, 105))
        canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=3)


def place_icon(canvas):
    icon = Image.open(ICON).convert("RGBA")
    icon.thumbnail((260, 220), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, ((W - icon.width) // 2, 56))


canvas = cover(BACKGROUND)
draw = ImageDraw.Draw(canvas)
place_icon(canvas)

# Header
rounded_panel(canvas, (300, 245, 780, 300), (89, 27, 104, 230), radius=26, shadow=False)
center(draw, 260, "PROMO APERTURA ATTIVA", F_KICKER, PINK)
center(draw, 326, "PIÙ VANTAGGI PER CHI\nENTRA ORA NEL NEXUS", F_TITLE, INK, spacing=2)
center(draw, 476, "RICHIESTE ENTRO IL 30 SETTEMBRE 2026", F_SUB, GOLD)

# Discounts
discounts = [("VISITATORI", "−10%", PINK), ("SUPPORTER", "−15%", CYAN), ("COLLECTOR", "−20%", GOLD)]
for i, (label, value, accent) in enumerate(discounts):
    x1 = 75 + i * 325
    rounded_panel(canvas, (x1, 545, x1 + 280, 700), (48, 18, 71, 225), outline=(255, 255, 255, 80), radius=30)
    box = draw.textbbox((0, 0), label, font=F_BADGE_LABEL)
    draw.text((x1 + (280 - (box[2] - box[0])) / 2, 570), label, font=F_BADGE_LABEL, fill=INK)
    box = draw.textbbox((0, 0), value, font=F_BADGE)
    draw.text((x1 + (280 - (box[2] - box[0])) / 2, 612), value, font=F_BADGE, fill=accent)

center(draw, 735, "SCONTO CALCOLATO SUL PREVENTIVO FINALE", F_KICKER, PINK)

# Offer cards
cards = [
    ("DA 49 €", "Ritratto Essenziale", "1 soggetto · sfondo semplice · 1 revisione", "3 GIORNI LAVORATIVI", PINK),
    ("DA 79 €", "Ritratto Completo", "Figura intera o coppia · sfondo curato · 2 revisioni", "5 GIORNI LAVORATIVI", CYAN),
    ("DA 119 €", "Opera Narrativa", "Scena articolata · trasformazione narrativa · 3 revisioni", "8 GIORNI LAVORATIVI", GOLD),
]
for i, (price, title, body, timing, accent) in enumerate(cards):
    y1 = 800 + i * 270
    rounded_panel(canvas, (70, y1, 1010, y1 + 232), (255, 249, 238, 238), outline=(255, 215, 92, 190), radius=32)
    draw.rounded_rectangle((95, y1 + 38, 315, y1 + 112), radius=28, fill=accent)
    box = draw.textbbox((0, 0), price, font=F_PRICE)
    draw.text((205 - (box[2] - box[0]) / 2, y1 + 49), price, font=F_PRICE, fill=DEEP)
    draw.text((355, y1 + 36), title, font=F_CARD_TITLE, fill=DEEP)
    draw.text((355, y1 + 104), body, font=F_CARD_BODY, fill="#4d3158")
    draw.text((355, y1 + 171), timing, font=F_CARD_META, fill="#8b2767")

# Conditions and CTA
rounded_panel(canvas, (75, 1620, 1005, 1740), (55, 20, 78, 228), outline=(255, 215, 92, 150), radius=28)
center(draw, 1644, "La tariffa promozionale resta acquisita anche se il lavoro\ntermina dopo la scadenza.", F_FINE, INK, spacing=5)
draw.rounded_rectangle((120, 1780, 960, 1870), radius=45, fill=(255, 215, 92, 245), outline=(255, 255, 255, 210), width=3)
box = draw.textbbox((0, 0), "LOREWISENEXUS.IT/COMMISSIONI", font=F_URL)
draw.text(((W - (box[2] - box[0])) / 2, 1807), "LOREWISENEXUS.IT/COMMISSIONI", font=F_URL, fill=DEEP)

out = OUT / "locandina-promo-commissioni-2026.png"
canvas.convert("RGB").save(out, quality=96)
print(out)
