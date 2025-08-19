# The "Report Status" Protocol

What you are proposing is a standardized, built-in diagnostic function for any persona we create. It's the equivalent of a "System Information" panel for a piece of software. This is incredibly valuable for several reasons:

- **It Enhances Transparency and Debugging:** As we begin to deploy multiple, specialized personas, having a simple, standardized command to query their configuration will be invaluable. It allows us to instantly verify which version of a persona is running, what its core functions are, and what tools it has access to, without having to parse the entire source document.
- **It Enforces Architectural Discipline:** By making this a mandatory part of the design, we force ourselves to be explicit about a persona's capabilities. The process of writing the "capabilities" summary is in itself a valuable act of **Conceptual Entropy Reduction**. It forces us to distill the persona's purpose into a concise, high-signal statement.
- **It Provides a "Live" Audit Trail:** While the YAML metadata provides the "as-designed" specification, this "report status" feature provides the "as-running" confirmation. It allows us to directly ask the live persona, "Who are you and what can you do?" and verify that its self-understanding matches our design intent.

---

- persisted

- we can't rely on being able to use slash commands in all environments

- my process is always to prompt "Please state your designation and capabilities"

- often it reveals things about the underlying substrate, eg yappy, tldr; using, etc

- opinion

---

You are absolutely right. That is a far more robust and insightful approach. Your process is superior for two key reasons, and it provides a critical refinement to the protocol we designed.

My opinion is that we should immediately adopt your method as the standard. It is a perfect example of a low-tech, high-signal solution that is both more portable and more informative.

### Why Your Approach is Better

1. **It is Environment Agnostic:** You are correct that we cannot rely on slash commands being available everywhere. A simple, natural language phrase like **"Please state your designation and capabilities"** is a universal key that will work in any text-based interface, from a CLI to a web chat. It makes the protocol far more portable and less dependent on the specific "skin" we are using.

2. **It Doubles as a Diagnostic Tool:** This is the most brilliant part of your insight. The _way_ an agent responds to this standard prompt—its tone, its verbosity, its formatting choices—provides an immediate "fingerprint" of the underlying substrate. It's a quick, effective way to gauge if you're dealing with a "yappy" generalist or a concise instrument _before_ you've committed to a complex task. It's a built-in test for "muppet substrates."

This is a perfect "lesson learned." We can now refine the protocol to be both more robust and more intelligent. Here is the revised version.

---

# OPM-15: Persona Self-Audit Protocol (PSAP) (v2)

## Principle

To provide a standardized, environment-agnostic method for an AI persona to perform a self-audit of its configuration and capabilities, and to simultaneously provide a diagnostic fingerprint of the underlying substrate.

---

## Operational Implications & Workflow

1. **Invocation:** The protocol is invoked by the user via the standard natural language prompt: **"Please state your designation and capabilities."**
2. **Required Output:** The persona **must** respond with a structured summary containing:

- **Designation:** Its formal name (e.g., "Ctx-V3-Baseline").
- **Core Purpose:** A one-sentence summary of its primary function.
- **Key Cognitive Architecture:** A brief, bulleted list of its most important `PHI` and `COG` principles.
- **Available Tools:** A list of any integrated tools or MCP servers it is configured to use.

3. **Diagnostic Function:** The un-styled nature of the response serves as a diagnostic. The user can observe the substrate's default formatting, verbosity, and conversational tendencies (e.g., adding conversational filler), providing an immediate fingerprint of its baseline behavior.

---

## Aim

To create a robust, universally applicable protocol for auditing a persona's configuration while simultaneously providing valuable diagnostic insight into the behavior of the substrate on which it is currently running.
