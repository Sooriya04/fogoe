/**
 * Deployment targets configuration and helper metadata.
 */

const DEPLOY_TARGETS = {
  none: {
    label: 'None (Build & Test CI only)',
    description: 'Runs linting, testing, and compile steps without deployment.',
    secrets: [],
  },
  dockerhub: {
    label: 'Docker Hub',
    description: 'Builds and pushes production image to Docker Hub registry.',
    secrets: ['DOCKERHUB_USERNAME', 'DOCKERHUB_TOKEN'],
  },
  fly: {
    label: 'Fly.io',
    description: 'Deploys containerized application to Fly.io global platform.',
    secrets: ['FLY_API_TOKEN'],
  },
  railway: {
    label: 'Railway',
    description: 'Deploys directly to Railway using Railway CLI and project token.',
    secrets: ['RAILWAY_TOKEN', 'RAILWAY_SERVICE_NAME'],
  },
  render: {
    label: 'Render',
    description: 'Triggers instant deployment via Render webhook deploy hook URL.',
    secrets: ['RENDER_DEPLOY_HOOK_URL'],
  },
};

/**
 * Validates whether deploy target is supported
 * @param {string} target
 * @returns {boolean}
 */
function isValidDeployTarget(target) {
  if (!target) return false;
  return Object.prototype.hasOwnProperty.call(DEPLOY_TARGETS, target.toLowerCase());
}

/**
 * Returns required secrets for a target
 * @param {string} target
 * @returns {string[]}
 */
function getRequiredSecrets(target = 'none') {
  const norm = (target || 'none').toLowerCase();
  return DEPLOY_TARGETS[norm] ? DEPLOY_TARGETS[norm].secrets : [];
}

module.exports = {
  DEPLOY_TARGETS,
  isValidDeployTarget,
  getRequiredSecrets,
};
