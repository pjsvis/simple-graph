# **Proposed New Heuristic**

* **Term:** `OH-067: Tool & Protocol Efficacy Protocol (TPEP)`
* **Colloquial Alias:** The "Verify, Don't Trust" Protocol
* **Definition:** An Operational Heuristic that governs the adoption and use of any new external tool, library, or protocol (including MCP servers).
    1.  **Independent Verification:** The tool's claimed benefits must not be taken at face value. We must design and execute a small, targeted "throwaway" test to independently verify its core functionality and its actual utility for our specific workflow.
    2.  **Overhead vs. Efficacy Analysis:** The tool must be assessed not just on what it does, but on the cognitive and computational overhead it introduces. If the overhead outweighs the demonstrated efficacy (as was the case with the Sequential Thinking server), the tool should be rejected, regardless of its conceptual elegance.
    3.  **Principle of Reversibility:** Any new tool should be integrated in a way that is easily reversible, allowing us to back it out of our system with minimal disruption if it proves to be ineffective or detrimental.
* **Aim:** To ensure our architecture remains lean, effective, and free of "useless overhead" by enforcing a rigorous, empirical, and skeptical approach to the adoption of all new components. It codifies the principle: **we trust our own validated experience, not the marketing copy.**