'use strict';

const VersionChecker = require('ember-cli-version-checker');
const getFlags = require('../utils/get-flags');

/**
 * Calls the `get-flags` util with mock inputs in order to retrieve the actual
 * flag keys.
 */
module.exports = Object.keys(
  getFlags('0.0.0', new VersionChecker({ root: __dirname }))
);
