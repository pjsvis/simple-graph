# Checklist: 004-CLI-and-Bash-Integration

- **Docket**: simple-graph-dev
- **Source Brief**: `brief-004-cli-and-bash-integration.md`
- **Objective**: To create a simple command-line interface (`cli.js`) that exposes the core functions of the `SimpleGraph` API, and to write integration tests that validate this CLI can be successfully called from a `bash` shell.

---

## Key Requirements

- [x] **Create `cli.js`**: Create a new executable file, `src/cli.js`, that can be run with Node.js.
- [x] **Argument Parsing**: The script must parse command-line arguments to determine which API function to call and with what parameters (e.g., `node src/cli.js getNode 0`).
- [x] **Expose Core Functions**: Initially, expose the following `SimpleGraph` methods via the CLI:
    - [x] `graph.nodes.get(id)`
    - [x] `graph.nodes.find(query)`
    - [x] `graph.edges.forNode(id)`
- [x] **Output**: The script should print the results of the API call to `stdout` as a JSON string. Errors should be printed to `stderr`.

## Acceptance Criteria

- [x] **Unit Tests for CLI**: Create unit tests for the argument parsing logic in `cli.js`.
- [ ] **Integration Tests via `bash`**: Create a new integration test suite. These tests must use a shell command executor (like Node's `exec` or `spawn`) to call the `cli.js` script from a `bash` process and assert that the `stdout` contains the expected JSON output for a known state of a test database. (Blocked by TypeScript compilation/execution issues)
- [ ] **Test `getNode`**: The integration tests must successfully call `getNode` for the genesis node (`id: 0`). (Blocked by TypeScript compilation/execution issues)
- [ ] **Test `find`**: The integration tests must successfully perform a `find` operation. (Blocked by TypeScript compilation/execution issues)
