#!/usr/bin/env python3
"""
Custom Tool 5: Garbage Collection & Hot-Path Performance Analyzer
Scans utility and game loop files in src/utils/ for array allocation anti-patterns (.map(), .filter(), Object.values())
that create garbage collection pressure in high-frequency loops.
"""

import os
import re
import sys

def check_gc_pressure(src_dir="src/utils"):
    results = []
    # Pattern matching array allocations or Object.values/entries inside functions
    map_filter_pattern = re.compile(r'\.(?:map|filter|reduce|flatMap)\s*\(')
    obj_values_pattern = re.compile(r'Object\.(?:values|entries)\s*\(')

    for root, _, files in os.walk(src_dir):
        for f in files:
            if f.endswith(".ts") or f.endswith(".tsx"):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                    lines = file.readlines()
                    for idx, line in enumerate(lines, start=1):
                        if map_filter_pattern.search(line) or obj_values_pattern.search(line):
                            results.append((filepath, idx, line.strip()))

    return results

def main():
    print("=== Garbage Collection & Hot-Path Performance Audit Tool ===")
    results = check_gc_pressure()

    print(f"Total Allocating Functional Calls in src/utils/: {len(results)}")
    print("\nSample High-Frequency Candidates for Procedural Loop Refactoring:")
    for filepath, line_num, content in results[:12]:
        print(f"  [{filepath}:{line_num}] -> {content}")
    if len(results) > 12:
        print(f"  ... and {len(results) - 12} more.")

if __name__ == "__main__":
    main()
