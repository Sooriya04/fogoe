const fs = require("fs");
const { input, select } = require("./prompts");
const { scaffold } = require("./scaffold");
const { buildPackageJson } = require("./packageJson");
const { install } = require("./installer");
const chalk = require("chalk");

(async () => {
// Check arguments
  const args = process.argv.slice(2);
  
  if (args.includes("git-init")) {
    const { initGit } = require("./git");
    await initGit();
    return;
  }

  console.log("\nFogoe Initializer\n");

  // Project metadata
  const name = await input("Package name");
  const version = (await input("Version", "1.0.0")) || "1.0.0";
  const description = await input("Description");
  const author = await input("Author");
  const license = (await input("License", "ISC")) || "ISC";

  // Module type selection
  const type = await select("Select module type", [
    "commonjs",
    "module"
  ]);

  // Language selection
  const language = await select("Select language", [
    "javascript",
    "typescript"
  ]);

  // Runtime selection
  const runtime = await select("Select runtime", [
    "express",
    "fastify"
  ]);

  // Architecture selection
  const architecture = await select("Select architecture", [
    "minimal",
    "mvc"
  ]);

  // MVC-specific options
  let database = "none";
  let hashing = "bcrypt";
  let useJwt = false;

  if (architecture === "mvc") {
    // Database selection
    database = await select("Select database", [
      "mongodb",
      "prisma",
      "mysql",
      "postgresql",
      "none"
    ]);

    // Hashing selection
    hashing = await select("Select hashing library", [
      "bcrypt",
      "argon2",
      "crypto"
    ]);

    // JWT selection
    const jwtChoice = await select("Include jsonwebtoken?", [
      "yes",
      "no"
    ]);
    useJwt = jwtChoice === "yes";
  }

  // Write package.json
  fs.writeFileSync(
    "package.json",
    JSON.stringify(
      buildPackageJson({
        name,
        version,
        description,
        author,
        license,
        type,
        language
      }),
      null,
      2
    )
  );

  // Scaffold the project
  scaffold(language, runtime, type, architecture, database, hashing, useJwt);

  // Install dependencies
  console.log("\nInstalling dependencies...\n");
  install(language, runtime, architecture, database, hashing, useJwt);

  console.log("\n");
  
  // Git initialization (optional)
  const gitChoice = await select("Initialize Git repository?", [
    "yes",
    "no"
  ]);
  
  if (gitChoice === "yes") {
    const { initGit } = require("./git");
    await initGit();
  }

  // Show completion message and instructions after git process
  console.log("\n");
  console.log(chalk.green("Fogoe project ready"));
  
  // Prisma-specific instructions
  if (database === "prisma") {
    console.log(chalk.yellow("\nPrisma setup:"));
    console.log(chalk.yellow("   1. Update DATABASE_URL in .env"));
    console.log(chalk.yellow("   2. Run: npx prisma generate"));
    console.log(chalk.yellow("   3. Run: npx prisma db push"));
    console.log(chalk.yellow("   4. Then run: npm run dev\n"));
  } else {
    console.log(chalk.cyan("\nnpm run dev"));
  }
})();
