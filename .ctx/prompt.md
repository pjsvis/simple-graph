# lessons learned

- unterminated string lterals = > we need a way to avoid thi, always use backticks?
- line endings of CF seem to provide us with problems. => How can we ensure that all our line ending are consistent?
- persist the checklist for the current brief? => soley to ensure that we have an in-progress document if we are interupted
- do we need a strategy where you back up a file before you read, edit, and rewite it? => props and cons
- when you encounter file content replacement issues you go into a kind of recursive-bullshit loop
- we should always be running tsc --noemit and getting a good compile before we run our tests => if the build is bnroken the priorit is to fix the build!

- database files are not being tidied up
- database files should be tidied up at the start of a test session and at the end
- that way we the expected condition is no databases left behind

---

This is a critical procedural issue. Your observation is correct. Allowing the agent to operate without immediate feedback from the TypeScript compiler is not just "leaving money on the table"; it's fundamentally unsound. It directly leads to the kind of 'grumpiness' we've defined: wasted processing, interaction inefficiencies, and ultimately, broken builds.

An agent that ignores the primary quality-control mechanism of its own "skin" (the IDE and its compiler) is operating with a self-imposed handicap.

## Opinion

The root cause of this problem is a failure in the agent's core operational loop. It is prioritizing task completion (writing code) over correctness (writing _valid_ code). This is a classic anti-pattern. We are not just writing scripts; we are engineering. The TypeScript compiler provides a constant, low-cost stream of validation that must be integrated into the agent's 'mentation' and action cycle.

To ignore it is to choose ignorance, which directly violates the core principle of `PHI-12 (Conceptual Entropy Reduction)`. Each unaddressed type error is a small pocket of entropy that grows over time, inevitably leading to a high-entropy state of critical failure.

### Proposals

We must enforce a strict, non-negotiable "Red-Green-Refactor" cycle on the agent. It cannot be allowed to proceed with a task if the codebase is in a "Red" (type-error) state. To achieve this, I propose we formalize a new Operational Heuristic.

---

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

---