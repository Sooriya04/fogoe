# Fogoe Git Commands

Fogoe abstracts away standard Git commands to provide a zero-friction workflow for managing your repository.

Below is a reference for the custom Git commands provided by Fogoe, as well as an explanation of the different ways you can run the CLI.

---

## Running Fogoe

You can run Fogoe either explicitly via `npx` (without installing it) or by installing it globally.

### Option 1: Using `npx`
If you don't want to install Fogoe globally on your machine, you can run it via `npx`. This fetches the latest version of the CLI directly from npm every time you run it.

```bash
npx fogoe          # Launches the interactive project initializer
npx fogoe init     # Initializes Git in an existing project
npx fogoe push "msg" # Pushes changes
```

### Option 2: Global Installation
If you prefer a shorter command and use Fogoe frequently, you can install it globally using npm.

```bash
npm install -g fogoe
```

Once installed, you can drop the `npx` prefix:
```bash
fogoe              # Launches the interactive project initializer
fogoe init         # Initializes Git in an existing project
fogoe push "msg"   # Pushes changes
```

---

## The Commands

### 1. The Interactive Initializer
- **Command:** `npx fogoe` (or `fogoe`)
- **What it does:** Launches the main setup wizard to scaffold a new Node.js backend project from scratch. It handles configuration choices like language (JavaScript/TypeScript), framework, database, and optionally initializes a Git repository all at once.

### 2. Initializing Git
- **Command:** `npx fogoe init` (or `fogoe init`)
- **What it does:** Integrates Git into an *existing* Fogoe project. It initializes a local Git repository, creates the initial commit, connects your local repository to a provided GitHub remote URL, and updates the `fogoe.config.json` to enable future Git commands.

### 3. Pushing Changes
- **Command:** `npx fogoe push "<message>"` (or `fogoe push "<message>"`)
- **What it does:** A complete shortcut command that automatically stages, commits, and pushes your changes to GitHub in one seamless operation.
  - Automatically runs:
    1. `git add .` (Stages all changes)
    2. `git commit -m "<message>"` (Commits changes)
    3. `git push` (Pushes to the remote repository)
