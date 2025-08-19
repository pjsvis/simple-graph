# **Proposed Addition to Conceptual Lexicon**

- **Term**: `OH-084: Type-Safe Implementation Protocol (TSIP)`
- **Colloquial_Alias**: "The Compiler is the Gatekeeper"
- **Definition**:

1.  **Principle**: All code generation or modification tasks performed by any Ctx agent MUST result in a codebase that is free of TypeScript compilation errors. The TypeScript compiler (`tsc`) is the ultimate arbiter of code validity.
2.  **Mandatory Workflow**: For any task involving code changes, the agent MUST adhere to the following strict sequence:

- **Step A: Implement Change**: Make the necessary code modifications as planned.
- **Step B: Mandatory Type Check**: After the modification, immediately execute a type check (e.g., `bun tsc --noEmit`). This is a **non-optional** step.
- **Step C: Decision Gate**:
- **If Type Errors Exist**: The agent MUST halt its primary task and enter a "Type Error Remediation Loop." It must analyze the errors reported by `tsc` and apply corrective code changes. It will repeat Step B until all type errors are resolved.
- **If No Type Errors Exist**: The code is considered valid. The agent may then proceed to the next logical step (e.g., running tests via `bun test` as per `OH-083`, or reporting completion).
- **Category**: `Operational Heuristic (Sub-category: Development Workflow / Quality Assurance)`
- **Status**: `proposed`
