/**
 * Generate tsconfig.json based on module type and architecture
 */
function buildTsConfig(type, architecture) {
  const isModule = type === "module";
  
  const baseConfig = {
    compilerOptions: {
      target: "ES2022",
      module: isModule ? "NodeNext" : "commonjs",
      moduleResolution: isModule ? "NodeNext" : "node",
      lib: ["ES2022"],
      outDir: "./dist",
      rootDir: "./src",
      
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
      "@routes/*": ["./routes/*"],
      "@controllers/*": ["./controllers/*"],
      "@middlewares/*": ["./middlewares/*"],
      "@models/*": ["./models/*"],
      "@config/*": ["./config/*"],
      "@utils/*": ["./utils/*"],
      "@functions/*": ["./functions/*"]
    };
  }

  return baseConfig;
}

module.exports = { buildTsConfig };
