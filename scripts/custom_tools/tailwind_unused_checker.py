#!/usr/bin/env python3
"""
Custom Tool 2: CSS / Tailwind Class Audit Tool
Scans src/ for className usages in TSX/JSX files and cross-checks with custom CSS declarations in src/index.css and src/overworld.css.
"""

import os
import re
import sys

def scan_css_classes(css_dir="src"):
    defined_classes = set()
    for root, _, files in os.walk(css_dir):
        for f in files:
            if f.endswith(".css"):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                    content = file.read()
                    # Match class definitions like .my-class or .custom-btn
                    matches = re.findall(r'\.([a-zA-Z0-9_\-]+)', content)
                    defined_classes.update(matches)
    return defined_classes

def scan_jsx_classes(src_dir="src"):
    used_classes = set()
    for root, _, files in os.walk(src_dir):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".jsx"):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                    content = file.read()
                    # Match className="..." or className={`...`}
                    matches = re.findall(r'className=["`{]([^"`}]+)["`}]', content)
                    for m in matches:
                        for token in m.split():
                            # sanitize token
                            cleaned = token.strip("`'\"{},")
                            if cleaned and not cleaned.startswith("$"):
                                used_classes.add(cleaned)
    return used_classes

def main():
    print("=== Tailwind & CSS Class Audit Tool ===")
    css_classes = scan_css_classes()
    jsx_classes = scan_jsx_classes()

    print(f"Total Custom CSS Classes Defined: {len(css_classes)}")
    print(f"Total Unique Class Tokens Used in JSX/TSX: {len(jsx_classes)}")

    # Custom CSS classes defined in .css files that might be unused
    possibly_unused_custom_css = set()
    for css_cls in css_classes:
        if css_cls not in jsx_classes:
            possibly_unused_custom_css.add(css_cls)

    print(f"\nPotentially Unused Custom CSS Classes ({len(possibly_unused_custom_css)}):")
    for cls in sorted(possibly_unused_custom_css)[:15]:
        print(f"  - .{cls}")
    if len(possibly_unused_custom_css) > 15:
        print(f"  ... and {len(possibly_unused_custom_css) - 15} more.")

if __name__ == "__main__":
    main()
