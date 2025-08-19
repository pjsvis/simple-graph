# Brief: 005-slash-command-config

- **Docket**: simple-graph-dev
- **Title**: Implement slash command configuration via a `.toml` file.
- **Objective**: To create a system that allows for the definition of simple slash commands (e.g., `/getNode`) in a `.toml` configuration file, which are then translated into the full `bash` commands required to execute the `cli.js` script.
- **Rationale**: This creates an efficiency and abstraction layer on top of our foundational CLI. It allows us (and the AI) to use simple, memorable commands instead of writing out the full `node src/cli.js ...` command string every time, reducing cognitive load and the potential for errors.

---

## Key Requirements

1. **Create `commands.toml`**: A new configuration file, `commands.toml`, should be created at the project root.
2. **Define TOML Structure**: The TOML file should define an array of `commands`. Each command object should have:

- `name`: The slash command (e.g., `/getNode`).
- `description`: A brief explanation of what it does.
- `template`: The `bash` command template (e.g., `node src/cli.js getNode {id}`).

3. **Create a Parser**: A new function or module must be created to parse the `commands.toml` file.
4. **Create a Command Executor**: A new function must be created that takes a slash command and its parameters as input, finds the corresponding template in the parsed TOML data, and executes the templated `bash` command.

---

## Acceptance Criteria

1. **TOML Parsing Test**: A unit test must be written to verify that the `commands.toml` file is correctly parsed into a structured object.
2. **Command Execution Test**: An integration test must be written that calls the command executor with a defined slash command (e.g., `/getNode` with `id: 0`) and verifies that the correct output is received from the underlying `cli.js` script.
