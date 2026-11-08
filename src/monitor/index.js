const chalk = require('chalk');
const { checkProjectHealth } = require('./checker');
const { formatDashboard } = require('./formatter');

/**
 * Main command runner for `fogoe monitor`.
 * Supports --json, --wait, --timeout, and --watch.
 */
async function runMonitor(options = {}) {
  const {
    cwd = process.cwd(),
    json = false,
    wait = false,
    timeout = 30000,
    watch = false,
  } = options;

  const timeoutMs = Number(timeout) || 30000;
  const startTime = Date.now();

  // 1. Wait mode: Poll until all services are healthy or timeout expires
  if (wait) {
    if (!json) {
      process.stderr.write(
        chalk.cyan(`  Waiting for all services to become healthy (timeout: ${timeoutMs / 1000}s)...\n`)
      );
    }

    while (Date.now() - startTime < timeoutMs) {
      const health = await checkProjectHealth(cwd, { timeoutMs: 1500 });
      if (health.healthy) {
        if (json) {
          console.log(JSON.stringify(health, null, 2));
        } else {
          console.log(formatDashboard(health));
        }
        process.exit(0);
      }
      await new Promise((res) => setTimeout(res, 500));
    }

    // Timed out
    const finalHealth = await checkProjectHealth(cwd, { timeoutMs: 1500 });
    finalHealth.timedOut = true;
    if (json) {
      console.log(JSON.stringify(finalHealth, null, 2));
    } else {
      console.error(chalk.red(`\n  ✖ Timeout reached after ${timeoutMs / 1000}s. Services not ready.\n`));
      console.log(formatDashboard(finalHealth));
    }
    process.exit(1);
  }

  // 2. Watch mode: Re-render dashboard continuously
  if (watch && !json) {
    const render = async () => {
      const health = await checkProjectHealth(cwd, { timeoutMs: 1500 });
      process.stdout.write('\x1b[2J\x1b[0;0H'); // clear screen
      process.stdout.write(formatDashboard(health));
      process.stdout.write(chalk.gray('  Press Ctrl+C to exit monitor.\n'));
    };

    await render();
    const interval = setInterval(render, 2000);
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });
    return;
  }

  // 3. One-shot mode: Probe once and output
  const health = await checkProjectHealth(cwd, { timeoutMs: 1500 });

  if (json) {
    console.log(JSON.stringify(health, null, 2));
  } else {
    console.log(formatDashboard(health));
  }

  process.exit(health.healthy ? 0 : 1);
}

module.exports = {
  checkProjectHealth,
  formatDashboard,
  runMonitor,
};
