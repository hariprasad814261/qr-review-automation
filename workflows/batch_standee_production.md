# Standard Operating Procedure (SOP): Batch Standee Production & Field Deployment

## Layer: WAT Layer 1 (Workflow / Instructions)

This document details the deterministic operational lifecycle of the **Smart Review Standee System**: from serial numbering and inventory registration to 300 DPI vector PDF generation, physical acrylic print hand-off, and on-site field activation.

---

## Phase 1: Batch Planning & Numbering

1. **Serial Code Nomenclature**: Standard prefix formatting is `ST-{NUMBER}` (e.g., `ST-101`, `ST-102`, `ST-200`).
2. **Batch Sizing**: Recommended production batch size is **50 to 100 units** per print run to optimize printer setup fees and field inventory logistics.
3. **Tracking Log**: Check current high-water mark in the admin dashboard (`/admin/batch`) before choosing the next `--start` and `--end` serial range.

---

## Phase 2: Database Inventory Registration

Pre-register the batch serials into the Supabase database. This creates empty unlinked slots (`is_active = false`) ready for on-site activation.

### Command:
```bash
python tools/seed_inventory.py --prefix ST- --start 101 --end 200
```

### Expected Output:
- Verification of connection to Supabase via `SUPABASE_SERVICE_ROLE_KEY`.
- Bulk upsert of 100 records into `public.standees`.
- Confirmation message indicating active stands were preserved and new stands were staged.

---

## Phase 3: High-Resolution Asset Generation

### Step 3.1: Generate 1000x1000px QR Codes
Generate QR codes pointing to the dynamic customer routing endpoint `{NEXT_PUBLIC_APP_URL}/s/{code}`.

```bash
python tools/generate_qr_batch.py --prefix ST- --start 101 --end 200
```
- Outputs high-contrast PNGs to `.tmp/qrs/ST-101.png` ... `.tmp/qrs/ST-200.png`.
- Adds a 40px quiet margin and bold monospace serial label at the bottom.

### Step 3.2: Compile Vector Print Tents PDF
Assemble individual QR images into a print-ready 4.0 x 6.0 inch multi-page PDF sheet.

```bash
python tools/compile_print_tents.py --input-dir .tmp/qrs --output .tmp/standees_4x6_batch.pdf
```
- Generates `.tmp/standees_4x6_batch.pdf`.
- 300 DPI vector layout formatted for standard vertical acrylic tent holders (GPay / PhonePe / QR sign standard).
- Visual elements per page:
  - 5 Gold Stars + Header: **"RATE YOUR EXPERIENCE"**
  - Subtext: *"Point your camera to scan • Rate in 5 seconds"*
  - High-res QR code image (2.0" × 2.0")
  - Footer: *"Serial ID: #ST-101 • Verified Review Station"*

---

## Phase 4: Commercial Print Hand-off

Deliver `.tmp/standees_4x6_batch.pdf` to the local UV acrylic sign printing vendor with the following specification sheet:

| Parameter | Vendor Specification |
| :--- | :--- |
| **Material** | 3mm or 4mm Clear Acrylic Vertical L-Shape / T-Shape Tent |
| **Print Technique** | Direct UV Flatbed Printing (Reverse/Back print with white opaque backing) OR 300 GSM Matte Laminated Vinyl Insert |
| **Dimensions** | 4.0 inches (W) × 6.0 inches (H) (101.6 mm × 152.4 mm) |
| **Color Profile** | CMYK, True Black `#000000`, Rich Gold `#F59E0B` |
| **Resolution** | 300 DPI Vector |

---

## Phase 5: Field Sales & On-Site 60-Second Activation

When presenting to a restaurant, salon, cafe, or dental clinic:

1. **Place the Physical Standee on the Table**: Hand the premium acrylic stand to the business owner or manager.
2. **Scan the Standee in front of them**: Open camera app on smartphone and scan the QR code (`/s/ST-xxx`).
3. **Instant Field Unlock**:
   - Because the standee is unlinked, the web app displays the **Admin Activation Form**.
   - Tap the Master PIN input, enter `8824` (or your configured `ADMIN_MASTER_PIN`).
4. **Enter Client Details**:
   - **Business Name**: e.g., *"The Roasted Bean Cafe"*
   - **Google Review URL**: Paste their Google Maps direct review link (or search CID link).
   - **WhatsApp Number**: Enter owner's 10-digit mobile number (system automatically normalizes to `+91` / international format).
5. **Instant Live Activation**:
   - Tap **"Activate Standee"**.
   - The page instantly reloads into the active **Customer Rating View**.
6. **Live Pitch Demonstration**:
   - *"Watch what happens when a customer gives you 5 stars..."* -> Tap 5 Stars -> Instantly opens their Google Review page.
   - *"Watch what happens when a customer gives 2 stars..."* -> Tap 2 Stars -> Instantly opens WhatsApp with pre-filled private feedback directly to the owner's phone.
7. **Discreet Link Updates**:
   - Long-press the Business Name for 4 seconds to trigger the PIN modal if the owner ever updates their Google link or WhatsApp number.

---

## Phase 6: Troubleshooting & Edge Cases

- **Camera fails to focus on QR**: Ensure 40px quiet margin was rendered during `generate_qr_batch.py`.
- **Wrong Google link entered**: Long-press business name for 4 seconds on active page, enter Master PIN, update URL.
- **PIN verification error**: Confirm `ADMIN_MASTER_PIN` in `.env.local` matches input.
