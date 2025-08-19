# **Project Brief: Implement Layered Configuration for `simple-graph` API**

**1. Objective:**
To refactor the `simple-graph` API to use a flexible, layered configuration strategy, moving away from purely programmatic options. This will enhance usability and align the module with modern best practices for software design.

**2. Guiding Heuristic:**
This implementation must adhere to the principles outlined in **`OH-085: Layered Configuration Protocol (LCP)`**, which specifies the following order of precedence for settings:

1. **Programmatic Overrides** (highest priority)
2. **User-Defined `simple-graph.settings.json`**
3. **Default Configuration** (lowest priority)

**3. Technical Implementation Plan:**

- **Phase 1: Default Configuration**

1. Create a new file: `src/config/default-config.ts`.
2. Within this file, define and export a constant named `DEFAULT_CONFIG`.
3. This object should contain the baseline settings, including the modern PRAGMA configuration for SQLite.

- **Phase 2: Configuration Loading and Merging**

1. Create a new file: `src/config/load-config.ts`.
2. Implement a function `loadConfig()` that performs the following:

- Starts with the `DEFAULT_CONFIG`.
- Searches for a `simple-graph.settings.json` file in the root of the project.
- If found, it reads and parses the JSON file.
- It then merges the user's settings from the JSON file over the default configuration, deeply.
- The function should return the final, merged configuration object.

3. This process must include robust error handling for cases like a malformed JSON file.

- **Phase 3: API Integration**

1. Modify the primary connection function (currently `createKnowledgeGraph` in `src/database/index.ts`) to incorporate the new configuration logic.
2. The function should now call `loadConfig()` to get the base configuration.
3. It must then merge any programmatic `options` passed directly to it over the configuration returned by `loadConfig()`, thus completing the layering required by `OH-085`.
4. The final, merged configuration object will then be used to establish the database connection.

**4. Verification:**

- **Unit Tests**: Create a new test file, `tests/unit/config-loading.test.ts`, to verify the layering logic.
- Test that default values are loaded correctly.
- Test that a `simple-graph.settings.json` file correctly overrides the defaults.
- Test that programmatic options correctly override both the defaults and the JSON file settings.
- **Type Safety**: All new and modified code must pass a TypeScript compilation check (`bun tsc --noEmit`) with zero errors, as mandated by **`OH-084: Type-Safe Implementation Protocol (TSIP)`**.

This brief is now ready for the coding agent to begin execution.
