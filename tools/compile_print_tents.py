#!/usr/bin/env python3
"""
Compile Print Tents Tool (WAT Layer 3: Execution)
Compiles 1000x1000px QR codes into a multi-page 4.0 x 6.0 inch 300 DPI vector PDF
for commercial acrylic sign printer hand-off.
"""

import argparse
import math
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(description="Compile QR codes into 4x6 inch vector PDF standees")
    parser.add_argument("--input-dir", type=str, default=str(ROOT_DIR / ".tmp" / "qrs"), help="Input directory containing QR PNGs")
    parser.add_argument("--output", type=str, default=str(ROOT_DIR / ".tmp" / "standees_4x6_batch.pdf"), help="Output PDF file path")
    parser.add_argument("--prefix", type=str, default="ST-", help="Filter by prefix if needed")
    return parser.parse_args()


def draw_star(c, cx, cy, r_outer, r_inner, fill_color, stroke_color=None):
    """Draws a crisp 5-pointed vector star."""
    c.saveState()
    c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(0.5)
    else:
        c.setStrokeColor(fill_color)
    
    path = c.beginPath()
    points = 5
    angle_step = math.pi / points
    # Start top point (pi/2)
    start_angle = math.pi / 2

    for i in range(points * 2):
        r = r_outer if i % 2 == 0 else r_inner
        curr_angle = start_angle + (i * angle_step)
        x = cx + r * math.cos(curr_angle)
        y = cy + r * math.sin(curr_angle)
        if i == 0:
            path.moveTo(x, y)
        else:
            path.lineTo(x, y)
    path.close()
    c.drawPath(path, fill=1, stroke=1 if stroke_color else 0)
    c.restoreState()


def render_standee_page(c, qr_path, serial_code, width, height):
    from reportlab.lib import colors

    # Palette
    GOLD = colors.HexColor("#F59E0B")
    DARK_BG = colors.HexColor("#0F172A")
    SLATE_TEXT = colors.HexColor("#334155")
    MUTED_TEXT = colors.HexColor("#64748B")
    CARD_BG = colors.HexColor("#FFFFFF")
    BORDER_COLOR = colors.HexColor("#E2E8F0")
    ACCENT_PILL = colors.HexColor("#F8FAFC")

    # 1. White Background Canvas
    c.setFillColor(colors.white)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # 2. Modern Card Margin & Subtle Cut Line / Border (0.2 inch inset)
    margin = 0.2 * 72 # 14.4 pt
    card_w = width - (2 * margin)
    card_h = height - (2 * margin)
    
    # Outer bleed & subtle boundary guide
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(1)
    c.roundRect(margin, margin, card_w, card_h, 16, stroke=1, fill=0)

    # 3. Top Decorative 5 Gold Stars
    star_y = height - 0.75 * 72 # around 5.25 inches from bottom
    star_spacing = 16
    start_x = (width / 2.0) - (2 * star_spacing)

    for i in range(5):
        draw_star(c, start_x + (i * star_spacing), star_y, r_outer=7.0, r_inner=3.2, fill_color=GOLD)

    # 4. Bold Header "RATE YOUR EXPERIENCE"
    c.setFillColor(DARK_BG)
    c.setFont("Helvetica-Bold", 17)
    c.drawCentredString(width / 2.0, height - 1.15 * 72, "RATE YOUR EXPERIENCE")

    # 5. Subtext: "Point your camera to scan • Rate in 5 seconds"
    c.setFillColor(MUTED_TEXT)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(width / 2.0, height - 1.38 * 72, "Point your camera to scan • Rate in 5 seconds")

    # 6. Center: High-Res QR Code scaled to exactly 2.0 x 2.0 inches
    qr_dim = 2.0 * 72 # 144 pt
    qr_x = (width - qr_dim) / 2.0
    qr_y = (height / 2.0) - (qr_dim / 2.0) - 10 # slightly adjusted vertical balance

    # QR background container with soft border
    padding = 10
    c.setFillColor(CARD_BG)
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(1.5)
    c.roundRect(qr_x - padding, qr_y - padding, qr_dim + (padding * 2), qr_dim + (padding * 2), 12, stroke=1, fill=1)

    # Draw QR Image
    c.drawImage(
        str(qr_path), 
        qr_x, 
        qr_y, 
        width=qr_dim, 
        height=qr_dim, 
        preserveAspectRatio=True, 
        mask='auto'
    )

    # 7. Bottom Callout / Serial Badge: "Serial ID: #{code} • Verified Review Station"
    pill_w = card_w - 40
    pill_h = 24
    pill_x = (width - pill_w) / 2.0
    pill_y = margin + 24

    c.setFillColor(ACCENT_PILL)
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(0.8)
    c.roundRect(pill_x, pill_y, pill_w, pill_h, 8, stroke=1, fill=1)

    c.setFillColor(SLATE_TEXT)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2.0, pill_y + 7.5, f"Serial ID: #{serial_code}  •  Verified Review Station")

    # 8. Micro UV Print Mark (at absolute edge)
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.setFont("Helvetica", 5.5)
    c.drawCentredString(width / 2.0, 8, "4x6 INCH ACRYLIC VERTICAL TENT • 300 DPI DIRECT UV PRINT")

    c.showPage()


def main():
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_pdf = Path(args.output)
    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        print(f"[!] Error: Input directory '{input_dir}' does not exist.")
        sys.exit(1)

    qr_files = sorted(list(input_dir.glob("*.png")))
    if args.prefix:
        qr_files = [f for f in qr_files if f.stem.startswith(args.prefix)]

    if not qr_files:
        print(f"[!] No QR PNG files found in '{input_dir}'.")
        sys.exit(1)

    try:
        from reportlab.lib.pagesizes import inch
        from reportlab.pdfgen import canvas
    except ImportError:
        print("[!] reportlab library missing. Run: pip install -r requirements.txt")
        sys.exit(1)

    # 4.0 inches wide x 6.0 inches tall
    PAGE_WIDTH = 4.0 * inch
    PAGE_HEIGHT = 6.0 * inch

    print(f"[*] Compiling {len(qr_files)} standees into 4.0 x 6.0 inch 300 DPI PDF...")
    print(f"    Target: {output_pdf}")

    pdf_canvas = canvas.Canvas(str(output_pdf), pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    pdf_canvas.setTitle("Smart Review Standees - 4x6 Acrylic Batch")
    pdf_canvas.setAuthor("WAT Standee Automation")

    for idx, qr_file in enumerate(qr_files, start=1):
        serial_code = qr_file.stem
        print(f"  [{idx}/{len(qr_files)}] Adding standee #{serial_code}")
        render_standee_page(pdf_canvas, qr_file, serial_code, PAGE_WIDTH, PAGE_HEIGHT)

    pdf_canvas.save()
    print(f"[OK] Successfully compiled print-ready PDF: {output_pdf} ({len(qr_files)} pages)")


if __name__ == "__main__":
    main()
