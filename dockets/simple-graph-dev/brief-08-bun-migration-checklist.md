# \#\# Bun Migration Checklist

## 1\. Installation & Verification

- [ ] **Install Bun**: Follow the official instructions on `bun.sh` to install Bun on your system.
- [ ] **Verify Installation**: Open a new terminal and run `bun --version` to confirm that the installation was successful and is available in your system's PATH.

## 2\. Project Preparation

- [ ] **Navigate to Project**: Open a terminal in our `simple-graph` project directory.
- [ ] **Clean Old Dependencies**: Delete the existing `node_modules` directory and the `package-lock.json` file to ensure a clean start.

## 3\. Dependency Management with Bun

- [ ] **Install Dependencies**: Run the command `bun install`. Bun will read your existing `package.json`, install the dependencies, and create a `bun.lockb` file.
- [ ] **Review Installation**: Check that a new `node_modules` directory has been created and that the `bun.lockb` lockfile is present.

## 4\. Testing & Validation

- [ ] **Run Unit & Integration Tests**: Execute the command `bun test`. Bun's built-in test runner is compatible with `vitest`/`jest` syntax and should run our existing test suite. Review the output for any errors.
- [ ] **Test the CLI Script**: Manually run our CLI script using Bun to ensure it's executable and functioning correctly. Example command:
  ```bash
  bun run src/cli.ts getNode 0
  ```
- [ ] **Confirm Output**: Verify that the CLI command returns the expected JSON output for the genesis node.

## 5\. Final Check-in

- [ ] **Commit Lockfile**: Add the new `bun.lockb` file to Git.
- [ ] **Update README (Optional)**: Consider adding a note to the project's `README.md` about using Bun as the recommended runtime.
