const fs = require("fs");
const { input, select } = require("./prompt");
const { scaffold } = require("./scaffold");
const { buildPackageJson } = require("./packageJson");
const { install } = require("./installer");
const chalk = require("chalk");

(async () => {
  console.log("\n⚡ Fogoe Initializer\n");

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
    "typescript (coming soon)"
  ]);

  if (language !== "javascript") {
    console.log("\nTypeScript support coming soon.\n");
    process.exit(0);
  }

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
      "argon2"
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
        type
      }),
      null,
      2
    )
  );

  // Scaffold the project
  scaffold(runtime, type, architecture, database, hashing, useJwt);

  // Install dependencies
  console.log("\nInstalling dependencies...\n");
  install(runtime, architecture, database, hashing, useJwt);

  console.log("\n");
  console.log(chalk.green("✓ Fogoe project ready"));
  console.log(chalk.cyan("→ npm run dev"));
  
  // Prisma-specific instructions
  if (database === "prisma") {
    console.log(chalk.yellow("\n📝 Prisma setup:"));
    console.log(chalk.yellow("   1. Update DATABASE_URL in .env"));
    console.log(chalk.yellow("   2. Run: npx prisma generate"));
    console.log(chalk.yellow("   3. Run: npx prisma db push"));
  }
})();
