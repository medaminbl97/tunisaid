# Agent guidance

This is the persistent project handoff for TunisAid. Follow these repository-specific preferences in new chats without asking the user to repeat them. Inspect the current code and Git state before acting; the implementation snapshot below is not a substitute for checking subsequent changes.

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

## Product and source of truth

- TunisAid is a nonprofit website supporting people with disabilities in Tunisia, connecting volunteers and partners in Germany and Tunisia.
- The project is being redesigned in Figma and implemented route by route. Preserve the approved design, content, and interactions rather than inventing a different website.
- Figma file: [TunisAid redesign](https://www.figma.com/design/FDwPXx3WPiHO6BlRSjPmWP). Approved route frames:
  - Home: sections listed below.
  - About: `25:200`.
  - What we do: `27:180`.
  - Contact: `30:229`.
- Distinguish design work from implementation. When the user says "in Figma," change the editable Figma design, not application code. Apply approved changes to code when requested.
- For a new undesigned route, establish its design in Figma first, then implement the approved result. Creative content is welcome when requested, but do not invent facts, statistics, outcomes, or organization details.
- Load the Figma design-to-code guidance before requesting design context. Use current design context and screenshots, not recollection alone. Adapt it to existing React components, tokens, and responsive layouts.
- Reuse exact local Figma assets when available; download missing assets through the Figma asset workflow. Do not ship temporary asset URLs, screenshot-as-page implementations, emoji substitutes, or improvised replacements.
- For Figma edits, follow the Figma tool guidance, reuse editable components and variables, and inspect the resulting screenshot. Check resolved variable paints: an incorrectly resolved binding previously produced a black contact panel.

## Route development and Git workflow

The unit of work is a complete route, not a separate branch for every section or shared component.

1. Inspect status and record the starting integration branch. The established integration branch is `main`; if work starts elsewhere, confirm the intended merge target rather than silently changing it.
2. Before creating branches or committing, use the commit-changes skill to present the proposed route branches, dependencies, and ordered logical commits, and obtain approval.
3. Create one branch per route, such as `feat/home-page`, `feat/about-page`, `feat/what-we-do-page`, or `feat/contact-page`.
4. On that branch, complete the entire route: page sections, shared components it introduces, responsive layout, motion, translations, assets, stories, and directly related documentation.
5. Type-check, then commit coherent dependency-ordered groups. Shared foundations precede their consumers where a useful split exists. Do not artificially split a coherent change or create separate shared-component feature branches within the route workflow.
6. Merge the completed route back with `--no-ff`. Return to the integration branch before starting the next route. Do not implement multiple unfinished route branches in parallel.
7. The user approved deletion of the merged branches in the Home/About/What we do/Contact batch. Ask about cleanup for future batches unless already authorized.
8. Verify the final branch, status, and merge history. Do not push unless requested.

- Use conventional commits with plain types, no invented scopes, and subjects at most 72 characters. Include the Copilot co-author trailer used in existing history.
- Run normal commit hooks; never bypass them. Hook-required checks still run even though component validation is otherwise type-check-only.
- Stage exact intended paths. Do not blanket-stage unrelated files or partially stage shared-file hunks without approval.
- Follow the skill's staged-content safety scan. If it matches, stop for confirmation, including when a match appears harmless, such as documentation mentioning CSS tokens.
- Do not amend or rewrite history without explicit authorization. If a hook changes files, inspect, re-stage the intended files, and retry normally.
- Preserve unrelated work. `docker-compose.yml` and `makefile` are excluded local tooling, not part of the website commits. Do not read out or copy their contents into documentation or commits.
- Whole-repository formatting hooks can touch excluded files. If necessary, protect only those exact files with a named targeted stash, restore that exact stash afterward, and verify their contents are unchanged. Do not leave them stashed at task completion.
- Stop and ask if merging produces conflicts or unexpected changes conflict with the task.

## Architecture and component placement

- Stack: React, TypeScript, TanStack Start/Router, Tailwind CSS, shadcn/Radix, Motion for React, typed i18next, and Storybook.
- Use the `#/` import alias and `cn` from `#/lib/utils` for new application components.
- Keep route files in `src/routes/` thin: configure the route and render a named page from `src/pages/<route>/index.tsx`.
- Put genuinely reusable components in the single shared `src/components/` folder, not duplicated inside page folders.
- Put shadcn primitives in `src/components/ui/`. Inspect existing primitives first; generate missing primitives using the shadcn CLI rather than rebuilding them manually.
- Page-only sections belong in `src/pages/<route>/components/<section>/index.tsx`. Keep section-specific copy, layout, and decoration there. Add nested components/hooks/utils only when necessary.
- Reuse in this order: UI primitive, shared component, page-specific composition. Extend an existing primitive with a brand variant for visual changes; do not create a wrapper solely to restyle it.
- Use named functional components and English identifiers. Take a props object instead of destructuring the signature unless defaults are needed. Match existing formatting and naming.
- Add stories for every new shared or page-section component in `src/stories/`, using `Meta`/`StoryObj` from `@storybook/tanstack-react`. Use `.tsx` when the story contains JSX. Generated UI primitives do not require stories by default.
- The root shell owns the header and a single global footer. Pages own their `<main>`; do not duplicate the footer inside a page.
- Keep contact values centralized in `src/lib/site-contact.ts`; do not introduce conflicting addresses, phone numbers, or email values.

### Shared building blocks already available

- `SectionHeading`: semantic heading level, eyebrow, description, alignment, inverse tone, and entrance motion.
- `GlassCard`: shared surfaces and reveal/float motion. `IconChip`, `StatCard`, and `InfoCard` compose it; `StatCard` must be inside a `<dl>`.
- `ProjectCard`, `ValueCard`, `ActionCard`, and `PartnerCard`: reusable content cards.
- `StatementCard`: labeled editorial statements, white/lagoon tones, default/compact sizes; reused for mission/vision, support areas, process steps, and conversation starters.
- `CtaBanner`: actions, optional decoration/eyebrow, sun or peach treatment.
- `ContactItem` and `ContactStrip`: shared expandable contact presentation. Reveal descriptions on hover/focus and allow touch toggling; retain separate working contact links, Escape/blur handling, and independent card heights.
- `DirectContactCard`: linked contact method with label, value, and hint.
- `SiteHeader`, `SiteFooter`, and shared Button variants. Input/Textarea have reusable `brand` variants; Label supplies field labels.

## Design tokens

- Define reusable design values, especially colors, as CSS custom-property tokens in `src/styles.css` rather than hard-coding them in components.
- Prefix new brand-specific tokens with `brand-` (for example, `--brand-lagoon-blue`) and expose them through the theme utilities when needed.
- Use the tokens or their semantic theme utilities in components. Map shadcn semantic variables such as `--primary`, `--primary-foreground`, and `--ring` to brand tokens where appropriate.

### Visual direction and gradients

- Keep the warm cream, lagoon, sun, and terracotta palette, Fraunces display headings, Manrope body copy, rounded panels, and soft glass surfaces.
- The user wants a lively, cohesive website with gradients especially between sections, not disconnected flat background blocks.
- Reuse `brand-flow-*` gradient utilities. Adjacent sections should have compatible endpoints, with subtle light-color transitions.
- Approved Home flow:
  - Hero `4:37`: cream → mist → lagoon tint.
  - Impact `4:71`: lagoon tint → sage → cream, retaining its dark inner panel.
  - Projects `5:30`: cream → cream → sun-soft.
  - Values `5:65`: sun-soft → sun-soft → cream.
  - Get involved `5:98`: cream → mist → lagoon tint.
  - Partners `5:153`: lagoon tint → lagoon tint → cream.
  - Donation `5:172`: cream → sun-soft → cream.
  - Contact `5:190`: cream around a rounded lagoon-tinted panel.
- About: cool hero, warm return through story, cream/peach/sun team section, sun-to-cream approach, cream contact section.
- What we do: cool hero, warm support section, cream around the feature, cream-to-sun process, sun-to-cream invitation, cream contact section.
- Contact: cool welcome, warm return through the hub, cream/sun/cream conversation starters, cream closing.
- All footers use the subtle ink-to-teal gradient.
- The user rejected a muddy light-to-dark edge fade on the What we do feature. Keep the approved horizontal deep-lagoon-to-ink gradient inside the rounded panel (`27:232`) with cream outside (`27:231`). Do not reintroduce the rejected fade across the section or text area.

## Component motion

- When creating or improving components, always add polished, purposeful motion so the website feels lively rather than static or stiff.
- Use the existing Motion for React (Framer Motion) library via `motion/react`; follow the animation patterns in `src/components/ui/button.tsx` and `src/components/site-header.tsx`.
- Favor subtle hover/tap feedback, smooth state transitions, and entrance animations where appropriate. Keep motion consistent and avoid distracting effects or layout shifts.
- Respect reduced-motion preferences with `useReducedMotion`, disabling or simplifying animations as needed.

## Content, translations, and accessibility

- All user-facing content and accessible labels need English and German translations. English resources define the typed keys; German must mirror their structure.
- Use the existing i18next initialization and `useTranslation`; do not hard-code new page copy into components.
- Current namespaces include `home`, `about`, `work`, `contact`, `siteHeader`, `siteContact`, and `siteFooter`.
- Preserve semantic headings, visible labels, working navigation, keyboard focus, touch access, and reduced-motion behavior. Hover-only disclosure is not sufficient.
- Use real destination routes and meaningful email/telephone/map links. Do not add dead `#` links or fake working controls.
- Ask before deciding an unspecified backend, submission behavior, or other significant functional behavior.
- Social URLs were not supplied: keep those controls explicitly disabled with a localized coming-soon notice until real URLs are provided.
- Contact form submission is intentionally unavailable, as explicitly chosen by the user. Keep the localized notice, disabled fields/send button, and working direct email alternative. Do not silently discard input or display fake success.
- Enabling the form requires a real delivery integration plus validation, privacy handling, and explicit error/success feedback; it is not part of the completed design-only form behavior.

## Component validation

- For component implementation tasks, focus on implementing the requested components. Do not run ESLint, browser or manual visual tests, or launch/open Storybook unless explicitly requested.
- A type check is the only validation to run for component implementation tasks.
- Use `npx --no-install tsc --noEmit`. Focused Prettier formatting is fine; normal commit hooks remain required.
- Do not install dependencies speculatively or launch development servers merely to finish a component task.
- Update directly related documentation. Documentation-only instruction edits do not need application validation.

## Implementation handoff

Snapshot after the completed route batch on 2026-11-05:

- Home, About, What we do, and Contact are implemented, type-checked, committed in separate route branches, and merged into `main`. Those branches were deleted; nothing was pushed.
- Home includes hero, impact, projects, values, get-involved, partners, donation, and the shared contact strip. The redesigned contact panel and expandable descriptions are implemented.
- About includes hero/snapshot, story, team placeholder, mission/vision, and the shared contact strip.
- What we do includes the typographic hero, six support areas, approved rounded feature panel, three process steps, invitation, and shared contact strip.
- Contact includes welcome, direct-contact methods, the explicitly unavailable message form, conversation starters, and closing note.
- Shared components, local assets, English/German copy, and stories were added with their introducing routes. Detailed implementation notes are in [README.md](README.md); current code takes precedence over stale starter text.
- Donate has no approved redesign and was deliberately left untouched. Do not assume it should be implemented without a design/task.
- Individual project-detail routes are not implemented.
- Directus backend (uncommitted on `feat/directus-backend` at the time of writing): one baseline migration `directus/migrations/001-initial-schema.mjs`, per-collection seeds in `directus/seeds/` run by `directus/scripts/seed.mjs`. The user chose to remove allocations, material donations/events, `project_updates`, `project_partners`, and the `donation-rules` hook. Refund state is derived from succeeded refunds, never stored. React-rendered bodies/descriptions must be rich-text fields. A `checkouts` row is one basket and one payment (status lives only there); it is split into one `donations` row per campaign, derived purpose → project → open campaign. The user chose: flexible amounts never count toward a campaign, and a project may be in at most one open campaign (otherwise checkout returns `campaign_conflict`). Donors never pick a campaign; `/donate?campaign=` only filters purposes. The user chose one generated SDK (spec exported with an admin `OPENAPI_TOKEN`) shared by browser and server; the server uses its own token-bearing client instance from `src/server/donations/directus.ts`, never imported into browser code. Add `002-…` migrations for later changes; do not edit an applied baseline.
- Original team photography and partner logos have not been supplied. Preserve the clearly labeled team-photo placeholder and existing partner initials; do not invent replacements. The Home illustration is also a design placeholder.
- There is an unresolved factual discrepancy: Home says 2016, while approved About copy says November 2018. Both were preserved and documented. Ask for factual confirmation rather than silently choosing one.
- The last route merge in this batch was `9cde02d`; verify current history before making assumptions about subsequent work.

Keep this handoff current when project decisions or implementation status change. Record project workflow and decisions, not private chat transcripts or sensitive local data.
