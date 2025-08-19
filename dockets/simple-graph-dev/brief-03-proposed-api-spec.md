# Brief: 003-proposed-api-spec

- **Docket**: simple-graph-dev
- **Title**: Proposed API Specification for `simple-graph` Library
- **Objective**: To define a clean, consistent, and extensible public API for the `simple-graph` library, improving developer experience and maintainability.
- **Rationale**: The current library exposes a flat list of functions. Organizing these into a class-based, modular API will make the library more intuitive, easier to use, and simpler to extend in the future. This aligns with standard practices for modern libraries.

---

## 1. Core Concept: The `SimpleGraph` Class

The entire API will be exposed through a main `SimpleGraph` class. A user will first connect to a database (either file-based or in-memory), which returns an instance of this class. All subsequent operations are performed on this instance.

```typescript
// Example of the core concept
import { SimpleGraph } from "simple-graph";

// Connect to a database
const graph = await SimpleGraph.connect({ path: "./my-database.db" });

// Use the instance to interact with the graph
const node = await graph.nodes.get("0");

// Close the connection when done
await graph.close();
```

---

## 2. Proposed API Surface

This section details the proposed methods and properties of the `SimpleGraph` class.

### `SimpleGraph.connect(options)` (Static Method)

This static method replaces the various `create...Connection` and `connectTo...` functions. It is the single entry point for creating and initializing a database instance.

- **`options`**: `ConnectOptions` object
- `path?: string`: Path to a database file. If not provided, an in-memory database is created.
- **Returns**: `Promise<SimpleGraph>`

### `graph.nodes`

Namespace for all node-related operations.

- `get(id: string): Promise<Node | null>`: Retrieves a single node by its ID.
- `add(node: Node): Promise<void>`: Adds a new node.
- `update(id: string, partialNode: Partial<Node>): Promise<void>`: **(New)** Updates an existing node.
- `delete(id: string): Promise<void>`: Deletes a node. Protects the genesis node.
- `find(query: string): Promise<Node[]>`: A more generic search function, replacing `searchNodes` and `getNodesByType`.

### `graph.edges`

Namespace for all edge-related operations.

- `get(source: string, target: string): Promise<Edge | null>`: Retrieves edges between two nodes.
- `add(edge: Edge): Promise<void>`: Adds a new edge.
- `update(source: string, target: string, partialEdge: Partial<Edge>): Promise<void>`: **(New)** Updates an existing edge.
- `delete(source: string, target: string): Promise<void>`: Deletes an edge.
- `forNode(id: string, direction: 'incoming' | 'outgoing' | 'both'): Promise<Edge[]>`: Retrieves all edges for a given node.

### `graph.query`

Namespace for advanced, whole-graph queries and traversals.

- `raw(sql: string, params?: any[]): Promise<any[]>`: **(New)** Execute a raw, read-only SQL query.
- `traverse(options: TraverseOptions): Promise<Node[]>`: Performs a graph traversal. `TraverseOptions` would include `startNodeId`, `maxDepth`, etc.
- `stats(): Promise<GraphStats>`: Retrieves statistics about the graph.

### `graph.visualize`

Namespace for visualization-related functionality.

- `mindMap(options: MindMapOptions): Promise<string>`: Generates a DOT string for a mind map. `MindMapOptions` would include `startNodeId` and `depth`.
- `render(dot: string, options: RenderOptions): Promise<void>`: Renders a DOT string to an image file. `RenderOptions` would include `format` and `path`.

### `graph.close()`

Closes the database connection gracefully.

---

## 3. Identified Gaps & Recommendations

- **Missing**: **Update Operations**. The current codebase lacks explicit `updateNode` or `updateEdge` functions. These are fundamental for any database library and should be added.
- **Missing**: **Transaction Support**. For operations that require multiple steps (e.g., adding a node and an edge together), transactions are necessary to ensure data integrity. The API should expose `beginTransaction()`, `commit()`, and `rollback()` methods.
- **Missing**: **Custom Error Types**. The library should throw custom error classes (e.g., `NodeNotFoundError`, `GenesisNodeError`) to allow consumers to handle specific error cases programmatically.
- **Superfluous**: The various connection functions (`connectToTheLoom`, `createMemoryDatabase`, etc.) are redundant. A single, well-defined `SimpleGraph.connect()` method provides a cleaner and more predictable entry point.
- **Recommendation**: The internal database helper functions (e.g., `insertNodeFromObject`) should not be part of the public API to avoid confusion and ensure a clean public interface.
