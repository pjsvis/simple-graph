# github worktree process

Adopting `git worktree` is the perfect way to create a safe and efficient "sandbox" for AI agents. Here is a practical workflow you can use, designed to be robust and easy to follow.

## The "Agent Sandbox" Workflow

This workflow ensures that the AI agent operates in a completely isolated environment, preventing any unintended changes to your main project while allowing for easy review and integration of its work.

-----

## The One-Time Setup

You only need to do this once per repository.

### 1\. Choose a Location for Your Worktrees

The best practice is to keep the worktrees *inside* your main project directory, but in a folder that is ignored by Git itself. This keeps everything self-contained.

**Action:**
Create a directory named `.worktrees` inside your project folder (e.g., `D:\dev\simple-graph\.worktrees`). The leading dot helps signify it as a hidden/meta directory.

### 2\. Update Your `.gitignore`

Add the worktree directory to your project's root `.gitignore` file. This is the most critical step for keeping your main repository clean.

**Action:**
Add the following line to your `.gitignore` file:

```
# Ignore agent worktree sandboxes
/.worktrees/
```

-----

## The Per-Task Workflow

You will repeat this simple process for every new "brief" or task you give to a coding agent.

### Step 1: Create the Agent's Worktree

From your main project directory (e.g., `D:\dev\simple-graph`), where you are likely on your `main` or `develop` branch, run the following command in your terminal:

```bash
git worktree add .worktrees/<brief-name> -b <new-branch-name>
```

  * **`<brief-name>`:** A short, descriptive name for the task (e.g., `brief-002-cli-entrypoint`).
  * **`<new-branch-name>`:** The name of the new Git branch the agent will work on (e.g., `feat/agent-brief-002`).

**Example:**
`git worktree add .worktrees/brief-002 feat/agent-brief-002`

This creates a new folder `D:\dev\simple-graph\.worktrees\brief-002` and checks out a new branch named `feat/agent-brief-002` inside it.

### Step 2: Invoke the AI Agent in the Sandbox

Now, instruct your AI agent to perform its coding task, but with its working directory set **exclusively** to the new worktree path.

**Example Instruction:**

> "Your task is to implement the CLI entry point. Your working directory is `D:\dev\simple-graph\.worktrees\brief-002`. All file operations must be relative to this path. Please commit your final changes to the current branch when you are done."

The agent now operates in a perfect sandbox. It can install dependencies, create files, and make commits without any risk to your main working directory.

### Step 3: Review the Agent's Work (Human in the Loop)

Once the agent has completed its task and committed its code, you can review its work from the safety of your main project directory using standard Git and GitHub workflows.

**Action:**

1.  Run `git fetch` to see the new branch created by the worktree.
2.  You can now create a pull request from the agent's branch (`feat/agent-brief-002`) to your main branch.
3.  Perform a normal code review on the pull request.

### Step 4: Merge and Clean Up

After you've reviewed and merged the pull request, the worktree is no longer needed and can be safely discarded.

**Action:**
Run the following command from your main project directory:

```bash
git worktree remove .worktrees/<brief-name>
```

**Example:**
`git worktree remove .worktrees/brief-002`

This workflow provides the perfect balance of isolation, efficiency, and control, making it an ideal platform for managing AI-driven development.