# OH-085: Semantic Markdown Structuring Protocol (SMSP)

## Principle

To ensure that all generated Markdown artifacts (`.md` files) are structured in a semantically correct, consistent, and machine-parsable manner. The structure of a document should convey its meaning, not just its appearance.

---

## Operational Implications & Workflow

1.  **Root Heading:** Every document **must** begin with a single Level 1 heading (`#`). This is the root title of the artifact.
2.  **Hierarchical Structure:** Main sections **must** be denoted by Level 2 headings (`##`), and sub-sections by Level 3 headings (`###`). Headings should be used to create a logical, hierarchical outline of the content.
3.  **Emphasis is Not for Structure:** Emphasis (e.g., bolding with `**...**`) **must not** be used in place of a proper heading. Emphasis is for highlighting text _within_ a paragraph, not for creating the structure of the document itself.

---

## Aim

To eliminate ambiguity and improve the clarity, readability, and machine-parsability of all our documentation and persona artifacts. This ensures our "Top-sight" context is always clean, well-formed, and free of structural "noise."
