---
name: change-plan-conventional-commits
description: plan code changes and draft commit messages. Trigger when preparing to modify code, refactor, or fix bugs. Ensures commits follow Conventional Commits standard.
---

# Change Plan & Conventional Commits

Create a structured plan for code changes and draft compliant commit messages.

## Workflow

1.  **Analyze the Request**
    Identify the scope: is it a feature, fix, refactor, or chore?
    *   **feat**: New functionality.
    *   **fix**: Bug fix.
    *   **refactor**: Code change that neither fixes a bug nor adds a feature.
    *   **docs**: Documentation only.
    *   **test**: Adding or correcting tests.
    *   **chore**: Build process, auxiliary tools.

2.  **Draft the Plan**
    Break down the task into logical steps. Each step should be verifyable.
    *   *Step 1: Create X component.*
    *   *Step 2: Add tests for X.*
    *   *Step 3: Integrate X into Y.*

3.  **Identify Risks & Validations**
    *   What could break?
    *   Which tests should run? (e.g., `npm run test:unit`, `npm run lint`)

4.  **Draft Commit Messages**
    Propose commit messages for the changes. Use the format:
    `type(scope): description`

    *   `feat(audio): add new synth engine`
    *   `fix(ui): resolve button overlapping issue`

## detailed Guidelines

*   **Scope**: Optional but recommended (e.g., `ui`, `audio`, `api`).
*   **Description**: Imperative, lowercase, no period at end (e.g., "add feature" not "Added feature.").
*   **Body**: Optional. Explain *what* and *why*, not *how*.

## Example

**Input**: "I need to fix the volume slider not persisting after reload."

**Output Plan**:
1.  **Analyze**: The `VolumeSlider` component updates state but doesn't write to `localStorage`.
2.  **Plan**:
    *   Modify `useAudioSettings` to read/write `localStorage`.
    *   Update `VolumeSlider` to use the initial value from the hook.
    *   Verify by reloading the page.
3.  **Commit**:
    ```
    fix(audio): persist volume settings to localStorage

    The volume slider now saves its value to localStorage and restores it on page load.
    ```
