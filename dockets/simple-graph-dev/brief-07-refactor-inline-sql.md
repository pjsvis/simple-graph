# Brief: 007-refactor-inline-sql

- **Docket**: simple-graph-dev
- **Title**: Refactor inline SQL into dedicated, parameterized functions.
- **Objective**: To improve the maintainability, security, and testability of the database layer by refactoring all inline SQL query strings into a set of dedicated, exported functions.
- **Rationale**: Centralizing SQL statement generation is a standard best practice. It prevents SQL injection vulnerabilities by enforcing parameterization, simplifies future schema changes by having the SQL in one place, and allows for isolated unit testing of the query logic itself. This is a direct application of the **Principle of Factored Design (`OH-040`)**.

---

## Key Requirements

1. **Create SQL Module**: A new module (e.g., `src/database/queries.ts`) shall be created to house all SQL query generation logic.
2. **Function per Query**: For each distinct SQL statement in the current codebase, a dedicated, exported function shall be created in the new module.
3. **Parameterization**: All functions must return the parameterized SQL string and, where applicable, an array of parameters. They must **not** use string interpolation to insert values directly into the query string.
4. **Refactor Operations**: All existing database operation functions (e.g., in `NodeManager.ts`, `EdgeManager.ts`) must be refactored to call these new query-generating functions instead of defining SQL inline.

---

## Acceptance Criteria

1. **No Regressions**: All existing integration and unit tests for the database operations must pass after the refactoring is complete.
2. **New Unit Tests**: A new test suite must be created for the `queries.ts` module. Each query-generating function must have a unit test that asserts it returns the correct SQL string for a given input.
