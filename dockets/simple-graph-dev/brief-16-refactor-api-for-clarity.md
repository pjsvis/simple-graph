# **Brief: Refactor API Structure for Conceptual Clarity**

## **1\. Objective**

To refactor the simple-graph project structure to create a clear separation between the high-level public API and the low-level database persistence layer. This will make the codebase more intuitive, maintainable, and easier for new developers to understand.

## **2\. Memory Shard (MSM)**

* **Context**: The current project structure has grown organically. The src/database directory now contains a mix of the main KnowledgeGraph API class, its component classes (Nodes, Edges), and the specific SQLite implementation details (connection.ts, schema.ts, operations.ts).  
* **Reasoning**: This mixing of concerns makes the API opaque. It is not clear what constitutes the public, stable API versus the internal, private implementation. This violates the **Principle of Factored Design (OH-040)** and increases cognitive load.  
* **Decision**: We will restructure the project to introduce a dedicated core directory for the public API and consolidate the database logic into a distinct persistence layer. This will create a clean architectural boundary, improving overall code quality.

## **3\. Technical Implementation Plan**

### **Phase 1: Create New Directory Structure**

1. Create a new directory: src/core. This will house the main public API of the library.  
2. Create a new directory: src/persistence. This will contain all the SQLite-specific implementation details.

### **Phase 2: Relocate and Refine Core API**

1. Move the SimpleGraph class (currently KnowledgeGraph in src/database/index.ts) into its own file: src/core/SimpleGraph.ts.  
2. Move the Nodes, Edges, and GraphQuery classes into their own files within src/core/.  
3. Modify the SimpleGraph class to import and use the classes from the persistence layer, hiding the implementation details from the public interface.

### **Phase 3: Consolidate Persistence Layer**

1. Move src/database/connection.ts, src/database/schema.ts, and src/database/operations.ts into the new src/persistence/ directory.  
2. These files should be treated as an internal module. Update their exports to ensure only the necessary functions are exposed to the core API layer.

### **Phase 4: Update Project Entry Point**

1. Modify the main project entry point (src/index.ts) to export only the classes and types from the src/core/ directory. The persistence layer should not be exposed to the end-user.  
2. Update all internal imports across the project (including in the tests/ directory) to reflect the new file locations.

## **4\. Verification**

* The agent **must** run bun tsc \--noEmit to confirm there are no type errors after the refactoring.  
* The agent **must** run bun test to confirm that the entire test suite passes, ensuring that this refactoring has not introduced any breaking changes to the library's functionality.