#!/usr/bin/env python3
"""
Crop les logos Edukea (docs/Logo *.png) au bbox reel + 10% de marge.
Ecrit `packages/ui/assets/logo-{color,white,black}.png`.

Idempotent : re-run apres changement de fichier source produit un output identique
tant que le bbox et la marge sont inchanges.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCES = {
    'logo-color.png': ROOT / 'docs' / 'Logo Couleur.png',
    'logo-white.png': ROOT / 'docs' / 'Logo Blanc.png',
    'logo-black.png': ROOT / 'docs' / 'Logo Noir.png',
}
OUT_DIR = ROOT / 'packages' / 'ui' / 'assets'
MARGIN_RATIO = 0.10

def crop_with_margin(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if bbox is None:
        raise ValueError('image is entirely transparent')
    x0, y0, x1, y1 = bbox
    pad = int((y1 - y0) * MARGIN_RATIO)
    return im.crop((
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(im.width, x1 + pad),
        min(im.height, y1 + pad),
    ))

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        if not src.exists():
            raise FileNotFoundError(src)
        out = OUT_DIR / name
        crop_with_margin(Image.open(src)).save(out, optimize=True)
        print(f'wrote {out}')

if __name__ == '__main__':
    main()
