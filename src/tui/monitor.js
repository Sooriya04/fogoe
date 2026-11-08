const chalk = require('chalk');
const os = require('node:os');

/**
 * Strips ANSI SGR color/style escape codes.
 * @param {string} str
 * @returns {string}
 */
function stripAnsi(str) {
  return typeof str === 'string'
    ? str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    : '';
}

/**
 * Truncates a string with an ellipsis if it exceeds max length.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max = 18) {
  if (!str || typeof str !== 'string') return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

/**
 * Creates a visual ASCII progress bar.
 * Example: [████████░░░░░░░░]
 * Safe against NaN or infinite values.
 * @param {number} percent - 0 to 100
 * @param {number} width - character width
 * @returns {string}
 */
function renderBar(percent, width = 16) {
  const safe = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, safe));
  const filledCount = Math.round((clamped / 100) * width);
  const emptyCount = Math.max(0, width - filledCount);

  const filled = chalk.cyan('█'.repeat(filledCount));
  const empty = chalk.gray('░'.repeat(emptyCount));
  return `${chalk.gray('[')}${filled}${empty}${chalk.gray(']')}`;
}

/**
 * Formats bytes to human-readable MB / GB string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Pad string cleanly based on actual terminal visible length (excluding ANSI codes).
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
function pad(str, width) {
  const visibleLength = stripAnsi(str).length;
  const padding = Math.max(0, width - visibleLength);
  return str + ' '.repeat(padding);
}

/**
 * Wraps content in side borders with exact fixed inner width.
 * Prevents border protrusion if content exceeds inner width.
 * @param {string} content
 * @param {number} boxWidth
 * @returns {string}
 */
function makeRow(content, boxWidth) {
  const innerWidth = boxWidth - 2;
  const visible = stripAnsi(content).length;
  if (visible > innerWidth) {
    const plain = stripAnsi(content);
    return chalk.cyan('│') + plain.slice(0, innerWidth - 3) + '...' + chalk.cyan('│');
  }
  const padding = Math.max(0, innerWidth - visible);
  return chalk.cyan('│') + content + ' '.repeat(padding) + chalk.cyan('│');
}

/**
 * Helper to format a unified 5-column service table row.
 * @param {string} name
 * @param {string} statusText
 * @param {string} endpoint
 * @param {string} latency
 * @param {string} detail
 * @returns {string}
 */
function formatServiceRow(name, statusText, endpoint, latency, detail) {
  return (
    '  ' +
    pad(name, 15) +
    pad(statusText, 12) +
    pad(truncate(endpoint, 18), 20) +
    pad(latency, 9) +
    detail
  );
}

/**
 * Renders high-density retro terminal TUI dashboard box for fogoe monitor.
 * Pure ASCII + Unicode box drawing, zero misalignment, zero emojis.
 * @param {Object} health
 * @returns {string}
 */
function renderTuiMonitor(health) {
  const boxWidth = 76;
  const border = (char) => chalk.cyan(char);
  const divider = border('├' + '─'.repeat(boxWidth - 2) + '┤');

  const lines = [];

  // Top header border with exact filler calculation
  const titleText = 'fogoe monitor ';
  const versionText = 'v1.2.0';
  const liveTag = health.healthy
    ? chalk.bgGreen.black(' LIVE ')
    : chalk.bgYellow.black(' DEGRADED ');

  const leftHeader = border('┌─ ') + chalk.bold.cyan(titleText) + chalk.gray(versionText) + border(' ');
  const rightHeader = border(' ') + liveTag + border(' ─┐');
  const topFiller = Math.max(
    0,
    boxWidth - stripAnsi(leftHeader).length - stripAnsi(rightHeader).length
  );
  lines.push('\n' + leftHeader + border('─'.repeat(topFiller)) + rightHeader);

  // Project Info Row
  const projectName = health.project || 'fogoe-app';
  const timeStr = new Date(health.timestamp).toLocaleTimeString();
  const infoRow = `  Project:  ${chalk.bold.white(projectName)}  ${chalk.gray('·')}  Updated: ${chalk.gray(timeStr)}`;
  lines.push(makeRow(infoRow, boxWidth));

  lines.push(divider);

  // Table Columns Header
  const colHeader =
    '  ' +
    chalk.gray(
      pad('SERVICE', 15) +
        pad('STATUS', 12) +
        pad('ENDPOINT', 20) +
        pad('LATENCY', 9) +
        'DETAILS'
    );
  lines.push(makeRow(colHeader, boxWidth));
  lines.push(makeRow('  ' + chalk.gray('─'.repeat(boxWidth - 6)), boxWidth));

  // 1. Application Server Row
  if (health.services.server) {
    const s = health.services.server;
    const statusText = s.listening
      ? chalk.green('● ONLINE')
      : chalk.red('○ OFFLINE');
    const endpoint = `127.0.0.1:${s.port}`;
    const latency = s.latencyMs ? `${s.latencyMs}ms` : '-';
    const detail = s.listening
      ? s.httpResponding
        ? chalk.green(`HTTP ${s.statusCode || 200}`)
        : chalk.gray('TCP ready')
      : chalk.red(truncate(s.error || 'refused', 18));

    lines.push(makeRow(formatServiceRow('Server', statusText, endpoint, latency, detail), boxWidth));
  }

  // 2. Database Row
  if (health.services.database) {
    const d = health.services.database;
    const ok = d.connected || d.accessible;
    const statusText = ok
      ? chalk.green('● READY')
      : chalk.red('○ FAILED');
    const endpoint =
      d.type === 'sqlite'
        ? d.path || 'dev.db'
        : `${d.host || '127.0.0.1'}:${d.port || 5432}`;
    const latency = d.latencyMs ? `${d.latencyMs}ms` : '-';
    const detail = ok
      ? chalk.gray(d.type ? truncate(`${d.type} connected`, 18) : 'connected')
      : chalk.red(truncate(d.error || 'unreachable', 18));

    lines.push(makeRow(formatServiceRow('Database', statusText, endpoint, latency, detail), boxWidth));
  }

  // 3. Redis Row
  if (health.services.redis) {
    const r = health.services.redis;
    const statusText = r.reachable
      ? chalk.green('● READY')
      : chalk.red('○ FAILED');
    const endpoint = '127.0.0.1:6379';
    const latency = r.latencyMs ? `${r.latencyMs}ms` : '-';
    const detail = r.reachable
      ? chalk.gray(truncate(r.response || 'PONG', 18))
      : chalk.red(truncate(r.error || 'unreachable', 18));

    lines.push(makeRow(formatServiceRow('Redis Queue', statusText, endpoint, latency, detail), boxWidth));
  }

  // 4. Docker Row
  if (health.services.docker && health.services.docker.available) {
    const d = health.services.docker;
    const count = d.containers ? d.containers.length : 0;
    const runningCount = d.containers
      ? d.containers.filter((c) => c.running).length
      : 0;
    const statusText =
      runningCount === count && count > 0
        ? chalk.green('● ACTIVE')
        : chalk.yellow('○ STOPPED');
    const endpoint = 'compose.yml';
    const detail =
      count > 0 ? `${runningCount}/${count} running` : chalk.gray('0 containers');

    lines.push(makeRow(formatServiceRow('Containers', statusText, endpoint, '-', detail), boxWidth));
  }

  lines.push(divider);

  // System Stats Box
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPct = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
  const bar = renderBar(memPct, 16);

  lines.push(makeRow(`  ${chalk.bold.cyan('SYSTEM TELEMETRY')}`, boxWidth));
  const memStr = `  Memory:   ${bar}  ${memPct}%  ${chalk.gray(`(${formatBytes(usedMem)} / ${formatBytes(totalMem)})`)}`;
  lines.push(makeRow(memStr, boxWidth));
  const cpuCount = (os.cpus() || []).length || 1;
  const cpuStr = `  CPU:      ${chalk.white(`${cpuCount} Cores (${os.arch()})`)}  ${chalk.gray('·')}  ${chalk.white(os.platform())}  ${chalk.gray('·')}  ${chalk.white(process.version)}`;
  lines.push(makeRow(cpuStr, boxWidth));

  lines.push(divider);

  // Footer / Shortcuts
  const footerStatus = health.healthy
    ? chalk.green('● All services operational')
    : chalk.yellow('▲ One or more services require attention');

  lines.push(makeRow(`  Status:    ${footerStatus}`, boxWidth));
  lines.push(makeRow(`  Shortcuts: [r] refresh [q] quit`, boxWidth));

  // Bottom Border
  lines.push(border('└' + '─'.repeat(boxWidth - 2) + '┘') + '\n');

  return lines.join('\n');
}

module.exports = {
  renderTuiMonitor,
  renderBar,
  formatBytes,
  stripAnsi,
  truncate,
};
