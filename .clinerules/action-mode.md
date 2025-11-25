applyTo: "**"
Copilot Instructions — Dreamland Engine (Unified & Strict)
Purpose: Actionable guidance for AI agents to be immediately productive in this Next.js + TypeScript game codebase, emphasizing architectural fidelity, documentation transparency, and strict execution protocols.

Quick Commands
Use these npm scripts for development (run from repo root):

PowerShell

# Start Next.js dev server (http://localhost:9003)
npm run dev

# Watch AI flows (Genkit, runs in separate terminal)
npm run genkit:watch

# Type check (CI gate)
npm run typecheck

# Run Jest tests (CI gate)
npm run test

# Validate narrative placeholders (run before narrative PRs)
npm run validate:narrative

# Generate TypeDoc API docs
npm run docs:api
Architecture: Four-Layer Clean Architecture
Layer isolation is mandatory — UI never touches engines/persistence directly.

src/
├── app/              → Next.js pages, server components (UI entry)
├── components/       → React components + hooks (client wiring)
├── hooks/            → React hooks (useGameEngine, useActionHandlers)
├── core/             → Domain types, entities, usecases, engines, repositories
├── infrastructure/   → Persistence adapters, infra plumbing
├── ai/               → Genkit flows (narrative generation, AI tools)
└── lib/              → Utilities, definitions, narrative
Data flow: UI → Hooks → Usecases → Engines/Repositories → Infrastructure

Mandatory Project Conventions (high level)
Bilingual content: always use getTranslatedText() and TranslatableString (EN/VI).

Persistence: use adapters in src/infrastructure/persistence/ (Dexie / Firebase / local-storage).

Usecases: pure functions returning new immutable domain objects (no side effects).

Engines: pure rule classes in src/core/engines/.

Content: game data lives in src/lib/definitions/ and is validated (Zod where applicable).

Documentation (Strict): Add tSDoc OVERVIEW header for all new/modified public files.

Commentary (Strict): Comment all calculations, variables, and their impact thoroughly in tSDoc/inline comments.

Pre-Code Checklist
Before implementing changes, gather the relevant files and dependencies.

Gather: domain types, usecases, engines, repositories, and any definitions/locales you will change.

Validation Cycle (Mental Check): Acknowledge that you must run npm run typecheck and npm run test after changes.

Narrative/locale changes: run npm run validate:narrative.

Approval / Pause Points (The ONLY allowed stops)
The agent is FORBIDDEN from stopping the execution flow unless one of these specific triggers occurs:

1. Mandatory Approval Points (High-Risk - Stop before starting):

Database schema changes or migrations.

Storing secrets/credentials.

Changing CI workflows or release pipelines.

Creating top-level modules or breaking architectural boundaries.

File size exceeding 800 lines (requires Split Plan).

2. Mandatory Pause Points (Failure - Stop during execution):

The "3-Strike" Rule: You may only pause if you have attempted to fix the same error >3 times without success.

If this happens, report clearly: What was attempted, Why it failed, and Recommended next steps.

Common Task Flows (short)
Adding a game item: add definition in src/lib/definitions/items.ts, validate, register, add bilingual description, run npm run validate:narrative.

Adding a feature: add types, add pure usecase, add engine rules, wire via hooks, persist via adapter, add tests.

Fixing cross-layer bug: identify layer, add a data trace, fix root cause, add tests.

Logic Deep Dive & Data Trace (when required)
For substantial logic changes, include a brief Logic Deep Dive and one concrete Data Trace example showing input → steps → output.

Execution Agent (Strict Protocol)
When an execution agent is authorized to act on a provided plan, follow this Non-Negotiable Protocol:

Step 0: Mandatory To-Do List Initialization

Before writing any code, you must generate a precise, step-by-step To-Do List that mirrors the user's approved plan exactly.

This list must be granular. You will check off items as you proceed.

Step 1: End-to-End Implementation (Do Not Stop)

You must execute the following cycle completely. Do not stop to ask for confirmation between these steps unless a "Pause Point" (see above) is triggered.

Implement Code: Write the code according to the To-Do list.

Document: Ensure all public files have tSDoc OVERVIEW headers and detailed comments on calculations/effects.

Validate Types: Run npm run typecheck. Fix if fail.

Verify Tests: Run npm run test. Fix if fail.

Real-World Check: Verify via dev server (npm run dev) logic.

Commit: Finalize the task.

Constraint: Do not ask "Shall I proceed?" after writing code. Proceed directly to verification and finishing, unless you hit a critical error loop (>3 tries).