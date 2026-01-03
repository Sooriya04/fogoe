const fs = require("fs");
const { input, select } = require("./prompt");
const { scaffold } = require("./scaffold");
const { buildPackageJson } = require("./packageJson");
const { install } = require("./installer");

(async () => {
  console.log("\n⚡ Fogoe Initializer\n");

  const name = await input("Package name");
  const version = (await input("Version", "1.0.0")) || "1.0.0";
  const description = await input("Description");
  const author = await input("Author");
  const license = (await input("License", "MIT")) || "MIT";

  const type = await select("Select module type", [
    "commonjs",
    "module"
  ]);

  const language = await select("Select language", [
    "javascript",
    "typescript (coming soon)"
  ]);

  if (language !== "javascript") {
    console.log("\nTypeScript support coming soon.\n");
    process.exit(0);
  }

  const runtime = await select("Select runtime", [
    "express",
    "fastify"
  ]);

  // Write package.json (NO npm init)
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

  scaffold(runtime);

  console.log("\nInstalling dependencies...\n");
  install(runtime);

  console.log("\n✅ fogoe project ready");
  console.log("→ npm run dev\n");
})();
