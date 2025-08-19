# **Brief: Implement Initial Persona Graph ORM and Ingestion**

## **1\. Objective**

To create the foundational components of the simple-graph-orm-ts layer for our persona engineering project. This involves defining the data schema via TypeScript types and implementing a quality-gated ingestion process for a single entity type (DirectiveNode).

## **2\. Memory Shard (MSM)**

* **Context**: We have determined that a generic graph schema is insufficient for our specific use case. We require a strongly-typed "sub-schema" or "micro-ORM" to ensure data integrity.  
* **Reasoning**: To maintain a high-quality, conceptually sound knowledge base, all incoming data must be validated against a set of principles: **Atomicity, Clarity, Orthogonality, and Falsifiability**. This cannot be achieved without a formal schema and a dedicated validation layer.  
* **Decision**: We will begin by creating the necessary types and an ingestion script for a single node type (DirectiveNode). This will be validated by a single, atomic test, allowing us to prove the pattern before extending it to other data types.

## **3\. Technical Implementation Plan**

### **Phase 1: Schema and Type Definition**

1. Create a new file: src/types/persona-graph.types.ts.  
2. In this file, implement the specific TypeScript interfaces for the persona graph as defined in the persona\_graph\_recipes artifact. For this brief, you only need to implement PersonaGraphNode and DirectiveNode.

### **Phase 2: Ingestion Quality Gate**

1. Create a new file: src/ingestion/validator.ts.  
2. Implement a validation function: validateDirectiveNode(node: DirectiveNode): { isValid: boolean; errors: string\[\] }.  
3. This function must check the incoming node object against our four quality principles:  
   * **Atomicity**: Check if the description is focused on a single concept (for now, a simple length check will suffice).  
   * **Clarity**: Ensure directiveId, title, and description are non-empty strings.  
   * **Orthogonality**: (Placeholder) This will be implemented later with database lookups. For now, it should always return true.  
   * **Falsifiability**: (Placeholder) This will require more advanced analysis. For now, it should always return true.

### **Phase 3: Ingestion Script & Test**

1. Create a new script: scripts/ingest-directives.ts.  
2. This script should:  
   * Accept a file path to a JSON file containing an array of DirectiveNode objects.  
   * For each object, pass it through the validateDirectiveNode function.  
   * If valid, use the simple-graph API's batchInsertNodes method to add the valid nodes to the database.  
   * Log any errors for invalid nodes.  
3. Create a new test file: tests/integration/ingestion.test.ts.  
4. The test should:  
   * Call the ingest-directives.ts script with a fixture file containing one valid and one invalid DirectiveNode.  
   * Assert that the valid node was added to the database.  
   * Assert that the invalid node was not added.

## **4\. Verification**

* The agent **must** run bun tsc \--noEmit to confirm there are no type errors.  
* The agent **must** run bun test to confirm that the new ingestion.test.ts passes successfully.