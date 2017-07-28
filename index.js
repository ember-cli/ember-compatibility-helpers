/* eslint-env node */
'use strict';

const VersionChecker = require('ember-cli-version-checker');

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
    const { parentChecker } = this;
    const emberChecker = new VersionChecker(this.app || this.parent).forEmber();

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
          HAS_UNDERSCORE_ACTIONS: !emberChecker.satisfies('>= 2.0.0'),

          IS_EMBER_2: emberChecker.satisfies('>= 2.0.0'),
          IS_GLIMMER_2: emberChecker.satisfies('>= 2.10.0'),

          SUPPORTS_GET_OWNER: emberChecker.satisfies('>= 2.3.0') || parentChecker.for('ember-getowner-polyfill', 'npm').satisfies('>= 1.1.0'),
          SUPPORTS_SET_OWNER: emberChecker.satisfies('>= 2.3.0'),
          SUPPORTS_NEW_COMPUTED: emberChecker.satisfies('>= 1.12.0-beta.1'),
          SUPPORTS_INVERSE_BLOCK: emberChecker.satisfies('>= 1.13.0'),
          SUPPORTS_CLOSURE_ACTIONS: emberChecker.satisfies('>= 1.13.0')
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
