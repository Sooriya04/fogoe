/**
 * Parses simple KEY=VALUE pairs from a .env string into an object.
 * Strips wrapping quotes if present.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
function parseEnv(raw) {
  const map = {};
  if (!raw) return map;
  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      map[key] = val;
    }
  }
  return map;
}

module.exports = {
  parseEnv,
  parseEnvFile: parseEnv, // Alias for backward compatibility with doctor tests
};
