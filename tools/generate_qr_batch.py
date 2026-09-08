#!/usr/bin/env python3
"""
Generate QR Batch Tool (WAT Layer 3: Execution)
Generates 1000x1000px high-contrast QR codes with 40px quiet margin
and bold monospace serial footer label for physical standee production.
"""

import argparse
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment secrets
ROOT_DIR = Path(__file__).resolve().parent.parent
env_local = ROOT_DIR / ".env.local"
env_default = ROOT_DIR / ".env"

if env_local.exists():
    load_dotenv(env_local)
elif env_default.exists():
    load_dotenv(env_default)

DEFAULT_BASE_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")


# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(description="Generate 1000x1000px QR Code batch for standees")
    parser.add_argument("--start", type=int, default=101, help="Starting serial number (e.g. 101)")
    parser.add_argument("--end", type=int, default=110, help="Ending serial number (e.g. 110)")
    parser.add_argument("--prefix", type=str, default="ST-", help="Serial code prefix (default: 'ST-')")
    parser.add_argument("--base-url", type=str, default=DEFAULT_BASE_URL, help=f"Base application URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--output-dir", type=str, default=str(ROOT_DIR / ".tmp" / "qrs"), help="Output directory for generated QR images")
    return parser.parse_args()


def get_font(size):
    from PIL import ImageFont
    # Try multiple standard monospace / clean sans fonts across OSes
    font_candidates = [
        "consola.ttf", "consolab.ttf", "arialbd.ttf", "arial.ttf", 
        "DejaVuSans-Bold.ttf", "Helvetica-Bold.ttf", "FreeSansBold.ttf", "calibrib.ttf"
    ]
    for font_name in font_candidates:
        try:
            return ImageFont.truetype(font_name, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def generate_single_qr(serial_code, target_url, output_path):
    try:
        import qrcode
        from PIL import Image, ImageDraw, ImageOps
    except ImportError:
        print("[!] qrcode or pillow library missing. Run: pip install -r requirements.txt")
        sys.exit(1)

    # 1. Generate base high-contrast QR code
    qr = qrcode.QRCode(
        version=None, # auto fit
        error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction for reliable scanning
        box_size=20,
        border=2,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="#000000", back_color="#FFFFFF").convert("RGB")

    # 2. Canvas geometry: target 1000 x 1000 px
    TARGET_SIZE = 1000
    FOOTER_HEIGHT = 120
    MARGIN = 40
    
    # Available area for QR code inside 1000x1000 canvas
    qr_max_size = TARGET_SIZE - (MARGIN * 2) - FOOTER_HEIGHT
    qr_resized = qr_img.resize((qr_max_size, qr_max_size), Image.Resampling.NEAREST)

    # 3. Create full master white canvas (1000x1000)
    canvas = Image.new("RGB", (TARGET_SIZE, TARGET_SIZE), "#FFFFFF")

    # 4. Paste QR code centered horizontally with top margin
    qr_x = (TARGET_SIZE - qr_max_size) // 2
    qr_y = MARGIN + 10
    canvas.paste(qr_resized, (qr_x, qr_y))

    # 5. Draw Monospace Bold Serial ID banner at the bottom
    draw = ImageDraw.Draw(canvas)
    
    font_size = 46
    font = get_font(font_size)
    label_text = f"#{serial_code}"

    # Calculate text bounding box
    bbox = draw.textbbox((0, 0), label_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = (TARGET_SIZE - text_width) // 2
    text_y = qr_y + qr_max_size + ((TARGET_SIZE - (qr_y + qr_max_size) - text_height) // 2) - 10

    # Draw decorative pill border behind serial number
    pill_padding_x = 28
    pill_padding_y = 12
    pill_rect = [
        text_x - pill_padding_x,
        text_y - pill_padding_y,
        text_x + text_width + pill_padding_x,
        text_y + text_height + pill_padding_y
    ]
    draw.rounded_rectangle(pill_rect, radius=12, fill="#F3F4F6", outline="#E5E7EB", width=2)
    draw.text((text_x, text_y), label_text, fill="#111827", font=font)

    # 6. Save image to disk
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="PNG", dpi=(300, 300))


def main():
    args = parse_args()
    base_url = args.base_url.rstrip("/")
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.start > args.end:
        print(f"[!] Error: --start ({args.start}) cannot be greater than --end ({args.end})")
        sys.exit(1)

    total = args.end - args.start + 1
    print(f"[*] Starting 1000x1000px QR generation for {total} standees...")
    print(f"    Base URL: {base_url}/s/...")
    print(f"    Output Folder: {out_dir}")

    for idx, num in enumerate(range(args.start, args.end + 1), start=1):
        code = f"{args.prefix}{num}"
        target_url = f"{base_url}/s/{code}"
        file_path = out_dir / f"{code}.png"
        generate_single_qr(code, target_url, file_path)
        print(f"  [{idx}/{total}] Generated {file_path.name} -> {target_url}")

    print(f"[OK] Batch generation complete! {total} high-contrast QR codes ready in {out_dir}")


if __name__ == "__main__":
    main()
