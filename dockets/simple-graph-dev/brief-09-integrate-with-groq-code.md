# **Project Brief: `simple-graph` Integration with `qroq-code`**

## **1. Objective:**

To enhance the `qroq-code` CLI by integrating the `simple-graph` knowledge graph module. This will provide a persistent, queryable context of the codebase, which can be used to augment and inform LLM queries, thereby improving the accuracy and relevance of generated code and analysis.

## **2. Core Deliverable:**

A new `qroq-code` tool and a corresponding slash command (`/graph`) that allows users to query the `simple-graph` database in the context of the current project.

## **3. Technical Implementation Plan:**

- **Phase 1: Module Integration**

  - **File Scaffolding**: Copy the required core files from `simple-graph` into a new `src/tools/simple-graph/` directory within the `qroq-code` project.
    - `src/types/base-types.ts`
    - `src/database/connection.ts`
    - `src/database/schema.ts`
    - `src/database/insert-node.ts`
    - `src/database/insert-edge.ts`
    - `src/database/operations.ts`
    - `src/database/index.ts`
  - **Dependency Management**: Add `sqlite3` and its corresponding types to the `package.json` and run `bun install`.

## **Phase 2: Tool Definition & Registration**

- **Schema Definition**: Create a new tool schema, `knowledgeGraphToolSchema`, in `src/tools/tool-schemas.ts`.
  - **Name**: `knowledgeGraphQuery`
  - **Description**: "Queries the codebase knowledge graph for nodes and relationships."
  - **Parameters**:
    - `query`: (string, required) The search query to execute against the knowledge graph.
- **Tool Implementation**: Implement the `knowledgeGraphQuery` function in `src/tools/tools.ts`.
  - This function will import and instantiate the `KnowledgeGraph` class from the newly integrated module.
  - It will execute the `search()` and `traverse()` methods based on the user's query and return a formatted string of the results.
- **Registration**: Register the new schema and function in the `TOOL_REGISTRY` and `executeTool` switch statement in `src/tools/tools.ts`.

## **Phase 3: User Interface (Slash Command)**

- **Command Definition**: Create a new command definition file, `src/commands/definitions/graph.ts`.
  - **Command**: `/graph`
  - **Description**: "Query the project's knowledge graph."
- **Handler Logic**: The command's handler will construct a tool-call message for the `knowledgeGraphQuery` tool, passing the user's input as the `query` parameter.
- **Registration**: Register the new `/graph` command in `src/commands/index.ts`.

## accomplishments, problems, and lessons learned

- After reviewing the files, and implelmenting part 3. above I have identified several issues that are causing the build to fail.
- NOTE: Filenames refer to the fioles in their new location in the groq-code-cli repo
- however we should resolve these errors her in the simple-graph repo 
- then we can port a fully functional set of files to the groq-code-cli repo
- provide your opinion and propose a plan and checklist to resolve the issues

1. In `src/tools/simple-graph/database/search.ts`:

- The function fullTextSearch is not exported, but it is used in
  src/tools/simple-graph/database/operations.ts as searchNodesSQL. The function should be renamed to
  searchNodes and exported.

2. In `src/tools/simple-graph/database/operations.ts`:

- The import of searchNodes as searchNodesSQL from ./search is incorrect because search.ts does not
  export searchNodes.
- The Database type from sqlite3 is used, but the DatabaseConnection type from base-types.ts should
  be used instead for consistency.
- The getGraphStats function returns an object that does not match the GraphStats interface from
  base-types.ts.
- The batchInsertEdges function has a property label that does not exist on type Edge.

3. In `src/tools/simple-graph/database/index.ts`:

- There are multiple errors of the type Cannot find name 'DatabaseConnection'. This is because the
  DatabaseConnection type is not being correctly exported or imported.
- The Node and Edge types are causing compatibility issues because they are being imported from
  different places.

To fix these issues, I will perform the following changes:

1.  In `src/tools/simple-graph/database/search.ts`:

    - Rename fullTextSearch to searchNodes and export it.

2.  In `src/tools/simple-graph/database/operations.ts`:

    - Change the import from ./search to import { searchNodes } from './search'.
    - Replace all instances of db: Database with db: DatabaseConnection.
    - Update the getGraphStats function to return the correct GraphStats object.
    - Remove the label property from the batchInsertEdges function.

3.  In `src/tools/simple-graph/database/index.ts`:
    - I will review the imports and exports to ensure that the DatabaseConnection, Node, and Edge
      types are correctly handled.


