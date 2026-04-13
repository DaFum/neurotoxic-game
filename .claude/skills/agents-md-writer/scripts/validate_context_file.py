#!/usr/bin/env python3
"""
Validate AGENTS.md / CLAUDE.md / CODEX.md context files against research-backed quality criteria.

Usage:
    python validate_context_file.py <path-to-context-file> [--readme <path-to-readme>] [--json] [--strict]

Checks:
    1. Codebase overviews and directory listings (anti-pattern)
    2. README duplication (if README path provided)
    3. Generic coding advice
    4. Technology descriptions agents can discover from package files
    5. Word count (warns >500, errors >1000)
    6. Vague instructions without actionable specifics
    7. Discoverable/standard commands
    8. Empty sections
    9. Structural issues
"""

import argparse
import json
import re
import sys
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class Issue:
    severity: str  # "error", "warning", "info"
    check: str
    message: str
    line: Optional[int] = None
    suggestion: Optional[str] = None


@dataclass
class ValidationResult:
    file_path: str
    word_count: int
    line_count: int
    section_count: int
    issues: list = field(default_factory=list)
    passed: bool = True

    def add(self, issue: Issue):
        self.issues.append(issue)
        if issue.severity == "error":
            self.passed = False


# --- Pattern Definitions ---

DIRECTORY_LISTING_PATTERNS = [
    # Markdown tree-style listings
    r'^\s*[-*]\s+`?[\w./]+/?`?\s*[—–-]+\s+\w',  # "- `src/` — Source code"
    r'^\s*[-*]\s+`?[\w./]+/?`?\s*:\s+\w',          # "- src/: Source code"
    r'^\s*[├└│─]+',                                  # Box-drawing characters
    r'^\s*\|?\s*[-*]\s+`?[\w./]+/`?$',              # Bare directory names as list items
]

CODEBASE_OVERVIEW_HEADERS = [
    r'(?i)^#+\s*(project\s+)?structure',
    r'(?i)^#+\s*directory\s+(layout|structure|overview)',
    r'(?i)^#+\s*codebase\s+(overview|structure|layout)',
    r'(?i)^#+\s*folder\s+structure',
    r'(?i)^#+\s*file\s+structure',
    r'(?i)^#+\s*overview$',
    r'(?i)^#+\s*about\s+(this\s+)?(project|repo)',
    r'(?i)^#+\s*what\s+(is|does)\s+this',
    r'(?i)^#+\s*introduction$',
]

GENERIC_ADVICE_PATTERNS = [
    r'(?i)\b(write|ensure|make sure to write)\s+(clean|readable|maintainable|well[- ]structured)\s+(code|software)',
    r'(?i)\bfollow\s+(best\s+practices|solid\s+principles|dry\s+principle|kiss\s+principle)',
    r'(?i)\bkeep\s+(code|functions|methods)\s+(simple|short|small|clean)',
    r'(?i)\b(add|write|include)\s+(meaningful|helpful|good)\s+(comments|documentation)',
    r'(?i)\buse\s+meaningful\s+(variable|function|method)\s+names',
    r'(?i)\b(handle|manage)\s+errors?\s+(properly|gracefully|appropriately)',
    r'(?i)\bwrite\s+tests?\s+for\s+(new|all|every)\s+(features?|code|changes?)',
    r'(?i)\bfollow\s+pep\s*8',
    r'(?i)\buse\s+type\s+(hints?|annotations?)\s+(for|on|in)\s+(all|every)',
    r'(?i)\b(always\s+)?review\s+(your\s+)?(code|changes)\s+before',
    r'(?i)\bkeep\s+(dependencies|packages)\s+up\s+to\s+date',
    r'(?i)\bdon\'?t\s+repeat\s+yourself',
    r'(?i)\bsingle\s+responsibility\s+principle',
]

TECH_DESCRIPTION_PATTERNS = [
    r'(?i)\b(this\s+)?(project|app|application|repo|repository)\s+(is\s+)?(built|made|created|developed|written)\s+(with|using|in)\b',
    r'(?i)\b(we|this\s+project)\s+use[sd]?\s+(react|vue|angular|next\.?js|express|fastapi|django|flask|spring)\b',
    r'(?i)\b(the\s+)?(frontend|backend|server|client)\s+(is|uses)\s+(built\s+)?(with|in|on)\b',
    r'(?i)\b(powered|driven)\s+by\s+\w+',
]

VAGUE_INSTRUCTION_PATTERNS = [
    r'(?i)\bmake\s+sure\s+(to\s+)?(handle|manage|deal\s+with|address)',
    r'(?i)\b(be\s+)?careful\s+(with|about|when)',
    r'(?i)\bensure\s+(proper|good|correct)\s+\w+',
    r'(?i)\btry\s+to\s+(keep|maintain|ensure)',
    r'(?i)\bconsider\s+(using|adding|implementing)',
    r'(?i)\b(it\'?s|is)\s+important\s+to\b',
    r'(?i)\bwhen\s+possible,?\s+(try\s+to\s+)?',
    r'(?i)\b(should|must)\s+be\s+(properly|correctly|appropriately)\s+(handled|managed|implemented)',
]

DISCOVERABLE_COMMANDS = [
    r'(?i)^\s*[-*]\s*`?git\s+clone\b',
    r'(?i)^\s*[-*]\s*`?cd\s+',
    r'(?i)^\s*[-*]\s*`?pip\s+install\s+-r\s+requirements',
    r'(?i)^\s*[-*]\s*`?pip\s+install\s+-e\s+\.',
    r'(?i)^\s*[-*]\s*`?npm\s+install`?\s*$',
    r'(?i)^\s*[-*]\s*`?yarn\s+install`?\s*$',
    r'(?i)^\s*[-*]\s*`?pnpm\s+install`?\s*$',
    r'(?i)^\s*[-*]\s*`?pytest`?\s*$',
    r'(?i)^\s*[-*]\s*`?npm\s+test`?\s*$',
    r'(?i)^\s*[-*]\s*`?npm\s+run\s+test`?\s*$',
    r'(?i)^\s*[-*]\s*`?python\s+-m\s+pytest`?\s*$',
    r'(?i)^\s*[-*]\s*`?cargo\s+test`?\s*$',
    r'(?i)^\s*[-*]\s*`?go\s+test\s+\./\.\.\.`?\s*$',
    r'(?i)^\s*[-*]\s*`?make`?\s*$',
    r'(?i)^\s*[-*]\s*`?black\s+\.`?\s*$',
    r'(?i)^\s*[-*]\s*`?prettier\b',
]


def count_words(text: str) -> int:
    """Count words in text, excluding code blocks and frontmatter."""
    # Remove YAML frontmatter
    text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.DOTALL)
    # Remove code blocks
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    # Remove inline code
    text = re.sub(r'`[^`]+`', '', text)
    # Remove markdown headers markers
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    # Remove list markers
    text = re.sub(r'^\s*[-*]\s+', '', text, flags=re.MULTILINE)
    return len(text.split())


def strip_fenced_blocks(lines: list[str]) -> list[str]:
    """Return lines with content inside fenced code blocks replaced by blank lines to preserve indexing."""
    result = []
    in_fence = False
    fence_char = None
    fence_length = 0
    for line in lines:
        if not in_fence:
            opener_match = re.match(r'^[ ]{0,3}(`{3,}|~{3,})[^\n]*$', line)
            if opener_match:
                in_fence = True
                fence_str = opener_match.group(1)
                fence_char = fence_str[0]
                fence_length = len(fence_str)
                result.append("") # Replace opening fence
                continue
        elif in_fence:
            # Check for closing fence matching the opener char and length minimum
            closer_match = re.match(rf'^[ ]{{0,3}}{re.escape(fence_char)}{{{fence_length},}}[ \t]*$', line)
            if closer_match:
                in_fence = False
                result.append("") # Replace closing fence
                continue

        if in_fence:
            result.append("") # Replace content inside fence
        else:
            result.append(line)

    return result


def get_sections(lines: list[str]) -> dict[str, tuple[int, int]]:
    """Map section headers to their line ranges."""
    sections = {}
    current_header = None
    current_start = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('#'):
            if current_header:
                sections[current_header] = (current_start, i)
            current_header = stripped
            current_start = i
    if current_header:
        sections[current_header] = (current_start, len(lines))
    return sections


def find_empty_sections(lines: list[str]) -> list[tuple[int, str]]:
    """Find sections with no content between header and next header."""
    empty = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('#'):
            # Look ahead for content (skip blank lines)
            has_content = False
            for j in range(i + 1, len(lines)):
                ahead_stripped = lines[j].strip()
                if ahead_stripped.startswith('#'):
                    break  # Hit next header
                if ahead_stripped and not ahead_stripped.startswith('<!--'):
                    has_content = True
                    break
            if not has_content:
                empty.append((i + 1, stripped))
    return empty


def check_readme_duplication(unfenced_lines: list[str], readme_path: str) -> list[Issue]:
    """Check for content duplicated from README."""
    issues = []
    try:
        readme = Path(readme_path).read_text(encoding='utf-8')
    except (FileNotFoundError, PermissionError):
        return issues

    # Extract meaningful sentences from README (>6 words)
    readme_sentences = set()
    readme_unfenced = strip_fenced_blocks(readme.split('\n'))

    for line in readme_unfenced:
        stripped = line.strip()
        if len(stripped.split()) > 6 and not stripped.startswith('#'):
            # Normalize whitespace
            normalized = ' '.join(stripped.lower().split())
            readme_sentences.add(normalized)

    for i, line in enumerate(unfenced_lines):
        stripped = line.strip()
        if len(stripped.split()) > 6 and not stripped.startswith('#'):
            normalized = ' '.join(stripped.lower().split())
            if normalized in readme_sentences:
                issues.append(Issue(
                    severity="error",
                    check="readme_duplication",
                    message=f"This line appears to be duplicated from README.md",
                    line=i + 1,
                    suggestion="Remove content that exists in README. Agents read README.md on their own."
                ))
    return issues


def validate(file_path: str, readme_path: Optional[str] = None) -> ValidationResult:
    """Run all validation checks on a context file."""
    path = Path(file_path)
    content = path.read_text(encoding='utf-8')
    lines = content.split('\n')

    # Strip frontmatter for analysis
    body = content
    frontmatter_count = 0
    fm_match = re.match(r'^---\s*\n.*?\n^---\s*$', content, flags=re.DOTALL | re.MULTILINE)
    if fm_match:
        end = fm_match.end()
        frontmatter_content = content[:end]
        after_fm = content[end:]
        stripped_count = len(after_fm) - len(after_fm.lstrip('\n'))
        frontmatter_count = frontmatter_content.count('\n') + stripped_count
        body = content[end:].lstrip('\n')

    body_lines = body.split('\n')
    unfenced_lines = strip_fenced_blocks(body_lines)
    word_count = count_words('\n'.join(unfenced_lines))
    sections = get_sections(unfenced_lines)

    result = ValidationResult(
        file_path=str(path),
        word_count=word_count,
        line_count=len(body_lines),
        section_count=len(sections),
    )

    # --- Check 1: Codebase overviews ---
    for i, line in enumerate(unfenced_lines):
        if not line: continue
        for pattern in CODEBASE_OVERVIEW_HEADERS:
            if re.match(pattern, line):
                result.add(Issue(
                    severity="error",
                    check="codebase_overview",
                    message=f"Section header suggests a codebase overview: '{line.strip()}'",
                    line=i + 1 + frontmatter_count,
                    suggestion="Remove codebase overviews. Research shows they don't help agents find files faster."
                ))

    # --- Check 2: Directory listings ---
    listing_streak = 0
    for i, line in enumerate(unfenced_lines):
        if not line:
            listing_streak = 0
            continue

        is_listing = False
        for pattern in DIRECTORY_LISTING_PATTERNS:
            if re.match(pattern, line):
                is_listing = True
                break
        if is_listing:
            listing_streak += 1
            if listing_streak >= 3:
                result.add(Issue(
                    severity="error",
                    check="directory_listing",
                    message=f"Directory listing detected (3+ consecutive entries near line {i + 1 + frontmatter_count})",
                    line=i + 1 + frontmatter_count,
                    suggestion="Remove directory listings. Agents can explore the filesystem themselves."
                ))
                listing_streak = 0  # Don't flag again immediately
        else:
            listing_streak = 0

    # --- Check 3: Generic coding advice ---
    for i, line in enumerate(unfenced_lines):
        if not line: continue
        for pattern in GENERIC_ADVICE_PATTERNS:
            if re.search(pattern, line):
                result.add(Issue(
                    severity="warning",
                    check="generic_advice",
                    message=f"Generic coding advice detected: '{line.strip()[:80]}...'",
                    line=i + 1 + frontmatter_count,
                    suggestion="Remove generic advice. Only include project-specific, actionable instructions."
                ))
                break  # One match per line is enough

    # --- Check 4: Technology descriptions ---
    for i, line in enumerate(unfenced_lines):
        if not line: continue
        # Skip if inside a code block (inline)
        if line.strip().startswith('`'):
            continue
        for pattern in TECH_DESCRIPTION_PATTERNS:
            if re.search(pattern, line):
                result.add(Issue(
                    severity="warning",
                    check="tech_description",
                    message=f"Technology description that agents can discover: '{line.strip()[:80]}...'",
                    line=i + 1 + frontmatter_count,
                    suggestion="Remove tech stack descriptions. Agents read package.json/pyproject.toml/Cargo.toml."
                ))
                break

    # --- Check 5: Word count ---
    if word_count > 1000:
        result.add(Issue(
            severity="error",
            check="word_count",
            message=f"File is {word_count} words — research shows files over 1000 words significantly hurt performance",
            suggestion="Aggressively trim. Aim for 200-400 words. Use imports or subdirectory files for overflow."
        ))
    elif word_count > 500:
        result.add(Issue(
            severity="warning",
            check="word_count",
            message=f"File is {word_count} words — consider trimming (optimal range: 200-400 words)",
            suggestion="Review each instruction against the Golden Rule. Cut anything an agent can discover on its own."
        ))

    # --- Check 6: Vague instructions ---
    for i, line in enumerate(unfenced_lines):
        if not line: continue
        for pattern in VAGUE_INSTRUCTION_PATTERNS:
            if re.search(pattern, line):
                result.add(Issue(
                    severity="warning",
                    check="vague_instruction",
                    message=f"Vague instruction: '{line.strip()[:80]}...'",
                    line=i + 1 + frontmatter_count,
                    suggestion="Make specific and actionable, or remove entirely."
                ))
                break

    # --- Check 7: Discoverable commands ---
    for i, line in enumerate(unfenced_lines):
        if not line: continue
        for pattern in DISCOVERABLE_COMMANDS:
            if re.match(pattern, line):
                result.add(Issue(
                    severity="warning",
                    check="discoverable_command",
                    message=f"Standard command agents already know: '{line.strip()[:80]}'",
                    line=i + 1 + frontmatter_count,
                    suggestion="Only include commands that differ from what agents would naturally try."
                ))
                break

    # --- Check 8: Empty sections ---
    for line_num, header in find_empty_sections(unfenced_lines):
        result.add(Issue(
            severity="info",
            check="empty_section",
            message=f"Empty section: '{header}'",
            line=line_num + frontmatter_count,
            suggestion="Remove empty sections — they add noise without value."
        ))

    # --- Check 9: README duplication ---
    if readme_path:
        for issue in check_readme_duplication(unfenced_lines, readme_path):
            if issue.line is not None:
                issue.line += frontmatter_count
            result.add(issue)

    return result


def format_text(result: ValidationResult) -> str:
    """Format validation result as human-readable text."""
    lines = []
    lines.append(f"{'=' * 60}")
    lines.append(f"Validation: {result.file_path}")
    lines.append(f"{'=' * 60}")
    lines.append(f"Words: {result.word_count} | Lines: {result.line_count} | Sections: {result.section_count}")
    lines.append("")

    errors = [i for i in result.issues if i.severity == "error"]
    warnings = [i for i in result.issues if i.severity == "warning"]
    infos = [i for i in result.issues if i.severity == "info"]

    if not result.issues:
        lines.append("✅ All checks passed! File looks good.")
        return '\n'.join(lines)

    if errors:
        lines.append(f"❌ ERRORS ({len(errors)}):")
        for issue in errors:
            loc = f" (line {issue.line})" if issue.line else ""
            lines.append(f"  [{issue.check}]{loc}: {issue.message}")
            if issue.suggestion:
                lines.append(f"    → {issue.suggestion}")
        lines.append("")

    if warnings:
        lines.append(f"⚠️  WARNINGS ({len(warnings)}):")
        for issue in warnings:
            loc = f" (line {issue.line})" if issue.line else ""
            lines.append(f"  [{issue.check}]{loc}: {issue.message}")
            if issue.suggestion:
                lines.append(f"    → {issue.suggestion}")
        lines.append("")

    if infos:
        lines.append(f"ℹ️  INFO ({len(infos)}):")
        for issue in infos:
            loc = f" (line {issue.line})" if issue.line else ""
            lines.append(f"  [{issue.check}]{loc}: {issue.message}")
            if issue.suggestion:
                lines.append(f"    → {issue.suggestion}")
        lines.append("")

    status = "❌ FAILED" if not result.passed else "✅ PASSED (with warnings)"
    lines.append(f"Result: {status} — {len(errors)} errors, {len(warnings)} warnings, {len(infos)} info")
    return '\n'.join(lines)


def format_json(result: ValidationResult) -> str:
    """Format validation result as JSON."""
    data = {
        "file_path": result.file_path,
        "word_count": result.word_count,
        "line_count": result.line_count,
        "section_count": result.section_count,
        "passed": result.passed,
        "summary": {
            "errors": len([i for i in result.issues if i.severity == "error"]),
            "warnings": len([i for i in result.issues if i.severity == "warning"]),
            "info": len([i for i in result.issues if i.severity == "info"]),
        },
        "issues": [asdict(i) for i in result.issues],
    }
    return json.dumps(data, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="Validate AI agent context files (AGENTS.md, CLAUDE.md, etc.)"
    )
    parser.add_argument("file", help="Path to the context file to validate")
    parser.add_argument("--readme", help="Path to README.md for duplication checking")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")

    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    # Auto-detect README if not provided
    readme_path = args.readme
    if not readme_path:
        candidate = Path(args.file).parent / "README.md"
        if candidate.exists():
            readme_path = str(candidate)

    result = validate(args.file, readme_path)

    if args.strict:
        for issue in result.issues:
            if issue.severity == "warning":
                issue.severity = "error"
                result.passed = False

    if args.json:
        print(format_json(result))
    else:
        print(format_text(result))

    sys.exit(0 if result.passed else 1)


if __name__ == "__main__":
    main()
