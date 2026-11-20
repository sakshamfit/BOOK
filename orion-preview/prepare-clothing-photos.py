#!/usr/bin/env python3
"""Prepare the rail's photorealistic concept cut-outs (authoring step only).

The ten AI-generated source photographs are deliberately kept in ignored work/.
Install Pillow and NumPy to run this script; the app itself needs neither.
Usage: python3 orion-preview/prepare-clothing-photos.py [source-directory]
The checked-in WebPs are the deployable assets, not actual mall inventory photos.
"""
from pathlib import Path
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "work/clothing-rail"
OUTPUT = ROOT / "images/clothing-rail"
WIDTH, HEIGHT = 600, 930

STYLES = [
    ("bone-tee", "tee", None, "#344A38"),
    ("ink-tee", "tee", "#303438", "#F3EDE0"),
    ("sky-shirt", "shirt", None, "#263E47"),
    ("olive-knit", "knit", None, "#FFF5DD"),
    ("heather-hoodie", "hoodie", None, "#24382C"),
    ("lilac-knit", "knit", "#CCB2E0", "#44294E"),
    ("forest-jacket", "jacket", None, "#F5EBD7"),
    ("brick-knit", "knit", "#B05139", "#FFF1DF"),
    ("sand-coat", "coat", None, "#3C352B"),
    ("ochre-tee", "tee", "#DE9C31", "#3D3222"),
]
HEMS = {"tee": 792, "shirt": 855, "knit": 816, "hoodie": 831, "jacket": 831, "coat": 912}
# Positions in the normalised photographic canvas, not in the SVG illustration.
CHEST = {"tee": (.70, .32), "shirt": (.67, .44), "knit": (.70, .31),
         "hoodie": (.70, .33), "jacket": (.70, .33), "coat": (.70, .35)}


def rgb(hex_colour):
    return np.array([int(hex_colour[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def key_and_align(path, kind):
    original = Image.open(path).convert("RGB")
    pixels = np.asarray(original, dtype=np.float32)
    r, g, b = np.moveaxis(pixels, -1, 0)
    # Neutral fabric and wooden hangers contain no saturated magenta. Use a
    # soft matte and unmix the key colour at edges, including neck/sleeve holes.
    spill = np.maximum(0, np.minimum(r, b) - g - 8)
    alpha = np.clip(1 - spill / 190, 0, 1)
    alpha[alpha < .045] = 0
    foreground = np.clip((pixels - (1 - alpha[..., None]) * np.array([255, 0, 255])) /
                         np.maximum(alpha[..., None], .02), 0, 255)
    rgba = Image.fromarray(np.dstack((foreground, alpha * 255)).astype("uint8"), "RGBA")
    bbox = rgba.getbbox()
    if not bbox:
        raise ValueError(f"Empty cutout: {path}")
    left, top, right, bottom = bbox
    # Find the thin vertical metal stem just above the wood, not the far edge
    # of the hook. All views pivot around the SAME point on the physical rail.
    rows = []
    for y in range(top + 30, min(top + int(original.height * .11), bottom)):
        xs = np.flatnonzero(alpha[y] > .8)
        if len(xs) and xs[-1] - xs[0] < 18:
            rows.append(float(np.median(xs)))
    stem_x = float(np.median(rows[-12:])) if rows else original.width / 2
    scale = min((HEMS[kind] - 12) / (bottom - top),
                (WIDTH - 22) / (2 * max(stem_x - left, right - stem_x)))
    cutout = rgba.crop(bbox)
    cutout = cutout.resize((round(cutout.width * scale), round(cutout.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (WIDTH, HEIGHT))
    canvas.alpha_composite(cutout, (round(WIDTH / 2 - (stem_x - left) * scale), 12))
    return canvas


def recolour(image, kind, target):
    if not target:
        return image.copy()
    pixels = np.asarray(image, dtype=np.float32).copy()
    r, g, b = np.moveaxis(pixels[..., :3], -1, 0)
    if kind == "tee":
        mask = (np.minimum(np.minimum(r, g), b) > 65) & ((np.maximum(r, b) - np.minimum(r, b)) < 62) & ((r - g) < 28)
    else:
        mask = (g > r * .92) & (b < g * .94) & (r < 190)
    # Below the neck the whole alpha silhouette is fabric, including warm
    # shadowed seams which a colour-only selection could leave ivory/tan.
    mask[210 if kind == "knit" else 180:] = True
    mask &= pixels[..., 3] > 10
    mask[:110] = False  # Never recolour the metal hook or exposed wooden hanger.
    luminance = pixels[..., :3] @ np.array([.2126, .7152, .0722])
    reference = np.median(luminance[mask])
    tone = np.clip(luminance / reference, .14, 1.7)
    if kind == "tee" and target == "#303438":
        tone = tone ** 1.8
    colour = rgb(target)
    # Preserve both the real shadow relief and individual yarn highlights.
    mapped = np.where(tone[..., None] < 1, colour * tone[..., None],
                      colour + (255 - colour) * (tone[..., None] - 1) * .72)
    blend = np.asarray(Image.fromarray((mask * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(.5)), dtype=np.float32) / 255
    pixels[..., :3] = pixels[..., :3] * (1 - blend[..., None]) + np.clip(mapped, 0, 255) * blend[..., None]
    return Image.fromarray(pixels.clip(0, 255).astype("uint8"), "RGBA")


def embroider(image, kind, colour):
    # Bake the wordmark INTO the cutout so it rotates with the actual textile,
    # rather than floating as an unrelated SVG over the photograph.
    font_paths = [Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"),
                  Path("/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf")]
    font_file = next((p for p in font_paths if p.exists()), None)
    if not font_file:
        raise FileNotFoundError("Install a system serif font for the ORION embroidery authoring step")
    font = ImageFont.truetype(str(font_file), 20)
    text_mask = Image.new("L", (110, 30))
    draw = ImageDraw.Draw(text_mask)
    x = 0
    for char in "ORION":
        draw.text((x, 0), char, fill=255, font=font, stroke_width=0)
        x += draw.textlength(char, font=font) + 1.3
    text_mask = text_mask.crop(text_mask.getbbox())
    cx, cy = CHEST[kind]
    x, y = round(cx * WIDTH - text_mask.width / 2), round(cy * HEIGHT - text_mask.height / 2)
    pixels = np.asarray(image, dtype=np.float32).copy()
    patch = pixels[y:y + text_mask.height, x:x + text_mask.width, :3]
    lum = patch @ np.array([.2126, .7152, .0722])
    # Fine directional thread, local fabric shade, tiny stitched relief.
    stitch = .88 + .12 * np.cos(np.indices(lum.shape)[0] * np.pi)
    shade = np.clip(lum / max(float(np.median(lum)), 1), .75, 1.12)
    thread = np.clip(rgb(colour)[None, None, :] * shade[..., None] * stitch[..., None], 0, 255)
    mask = np.asarray(text_mask, dtype=np.float32) / 255 * .95
    patch[:] = patch * (1 - mask[..., None]) + thread * mask[..., None]
    return Image.fromarray(pixels.astype("uint8"), "RGBA")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sources = {}
    for _, kind, _, _ in STYLES:
        for face in ("front", "back"):
            path = SOURCE / f"{kind}-{face}.png"
            if path.exists() and (kind, face) not in sources:
                sources[kind, face] = key_and_align(path, kind)
    manifest = {"type": "AI-generated photorealistic wardrobe concepts, not stock or mall inventory",
                "canvas": [WIDTH, HEIGHT], "brand": "ORION", "brandPlacement": "viewer-right-chest", "items": []}
    for name, kind, target, ink in STYLES:
        item = {"id": name, "brandBakedIn": True, "front": f"{name}-front.webp"}
        for face in ("front", "back"):
            if (kind, face) not in sources:
                continue  # Never invent a back view by reusing the front.
            image = recolour(sources[kind, face], kind, target)
            if face == "front":
                image = embroider(image, kind, ink)
            output = OUTPUT / f"{name}-{face}.webp"
            image.save(output, "WEBP", quality=86, method=6, alpha_quality=100)
            item[face] = output.name
        manifest["items"].append(item)
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Prepared {len(list(OUTPUT.glob('*.webp')))} transparent clothing assets in {OUTPUT}")


if __name__ == "__main__":
    main()
