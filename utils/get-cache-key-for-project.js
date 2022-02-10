'use strict';

const crypto = require('crypto');
const { sync: findUpSync } = require('find-up');
const fs = require('fs');

/**
 * This gets a hash representing a cache key for a given project (using the
 * lockfile for the project). This was extracted from `@embroider/macros`.
 *
 * For more info:
 * https://github.com/embroider-build/embroider/blob/main/packages/macros/src/macros-config.ts#L337
 *
 * TODO: extract this out to a centralized place, so this logic isn't duplicated
 * in both `@embroider/macros` and `ember-compatibility-helpers`
 *
 * @name getCacheKeyForProject
 * @param {string} projectRoot
 * @returns {string}
 */
function getCacheKeyForProject(projectRoot) {
  const lockFilePath = findUpSync(
    ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'],
    { cwd: projectRoot }
  );

  const lockFileBuffer = lockFilePath
    ? fs.readFileSync(lockFilePath)
    : 'no-additional-cache-key';

  return crypto.createHash('sha256').update(lockFileBuffer).digest('hex');
}

module.exports = {
  getCacheKeyForProject,
};
