# Simple Graph Development Progress

This document summarizes the status of all development briefs for the `simple-graph` project.

---

### Completed Work

*   **Brief 02: Implement Genesis Node:** A permanent "genesis node" (`id: 0`) has been successfully added to the database schema. This work is complete, as indicated by the detailed implementation debrief.
*   **Brief 03: Proposed API Spec:** The API has been refactored into a class-based structure (`SimpleGraph`, `NodeManager`, etc.). The associated checklist is fully completed.

### In Progress

*   **Brief 04: CLI and Bash Integration:** The core CLI script has been created and its argument parsing is unit tested. However, the work is **partially blocked** as the `bash` integration tests cannot be completed due to TypeScript compilation issues.
*   **Brief 09: Integrate with `groq-code`:** An attempt was made to integrate `simple-graph` into the `qroq-code` project, but it is **blocked by multiple build errors**. A plan to resolve these errors has been proposed within the brief.

### Proposed / Not Started

The following briefs have been defined but have not yet been started. Checklists either do not exist or are completely unchecked.

*   **Brief 01:** Implement mind map visualization using DOT language.
*   **Brief 05:** Create a slash command system using a `commands.toml` file.
*   **Brief 06:** Implement a local MCP (Model Control Protocol) server to wrap the API.
*   **Brief 07:** Refactor all inline SQL queries into a dedicated, secure module.
*   **Brief 08:** Migrate the project from Node/NPM to use the Bun runtime.
*   **Brief 10:** Implement a layered configuration strategy (defaults, JSON file, programmatic overrides).
*   **Brief 11:** Refactor the API class names to be more descriptive (e.g., `NodeManager` -> `Nodes`).
*   **Brief 12:** Integrate vector search capabilities using `sqlite-vec`.
*   **Brief 13:** Decouple the hard-coded DOT graph visualization settings to make the tool more generic.

---

## Progress Table

| Brief ID | Title | Status | Priority |
|---|---|---|---|
| 01 | Implement Mind Map Visualization | Proposed | |
| 02 | Implement Genesis Node | Completed | |
| 03 | Proposed API Spec | Completed | |
| 04 | CLI and Bash Integration | In Progress (Blocked) | |
| 05 | Slash Command Config | Proposed | |
| 06 | Local MCP Server | Proposed | |
| 07 | Refactor Inline SQL | Proposed | |
| 08 | Bun Migration | Proposed | |
| 09 | Integrate with `groq-code` | In Progress (Blocked) | |
| 10 | API Settings Strategy | Proposed | |
| 11 | Refactor Names | Proposed | |
| 12 | Integrate Vector Search | Proposed | |
| 13 | Decouple DOT Graph Config | Proposed | |
