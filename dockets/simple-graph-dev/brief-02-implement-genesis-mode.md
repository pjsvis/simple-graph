# Brief: 002-implement-genesis-node

- **Docket**: simple-graph-dev
- **Title**: Implement a permanent "Genesis Node" in the graph database.
- **Objective**: To create a single, permanent, and known root node in every graph database instance upon its creation. This node will serve as a stable entry point for testing and graph traversal.
- **Rationale**: A known "genesis node" is a standard graph database pattern. It provides a reliable anchor for the entire graph, simplifying testing by guaranteeing at least one node always exists. It also establishes a logical root from which all other primary concepts can be connected, enabling predictable navigation from a single, known starting point.

---

## Key Requirements

1. **Modify Schema Creation**: The genesis node must be created automatically during the database initialization process. This will require modifying the `createSchema` function (or its equivalent) to include an `INSERT` statement that runs immediately after the `nodes` table is created.

2. **Node Specification**: The genesis node shall have the following fixed properties:

    - `id`: `0` (integer)
    - `label`: `'System'`
    - `body`: `'This is the genesis node, the root of the graph.'`
    - `createdAt`: The timestamp of its creation.

3. **Edge Specification**: By definition, the genesis node is the origin point of the graph. Therefore, it should be created with **no initial edges**.

4. **Universality**: This implementation must apply to all database instances created by the `simple-graph` library, including the persistent file-based databases and the temporary in-memory databases used for testing.

---

## Acceptance Criteria

1. **Verification Test**: A new test must be written to verify that after `initializeDatabase` is called on a new, empty database, a call to `getNodeById(0)` successfully returns the specified genesis node.
2. **Immutability Test**: A new test must be written to verify that any attempt to delete the genesis node (e.g., `deleteNode(0)`) fails and throws an appropriate error. The genesis node must be protected from deletion. This may require adding a specific check in the `deleteNode` function.

---

## Debrief: Implementation Summary

### Accomplishments

1.  **Schema Modification**: Successfully updated `src/database/schema.ts` to automatically insert the genesis node (`id: '0'`) into every new database upon initialization.
2.  **Deletion Protection**: Implemented immutability for the genesis node by creating a `deleteNode` function in `src/database/operations.ts` that throws an error if deletion of node `'0'` is attempted.
3.  **Verification Tests**: Authored a new test suite in `tests/unit/database-operations.test.ts` to validate both the successful creation of the genesis node and its protection from deletion.
4.  **Database Migration**: Executed a migration script to insert the genesis node into all existing `.db` files within the project, ensuring consistency across all databases.

### Problems Encountered

1.  **Environment Mismatch (Shell)**: The initial migration attempt using a shell script failed because it used `chmod`, a Linux/macOS command, which is not available in the Windows environment.
2.  **Missing Dependency (Shell)**: The second shell script attempt failed with a `command not found` error, indicating that the `sqlite3` command-line tool was not available in the execution environment.
3.  **Module System Conflict (Node.js)**: The first Node.js migration script failed because it used CommonJS `require()` syntax in a project configured for ES Modules (`"type": "module"` in `package.json`).

### Lessons Learned

1.  **Environment is Key**: Always confirm the target OS and environment before using shell commands. What works in one environment may not work in another.
2.  **Use Project Dependencies**: For portability and reliability, it's better to use libraries included in the project's `package.json` (like the `sqlite3` npm package) rather than relying on globally installed command-line tools.
3.  **Check `package.json` for Module Type**: Before writing Node.js scripts, check `package.json` for `"type": "module"` to determine whether to use ES Module (`import`) or CommonJS (`require`) syntax. Using the `.cjs` extension is a reliable way to ensure a script is treated as CommonJS.