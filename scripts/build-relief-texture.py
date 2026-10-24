#!/usr/bin/env python3
"""Erzeugt die Relief-Textur für die Kartenebene "Zentraleuropa".

Quelle: Natural Earth 1:50m Shaded Relief (SR_50M), Public Domain
        https://www.naturalearthdata.com/downloads/50m-raster-data/50m-shaded-relief/
        Projektion WGS84, Auflösung 30 Bogenminuten pro Pixel (10800 x 5400).

Das Skript ist bewusst reproduzierbar und idempotent: Es bricht ab, wenn die
Zieldatei existiert, sofern nicht --force gesetzt ist.

Nutzung:
    python scripts/build-relief-texture.py            # erzeugt public/maps/relief-central-europe.webp
    python scripts/build-relief-texture.py --force    # überschreibt
    python scripts/build-relief-texture.py --keep-tif # behält den Zwischenstand

Abhängigkeit: Pillow (>= 10). Natural Earth ist Public Domain; die
abgeleitete Kachel erbt diesen Status.
"""

from __future__ import annotations

import argparse
import math
import os
import sys
import urllib.request
import zipfile
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
except ImportError:  # pragma: no cover - klare Fehlermeldung statt Traceback
    print("Fehler: Pillow wird benötigt (pip install Pillow).", file=sys.stderr)
    raise SystemExit(1)

RELIEF_URL = "https://naciscdn.org/naturalearth/50m/raster/SR_50M.zip"
"""Offizielle Natural-Earth-CDN-Adresse für das 1:50m-Shaded-Relief."""

SOURCE_PX_PER_DEGREE = 30
"""10800 px / 360° = 30 Pixel pro Breitengrad."""

# Zentraleuropa-Ausschnitt: deckt Rheinland bis Preußen und die Alpen ab.
BOUNDS = {"west": 3.0, "east": 19.0, "south": 45.0, "north": 56.0}

TARGET_WIDTH = 960
"""Zielbreite der Kachel. 960 px reichen für die L3-Ansicht und halten die
Dateigröße klein; die Textur wird im Renderer skaliert.
"""

OUTPUT = Path(__file__).resolve().parent.parent / "public" / "maps" / "relief-central-europe.webp"
CACHE = Path(os.environ.get("TEMP", "/tmp")) / "ne-relief"


def download_source() -> Path:
    """Lädt das Natural-Earth-ZIP und liefert den Pfad zur TIFF-Datei."""
    CACHE.mkdir(parents=True, exist_ok=True)
    archive = CACHE / "SR_50M.zip"
    tif = CACHE / "SR_50M.tif"
    if not tif.exists():
        if not archive.exists():
            print(f"Lade {RELIEF_URL} …")
            urllib.request.urlretrieve(RELIEF_URL, archive)
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(CACHE)
    if not tif.exists():
        raise SystemExit("SR_50M.tif fehlt nach dem Entpacken.")
    return tif


def crop_bounds(image: Image.Image) -> Image.Image:
    """Schneidet den geografischen Ausschnitt aus dem globalen Raster."""
    def to_x(lon: float) -> int:
        return int(round((lon + 180.0) * SOURCE_PX_PER_DEGREE))

    def to_y(lat: float) -> int:
        return int(round((90.0 - lat) * SOURCE_PX_PER_DEGREE))

    box = (to_x(BOUNDS["west"]), to_y(BOUNDS["north"]),
           to_x(BOUNDS["east"]), to_y(BOUNDS["south"]))
    return image.crop(box)


def main() -> int:
    parser = argparse.ArgumentParser(description="Erzeugt die Relief-Textur für die Karte.")
    parser.add_argument("--force", action="store_true", help="vorhandene Zieldatei überschreiben")
    parser.add_argument("--keep-tif", action="store_true", help="Zwischenstand (55 MB) behalten")
    args = parser.parse_args()

    if OUTPUT.exists() and not args.force:
        print(f"Vorhanden: {OUTPUT.relative_to(OUTPUT.parents[2])} – nutze --force zum Neuerzeugen.")
        return 0

    source = download_source()
    with Image.open(source) as raw:
        cropped = crop_bounds(raw.convert("L"))

    aspect_ratio = (BOUNDS["north"] - BOUNDS["south"]) / (BOUNDS["east"] - BOUNDS["west"])
    height = int(round(TARGET_WIDTH * aspect_ratio))
    # Meterüber-Cosinuskorrektur wäre kartografisch korrekt, würde aber die
    # Regionenpositionen (Prozent der Fläche) verschieben. Bewusst einfache
    # lineare Skalierung, damit Textur und Labels dieselbe Fläche teilen.
    resized = cropped.resize((TARGET_WIDTH, height), Image.LANCZOS)

    # Kontrast behutsam anheben: Das Relief dient als Hintergrund, nicht als
    # Hauptdarsteller – Regionennamen müssen lesbar bleiben.
    enhanced = ImageEnhance.Contrast(resized).enhance(1.15)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    enhanced.save(OUTPUT, format="WEBP", quality=82, method=6)

    size_kb = OUTPUT.stat().st_size / 1024
    covered = math.prod([BOUNDS["north"] - BOUNDS["south"], BOUNDS["east"] - BOUNDS["west"]])
    print(f"Erzeugt: {OUTPUT.relative_to(OUTPUT.parents[2])} "
          f"({TARGET_WIDTH}x{height} px, {size_kb:.0f} kB, {covered:.0f} Quadratgrad)")
    print("Quelle: Natural Earth 1:50m Shaded Relief, Public Domain.")

    if not args.keep_tif and source.exists():
        source.unlink(missing_ok=True)
        print("Zwischenstand entfernt (--keep-tif behält ihn).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
