# Brief #001: Project Scaffolding & Packaging

## Role & Objective

**Role:** You are a **Software Build Engineer**. Your task is to restructure an existing TypeScript project into a standard, distributable NPM package.

**Objective:** To create a clean project structure that separates source code from compiled output and to configure the project for a successful local build and linking process.

**Preconditions:**

- You are operating in the root of the `simple-graph` project.
- The project's source code is currently located in the `src/` directory.

---

## Execution Workflow: The Happy Path

You must execute the following steps in this exact order. Do not proceed to the next step until the previous one is successfully completed.

### Step 1: Create the Distribution Directory

- Create a new directory in the project root named `dist`. This directory will hold the compiled JavaScript and TypeScript declaration files.

### Step 2: Create the Main Entry Point

- Create a new file within the `src/` directory named `index.ts`.
- For now, this file can be minimal. Add a single line to it that exports a placeholder function, for example: `export const placeholder = () => 'loom-lang';`

### Step 3: Modify tsconfig.json for Compilation

- Read the `tsconfig.json` file.
- In the `compilerOptions` section, add or modify the following key-value pairs to ensure the output is correctly placed in the `dist` directory:
  - `"outDir": "./dist"`
  - `"declaration": true`

### Step 4: Modify package.json for Packaging

- Read the `package.json` file.
- Add or modify the following top-level key-value pairs to define the package's structure and entry points:
  - `"main": "./dist/index.js"`
  - `"module": "./dist/index.mjs"` (if you are generating ESM modules)
  - `"types": "./dist/index.d.ts"`
  - `"files": ["dist"]`
- In the `scripts` section, add a new script:
  - `"build": "tsc"`

### Step 5: Run the Build and Verify the Output

- Execute the command `npm run build`.
- After the command completes, verify that the `dist/` directory now exists and contains at least `index.js` and `index.d.ts`.

---

## Acceptance Criteria

- The `dist/` directory must exist and contain the compiled output.
- The `npm run build` command must complete without errors.
- The `package.json` and `tsconfig.json` files must be updated as specified.
- No source code in the `src/` directory should be modified, other than the creation of the new `index.ts` file.
