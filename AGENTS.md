# Agent guidance

Before implementing or changing anything in this repository, inspect the relevant skill under `.agents/skills/` and read its complete `SKILL.md`. Follow its workflow and constraints before editing. If more than one skill applies, review each applicable skill first.

## Available skills

Use the slash shortcut to invoke the corresponding workflow:

| Skill            | Shortcut            | Use when                                              |
| ---------------- | ------------------- | ----------------------------------------------------- |
| Typed i18n setup | `/add-i18n-content` | Setting up i18next and typed translation resources.   |
| Commit changes   | `/commit-changes`   | Grouping, branching, and committing uncommitted work. |
| Create component | `/create-component` | Creating a React component for this project.          |
| Setup pre-commit | `/setup-pre-commit` | Adding or configuring pre-commit quality checks.      |

Shortcuts correspond to the skill directories in `.agents/skills/`. Only directories containing a `SKILL.md` are listed as available skills.

## Design tokens

- Define reusable design values, especially colors, as CSS custom-property tokens in `src/styles.css` rather than hard-coding them in components.
- Prefix new brand-specific tokens with `brand-` (for example, `--brand-lagoon-blue`) and expose them through the theme utilities when needed.
- Use the tokens or their semantic theme utilities in components. Map shadcn semantic variables such as `--primary`, `--primary-foreground`, and `--ring` to brand tokens where appropriate.

## Component validation

- For component implementation tasks, focus on implementing the requested components. Do not run ESLint, browser or manual visual tests, or launch/open Storybook unless explicitly requested.
- A type check is the only validation to run for component implementation tasks.
