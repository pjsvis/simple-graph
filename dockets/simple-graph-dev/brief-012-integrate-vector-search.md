# **Project Brief: Integrate Vector Search with `simple-graph`**

**1. Objective:**
To augment the `simple-graph` library with semantic search capabilities by integrating the `sqlite-vec` package. This will enable the discovery of conceptually related nodes, moving beyond simple keyword matching and creating a powerful hybrid search-and-traversal system.

**2. Rationale:**
The current `KnowledgeGraph` excels at traversing explicit, structured relationships. However, it lacks the ability to uncover implicit, semantic relationships between nodes. By integrating `sqlite-vec`, we create a synergistic system where a user can start with a fuzzy, conceptual query (vector search) and then pivot to a precise, structural exploration (graph traversal). This significantly enhances the library's utility as a tool for knowledge discovery.

**3. Architectural Approach:**
We will follow a modular, composable design that respects the **Separation of Concerns** principle. The vector search functionality will be encapsulated in its own module and class, and a new high-level class will be created to orchestrate the interaction between the two.

- **`VectorStore` Class**: A new, self-contained class responsible for all `sqlite-vec` interactions, including initializing the vector extension, creating vector tables, embedding text, and performing similarity searches.
- **`SemanticGraph` Class**: A new top-level class that will instantiate and manage both a `KnowledgeGraph` instance and a `VectorStore` instance. This class will expose a unified API for combined semantic and structural queries.

**4. Technical Implementation Plan:**

- **Phase 1: Dependency and Module Scaffolding**

1.  Add the `sqlite-vec` and an appropriate sentence transformer library (e.g., `@xenova/transformers`) to the project's dependencies in `package.json`.
2.  Create a new directory `src/vector-search/`.
3.  Within this directory, create the following files: `index.ts`, `vector-store.ts`, and `embedding-manager.ts`.

- **Phase 2: `VectorStore` Implementation (`src/vector-search/vector-store.ts`)**

1.  Implement a `VectorStore` class that connects to a SQLite database and initializes the `sqlite-vec` extension.
2.  Create a method to initialize a virtual table for storing vectors (e.g., `CREATE VIRTUAL TABLE vss_nodes USING vss0(...)`).
3.  Implement a method `addNodeVector(nodeId: string, text: string)` that:

- Generates a vector embedding from the input text using the sentence transformer library.
- Inserts the vector into the virtual table, associated with the `nodeId`.

4.  Implement a method `findSimilar(queryText: string, limit: number = 10)` that:

- Generates a vector embedding for the query text.
- Performs a similarity search against the vector table.
- Returns a list of `nodeId`s and their similarity scores.

- **Phase 3: `SemanticGraph` Orchestrator (`src/semantic-graph.ts`)**

1.  Create a new `SemanticGraph` class. Its constructor will initialize both a `KnowledgeGraph` instance and a `VectorStore` instance, sharing the same database connection.
2.  Implement a high-level method `semanticSearchThenTraverse(queryText: string, traversalOptions: TraversalOptions)`. This method will:

- First, call `vectorStore.findSimilar(queryText)`.
- Then, for each of the resulting node IDs, it will call `knowledgeGraph.traverse()` with the provided options.
- It will then aggregate and return the combined results.

**5. Verification:**

1. **Unit Tests**: Create a new test file, `tests/integration/semantic-search.test.ts`, to validate the `VectorStore` and `SemanticGraph` functionality.
2. **Type Safety**: The entire project must pass a TypeScript compilation check (`bun tsc --noEmit`) with zero errors, as mandated by **`OH-084: Type-Safe Implementation Protocol (TSIP)`**.
