# Brief: 004-cli-and-bash-integration

- **Docket**: simple-graph-dev
- **Title**: Create a CLI entry point and test API access via `bash`.
- **Objective**: To create a simple command-line interface (`cli.js`) that exposes the core functions of the `SimpleGraph` API, and to write integration tests that validate this CLI can be successfully called from a `bash` shell.
- **Rationale**: This is the foundational step for enabling agentic interaction with our knowledge graph. Before we can build abstractions like slash commands or an MCP server, we need a robust and testable way for an external process, like the Gemini-CLI's `bash` tool, to interact with the database.

---

## Key Requirements

1. **Create `cli.js`**: Create a new executable file, `src/cli.js`, that can be run with Node.js.
2. **Argument Parsing**: The script must parse command-line arguments to determine which API function to call and with what parameters (e.g., `node src/cli.js getNode 0`).
3. **Expose Core Functions**: Initially, expose the following `SimpleGraph` methods via the CLI:

- `graph.nodes.get(id)`
- `graph.nodes.find(query)`
- `graph.edges.forNode(id)`

4. **Output**: The script should print the results of the API call to `stdout` as a JSON string. Errors should be printed to `stderr`.

---

## Acceptance Criteria

1. **Unit Tests for CLI**: Create unit tests for the argument parsing logic in `cli.js`.
2. **Integration Tests via `bash`**: Create a new integration test suite. These tests must use a shell command executor (like Node's `exec` or `spawn`) to call the `cli.js` script from a `bash` process and assert that the `stdout` contains the expected JSON output for a known state of a test database.
3. **Test `getNode`**: The integration tests must successfully call `getNode` for the genesis node (`id: 0`).
4. **Test `find`**: The integration tests must successfully perform a `find` operation.
