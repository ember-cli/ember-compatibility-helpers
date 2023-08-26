'use strict';

const VersionChecker = require('ember-cli-version-checker');
const extractTrueVersion = require('./utils/extract-true-version');
const getFlags = require('./utils/get-flags');
const { getCacheKeyForProject } = require('./utils/get-cache-key-for-project');
const fs = require('fs-extra');
const path = require('path');

// a map to store SHA-256 hashes of the lockfile for a given project
const LOCK_FILE_CACHE_KEY_MAP = new Map();

// from https://github.com/ember-cli/ember-cli-version-checker/blob/70c2d52cde964b1e8acd062411c9f1666180a52c/src/dependency-version-checker.js#L9
function getVersionFromJSONFile(filePath) {
  try {
    // Use the require cache to avoid file I/O after first call on a given path.
    let pkg = require(filePath);
    return pkg.version;
  } catch (err) {
    // file doesn't exist or is not a file or is not parseable.
    return null;
  }
}

module.exports = {
  name: 'ember-compatibility-helpers',

  included(appOrParentAddon) {
    this._super.included.apply(this, arguments);

    const host = this._findHost();

    // Create a root level version checker for checking the Ember version later on
    this.projectChecker = new VersionChecker(this.project);
    this.emberVersion = this.projectChecker.for('ember-source').version;

    if (!this.emberVersion) {
      let bowerrcPath = path.join(this.project.root, '.bowerrc');
      let bowerDirectory = 'bower_components';

      if (fs.existsSync(bowerrcPath)) {
        bowerDirectory = fs.readJsonSync(bowerrcPath).directory;
      }

      this.emberVersion =
        getVersionFromJSONFile(path.join(this.project.root, bowerDirectory, 'ember', '.bower.json')) ||
        getVersionFromJSONFile(path.join(this.project.root, bowerDirectory, 'ember', 'bower.json'));
    }

    // Create a parent checker for checking the parent app/addons dependencies (for things like polyfills)
    this.parentChecker = new VersionChecker(this.parent);
    const emberBabelChecker = this.parentChecker.for('ember-cli-babel', 'npm');

    this._usingBabel6 = emberBabelChecker.satisfies('^6.0.0-beta.1');
    // ember-cli-babel 7 and 8 both use babel 7
    this._usingBabel7 = emberBabelChecker.satisfies('^7.0.0-beta.1') || emberBabelChecker.satisfies('^8.0.0');

    if (!this._usingBabel6 && !this._usingBabel7) {
      host.project.ui.writeWarnLine(
        'ember-compatibility-helpers: You are using an unsupported ember-cli-babel version, ' +
        'compatibility helper tranforms will not be included automatically'
      );

      this._registeredWithBabel = true;
    }

    this.registerTransformWithParent(appOrParentAddon);
  },

  /**
   * Registers the compatibility transforms with the parent addon or application
   *
   * @param {Addon|EmberAddon|EmberApp} parent
   */
  registerTransformWithParent(parent) {
    if (this._registeredWithBabel) return;

    const parentOptions = parent.options = parent.options || {};

    // Create babel options if they do not exist
    parentOptions.babel = parentOptions.babel || {};
    const plugins = parentOptions.babel.plugins = parentOptions.babel.plugins || [];

    const comparisonPlugin = this._getComparisonPlugin(this.emberVersion);
    const debugPlugin = this._getDebugPlugin(this.emberVersion, this.parentChecker);

    if (this._usingBabel7) {
      if (!plugins.find(p => Array.isArray(p) && p[2] === comparisonPlugin[2])) {
        plugins.push(comparisonPlugin);
      }

      if (!plugins.find(p => Array.isArray(p) && p[2] === debugPlugin[2])) {
        plugins.push(debugPlugin);
      }
    } else {
      plugins.push(comparisonPlugin, debugPlugin);
    }

    this._registeredWithBabel = true;
  },

  _getComparisonPlugin() {
    const trueEmberVersion = extractTrueVersion(this.emberVersion);

    const parentName =
      typeof this.parent.name === 'function'
        ? this.parent.name()
        : this.parent.name;

    const projectRoot = this.project.root;
    let cacheKey = LOCK_FILE_CACHE_KEY_MAP.get(projectRoot);

    if (!cacheKey) {
      cacheKey = getCacheKeyForProject(projectRoot);
      LOCK_FILE_CACHE_KEY_MAP.set(projectRoot, cacheKey);
    }

    let plugin = [
      require.resolve('./comparision-plugin.js'),
      {
        emberVersion: trueEmberVersion,
        root: projectRoot,
        name: parentName,
        cacheKey,
      },
    ];

    if (this._usingBabel7) {
      plugin.push(
        `ember-compatibility-helpers:comparison-plugin:${parentName}`
      );
    }

    return plugin;
  },

  _getDebugPlugin(emberVersion, parentChecker) {
    const parentName = typeof this.parent.name === 'function' ? this.parent.name() : this.parent.name;

    const options = {
      debugTools: {
        isDebug: process.env.EMBER_ENV !== 'production',
        source: 'ember-compatibility-helpers'
      },

      flags: [
        {
          name: 'ember-compatibility-helpers',
          source: 'ember-compatibility-helpers',
          flags: getFlags(emberVersion, parentChecker)
        }
      ]
    };

    const plugin = [require.resolve('babel-plugin-debug-macros'), options];

    if (this._usingBabel7) {
      plugin.push(`ember-compatibility-helpers:debug-macros:${parentName}`);
    }

    return plugin;
  },

  _findHost() {
    let current = this;
    let app;

    do {
      app = current.app || app;
    } while (current.parent.parent && (current = current.parent));

    return app;
  }
};
