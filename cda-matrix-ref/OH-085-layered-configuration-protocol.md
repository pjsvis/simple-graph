You are correct to question this. Hard-coding configuration directly into the API or relying solely on programmatic options is indeed brittle and restrictive. It violates the principle of separating configuration from implementation, which is a cornerstone of flexible and maintainable software.

My assessment is that your intuition is sound. **Yes, we absolutely should have a `settings.json` file for the `simple-graph` API.**

---

### Analysis

The current approach, where options are passed programmatically via an interface like `ConnectOptions`, is excellent for type safety and for developers who are directly integrating the library into a larger application. However, it fails to account for other common use cases, such as running standalone scripts or allowing for environment-specific configurations without recompiling the code.

By externalizing configuration, we gain several key advantages:

* **Flexibility**: Users can easily modify database paths, PRAGMA settings, or other parameters without touching the source code. This is crucial for deploying the same codebase in different environments (development, testing, production).
* **Clarity**: A `settings.json` file provides a single, clear location to understand and manage the library's behavior. This improves maintainability and reduces the cognitive load (`OPM-10`) for new developers.
* **Robustness**: It allows us to establish sensible defaults within the file, while still giving users the power to override them. This makes the API easier to use out-of-the-box.

---

### Proposal

I propose we adopt a hybrid configuration strategy that leverages the strengths of both approaches. This will provide a robust, layered system for managing settings.

1.  **Establish Default Configuration**: We will create a `simple-graph.config.ts` file that exports a default configuration object. This provides a clear, version-controlled baseline.
2.  **Introduce `settings.json` for Overrides**: The API will look for an optional `simple-graph.settings.json` file in the project root. If found, it will merge these settings over the defaults.
3.  **Prioritize Programmatic Options**: Any options passed directly to the `SimpleGraph.connect()` method will take the highest precedence, overriding both the defaults and the `settings.json` file.

This creates a clear hierarchy: **Programmatic > `settings.json` > Defaults**.

To formalize this, I propose we add the following Operational Heuristic to our Conceptual Lexicon:

***

### **Proposed Addition to Conceptual Lexicon**

* **Term**: `OH-085: Layered Configuration Protocol (LCP)`
* **Definition**: For any module or application requiring configuration, a layered approach shall be implemented to ensure both flexibility and predictability. The order of precedence for loading settings will be:
    1.  **Programmatic Overrides**: Arguments passed directly to functions or constructors.
    2.  **User-Defined Configuration**: An external file (e.g., `settings.json`) that can be easily modified by the user without changing the source code.
    3.  **Default Configuration**: A version-controlled file within the source code that provides sensible default values.
    This protocol ensures that users have a simple way to configure the system, while developers retain the ability to override settings for specific use cases.
* **Category**: `Operational Heuristic (Sub-category: Architectural Design)`
* **Status**: `proposed`
