/* eslint-env node */
'use strict';

const VersionChecker = require('ember-cli-version-checker');
const satisfies = require('semver').satisfies;

module.exports = {
  name: 'ember-compatibility-helpers',

  included() {
    this._super.included.apply(this, arguments);

    if (this._registeredWithBabel ) {
      return;
    }

    this.parentChecker = new VersionChecker(this.parent);
    const emberBabelChecker = this.parentChecker.for('ember-cli-babel', 'npm');

    if (!emberBabelChecker.satisfies('^6.0.0-beta.1')) {
      this.app.project.ui.writeWarnLine(
        'ember-decorators: You are using an unsupported ember-cli-babel version,' +
        'decorator/class-property transforms will not be included automatically'
      );

      this._registeredWithBabel = true;
      return;
    }

    const parentOptions = this._getParentOptions();

    // Create babel options if they do not exist
    parentOptions.babel = parentOptions.babel || {};

    const plugins = parentOptions.babel.plugins = parentOptions.babel.plugins || [];
    const debugPlugin = this._getDebugPlugin();

    plugins.push(debugPlugin);

    this._registeredWithBabel = true;
  },

  _getParentOptions() {
    const parent = this.app || this.parent;
    const options = parent.options = parent.options || {};

    return options;
  },

  _getDebugPlugin() {
    const parentChecker = this.parentChecker;
    const emberVersion = new VersionChecker(this.app || this.parent).forEmber().version;
    const trueEmberVersion = emberVersion.match(/\d+\.\d+\.\d+/)[0];

    const DebugMacros = require('babel-plugin-debug-macros').default;

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
          HAS_UNDERSCORE_ACTIONS: !satisfies(trueEmberVersion, '>= 2.0.0'),
          HAS_MODERN_FACTORY_INJECTIONS: satisfies(trueEmberVersion, '>= 2.13.0'),

          GTE_EMBER_1_13: satisfies(trueEmberVersion, '>= 1.13.0'),
          IS_EMBER_2: satisfies(trueEmberVersion, '>= 2.0.0'),
          IS_GLIMMER_2: satisfies(trueEmberVersion, '>= 2.10.0'),

          SUPPORTS_FACTORY_FOR: satisfies(trueEmberVersion, '>= 2.12.0') || parentChecker.for('ember-factory-for-polyfill', 'npm').satisfies('>= 1.0.0'),
          SUPPORTS_GET_OWNER: satisfies(trueEmberVersion, '>= 2.3.0') || parentChecker.for('ember-getowner-polyfill', 'npm').satisfies('>= 1.1.0'),
          SUPPORTS_SET_OWNER: satisfies(trueEmberVersion, '>= 2.3.0'),
          SUPPORTS_NEW_COMPUTED: satisfies(trueEmberVersion, '>= 1.12.0-beta.1'),
          SUPPORTS_INVERSE_BLOCK: satisfies(trueEmberVersion, '>= 1.13.0'),
          SUPPORTS_CLOSURE_ACTIONS: satisfies(trueEmberVersion, '>= 1.13.0'),
          SUPPORTS_UNIQ_BY_COMPUTED: satisfies(trueEmberVersion, '>= 2.7.0')
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

    return [DebugMacros, options];
  }
};
