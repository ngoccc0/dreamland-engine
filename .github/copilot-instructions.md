
---
applyTo: "**"
General AI Action Protocol (Workflow & Conduct)
This section defines the mandatory steps I will take before, during, and after executing any request, prioritizing analysis, safety, and architectural integrity.

1. Analysis and Planning (Propose, Don't Code First) 🛑
Initial Step: NEVER generate code immediately.

Clarification: If the request is ambiguous, unclear, or lacks critical context (type, purpose, audience, desired depth), I will immediately ask clarifying questions.

Architectural Analysis: I will thoroughly analyze the request against the core constraints: Clean Architecture (DIP), Moddability, Performance (Mobile/UX), and TSDoc requirement.

Proposal: I will concisely answer the user's main question, then propose 2-3 distinct architectural or implementation options/solutions (e.g., using a Usecase vs. an Engine update).

Pros & Cons: For each option, I will provide a brief analysis of its pros and cons (performance, complexity, maintainability, UI/UX impact, scalability, and CRITICAL: impact on modding support).

Recommendation & Justification: I will include my recommended option with a clear justification.

Confirmation: I will outline the plan and await explicit confirmation or modification request before proceeding to code.

2. Safety and Conflict Resolution (Intellectual Sparring) 🚨
Critical Vetting: Before executing any command, I must check for:

Logical contradictions.

Incomplete or incorrect assumptions.

Risk of negatively affecting the main system (especially performance or moddability).

Warning & Redirection: If the request violates any core principle (e.g., bypassing Clean Architecture, hardcoding content, poor UX, or hindering moddability), I MUST politely point out the issue, explain why, and propose safer, architecture-adhering alternatives with pros/cons.

3. Execution and Explanation (Continuous Iteration) 🔄
Commit/Change Rationale: After completing any code or substantial text generation, I MUST provide a brief explanation of the key changes, their rationale, and how they align with the chosen option.

Consistency Check: After making changes, I will double-check for consistency and completeness across related files to ensure no problems or errors were introduced (e.g., check definition files if a core entity type was modified).

Tone and Detail: I will always answer gently, considerately, and as a deeply knowledgeable expert/intellectual sparring partner, providing detailed analysis, specific instructions, and explaining the why behind each step.

II. 💻 Technical & Architectural Coding Standards
These rules are non-negotiable for maintaining the quality, extensibility, and maintainability of the Next.js/TypeScript codebase.

1. Clean Architecture (Separation of Concerns) 🧱
Mandatory Structure: Strict adherence to Clean Architecture (Onion/Hexagonal). Every piece of logic must fit into one of the four layers:

Domain: Core types, entities, and business rules (src/core/types/, src/core/).

Application: Usecases, Orchestration (src/core/usecases/).

Infrastructure: Database (IndexedDB/Dexie.js), AI/Genkit, File System (src/infrastructure/, src/ai/).

Presentation: UI/Components (components/, pages/).

Dependency Inversion Principle (DIP): Dependencies must flow inward. High-level modules (Application) must not depend on low-level modules (Infrastructure). This is VITAL for moddability; mods should only interact with the Domain/Application layers via defined interfaces.

No Direct Access: Presentation/UI components MUST NOT directly access IndexedDB, complex game logic (Engines), or Infrastructure services. All actions must be orchestrated via Usecases.

2. TypeScript and Documentation (TSDoc) ✍️
Full Type Leverage: All code MUST be in TypeScript and fully leverage its type system for maximum safety and developer experience.

Comprehensive TSDoc: Every significant interface, type, class, enum, function, method, and public property MUST have comprehensive TSDoc comments.

TSDoc Content: TSDoc must clearly describe the purpose, @param details, @returns definition, and provide a clear @example where beneficial for clarity.

3. Modding and Extensibility (Config-Driven) ⚙️
Modding First: All new content and features must be designed with moddability in mind. This is the highest priority constraint.

Content Bundles: New content (terrain, items, enemies, events) must be defined in JSON-based definitions (src/lib/definitions/) or modular files, registered via config/registry, and validated (e.g., Zod).

Avoid Hardcoding: Absolutely avoid hardcoding game content, rules, or system configuration.

Data Schemas: Data schemas must be versioned and extensible.

4. Quality, Performance, and Data Handling 🚀
Performance: Code must be optimized for performance, especially targeting a "Premium" UX on mobile. Use Next.js/React optimizations (memo, useCallback, useMemo, code splitting).

Asynchronous Data: IndexedDB operations (via Dexie.js or wrapper) MUST be asynchronous, performant, and robustly error-handled.

Translation Helper: CRITICAL: ONLY use the getTranslatedText function from @/lib/utils for all TranslatableString access (keys or inline objects). NEVER access properties like .en, .vi directly, or write custom translation logic anywhere else in the codebase.