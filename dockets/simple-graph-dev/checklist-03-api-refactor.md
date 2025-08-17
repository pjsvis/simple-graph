# Checklist: 003-API-Refactor

- **Docket**: simple-graph-dev
- **Source Brief**: `brief-03-proposed-api-spec.md`
- **Objective**: To refactor the existing codebase to implement the new class-based API.

---

## Tasks

### 1. Core `SimpleGraph` Class Structure

- [x] Create `src/SimpleGraph.ts` to define the main `SimpleGraph` class.
- [x] Implement the `constructor` to accept a database connection.
- [x] Implement the `close()` method.
- [x] Implement the static `SimpleGraph.connect()` method for creating and initializing database instances.

### 2. API Namespace Implementation

- [x] Create `src/api/NodeManager.ts` for the `graph.nodes` namespace.
- [x] Create `src/api/EdgeManager.ts` for the `graph.edges` namespace.
- [x] Create `src/api/QueryManager.ts` for the `graph.query` namespace.
- [x] Create `src/api/VisualizationManager.ts` for the `graph.visualize` namespace.
- [x] Integrate manager instances into the `SimpleGraph` class.

### 3. Feature Migration & Implementation

- [x] **Nodes**: Migrate `getNodeById`, `insertNode`, `deleteNode` to `NodeManager` and implement `update` and `find`.
- [x] **Edges**: Migrate `insertEdge`, `getEdgesForNode` to `EdgeManager` and implement `get`, `update`, and `delete`.
- [x] **Query**: Migrate `traverseGraph`, `getGraphStats` to `QueryManager` and implement `raw`.
- [x] **Visualize**: Migrate `generateMindMap`, `renderDotToImage` to `VisualizationManager`.

### 4. Codebase Refactoring

- [x] Update all tests in the `tests/` directory to use the new `SimpleGraph` API.
- [x] Update all scripts in the `scripts/` directory to use the new API.
- [x] Deprecate and remove the old functions from `src/database/operations.ts` and `src/database/connection.ts`.

### 5. Finalization

- [x] Review all changes for consistency and correctness.
- [x] Mark this checklist as complete.
