**Learn more about vector databases and embeddings:**  
[Introduction to Vector Databases & Embeddings (HTML)](vector-database-intro.html)

# Introduction to Graph Databases

A graph database is a system designed to store and query relationships between data using nodes (entities) and edges (connections). This structure makes it easy to explore complex relationships, hierarchies, and patterns—far beyond what traditional table-based databases can offer.

## Why Use a Graph Database?

- Discover connections between concepts, people, or objects.
- Analyze networks (social, knowledge, recommendations).
- Efficiently answer questions like “Who is connected to whom?” or “What are the shortest paths between two points?”
- Visualize and understand data structure in a more intuitive way.

## Example: E-Commerce Recommendation Engine

Imagine a simple online store that wants to provide “customers who bought this also bought...” recommendations.

**Graph Structure:**

- **Nodes:**
  - `customer`: Represents a user (e.g., `{ id: 'user123', type: 'customer', name: 'Alice' }`)
  - `product`: Represents an item for sale (e.g., `{ id: 'product-abc', type: 'product', name: 'Quantum Entangler' }`)
  - `category`: Represents a product category (e.g., `{ id: 'cat-01', type: 'category', name: 'Gadgets' }`)
- **Edges:**
  - `PURCHASED`: Connects a `customer` to a `product`
  - `BELONGS_TO`: Connects a `product` to a `category`

**Workflow:**

1. Add nodes for each customer, product, and category.
2. When a customer buys a product, add a `PURCHASED` edge.
3. To generate recommendations:
   - Find all customers who bought “Product X”.
   - Find all other products those customers bought.
   - Aggregate and rank these products to recommend the most popular co-purchases.

This example shows how graph databases make it easy to analyze relationships and generate insights in real-world scenarios.

## Search and Traversal: The Find-Then-Traverse Pattern

In graph databases, the journey often begins with **search**. Before you can explore relationships, you need to locate your starting node—such as a customer by name. The `search()` function helps you find the node ID for "Alice" so you can traverse her connections and recommendations.

```js
// Find-then-traverse pattern in an e-commerce graph
import { createKnowledgeGraph } from "./database";

const kg = await createKnowledgeGraph("ecommerce.db");

// Step 1: Find the starting node
const searchResults = await kg.search("Alice", ["name"]);
const aliceNode = searchResults[0];

if (aliceNode) {
  console.log(`Found Alice's node ID: ${aliceNode.id}`);

  // Step 2: Use the ID to traverse the graph
  const purchases = await kg.traverse(aliceNode.id, 1, "outgoing");
  console.log("Alice's Purchases:", purchases);
} else {
  console.log("Customer not found.");
}
```

This **find-then-traverse** pattern is central to graph database workflows. It enables recommendations, relationship analysis, and much more.
