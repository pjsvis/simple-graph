Understood. Here is the project brief for the coding assistant to refactor the API's class names.

---

### **Project Brief: Refactor `simple-graph` API Class Naming**

**1. Objective:**
To improve the clarity, expressiveness, and conceptual integrity of the `simple-graph` API by refactoring the existing class names to be more descriptive and imperative, removing the `"Manager"` suffix code smell.

**2. Rationale:**
The current use of the `...Manager` suffix is vague and considered a code smell. It obscures the true responsibility of the classes. By adopting more precise, domain-oriented names, we will reduce ambiguity and cognitive load, aligning with our core principle of **Conceptual Entropy Reduction (`PHI-12`)**. This change will make the API more intuitive and fluent for developers.

**3. Refactoring Plan:**

The following class renames shall be implemented across the entire codebase:

| Current Class Name     | New Class Name  | Rationale                            |
| ---------------------- | --------------- | ------------------------------------ |
| `NodeManager`          | `Nodes`         | Adopts a clear, fluent API style.    |
| `EdgeManager`          | `Edges`         | Adopts a clear, fluent API style.    |
| `QueryManager`         | `GraphQuery`    | Imperative and directly descriptive. |
| `VisualizationManager` | `GraphRenderer` | Imperative and directly descriptive. |

**4. Execution Plan:**

The coding agent must perform a global, case-sensitive search-and-replace for each class name in the table above. This includes:

1. **File and Class Renaming**: Rename the class definitions and their corresponding filenames (e.g., `NodeManager.ts` becomes `Nodes.ts`).
2. **Update Internal References**: Update all internal instantiations and type references within the `simple-graph` library (e.g., in the main `SimpleGraph.ts` class).
3. **Update Imports**: Correct all import statements across the entire project that reference the old class names.

**5. Verification:**

- **Type Safety**: After the refactoring is complete, the entire project must pass a TypeScript compilation check (`bun tsc --noEmit`) with **zero errors**, as mandated by **`OH-084: Type-Safe Implementation Protocol (TSIP)`**.
- **Test Suite**: All existing unit and integration tests must pass successfully using the `bun test` command, as per **`OH-083: Bun Test Execution Protocol`**. This will validate that the refactoring has not introduced any breaking changes to the API's public contract.

This brief is now ready for execution.
