/**
 * Generate tsconfig.json based on module type and architecture
 */
function buildTsConfig(type, architecture) {
  const isModule = type === "module";
  
  const baseConfig = {
    compilerOptions: {
      target: "ES2020",
      module: isModule ? "ES2020" : "commonjs",
      lib: ["ES2020"],
      outDir: "./dist",
      rootDir: "./src",
      moduleResolution: "node",
      
      // Strict type checking
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      
      // Additional checks
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      
      // Module resolution
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      
      // Other options
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
  };

  // Add paths for MVC architecture
  if (architecture === "mvc") {
    baseConfig.compilerOptions.baseUrl = "./src";
    baseConfig.compilerOptions.paths = {
      "@routes/*": ["routes/*"],
      "@controllers/*": ["controllers/*"],
      "@middlewares/*": ["middlewares/*"],
      "@models/*": ["models/*"],
      "@config/*": ["config/*"],
      "@utils/*": ["utils/*"],
      "@functions/*": ["functions/*"]
    };
  }

  // For ES modules, add type module hint
  if (isModule) {
    baseConfig.compilerOptions.moduleResolution = "node";
  }

  return baseConfig;
}

module.exports = { buildTsConfig };
