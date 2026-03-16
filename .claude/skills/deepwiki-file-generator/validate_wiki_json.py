#!/usr/bin/env python3
# TODO: Implement this
"""
Validate a .devin/wiki.json file against DeepWiki's constraints.

Usage:
    python validate_wiki_json.py <path-to-wiki.json> [--enterprise]

Exit codes:
    0 = valid
    1 = invalid (errors printed to stderr)
    2 = file not found or not valid JSON
"""

import json
import sys
import os


def validate_wiki_json(data: dict, enterprise: bool = False) -> list[str]:
    """Validate wiki.json structure and return list of error messages."""
    errors = []
    warnings = []

    max_pages = 80 if enterprise else 30
    max_total_notes = 100
    max_note_chars = 10_000
    tier = "Enterprise" if enterprise else "Standard"

    # --- Top-level structure ---
    if not isinstance(data, dict):
        return ["Root must be a JSON object"], []

    allowed_keys = {"repo_notes", "pages"}
    unknown = set(data.keys()) - allowed_keys
    if unknown:
        warnings.append(f"Unknown top-level keys (will be ignored): {unknown}")

    # --- repo_notes validation ---
    total_notes = 0
    repo_notes = data.get("repo_notes", [])
    if not isinstance(repo_notes, list):
        errors.append("repo_notes must be an array")
    else:
        for i, note in enumerate(repo_notes):
            if not isinstance(note, dict):
                errors.append(f"repo_notes[{i}]: must be an object")
                continue
            if "content" not in note:
                errors.append(f"repo_notes[{i}]: missing required 'content' field")
            elif not isinstance(note["content"], str):
                errors.append(f"repo_notes[{i}]: 'content' must be a string")
            elif len(note["content"]) == 0:
                errors.append(f"repo_notes[{i}]: 'content' must not be empty")
            elif len(note["content"]) > max_note_chars:
                errors.append(
                    f"repo_notes[{i}]: content is {len(note['content']):,} chars "
                    f"(max {max_note_chars:,})"
                )
            if "author" in note and not isinstance(note.get("author"), str):
                errors.append(f"repo_notes[{i}]: 'author' must be a string if provided")
            total_notes += 1

    # --- pages validation ---
    pages = data.get("pages", [])
    if not isinstance(pages, list):
        errors.append("pages must be an array")
    else:
        if len(pages) > max_pages:
            errors.append(
                f"Too many pages: {len(pages)} (max {max_pages} for {tier})"
            )

        titles = []
        title_set = set()
        for i, page in enumerate(pages):
            if not isinstance(page, dict):
                errors.append(f"pages[{i}]: must be an object")
                continue

            # title
            title = page.get("title")
            if title is None:
                errors.append(f"pages[{i}]: missing required 'title' field")
            elif not isinstance(title, str):
                errors.append(f"pages[{i}]: 'title' must be a string")
            elif len(title.strip()) == 0:
                errors.append(f"pages[{i}]: 'title' must not be empty")
            else:
                if title in title_set:
                    errors.append(f"pages[{i}]: duplicate title '{title}'")
                title_set.add(title)
                titles.append(title)

            # purpose
            if "purpose" not in page:
                errors.append(f"pages[{i}]: missing required 'purpose' field")
            elif not isinstance(page["purpose"], str):
                errors.append(f"pages[{i}]: 'purpose' must be a string")
            elif len(page["purpose"].strip()) == 0:
                errors.append(f"pages[{i}]: 'purpose' must not be empty")

            # parent
            parent = page.get("parent")
            if parent is not None:
                if not isinstance(parent, str):
                    errors.append(f"pages[{i}]: 'parent' must be a string or null")
                # We'll check parent references after collecting all titles

            # page_notes
            page_notes = page.get("page_notes", [])
            if not isinstance(page_notes, list):
                errors.append(f"pages[{i}]: 'page_notes' must be an array")
            else:
                for j, note in enumerate(page_notes):
                    if not isinstance(note, dict):
                        errors.append(f"pages[{i}].page_notes[{j}]: must be an object")
                        continue
                    if "content" not in note:
                        errors.append(
                            f"pages[{i}].page_notes[{j}]: missing required 'content'"
                        )
                    elif not isinstance(note["content"], str):
                        errors.append(
                            f"pages[{i}].page_notes[{j}]: 'content' must be a string"
                        )
                    elif len(note["content"]) == 0:
                        errors.append(
                            f"pages[{i}].page_notes[{j}]: 'content' must not be empty"
                        )
                    elif len(note["content"]) > max_note_chars:
                        errors.append(
                            f"pages[{i}].page_notes[{j}]: content is "
                            f"{len(note['content']):,} chars (max {max_note_chars:,})"
                        )
                    total_notes += 1

        # Check parent references
        for i, page in enumerate(pages):
            if not isinstance(page, dict):
                continue
            parent = page.get("parent")
            if parent and isinstance(parent, str) and parent not in title_set:
                errors.append(
                    f"pages[{i}]: parent '{parent}' does not match any page title"
                )

        # Check for circular parent references
        parent_map = {}
        for page in pages:
            if isinstance(page, dict) and isinstance(page.get("title"), str):
                parent_map[page["title"]] = page.get("parent")

        for title in parent_map:
            visited = set()
            current = title
            while current and current in parent_map:
                if current in visited:
                    errors.append(f"Circular parent reference detected involving '{title}'")
                    break
                visited.add(current)
                current = parent_map.get(current)

    # --- Total notes check ---
    if total_notes > max_total_notes:
        errors.append(
            f"Total notes: {total_notes} (max {max_total_notes}). "
            f"This includes repo_notes + all page_notes across all pages."
        )

    return errors, warnings


def main():
    enterprise = "--enterprise" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    if not args:
        print("Usage: python validate_wiki_json.py <path-to-wiki.json> [--enterprise]")
        sys.exit(2)

    path = args[0]
    if not os.path.exists(path):
        print(f"Error: File not found: {path}", file=sys.stderr)
        sys.exit(2)

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(2)

    tier = "Enterprise" if enterprise else "Standard"
    errors, warnings = validate_wiki_json(data, enterprise=enterprise)

    # Summary
    page_count = len(data.get("pages", []))
    note_count = len(data.get("repo_notes", []))
    page_note_count = sum(
        len(p.get("page_notes", []))
        for p in data.get("pages", [])
        if isinstance(p, dict)
    )
    total_notes = note_count + page_note_count
    max_pages = 80 if enterprise else 30

    print(f"=== DeepWiki wiki.json Validation ({tier}) ===")
    print(f"Pages:       {page_count}/{max_pages}")
    print(f"Total notes: {total_notes}/100 (repo: {note_count}, page: {page_note_count})")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠ {w}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
        print(f"\nResult: INVALID")
        sys.exit(1)
    else:
        print(f"\nResult: VALID ✓")
        sys.exit(0)


if __name__ == "__main__":
    main()
