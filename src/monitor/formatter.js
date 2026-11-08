const chalk = require('chalk');

/**
 * Formats a terminal-friendly ANSI dashboard representing health status.
 * @param {Object} health
 * @returns {string}
 */
function formatDashboard(health) {
  const lines = [];
  lines.push(chalk.bold.cyan(`\n  Fogoe Stack Monitor — ${chalk.white(health.project)}`));
  lines.push(chalk.gray(`  Status as of: ${new Date(health.timestamp).toLocaleTimeString()}`));
  lines.push(chalk.gray('  ' + '─'.repeat(52)));

  // 1. Application Server
  if (health.services.server) {
    const s = health.services.server;
    const statusIcon = s.listening ? chalk.green('● ONLINE ') : chalk.red('○ OFFLINE');
    const detail = s.listening
      ? `(port ${s.port}, ${s.latencyMs}ms)`
      : `(port ${s.port} — ${s.error || 'Connection refused'})`;
    lines.push(`  ${statusIcon}  ${chalk.bold('Application Server')} ${chalk.gray(detail)}`);
  }

  // 2. Database
  if (health.services.database) {
    const d = health.services.database;
    const ok = d.connected || d.accessible;
    const statusIcon = ok ? chalk.green('● READY  ') : chalk.red('○ FAILED ');
    const label = `Database (${d.type || 'unknown'})`;
    const detail = ok ? `(${d.latencyMs ? d.latencyMs + 'ms' : 'file ok'})` : `(${d.error || 'unreachable'})`;
    lines.push(`  ${statusIcon}  ${chalk.bold(label)} ${chalk.gray(detail)}`);
    if (d.hint) lines.push(chalk.yellow(`             └─ ${d.hint}`));
  }

  // 3. Redis
  if (health.services.redis) {
    const r = health.services.redis;
    const statusIcon = r.reachable ? chalk.green('● READY  ') : chalk.red('○ FAILED ');
    const detail = r.reachable ? `(${r.latencyMs}ms)` : `(${r.error || 'unreachable'})`;
    lines.push(`  ${statusIcon}  ${chalk.bold('Redis Cache / Queue')} ${chalk.gray(detail)}`);
  }

  // 4. Docker Compose
  if (health.services.docker && health.services.docker.available) {
    const d = health.services.docker;
    if (d.containers && d.containers.length > 0) {
      lines.push(chalk.gray('  ' + '─'.repeat(52)));
      lines.push(chalk.bold.white('  Docker Containers:'));
      for (const c of d.containers) {
        const icon = c.running ? chalk.green('  ✔') : chalk.red('  ✖');
        lines.push(`  ${icon} ${chalk.bold(c.service)} [${c.state}]`);
      }
      if (d.hint) lines.push(chalk.yellow(`     └─ ${d.hint}`));
    }
  }

  lines.push(chalk.gray('  ' + '─'.repeat(52)));
  const summary = health.healthy
    ? chalk.green.bold('  ✔ All monitored services are healthy.\n')
    : chalk.yellow.bold('  ⚠ One or more services are not ready.\n');
  lines.push(summary);

  return lines.join('\n');
}

module.exports = { formatDashboard };
