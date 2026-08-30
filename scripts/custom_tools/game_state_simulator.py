#!/usr/bin/env python3
"""
Custom Tool 3: Game State Sanitizer & Seed Simulator
Inspects state logic files in src/utils/ and checks for numeric sanitization (finiteNumberOr, Math.max, etc.) vs raw nullish coalescing (??) or unsafe calculations.
"""

import os
import re
import sys

def check_numeric_sanitization(src_dir="src/utils"):
    issues = []
    # Pattern matching unsafe ?? on numeric fields or direct assignment without finiteNumberOr
    unsafe_coalesce_pattern = re.compile(r'(\b(?:money|fame|fans|harmony|controversy|health|energy|luck)\b\s*\?\?\s*[0-9]+)')

    for root, _, files in os.walk(src_dir):
        for f in files:
            if f.endswith(".ts") or f.endswith(".tsx"):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                    lines = file.readlines()
                    for idx, line in enumerate(lines, start=1):
                        match = unsafe_coalesce_pattern.search(line)
                        if match:
                            issues.append((filepath, idx, line.strip(), match.group(0)))

    return issues

def main():
    print("=== Game State Sanitizer & Boundary Audit Tool ===")
    issues = check_numeric_sanitization()

    print(f"Total potential numeric sanitization anti-patterns found: {len(issues)}")
    if issues:
        print("\nPotential Unsafety Detected (Using ?? for numeric state instead of finiteNumberOr):")
        for filepath, line_num, content, snippet in issues[:10]:
            print(f"  [{filepath}:{line_num}] -> {snippet}")
            print(f"    Line: {content}")
        if len(issues) > 10:
            print(f"  ... and {len(issues) - 10} more.")
    else:
        print("✅ No raw nullish coalescing on numeric state variables detected in src/utils/!")

if __name__ == "__main__":
    main()
