'use strict';

const semver = require('semver');
const satisfies = semver.satisfies;
const gte = semver.gte;

module.exports = function(emberVersion, parentChecker) {
  const emberDataVersion = parentChecker.for('ember-data', 'npm').version;

  return {
    HAS_UNDERSCORE_ACTIONS: !gte(emberVersion, '2.0.0'),
    HAS_MODERN_FACTORY_INJECTIONS: gte(emberVersion, '2.13.0'),
    HAS_DESCRIPTOR_TRAP: satisfies(emberVersion, '~3.0.0'),
    HAS_NATIVE_COMPUTED_GETTERS: gte(emberVersion, '3.1.0-beta.1'),

    IS_GLIMMER_2: gte(emberVersion, '2.10.0'),
    IS_RECORD_DATA: !emberDataVersion ? false : gte(emberDataVersion, '3.5.0'),

    SUPPORTS_FACTORY_FOR:
      gte(emberVersion, '2.12.0') ||
      parentChecker.for('ember-factory-for-polyfill', 'npm').gte('1.0.0'),
    SUPPORTS_GET_OWNER:
      gte(emberVersion, '2.3.0') ||
      parentChecker.for('ember-getowner-polyfill', 'npm').gte('1.1.0'),
    SUPPORTS_SET_OWNER: gte(emberVersion, '2.3.0'),
    SUPPORTS_NEW_COMPUTED: gte(emberVersion, '1.12.0-beta.1'),
    SUPPORTS_INVERSE_BLOCK: gte(emberVersion, '1.13.0'),
    SUPPORTS_CLOSURE_ACTIONS: gte(emberVersion, '1.13.0'),
    SUPPORTS_UNIQ_BY_COMPUTED: gte(emberVersion, '2.7.0')
  };
};
