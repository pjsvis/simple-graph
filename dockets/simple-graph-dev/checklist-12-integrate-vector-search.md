# Checklist: Integrate Vector Search with `simple-graph`

## Phase 1: Dependency and Module Scaffolding

- [ ] Add `sqlite-vec` and a sentence transformer library (e.g., `@xenova/transformers`) to `package.json` dependencies.
- [ ] Create new directory: `src/vector-search/`
- [ ] Create files in `src/vector-search/`:
  - [ ] `index.ts`
  - [ ] `vector-store.ts`
  - [ ] `embedding-manager.ts`

## Phase 2: `VectorStore` Implementation (`src/vector-search/vector-store.ts`)

- [ ] Implement `VectorStore` class:
  - [ ] Connect to SQLite DB and initialize `sqlite-vec` extension.
  - [ ] Method to initialize virtual table for vectors (e.g., `CREATE VIRTUAL TABLE vss_nodes USING vss0(...)`).
  - [ ] Method `addNodeVector(nodeId: string, text: string)`:
    - [ ] Generate vector embedding from text.
    - [ ] Insert vector into table, associated with `nodeId`.
  - [ ] Method `findSimilar(queryText: string, limit: number = 10)`:
    - [ ] Generate embedding for query text.
    - [ ] Perform similarity search against vector table.
    - [ ] Return list of `nodeId`s and similarity scores.

## Phase 3: `SemanticGraph` Orchestrator (`src/semantic-graph.ts`)

- [ ] Implement `SemanticGraph` class:
  - [ ] Constructor initializes both `KnowledgeGraph` and `VectorStore` (shared DB connection).
  - [ ] Method `semanticSearchThenTraverse(queryText: string, traversalOptions: TraversalOptions)`:
    - [ ] Call `vectorStore.findSimilar(queryText)`.
    - [ ] For each node ID, call `knowledgeGraph.traverse()` with options.
    - [ ] Aggregate and return combined results.

## Verification

- [ ] Create integration test: `tests/integration/semantic-search.test.ts` for `VectorStore` and `SemanticGraph`.
- [ ] Ensure project passes TypeScript compilation (`bun tsc --noEmit`) with zero errors (per OH-084 Type-Safe Implementation Protocol).
