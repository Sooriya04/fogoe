const fs = require("fs");
const { execSync } = require("child_process");
const { input } = require("./prompts");
const chalk = require("chalk");

async function initGit() {
  console.log("\nInitializing GitHub Repository...\n");

  const gitignorePath = ".gitignore";
  const gitignoreContent = "node_modules/\n.env";

  if (!fs.existsSync(gitignorePath)) {
    try {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(".gitignore configured successfully.");
    } catch (err) {
      console.error("Failed to create or update .gitignore file.");
      process.exit(1);
    }
  } else {
    let currentContent = "";
    if (fs.existsSync(gitignorePath)) {
        currentContent = fs.readFileSync(gitignorePath, "utf8");
    }
    
    let toAppend = "";
    if (!currentContent.includes("node_modules/")) toAppend += "\nnode_modules/";
    if (!currentContent.includes(".env")) toAppend += "\n.env";
    
    if (toAppend) {
        try {
            fs.appendFileSync(gitignorePath, toAppend);
        } catch (err) {
             console.error("Failed to create or update .gitignore file.");
             process.exit(1);
        }
    }
  }

  try {
    execSync("git --version", { stdio: "ignore" });
  } catch (err) {
    console.error("Git is not installed. Cannot initialize GitHub repository.");
    process.exit(1);
  }

  try {
    const hasGh = (() => { try { execSync("gh --version", {stdio:'ignore'}); return true; } catch { return false; } })();
    if (hasGh) {
        try {
            execSync("gh auth status", { stdio: "ignore" });
        } catch (err) {
            console.error("GitHub authentication not found. Please log in to GitHub before continuing.");
            process.exit(1);
        }
    } else {
         try {
            execSync("git config user.name", { stdio: "ignore" });
        } catch (err) {
             console.error("GitHub authentication not found. Please log in to GitHub before continuing.");
             process.exit(1);
        }
    }

  } catch (err) {
      console.error("GitHub authentication not found. Please log in to GitHub before continuing.");
      process.exit(1);
  }

  const branchName = (await input("Branch name", "main")) || "main";
  const repoUrl = await input("GitHub repository URL");

  if (!repoUrl) {
      console.error("Repository URL is required.");
      process.exit(1);
  }

  try {
    execSync("git init", { stdio: "ignore" });
    console.log(chalk.green("✓ Git repository initialized"));
  } catch (err) {
    console.error("Failed to initialize Git repository.");
    process.exit(1);
  }

  try {
    execSync("git add .", { stdio: "ignore" });
    console.log(chalk.green("✓ Files staged"));
  } catch (err) {
    console.error("Failed to stage files.");
    process.exit(1);
  }

  try {
    execSync('git commit -m "Initial commit"', { stdio: "ignore" });
    console.log(chalk.green("✓ Initial commit created"));
  } catch (err) {
    console.error("Commit failed. Ensure there are files to commit.");
    process.exit(1);
  }

  try {
    execSync(`git branch -M ${branchName}`, { stdio: "ignore" });
    console.log(chalk.green(`✓ Branch set to ${branchName}`));
  } catch (err) {
    console.error("Failed to set branch.");
    process.exit(1);
  }

  try {
    execSync(`git remote add origin ${repoUrl}`, { stdio: "ignore" });
    console.log(chalk.green("✓ Remote origin added"));
  } catch (err) {
    const existingRemotes = execSync("git remote", { encoding: "utf8" });
    if (existingRemotes.includes("origin")) {
        console.error("Remote origin already exists.");
    } else {
        console.error("Failed to add remote repository.");
    }
    process.exit(1);
  }

  try {
    execSync("git remote -v", { stdio: "ignore" });
  } catch (err) {
    console.error("Failed to verify remote repository.");
    process.exit(1);
  }

  try {
    execSync(`git push -u origin ${branchName}`, { stdio: "ignore" });
    console.log(chalk.green("✓ Repository pushed to GitHub"));
  } catch (err) {
    console.error("Failed to push repository to GitHub.");
    process.exit(1);
  }

  console.log(chalk.green("\n✓ GitHub repository initialized successfully!"));
}

module.exports = { initGit };
