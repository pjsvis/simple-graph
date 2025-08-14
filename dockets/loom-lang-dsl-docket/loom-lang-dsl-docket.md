# The "Loom-Lang DSL" Docket

Here is the initial Docket and the list of briefs required to build our DSL. We will fill out each brief in detail as we tackle it.

- **Docket Name:** Loom-Lang DSL Implementation (v0.1)
- **Objective:** To refactor the existing `simple-graph` project into a modular, reusable NPM package that exposes a clear, command-line-driven Domain Specific Language for our Persona Engineering workflow.
- **Success Criteria:**
  - The final product is a locally-linkable NPM package.
  - The package exposes four core commands (`ingest`, `analyze`, `synthesize`, `validate`) via an executable script.
  - The existing test suite is adapted to the new architecture and passes completely.

## List of Briefs

1.  **Brief #001: Project Scaffolding & Packaging:**

    - **Objective:** Restructure the current project into a standard NPM package layout (`src/`, `dist/`, etc.) and configure `package.json` and `tsconfig.json` for a successful build.

2.  **Brief #002: Create the CLI Entry Point:**

    - **Objective:** Create the main `scripts/loom.ts` executable file and implement the core command-line parsing logic using a library like `commander`.

3.  **Brief #003: Refactor the `ingest` Logic:**

    - **Objective:** Isolate all existing data ingestion logic into a self-contained `IngestionService` and connect it to the `ingest` command in the CLI.

4.  **Brief #004: Refactor the `analyze` Logic:**

    - **Objective:** Isolate all existing analysis and DOT graph generation logic into an `AnalysisService` and connect it to the `analyze` command.

5.  **Brief #005: Refactor the `synthesize` Logic:**

    - **Objective:** Isolate all persona generation logic into a `SynthesisService` and connect it to the `synthesize` command.

6.  **Brief #006: Refactor the `validate` Logic:**

    - **Objective:** Adapt our "Three-Phase Database Audit" into a `ValidationService` and connect it to the `validate` command.

7.  **Brief #007: `npm link` Integration Test:**
    - **Objective:** Create a test procedure to validate that the complete package can be successfully linked and used by an external project (like our Gemini-CLI config).
