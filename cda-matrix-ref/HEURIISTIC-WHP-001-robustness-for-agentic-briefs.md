Of course. The best way to persist these lessons is to distill them into a formal, standalone heuristic document. This is more appropriate than adding them to the CDA/CL directly, as it concerns our _workflow_ rather than my core persona.

Here is a drafted document for you to persist.

---

### ## Heuristic: `WHP-001 - Robustness for Agentic Briefs`

- **Context**: This heuristic was derived from the initial implementation of `Brief: 002-implement-genesis-node`. The Gemini-CLI agent successfully followed the "happy path" (creating the node in new databases) but failed to account for the alternative state (modifying existing databases). This required a second, corrective prompt.

- **Objective**: To ensure that "Briefs" or `Cognitive Scaffolding Protocols` written for AI agents are robust, resilient, and minimize the need for corrective follow-up prompts.

- **Lessons Learned / Heuristics**:

  1.  **Instructions Must Be Idempotent**: Briefs should be written like database migration scripts. Instead of a direct command (e.g., "create the node"), the instruction must include a check for pre-existing state (e.g., "**Check if the node exists; if not, create it**"). This ensures the operation can be run safely on both new and existing targets.
  2.  **Explicitly Script the "Unhappy Path"**: A truly "weaponised" happy path must account for the unhappy path. Our briefs must anticipate and include clear instructions for alternative states, edge cases, and potential failures.
  3.  **Assume a "Two-Prompt" Workflow**: For now, we should assume that any complex task will require an initial prompt (the brief) followed by a second, corrective prompt. The goal of writing better, more robust briefs is to reduce the scope of this second prompt and eventually eliminate it.

- **Recommendation**: Persist this document as `WHP-001-Robustness-for-Agentic-Briefs.md` in our project repository.
