/**
 * # Introduction to Graph Databases
 *
 * A graph database is a system designed to store and query relationships between data using nodes (entities) and edges (connections).
 * This structure makes it easy to explore complex relationships, hierarchies, and patterns—far beyond what traditional table-based databases can offer.
 *
 * ## Why Use a Graph Database?
 * - Discover connections between concepts, people, or objects.
 * - Analyze networks (social, knowledge, recommendations).
 * - Efficiently answer questions like “Who is connected to whom?” or “What are the shortest paths between two points?”
 * - Visualize and understand data structure in a more intuitive way.
 *
 * ## Example: E-Commerce Recommendation Engine
 *
 * Imagine a simple online store that wants to provide “customers who bought this also bought...” recommendations.
 *
 * **Graph Structure:**
 * - **Nodes:**
 *   - `customer`: Represents a user (e.g., `{ id: 'user123', type: 'customer', name: 'Alice' }`)
 *   - `product`: Represents an item for sale (e.g., `{ id: 'product-abc', type: 'product', name: 'Quantum Entangler' }`)
 *   - `category`: Represents a product category (e.g., `{ id: 'cat-01', type: 'category', name: 'Gadgets' }`)
 * - **Edges:**
 *   - `PURCHASED`: Connects a `customer` to a `product`
 *   - `BELONGS_TO`: Connects a `product` to a `category`
 *
 * **Workflow:**
 * 1. Add nodes for each customer, product, and category.
 * 2. When a customer buys a product, add a `PURCHASED` edge.
 * 3. To generate recommendations:
 *    - Find all customers who bought “Product X”.
 *    - Find all other products those customers bought.
 *    - Aggregate and rank these products to recommend the most popular co-purchases.
 *
 * This example shows how graph databases make it easy to analyze relationships and generate insights in real-world scenarios.
 */
import { SimpleGraph } from './SimpleGraph';

export { SimpleGraph };

/**
 * Vector Search & Semantic Search Integration
 *
 * The vector search module enables semantic search and similarity queries using vector embeddings.
 * It leverages sqlite-vec for fast vector similarity and @xenova/transformers for generating embeddings.
 *
 * ## Key Classes
 * - VectorStore: Manages vector storage and similarity search in SQLite.
 * - Vectorizer: Generates vector embeddings for text using transformer models.
 *
 * ## Example Usage
 * ```ts
 * import { VectorStore, Vectorizer } from './vector-search';
 *
 * const vectorizer = new Vectorizer();
 * await vectorizer.init();
 * const embedding = await vectorizer.embed('search text');
 *
 * const store = new VectorStore('mydb.sqlite');
 * await store.init();
 * await store.addNodeVector('node1', 'some text');
 * const results = await store.findSimilar('search text');
 * ```
 */
export * from './vector-search';

// If you want to run CLI logic, you can add:
// if (require.main === module) {
//   // CLI logic here
// }