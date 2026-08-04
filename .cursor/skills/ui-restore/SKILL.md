---
name: ui-restore
description: >-
  Restore design images into an existing Vue 3 project via ui-restore CLI.
  Use when the user asks to restore a page from a screenshot/PNG, run
  ui-restore init/restore/scan/autofix, extract shared components across
  multiple images, or wire Cursor to the ui-restore workflow.
---

# ui-restore Agent Skill

## Goal

Restore UI **into the user's existing Vue project**. Do not generate a standalone demo app.

Tagline: **Restore UI into your existing Vue project. Not generate another demo.**

## Workflow

1. Ensure monorepo is built: `pnpm build` (from repo root).
2. Prefer CLI over hand-writing Vue from images.
3. Pipeline must stay: **Image → Vision → JSON DSL → (scan/match) → Generator → AutoFix**.

## Commands

```bash
# From ui-restore repo root
pnpm ui-restore init --cwd <vue-project>
pnpm ui-restore scan --cwd <vue-project>
pnpm ui-restore restore --cwd <vue-project> [--provider mock|openai] <images...>
pnpm ui-restore autofix <pageId> --cwd <vue-project> --reference <image> [--provider mock|openai]
```

Image paths resolve from the shell cwd (usually repo root). Project paths use `--cwd`.

## Rules

- Never skip the DSL and dump model-generated `.vue` as the primary deliverable.
- Reuse project components when the scanner finds matches (`Button`, `AppInput`, …).
- Multi-image restores should extract shared components unless user passes `--no-extract`.
- Autofix revises DSL then regenerates Vue; keep `.ui-restore/` artifacts for review.
- Providers are pluggable (`mock` offline; `openai` needs `OPENAI_API_KEY`).

## Offline demo (this repo)

```bash
pnpm ui-restore restore --provider mock --cwd test-project examples/home.png examples/profile.png
pnpm ui-restore autofix home --provider mock --cwd test-project --reference examples/home.png --threshold 0.9
```

## Read more

- `docs/AGENT.md`
- `docs/ARCHITECTURE.md`
- `docs/PROMPT.md`
