function buildPackageJson(meta) {
  const isTypeScript = meta.language === "typescript";
  const ext = isTypeScript ? "ts" : "js";
  
  return {
    name: meta.name,
    version: meta.version,
    description: meta.description,
    main: `src/server.${ext}`,
    scripts: {
      dev: isTypeScript 
        ? `tsx watch src/server.${ext}`
        : `nodemon src/server.${ext}`,
      start: isTypeScript
        ? `tsx src/server.${ext}`
        : `node src/server.${ext}`
    },
    author: meta.author,
    license: meta.license,
    type: meta.type
  };
}

module.exports = { buildPackageJson };
