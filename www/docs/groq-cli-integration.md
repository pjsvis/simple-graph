# Groq-CLI Integration Guide

This guide explains how to integrate the knowledge graph database module with Groq-CLI.

## 📋 Files to Copy

### Required Core Files
```
src/types/base-types.ts       # Core type definitions
src/database/connection.ts    # Database connection with high-concurrency settings
src/database/schema.ts        # SQLite schema for nodes and edges
src/database/insert-node.ts   # Node insertion utilities
src/database/insert-edge.ts   # Edge insertion utilities
src/database/operations.ts    # High-level database operations
src/database/index.ts         # Main exports and KnowledgeGraph class
```

### Optional Files (for full CDA support)
```
src/types/cl-types.ts         # CDA-specific types (DirectiveNode, etc.)
src/parsers/cda-parser.ts     # CDA markdown parser
```

## 🔧 Dependencies

Add to your `package.json`:
```json
{
  "dependencies": {
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "@types/sqlite3": "^3.1.8"
  }
}
```

## 🚀 Basic Usage

### Simple Knowledge Graph
```typescript
import { createKnowledgeGraph } from './database'

// Create in-memory graph
const kg = await createKnowledgeGraph()

// Add nodes
await kg.insertNode({
  id: 'concept-1',
  type: 'concept',
  name: 'Machine Learning',
  description: 'A subset of artificial intelligence'
})

await kg.insertNode({
  id: 'concept-2', 
  type: 'concept',
  name: 'Neural Networks',
  description: 'Computing systems inspired by biological neural networks'
})

// Add relationship
await kg.insertEdge({
  source: 'concept-2',
  target: 'concept-1',
  properties: {
    type: 'is_subset_of',
    context: 'Neural networks are a key technique in machine learning'
  }
})

// Search and traverse
const results = await kg.search('neural')
const related = await kg.traverse('concept-1', 2, 'both')
const stats = await kg.getStats()

console.log('Search results:', results)
console.log('Related concepts:', related)
console.log('Graph stats:', stats)
```

### File-based Database
```typescript
import { createKnowledgeGraph } from './database'

// Create persistent database
const kg = await createKnowledgeGraph('my-knowledge-graph.db')

// Use the same API as above
await kg.insertNode({ id: 'node1', type: 'entity', name: 'Example' })

// Close when done
await kg.close()
```

### Connect to the knowledge graph
```typescript
import { connectToLoom } from './database'

// Connect to existing Loom database
const loom = await connectToLoom('path/to/the-loom-v2.db', true) // readonly

// Query CDA directives
const phiDirectives = await loom.search('processing philosophy')
const cogStrategies = await loom.search('cognitive')

// Traverse from a specific directive
const related = await loom.traverse('cda-61-phi-1', 3, 'both')
```

## 🏗️ Advanced Usage

### Custom Database Configuration
```typescript
import { createDatabaseConnection, KnowledgeGraph } from './database'

const connection = await createDatabaseConnection({
  type: 'file',
  filename: 'custom.db',
  readonly: false,
  timeout: 10000,
  pragmas: {
    journal_mode: 'WAL',
    busy_timeout: 10000,
    synchronous: 'FULL',
    foreign_keys: 'ON'
  }
})

const kg = new KnowledgeGraph(connection)
await kg.initialize()
```

### Batch Operations
```typescript
// Batch insert nodes
const nodes = [
  { id: 'n1', type: 'concept', name: 'Concept 1' },
  { id: 'n2', type: 'concept', name: 'Concept 2' },
  { id: 'n3', type: 'concept', name: 'Concept 3' }
]

await kg.batchInsertNodes(nodes)

// Batch insert edges
const edges = [
  { source: 'n1', target: 'n2', properties: { type: 'relates_to' } },
  { source: 'n2', target: 'n3', properties: { type: 'leads_to' } }
]

await kg.batchInsertEdges(edges)
```

### Low-level Operations
```typescript
import { 
  createDatabaseConnection, 
  insertNodeSQL, 
  getInsertNodeParams,
  getNodeById 
} from './database'

const connection = await createDatabaseConnection({ type: 'memory' })

// Direct SQL operations
const node = { id: 'test', type: 'example', data: 'value' }
const sql = insertNodeSQL(node)
const params = getInsertNodeParams(node)
await connection.run(sql, params)

// Direct queries
const retrieved = await getNodeById(connection, 'test')
```

## 🎯 Integration Patterns

### Groq Query Enhancement
```typescript
// Enhance Groq queries with knowledge graph context
async function enhanceQuery(query: string, kg: KnowledgeGraph) {
  // Search for relevant concepts
  const concepts = await kg.search(query)
  
  // Get related information
  const context = []
  for (const concept of concepts.slice(0, 5)) {
    const related = await kg.traverse(concept.id, 2, 'both')
    context.push(...related)
  }
  
  return {
    originalQuery: query,
    relevantConcepts: concepts,
    contextualInformation: context
  }
}
```

### Knowledge Graph as Context Provider
```typescript
// Use knowledge graph to provide context for LLM queries
async function getContextForQuery(query: string, kg: KnowledgeGraph) {
  const searchResults = await kg.search(query)
  const stats = await kg.getStats()
  
  return {
    relevantNodes: searchResults,
    graphSize: stats.nodeCount,
    availableTypes: Object.keys(stats.nodeTypes),
    suggestedTraversals: searchResults.map(node => ({
      startNode: node.id,
      description: node.name || node.title || node.id
    }))
  }
}
```

## 🔒 High-Concurrency Features

The database module includes production-grade concurrency features:

- **WAL Mode**: Write-Ahead Logging for concurrent reads/writes
- **Busy Timeout**: 5-second wait for locked databases
- **Connection Pooling**: Ready for multiple concurrent connections
- **Foreign Key Constraints**: Referential integrity enforcement
- **Optimized Indexes**: Fast queries on node IDs and edge relationships

## 📊 Schema Overview

### Nodes Table
```sql
CREATE TABLE nodes (
    body TEXT,                                                    -- JSON node data
    id TEXT GENERATED ALWAYS AS (json_extract(body, '$.id'))     -- Virtual column for ID
        VIRTUAL NOT NULL UNIQUE
);
```

### Edges Table  
```sql
CREATE TABLE edges (
    source     TEXT,                                              -- Source node ID
    target     TEXT,                                              -- Target node ID
    properties TEXT,                                              -- JSON edge properties
    FOREIGN KEY(source) REFERENCES nodes(id),
    FOREIGN KEY(target) REFERENCES nodes(id)
);
```

## 🎊 Ready for Production

This database module is production-ready with:
- ✅ High-concurrency SQLite configuration
- ✅ Comprehensive error handling
- ✅ Type-safe interfaces
- ✅ Flexible schema supporting any node/edge types
- ✅ Efficient indexing and querying
- ✅ Easy integration with external systems

Perfect for enhancing Groq-CLI with persistent knowledge graph capabilities!
