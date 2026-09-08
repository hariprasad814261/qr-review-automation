#!/usr/bin/env python3
"""
Seed Inventory Tool (WAT Layer 3: Execution)
Bulk pre-registers serial codes into Supabase (or local fallback storage)
with is_active = False, ready for field PIN activation.
"""

import argparse
import os
import sys
import json
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

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(description="Seed serial inventory into Supabase")
    parser.add_argument("--start", type=int, default=101, help="Starting serial number (e.g. 101)")
    parser.add_argument("--end", type=int, default=110, help="Ending serial number (e.g. 200)")
    parser.add_argument("--prefix", type=str, default="ST-", help="Serial code prefix (default: 'ST-')")
    parser.add_argument("--force-local", action="store_true", help="Force local mock store seeding")
    return parser.parse_args()


def seed_to_supabase(records, url, key):
    try:
        from supabase import create_client, Client
    except ImportError:
        print("[!] supabase-py package not found. Installing or falling back...")
        return False, "supabase-py missing"

    try:
        supabase: Client = create_client(url, key)
        print(f"[*] Connected to Supabase at {url}")
        
        # Upsert records, ignoring duplicates on serial_code
        response = supabase.table("standees").upsert(
            records,
            on_conflict="serial_code",
            ignore_duplicates=True
        ).execute()
        
        return True, f"Successfully processed {len(records)} records in Supabase."
    except Exception as e:
        return False, str(e)


def seed_to_local_store(records):
    storage_dir = ROOT_DIR / ".tmp"
    storage_dir.mkdir(parents=True, exist_ok=True)
    local_db_path = storage_dir / "inventory_db.json"
    
    existing = {}
    if local_db_path.exists():
        try:
            with open(local_db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    existing[item["serial_code"]] = item
        except Exception:
            existing = {}

    new_count = 0
    for rec in records:
        code = rec["serial_code"]
        if code not in existing:
            existing[code] = rec
            new_count += 1

    with open(local_db_path, "w", encoding="utf-8") as f:
        json.dump(list(existing.values()), f, indent=2)

    return True, f"Saved to local inventory store ({local_db_path}): {new_count} new records added, {len(existing)} total."


def main():
    args = parse_args()
    
    if args.start > args.end:
        print(f"[!] Error: --start ({args.start}) cannot be greater than --end ({args.end})")
        sys.exit(1)

    print(f"[*] Generating serial batch: {args.prefix}{args.start} to {args.prefix}{args.end} ({args.end - args.start + 1} units)")

    records = []
    for num in range(args.start, args.end + 1):
        code = f"{args.prefix}{num}"
        records.append({
            "serial_code": code,
            "business_name": None,
            "google_review_url": None,
            "whatsapp_number": None,
            "is_active": False,
            "scan_count": 0
        })

    is_valid_supabase = (
        SUPABASE_URL 
        and SUPABASE_SERVICE_KEY 
        and not SUPABASE_URL.startswith("https://mock-")
        and not SUPABASE_SERVICE_KEY.startswith("mock-")
        and not args.force_local
    )

    if is_valid_supabase:
        print(f"[*] Attempting Supabase cloud seeding...")
        success, msg = seed_to_supabase(records, SUPABASE_URL, SUPABASE_SERVICE_KEY)
        if success:
            print(f"[OK] {msg}")
            # Also mirror to local store for offline development resilience
            seed_to_local_store(records)
            return
        else:
            print(f"[!] Supabase seeding failed ({msg}). Falling back to local offline store.")

    # Local fallback
    success, msg = seed_to_local_store(records)
    if success:
        print(f"[OK] {msg}")
    else:
        print(f"[FAILED] {msg}")
        sys.exit(1)


if __name__ == "__main__":
    main()
