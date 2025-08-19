# Debrief: CLI and Bash Integration

- **Source Brief**: `brief-004-cli-and-bash-integration.md`
- **Date**: 2025-08-17

## Accomplishments

1. **CLI Creation**: Successfully created `src/cli.ts` (initially `cli.js`) as a command-line entry point for `SimpleGraph` functions.
2. **Argument Parsing**: Implemented basic argument parsing in `src/cli.ts` to handle commands and parameters.
3. **Core Function Exposure**: Exposed `graph.nodes.get`, `graph.nodes.find`, and `graph.edges.forNode` via the CLI.
4. **Output Handling**: Configured `src/cli.ts` to output results as JSON to `stdout` and errors to `stderr`.
5. **Unit Tests**: Developed comprehensive unit tests for `src/cli.ts`'s argument parsing and command execution, ensuring they pass by mocking `SimpleGraph` interactions.

## Problems Encountered

1. **`SimpleGraph` API Mismatch**: Initial integration tests failed because `SimpleGraph.connect` was missing `initializeDatabase` and the `SimpleGraph` class itself did not expose `nodes` or `edges` managers. This required significant refactoring of `SimpleGraph.ts` and `cli.test.ts`.
2. **SQLite Constraint Violation**: Encountered `SQLITE_CONSTRAINT: UNIQUE constraint failed: nodes.id` due to the genesis node being inserted twice (once by schema creation, once by test setup). This was resolved by removing explicit genesis node insertion from test setup.
3. **CLI Database Path Mismatch**: `cli.ts` was hardcoded to a specific database, while integration tests used a temporary one. This was resolved by introducing `SIMPLE_GRAPH_DB_PATH` environment variable.
4. **CLI Execution on Windows**: `execPromise('./src/cli.js ...')` failed on Windows because `.js` files are not directly executable. This necessitated prefixing the command with `node`.
5. **TypeScript Compilation/Execution Issues (Major Blocker)**:

- Attempted to compile `cli.ts` to `dist/cli.js` but faced persistent `Cannot find module 'undici-types'` errors, `sqlite3` type issues, and `Cannot find name 'Database'` errors, even after `tsconfig.json` adjustments, `npm install`, and `npm update`.
- Attempted to run `cli.ts` directly using `ts-node` (both `npx ts-node` and `node --loader ts-node/esm`), but encountered `ERR_MODULE_NOT_FOUND` for `SimpleGraph` and fatal `napi_throw` errors, indicating deep-seated issues with ESM resolution in the `ts-node` environment.

## Lessons Learned

1. **Thorough API Understanding**: Before integrating new components, a deep understanding of the target API's structure and expected usage (e.g., `NodeManager.add` vs. `insert`) is crucial to avoid runtime errors.
2. **Test Environment Isolation**: Ensure strict isolation of test environments (e.g., unique database files, proper cleanup) to prevent interference between test runs.
3. **Cross-Platform Compatibility**: When using shell commands in Node.js, always consider cross-platform compatibility (e.g., explicit `node` prefix for `.js` files on Windows).
4. **TypeScript Ecosystem Complexity**: Integrating command-line tools written in TypeScript into a Node.js project, especially with ESM, can be highly complex due to module resolution, type checking, and `ts-node` intricacies. Persistent `ERR_MODULE_NOT_FOUND` and `undici-types` errors often indicate deeper configuration or dependency conflicts that may require expert intervention or a fresh project setup.
5. **Pragmatism in Debugging**: When faced with intractable technical issues (like persistent TypeScript compilation errors), it's important to recognize when to pivot or escalate, rather than getting stuck in a debugging rabbit hole. Sometimes, a workaround (like `skipLibCheck` or deferring to a different execution method) is necessary to unblock progress, even if it's not the ideal long-term solution.
