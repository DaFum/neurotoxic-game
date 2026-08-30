#!/usr/bin/env python3
"""
Custom tool: i18n key difference checker between en and de locale JSON files.
Placed in /home/jules/self_created_tools/i18n_key_checker.py
"""

import json
import os
import sys

def extract_keys(data, prefix=""):
    keys = set()
    if isinstance(data, dict):
        for k, v in data.items():
            full_key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys.update(extract_keys(v, full_key))
            else:
                keys.add(full_key)
    return keys

def check_locales(base_dir="public/locales"):
    en_dir = os.path.join(base_dir, "en")
    de_dir = os.path.join(base_dir, "de")

    if not os.path.exists(en_dir) or not os.path.exists(de_dir):
        print(f"Error: {base_dir} does not contain en and de directories.")
        sys.exit(1)

    en_files = {f for f in os.listdir(en_dir) if f.endswith(".json")}
    de_files = {f for f in os.listdir(de_dir) if f.endswith(".json")}

    all_namespaces = sorted(en_files.union(de_files))

    missing_in_de_total = 0
    missing_in_en_total = 0

    print("=== i18n Key Discrepancy Report ===")

    for ns_file in all_namespaces:
        ns = ns_file.replace(".json", "")
        en_path = os.path.join(en_dir, ns_file)
        de_path = os.path.join(de_dir, ns_file)

        en_keys = set()
        de_keys = set()

        if os.path.exists(en_path):
            with open(en_path, "r", encoding="utf-8") as f:
                try:
                    en_data = json.load(f)
                    en_keys = extract_keys(en_data)
                except Exception as e:
                    print(f"Error reading {en_path}: {e}")

        if os.path.exists(de_path):
            with open(de_path, "r", encoding="utf-8") as f:
                try:
                    de_data = json.load(f)
                    de_keys = extract_keys(de_data)
                except Exception as e:
                    print(f"Error reading {de_path}: {e}")

        missing_in_de = en_keys - de_keys
        missing_in_en = de_keys - en_keys

        missing_in_de_total += len(missing_in_de)
        missing_in_en_total += len(missing_in_en)

        if missing_in_de or missing_in_en:
            print(f"\n[Namespace: {ns}]")
            if missing_in_de:
                print(f"  Missing in DE ({len(missing_in_de)} keys):")
                for k in sorted(missing_in_de)[:10]:
                    print(f"    - {k}")
                if len(missing_in_de) > 10:
                    print(f"    ... and {len(missing_in_de) - 10} more.")
            if missing_in_en:
                print(f"  Missing in EN ({len(missing_in_en)} keys):")
                for k in sorted(missing_in_en)[:10]:
                    print(f"    - {k}")
                if len(missing_in_en) > 10:
                    print(f"    ... and {len(missing_in_en) - 10} more.")

    print("\n=== Summary ===")
    print(f"Total missing in DE: {missing_in_de_total}")
    print(f"Total missing in EN: {missing_in_en_total}")

if __name__ == "__main__":
    check_locales()
