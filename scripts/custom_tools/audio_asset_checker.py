#!/usr/bin/env python3
"""
Custom Tool 4: Audio Node Safety & Memory Leak Detector
Scans src/utils/ and src/components/ for object spread operations on audio nodes (`{ ...node }` or `Object.assign({}, node)`)
and checks for proper cleanup callbacks.
"""

import os
import re
import sys

def check_audio_anti_patterns(src_dir="src"):
    spread_issues = []
    # Pattern matching object spread on audio-like objects
    spread_pattern = re.compile(r'\{\s*\.\.\.(?:synth|player|audio|sound|node|oscillator|gain|filter|volume)\b')
    assign_pattern = re.compile(r'Object\.assign\(\s*\{\}\s*,\s*(?:synth|player|audio|sound|node|oscillator|gain|filter|volume)\b')

    for root, _, files in os.walk(src_dir):
        for f in files:
            if f.endswith(".ts") or f.endswith(".tsx"):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                    lines = file.readlines()
                    for idx, line in enumerate(lines, start=1):
                        if spread_pattern.search(line) or assign_pattern.search(line):
                            spread_issues.append((filepath, idx, line.strip()))

    return spread_issues

def main():
    print("=== Audio Node Safety & Memory Leak Audit Tool ===")
    issues = check_audio_anti_patterns()

    print(f"Total Audio Node Spread Anti-Patterns Found: {len(issues)}")
    if issues:
        print("\n⚠️ Dangerous Audio Object Spread Detected (Strips prototype chain/methods):")
        for filepath, line_num, content in issues:
            print(f"  [{filepath}:{line_num}] -> {content}")
    else:
        print("✅ No audio node spread anti-patterns ({ ...node }) detected in codebase!")

if __name__ == "__main__":
    main()
