const chalk = require('chalk');
const { checkProjectHealth } = require('./checker');
const { formatDashboard } = require('./formatter');
const { renderTuiMonitor } = require('../tui/monitor');

/**
 * Main command runner for `fogoe monitor`.
 * Supports --json, --wait, --timeout, --watch, and --stats / --tui.
 */
async function runMonitor(options = {}) {
  const {
    cwd = process.cwd(),
    json = false,
    wait = false,
    timeout = 30000,
    watch = false,
    stats = false,
    tui = false,
  } = options;

  const useTui = stats || tui;
  const timeoutMs = Number(timeout) || 30000;
  const startTime = Date.now();

  const renderView = (health) => {
    return useTui ? renderTuiMonitor(health) : formatDashboard(health);
  };

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
          console.log(renderView(health));
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
      console.log(renderView(finalHealth));
    }
    process.exit(1);
  }

  // 2. Watch mode: Re-render dashboard continuously
  if (watch && !json) {
    let interval;
    const render = async () => {
      const health = await checkProjectHealth(cwd, { timeoutMs: 1500 });
      process.stdout.write('\x1b[2J\x1b[0;0H'); // clear screen
      process.stdout.write(renderView(health));
      if (!useTui) {
        process.stdout.write(chalk.gray('  Press Ctrl+C to exit monitor.\n'));
      }
    };

    const cleanup = () => {
      if (interval) clearInterval(interval);
      if (process.stdin.isTTY && process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    if (process.stdin.isTTY && process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (key) => {
        if (key === 'q' || key === '\u0003') {
          cleanup();
        } else if (key === 'r') {
          render();
        }
      });
    }

    await render();
    interval = setInterval(render, 2000);
    return;
  }

  // 3. One-shot mode: Probe once and output
  const health = await checkProjectHealth(cwd, { timeoutMs: 1500 });

  if (json) {
    console.log(JSON.stringify(health, null, 2));
  } else {
    console.log(renderView(health));
  }

  process.exit(health.healthy ? 0 : 1);
}

module.exports = {
  checkProjectHealth,
  formatDashboard,
  renderTuiMonitor,
  runMonitor,
};
