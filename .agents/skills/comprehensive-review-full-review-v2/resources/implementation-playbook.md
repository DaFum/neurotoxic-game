# Comprehensive review playbook

Use this playbook after establishing the target and its permissions. Treat the original role names and configuration labels in the preserved upstream reference as suggestions, not installed commands or guarantees.

## Review phases

1. **Quality and architecture:** inspect complexity, coupling, interfaces, data ownership, dependencies, and applicable design invariants. Carry relevant findings into later phases.
2. **Security and performance:** trace trust boundaries, input validation, secrets handling, and deployment configuration. Inspect likely CPU, memory, I/O, and lifecycle bottlenecks. Profile only when feasible and authorized; otherwise label findings as static observations.
3. **Tests and documentation:** examine tests for affected boundaries, meaningful assertions, isolation, and critical flows; compare documentation with observed implementation. Measure coverage only if an appropriate tool and inputs are available.
4. **Language practices and delivery:** inspect applicable framework and language practices, build and deployment configuration, and relevant operational controls. Avoid applying server or enterprise checklists where they do not fit.

If authorized agents and matching tools exist, assign bounded, non-overlapping scopes and consolidate their evidence. If agents or scanners are unavailable, perform a direct or sequential review and identify skipped checks. Obtain authorization before any external upload or intrusive probe.

## Options

The upstream labels `--security-focus`, `--performance-critical`, `--tdd-review`, `--ai-assisted`, `--strict-mode`, `--metrics-report`, and `--framework` express review preferences. Interpret a requested preference within the host's available capabilities; do not imply these are executable flags. A metrics report needs measured data, and strict mode needs an explicitly defined failure threshold.

## Handoff

List issues in severity order with reproducible conditions, impact, evidence, and remediation. Summarize what was inspected, passing and failing checks, skipped or blocked areas, and uncertainties. Explain which source revision and files were examined. Do not certify compliance or assert that all vulnerabilities were found.
