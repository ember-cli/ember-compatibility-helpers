'use strict';

const booleanFlags = require('./boolean-flags');

/**
 * Generates type declarations for the `comparison-plugin` (`gte`, `lte`) and
 * and the debug plugin (boolean flags).
 */
module.exports = [
  'export function gte(version: string): boolean;',
  'export function gte(package: string, version: string): boolean;',
  'export function lte(version: string): boolean;',
  'export function lte(package: string, version: string): boolean;'
]
  .concat(booleanFlags.map(b => `export const ${b}: boolean;`))
  .join('\n');
