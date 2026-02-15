# Building Skill for Claude: A Comprehensive Summary

This document summarizes the key concepts and best practices from "The Complete Guide to Building Skill for Claude".

## 1. Core Principles

### Skill Definition

A skill is a package that extends Claude's capabilities by providing:

- **Tools**: Access to external data or actions (via MCP).
- **Instructions**: Specific guidance on how to use tools and respond.
- **Context**: Domain knowledge or procedural rules.

### Model Context Protocol (MCP)

MCP is the standard for connecting Claude to external systems.

- **Servers**: Provide tools and resources.
- **Clients**: Connect servers to Claude (e.g., Claude Desktop, IDEs).
- **Skills**: Define _when_ and _how_ to use these tools.

## 2. Skill Structure

### File Organization

- Skills reside in `.claude/skills` (or `.agents/skills` in legacy setups).
- Each skill must have a directory named in `kebab-case`.
- Inside the directory, `SKILL.md` is required.

### SKILL.md Format

The `SKILL.md` file must include YAML frontmatter and Markdown content.

#### YAML Frontmatter

```yaml
---
name: skill-name-in-kebab-case
description: What it does and when to use it. Include specific trigger phrases.
---
```

- **name**: Required. Must be `kebab-case`. No spaces or capitals.
- **description**: Required. Should clearly state the purpose and trigger conditions.
- **allowed-tools**: Optional. List of specific tools the skill can use.
- **metadata**: Optional custom fields.

#### Markdown Content

- Use clear headings.
- Instructions should be concise and actionable.
- Use bullet points and numbered lists.
- Avoid XML tags (`< >`) as they are security restricted in YAML but can be used in Markdown if needed (though discouraged in frontmatter).

## 3. Best Practices & Patterns

### Quality Check Pattern

1. Generate draft.
2. Run validation script.
3. Refine based on validation.
4. Finalize.

### Context-Aware Tool Selection

Choose tools based on context (e.g., file size, type).

- Example: Use local storage for small files, cloud for large ones.

### Domain-Specific Intelligence

Embed expert knowledge into the skill.

- Example: Financial compliance checks before processing payments.

### Troubleshooting

- **Skill won't upload**: Check `SKILL.md` existence and naming.
- **Invalid frontmatter**: Verify YAML syntax (delimiters `---`).
- **Skill doesn't trigger**: Refine `description` with specific triggers.
- **Skill triggers too often**: Add negative constraints or be more specific.
- **MCP connection issues**: Check server status, auth, and tool names.

## 4. Resources

- **Official Docs**: Anthropic Skills Documentation.
- **Example Skills**: `anthropics/skills` repository.
- **Tools**: `skill-creator` (built-in), `skill-qa-harness`.
