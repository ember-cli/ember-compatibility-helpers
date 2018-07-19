'use strict';

const VersionChecker = require('ember-cli-version-checker');

const semver = require('semver');
const satisfies = semver.satisfies;
const gte = semver.gte;

module.exports = {
  name: 'ember-compatibility-helpers',

  included(appOrParentAddon) {
    this._super.included.apply(this, arguments);

    const host = this._findHost();

    // Create a root level version checker for checking the Ember version later on
    this.emberVersion = new VersionChecker(this.project).forEmber().version;

    // Create a parent checker for checking the parent app/addons dependencies (for things like polyfills)
    this.parentChecker = new VersionChecker(this.parent);
    const emberBabelChecker = this.parentChecker.for('ember-cli-babel', 'npm');

    if (!emberBabelChecker.satisfies('^6.0.0-beta.1')) {
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
    const debugPlugin = this._getDebugPlugin(this.emberVersion, this.parentChecker);
    const comparisonPlugin = this._getComparisonPlugin(this.emberVersion);

    plugins.push(debugPlugin, comparisonPlugin);

    this._registeredWithBabel = true;
  },

  _getComparisonPlugin() {
    const trueEmberVersion = this.emberVersion.match(/\d+\.\d+\.\d+/)[0];

    return [require.resolve('./comparision-plugin.js'), { emberVersion: trueEmberVersion }];
  },

  _getDebugPlugin(emberVersion, parentChecker) {
    const trueEmberVersion = emberVersion.match(/\d+\.\d+\.\d+/)[0];

    let options = {
      envFlags: {
        source: 'ember-compatibility-helpers',
        flags: {
          DEBUG: false
        }
      },

      features: {
        name: 'ember-compatibility-helpers',
        source: 'ember-compatibility-helpers',
        flags: {
          HAS_UNDERSCORE_ACTIONS: !gte(trueEmberVersion, '2.0.0'),
          HAS_MODERN_FACTORY_INJECTIONS: gte(trueEmberVersion, '2.13.0'),
          HAS_DESCRIPTOR_TRAP: satisfies(trueEmberVersion, '~3.0.0'),
          HAS_NATIVE_COMPUTED_GETTERS: gte(trueEmberVersion, '3.1.0-beta.1'),

          IS_GLIMMER_2: gte(trueEmberVersion, '2.10.0'),

          SUPPORTS_FACTORY_FOR: gte(trueEmberVersion, '2.12.0') || parentChecker.for('ember-factory-for-polyfill', 'npm').gte('1.0.0'),
          SUPPORTS_GET_OWNER: gte(trueEmberVersion, '2.3.0') || parentChecker.for('ember-getowner-polyfill', 'npm').gte('1.1.0'),
          SUPPORTS_SET_OWNER: gte(trueEmberVersion, '2.3.0'),
          SUPPORTS_NEW_COMPUTED: gte(trueEmberVersion, '1.12.0-beta.1'),
          SUPPORTS_INVERSE_BLOCK: gte(trueEmberVersion, '1.13.0'),
          SUPPORTS_CLOSURE_ACTIONS: gte(trueEmberVersion, '1.13.0'),
          SUPPORTS_UNIQ_BY_COMPUTED: gte(trueEmberVersion, '2.7.0')
        }
      },

      externalizeHelpers: {
        global: 'Ember'
      },

      debugTools: {
        source: 'ember-compatibility-helpers',
        assertPredicateIndex: 1
      }
    };

    return [require.resolve('babel-plugin-debug-macros'), options];
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
