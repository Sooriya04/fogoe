/**
 * Stack-aware GitHub Actions workflow generator for Fogoe projects.
 */

/**
 * Generate GitHub Actions CI/CD workflow YAML content.
 *
 * @param {Object} options
 * @param {string} [options.name] - Project or workflow name
 * @param {string} [options.language] - 'javascript' | 'typescript'
 * @param {string} [options.pm] - 'npm' | 'pnpm' | 'bun' | 'yarn'
 * @param {boolean} [options.testing] - Whether vitest testing is enabled
 * @param {boolean} [options.linting] - Whether eslint/prettier is enabled
 * @param {boolean} [options.docker] - Whether to include Docker build check step
 * @param {string} [options.deploy] - 'none' | 'dockerhub' | 'fly' | 'railway' | 'render'
 * @param {string} [options.nodeVersion] - '20.x'
 * @returns {string} Clean YAML workflow
 */
function generateGitHubActionsWorkflow(options = {}) {
  const {
    name = 'CI/CD Pipeline',
    language = 'javascript',
    pm = 'npm',
    testing = false,
    linting = false,
    docker = false,
    deploy = 'none',
    nodeVersion = '20.x',
  } = options;

  const isTs = language === 'typescript' || language === 'ts';
  const lines = [];

  lines.push(`name: ${name}`);
  lines.push('');
  lines.push('on:');
  lines.push('  push:');
  lines.push('    branches: [ main, dev, master ]');
  lines.push('  pull_request:');
  lines.push('    branches: [ main, dev, master ]');
  lines.push('');
  lines.push('jobs:');
  lines.push('  test-and-build:');
  lines.push('    runs-on: ubuntu-latest');
  lines.push('');
  lines.push('    steps:');
  lines.push('      - name: Checkout repository');
  lines.push('        uses: actions/checkout@v4');
  lines.push('');

  // Setup package manager / runtime
  if (pm === 'bun') {
    lines.push('      - name: Setup Bun');
    lines.push('        uses: oven-sh/setup-bun@v2');
    lines.push('        with:');
    lines.push('          bun-version: latest');
    lines.push('');
    lines.push('      - name: Install dependencies');
    lines.push('        run: bun install --frozen-lockfile || bun install');
  } else if (pm === 'pnpm') {
    lines.push('      - name: Install pnpm');
    lines.push('        uses: pnpm/action-setup@v4');
    lines.push('        with:');
    lines.push('          version: latest');
    lines.push('          run_install: false');
    lines.push('');
    lines.push(`      - name: Setup Node.js ${nodeVersion}`);
    lines.push('        uses: actions/setup-node@v4');
    lines.push('        with:');
    lines.push(`          node-version: '${nodeVersion}'`);
    lines.push('          cache: pnpm');
    lines.push('');
    lines.push('      - name: Install dependencies');
    lines.push('        run: pnpm install --frozen-lockfile || pnpm install --config.dangerouslyAllowAllBuilds=true');
  } else if (pm === 'yarn') {
    lines.push(`      - name: Setup Node.js ${nodeVersion}`);
    lines.push('        uses: actions/setup-node@v4');
    lines.push('        with:');
    lines.push(`          node-version: '${nodeVersion}'`);
    lines.push('          cache: yarn');
    lines.push('');
    lines.push('      - name: Install dependencies');
    lines.push('        run: yarn install --frozen-lockfile || yarn install');
  } else {
    // Default npm
    lines.push(`      - name: Setup Node.js ${nodeVersion}`);
    lines.push('        uses: actions/setup-node@v4');
    lines.push('        with:');
    lines.push(`          node-version: '${nodeVersion}'`);
    lines.push('          cache: npm');
    lines.push('');
    lines.push('      - name: Install dependencies');
    lines.push('        run: npm ci || npm install');
  }
  lines.push('');

  // Linting stage
  if (linting) {
    const lintCmd = pm === 'bun' ? 'bun run lint' : `${pm} run lint`;
    lines.push('      - name: Code Quality & Linting');
    lines.push(`        run: ${lintCmd}`);
    lines.push('');
  }

  // Testing stage
  if (testing) {
    const testCmd = pm === 'bun' ? 'bun test' : `${pm} test`;
    lines.push('      - name: Run Test Suite');
    lines.push(`        run: ${testCmd}`);
    lines.push('');
  }

  // Build stage for TypeScript
  if (isTs) {
    const buildCmd = pm === 'bun' ? 'bun run build' : `${pm} run build`;
    lines.push('      - name: Compile TypeScript');
    lines.push(`        run: ${buildCmd}`);
    lines.push('');
  }

  // Docker build check stage
  if (docker && deploy !== 'dockerhub') {
    lines.push('      - name: Set up Docker Buildx');
    lines.push('        uses: docker/setup-buildx-action@v3');
    lines.push('');
    lines.push('      - name: Verify Docker build');
    lines.push('        uses: docker/build-push-action@v5');
    lines.push('        with:');
    lines.push('          context: .');
    lines.push('          push: false');
    lines.push('          tags: fogoe-app:test');
    lines.push('');
  }

  // Deployments
  if (deploy === 'dockerhub') {
    lines.push('  deploy-dockerhub:');
    lines.push('    name: Build & Push Docker Image');
    lines.push('    needs: test-and-build');
    lines.push("    if: github.ref == 'refs/heads/main' && github.event_name == 'push'");
    lines.push('    runs-on: ubuntu-latest');
    lines.push('    steps:');
    lines.push('      - name: Checkout repository');
    lines.push('        uses: actions/checkout@v4');
    lines.push('');
    lines.push('      - name: Set up Docker Buildx');
    lines.push('        uses: docker/setup-buildx-action@v3');
    lines.push('');
    lines.push('      - name: Login to Docker Hub');
    lines.push('        uses: docker/login-action@v3');
    lines.push('        with:');
    lines.push('          username: ${{ secrets.DOCKERHUB_USERNAME }}');
    lines.push('          password: ${{ secrets.DOCKERHUB_TOKEN }}');
    lines.push('');
    lines.push('      - name: Build and Push');
    lines.push('        uses: docker/build-push-action@v5');
    lines.push('        with:');
    lines.push('          context: .');
    lines.push('          push: true');
    lines.push('          tags: ${{ secrets.DOCKERHUB_USERNAME }}/${{ github.event.repository.name }}:latest');
    lines.push('');
  } else if (deploy === 'fly') {
    lines.push('  deploy-fly:');
    lines.push('    name: Deploy to Fly.io');
    lines.push('    needs: test-and-build');
    lines.push("    if: github.ref == 'refs/heads/main' && github.event_name == 'push'");
    lines.push('    runs-on: ubuntu-latest');
    lines.push('    steps:');
    lines.push('      - name: Checkout repository');
    lines.push('        uses: actions/checkout@v4');
    lines.push('');
    lines.push('      - name: Setup flyctl');
    lines.push('        uses: superfly/flyctl-actions/setup-flyctl@master');
    lines.push('');
    lines.push('      - name: Deploy application');
    lines.push('        run: flyctl deploy --remote-only');
    lines.push('        env:');
    lines.push('          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}');
    lines.push('');
  } else if (deploy === 'railway') {
    lines.push('  deploy-railway:');
    lines.push('    name: Deploy to Railway');
    lines.push('    needs: test-and-build');
    lines.push("    if: github.ref == 'refs/heads/main' && github.event_name == 'push'");
    lines.push('    runs-on: ubuntu-latest');
    lines.push('    steps:');
    lines.push('      - name: Checkout repository');
    lines.push('        uses: actions/checkout@v4');
    lines.push('');
    lines.push('      - name: Install Railway CLI');
    lines.push('        run: npm install -g @railway/cli');
    lines.push('');
    lines.push('      - name: Deploy');
    lines.push('        run: railway up --service=${{ secrets.RAILWAY_SERVICE_NAME }}');
    lines.push('        env:');
    lines.push('          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}');
    lines.push('');
  } else if (deploy === 'render') {
    lines.push('  deploy-render:');
    lines.push('    name: Trigger Deploy on Render');
    lines.push('    needs: test-and-build');
    lines.push("    if: github.ref == 'refs/heads/main' && github.event_name == 'push'");
    lines.push('    runs-on: ubuntu-latest');
    lines.push('    steps:');
    lines.push('      - name: Trigger Deploy Hook');
    lines.push('        run: |');
    lines.push('          curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

module.exports = { generateGitHubActionsWorkflow };
