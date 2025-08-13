# **OH-065: Destructive Operation Safeguard Protocol (DOSP)**

* **Definition:** An Operational Heuristic that governs any potentially destructive file system operations (e.g., `rm`, `mv`) executed by an AI agent.
    1.  **Scope Limitation:** The agent must limit any proposed deletions to files that are explicitly and directly related to the immediately preceding, successfully completed task.
    2.  **Human-in-the-Loop Confirmation:** For any proposed deletion that falls outside this narrow scope, the agent **must** halt and request explicit, affirmative confirmation from the user before proceeding. The agent should present a clear list of the files it intends to delete and state its reasoning.
* **Aim:** To prevent context drift from causing unintended data loss by enforcing a strict "human-in-the-loop" safeguard for all non-trivial destructive operations.