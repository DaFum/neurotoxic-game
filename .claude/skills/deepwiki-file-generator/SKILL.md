<!-- TODO: Implement this -->
---
name: deepwiki-file-generator
description: >
  Generate and improve `.devin/wiki.json` files that steer DeepWiki documentation for repositories.
  Use this skill whenever the user mentions DeepWiki, wiki.json, Devin wiki, repository documentation generation,
  or wants to control how their codebase gets auto-documented. Also trigger when users say things like
  "document my repo", "generate wiki config", "improve my wiki structure", "my DeepWiki is missing pages",
  or reference `.devin/wiki.json` in any way. Works for both creating new configs from scratch and
  improving existing ones.
---

# DeepWiki wiki.json Generator

Generate `.devin/wiki.json` files that steer Devin's DeepWiki documentation generation for repositories.

## When This Skill Applies

- User wants to create a new `.devin/wiki.json` for a repository
- User wants to improve an existing `.devin/wiki.json`
- User's DeepWiki is missing important parts of their codebase
- User wants to restructure their auto-generated wiki
- User mentions DeepWiki, Devin wiki, or repository documentation steering

## Workflow

### Step 1: Determine Context

Ask or infer:

1. **New or existing?** — Is there already a `.devin/wiki.json` in the repo?
2. **Standard or Enterprise?** — Default to Standard limits unless user specifies Enterprise.
3. **Repo access** — Does the user have repo files uploaded, or are they describing the structure verbally?
4. **Pain points** — If improving, what's wrong with the current wiki? Missing areas? Wrong structure? Too vague?

### Step 2: Analyze the Repository

If repo files or structure are available, examine them to understand:

- Top-level directory structure and what each folder contains
- Key technologies and frameworks used
- Critical components vs. boilerplate/generated code
- Relationships between components (frontend ↔ backend, shared types, etc.)
- Areas that an auto-planner would likely miss (small but critical dirs, config-heavy areas, cross-cutting concerns)

If no repo access, interview the user about their codebase structure, priorities, and what should/shouldn't be documented.

### Step 3: Decide Strategy

Choose the right approach based on the situation:

**repo_notes only** (recommended first pass):

- Use when the repo is small-to-medium and auto-planning mostly works
- Use when user just wants to emphasize or de-emphasize certain areas
- Use when user is unsure what pages they need

**repo_notes + explicit pages** (full control):

- Use when the repo is large and hitting auto-planning limits
- Use when user needs a specific documentation hierarchy
- Use when previous auto-generated wiki had significant structural problems
- CRITICAL: When `pages` is provided, ONLY those pages get generated — list ALL desired pages, not just missing ones

### Step 4: Generate the wiki.json

Follow these rules when generating:

**For repo_notes:**

- Write them as strategic guidance to the documentation generator
- Mention priority folders/components explicitly by path
- Explain relationships that the system might miss
- State what to ignore (legacy code, generated files, test fixtures)
- Keep each note focused; consolidate related guidance into fewer, longer notes

**For pages:**

- Use descriptive, unique titles
- Write specific `purpose` fields that reference actual directories, files, and concepts
- Build logical hierarchies with `parent` fields
- Add `page_notes` only for pages needing surgical precision (extra context, things to ignore, specific focus areas)
- Stay within limits (see Quick Reference below)

**Purpose field quality matters enormously.** Compare:

- Bad: `"Document the API"` — too vague, generates generic content
- Good: `"Document REST endpoints in /api/v2/, including request/response formats, authentication requirements, rate limits, and error codes. Focus on the user and order resources."` — specific, actionable

### Step 5: Validate and Deliver

Run the validation script (see `scripts/validate_wiki_json.py`) to check:

- Page count within limits
- Total notes within limits
- Character limits per note
- Unique, non-empty titles
- Valid parent references (parent titles must exist as page titles)
- Valid JSON structure

Deliver the file and explain:

- What strategy was chosen and why
- Key decisions made in the structure
- Suggested next steps (commit, regenerate wiki, evaluate, iterate)

---

## Quick Reference: Limits

| Limit                   | Standard                                   | Enterprise |
| ----------------------- | ------------------------------------------ | ---------- |
| Max pages               | 30                                         | 80         |
| Max total notes         | 100 (repo_notes + all page_notes combined) | 100        |
| Max characters per note | 10,000                                     | 10,000     |
| Page titles             | Must be unique and non-empty               | Same       |

---

## JSON Schema

```json
{
  "repo_notes": [
    {
      "content": "string (required, max 10,000 chars)",
      "author": "string (optional)"
    }
  ],
  "pages": [
    {
      "title": "string (required, unique, non-empty)",
      "purpose": "string (required)",
      "parent": "string or null (optional, must match another page's title)",
      "page_notes": [
        {
          "content": "string (required, max 10,000 chars)",
          "author": "string (optional)"
        }
      ]
    }
  ]
}
```

---

## Critical Rules

1. **pages is all-or-nothing.** When present, it bypasses automatic planning entirely. Only listed pages get generated. Never add "just the missing pages" — include ALL desired pages.

2. **Start simple, iterate up.** Recommend `repo_notes` only as a first pass. Add explicit `pages` only if auto-generation misses critical areas after regenerating.

3. **repo_notes are strategic.** Think of them as a system prompt for the documentation generator. Prioritize, de-prioritize, explain relationships, highlight what matters.

4. **page_notes are surgical.** Use them sparingly for pages that need extra context the `purpose` field alone can't convey.

5. **Validate before committing.** Always run validation to catch structural issues before the user commits and triggers regeneration.

6. **Iterative refinement workflow:**
   - Pass 1: `repo_notes` only → regenerate → evaluate
   - Pass 2: Switch to explicit `pages` and provide the complete desired page set (remember the all-or-nothing rule for `pages` to avoid incremental additions)
   - Pass 3: Add `page_notes` for pages needing refinement
   - Commit and regenerate after each pass

---

## Common Patterns

### Large Monorepo

Use `repo_notes` to establish priorities and ignore irrelevant directories:

```json
{
  "repo_notes": [
    {
      "content": "Monorepo with 3 critical packages: /packages/core (highest priority — business logic), /packages/ui (medium — component library), /services/api (medium — REST API). Ignore /legacy/, /scripts/, /tools/, and /node_modules/ entirely. The /packages/shared/ directory contains TypeScript types used across all packages — document the cross-package type contracts."
    }
  ]
}
```

### Microservices

Create a page per service with a shared overview:

```json
{
  "repo_notes": [
    {
      "content": "Microservices architecture. Each service in /services/ is independently deployable. Shared libraries in /libs/. Inter-service communication uses gRPC (defined in /proto/). Document service boundaries and API contracts between services."
    }
  ],
  "pages": [
    {
      "title": "System Architecture",
      "purpose": "Overview of microservices topology, communication patterns, and deployment model"
    },
    {
      "title": "User Service",
      "purpose": "User management in /services/user/, including auth flows, profile management, and gRPC endpoints",
      "parent": "System Architecture"
    },
    {
      "title": "Order Service",
      "purpose": "Order processing in /services/order/, including state machine, payment integration, and event publishing",
      "parent": "System Architecture"
    },
    {
      "title": "Shared Libraries",
      "purpose": "Common utilities in /libs/ used across services, including logging, error handling, and middleware",
      "parent": "System Architecture"
    },
    {
      "title": "Proto Definitions",
      "purpose": "gRPC service definitions in /proto/, message types, and inter-service contracts",
      "parent": "System Architecture"
    }
  ]
}
```

### Frontend Application

Organize around user-facing concerns:

```json
{
  "pages": [
    {
      "title": "Application Overview",
      "purpose": "High-level architecture of the React application in /src/, routing structure, and build configuration"
    },
    {
      "title": "Component Library",
      "purpose": "Reusable UI components in /src/components/, their props interfaces, composition patterns, and Storybook usage",
      "parent": "Application Overview"
    },
    {
      "title": "State Management",
      "purpose": "Redux store in /src/store/, slice patterns, async thunks, selectors, and data flow",
      "parent": "Application Overview"
    },
    {
      "title": "API Integration",
      "purpose": "API client layer in /src/api/, request/response types, error handling, and caching strategy",
      "parent": "Application Overview"
    },
    {
      "title": "Authentication",
      "purpose": "Auth flow spanning /src/auth/ and /src/api/auth/, including JWT handling, refresh tokens, and protected routes",
      "parent": "Application Overview"
    }
  ]
}
```

---

## Troubleshooting

| Problem                                 | Likely Cause                        | Solution                                                                             |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| Only some folders documented            | Large repo hit auto-planning limits | Add `repo_notes` emphasizing missing areas; if insufficient, define explicit `pages` |
| Important components missing            | Auto-planner didn't prioritize them | Add specific pages with clear purposes; use `repo_notes` to highlight importance     |
| Wiki structure doesn't match team needs | Auto-generated structure            | Define explicit `pages` array with preferred hierarchy                               |
| Too much detail on unimportant areas    | No guidance provided                | Use `repo_notes` to explicitly deprioritize certain folders                          |
| Pages exist but content is wrong        | Vague `purpose` field               | Rewrite `purpose` with specific directories, concepts, and scope                     |
| Added pages but others disappeared      | `pages` is all-or-nothing           | Include ALL desired pages in the array, not just new ones                            |

---

## Reference

- [Official DeepWiki Documentation](https://docs.devin.ai/work-with-devin/deepwiki)
- Public repos can use [deepwiki.com](https://deepwiki.com/) — replace `github.com` with `deepwiki.com` in any repo URL
- For private repos, DeepWiki is available through [Devin](https://app.devin.ai/wiki)
