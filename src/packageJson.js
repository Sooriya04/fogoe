function buildPackageJson(meta) {
  return {
    name: meta.name,
    version: meta.version,
    description: meta.description,
    main: "src/server.js",
    scripts: {
      dev: "nodemon src/server.js",
      start: "node src/server.js"
    },
    author: meta.author,
    license: meta.license,
    type: meta.type
  };
}

module.exports = { buildPackageJson };
