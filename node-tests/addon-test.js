/* eslint-env node */
'use strict';

const co = require('co');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const CoreObject = require('core-object');
const BroccoliTestHelper = require('broccoli-test-helper');
const createBuilder = BroccoliTestHelper.createBuilder;
const createTempDir = BroccoliTestHelper.createTempDir;

const mockPackage = require('./helpers/mock-package');

const AddonMixin = require('../index');
const EmberBabelMixin = require('ember-cli-babel');

let Addon = CoreObject.extend(AddonMixin);
let EmberBabelAddon = CoreObject.extend(EmberBabelMixin);

function itShouldReplace(flagName, value, libs) {
  return it(`should replace ${flagName} correctly`, co.wrap(function* () {
    const project = { root: process.cwd() };
    const ui = new MockUI();

    const babelAddon = new EmberBabelAddon({
      project,
      parent: project,
    });

    const addon = new Addon({
      project,
      app: project,
      parent: project,
      ui: this.ui,
    });

    const input = yield createTempDir();

    input.write({
      'foo.js': `import { ${flagName} } from 'ember-compatibility-helpers'; if (${flagName}) { console.log('hello, world!'); }`
    });

    for (let lib in libs) {
      mockPackage.mock(lib, libs[lib]);
    }

    addon.included();
    const subject = babelAddon.transpileTree(input.path());
    const output = createBuilder(subject);

    yield output.build();

    expect(
      output.read()
    ).to.deep.equal({
      'foo.js': `define('foo', [], function () {\n  'use strict';\n\n  if (${String(value)}) {\n    console.log('hello, world!');\n  }\n});`
    });

    for (let lib in libs) {
      mockPackage.unmock(lib);
    }

    yield input.dispose();
    yield output.dispose();
  }));
}


describe('ember-compatibility-helpers', function() {
  this.timeout(0);

  itShouldReplace('HAS_UNDERSCORE_ACTIONS', true, { 'ember-source': '1.10.0' });
  itShouldReplace('HAS_UNDERSCORE_ACTIONS', false, { 'ember-source': '2.0.0' });

  itShouldReplace('HAS_MODERN_FACTORY_INJECTIONS', true, { 'ember-source': '2.13.0' });
  itShouldReplace('HAS_MODERN_FACTORY_INJECTIONS', false, { 'ember-source': '2.12.0' });

  itShouldReplace('GTE_EMBER_1_13', true, { 'ember-source': '1.13.0' });
  itShouldReplace('GTE_EMBER_1_13', false, { 'ember-source': '1.11.0' });

  itShouldReplace('IS_EMBER_2', true, { 'ember-source': '2.0.0' });
  itShouldReplace('IS_EMBER_2', false, { 'ember-source': '1.13.0' });

  itShouldReplace('IS_GLIMMER_2', true, { 'ember-source': '2.10.0' });
  itShouldReplace('IS_GLIMMER_2', false, { 'ember-source': '2.9.0' });

  itShouldReplace('SUPPORTS_FACTORY_FOR', true, { 'ember-source': '2.12.0' });
  itShouldReplace('SUPPORTS_FACTORY_FOR', true, { 'ember-source': '2.9.0', 'ember-factory-for-polyfill': '1.0.0' });
  itShouldReplace('SUPPORTS_FACTORY_FOR', false, { 'ember-source': '2.9.0' });

  itShouldReplace('SUPPORTS_GET_OWNER', true, { 'ember-source': '2.3.0' });
  itShouldReplace('SUPPORTS_GET_OWNER', true, { 'ember-source': '2.2.0', 'ember-getowner-polyfill': '1.1.0' });
  itShouldReplace('SUPPORTS_GET_OWNER', false, { 'ember-source': '2.0.0' });

  itShouldReplace('SUPPORTS_SET_OWNER', true, { 'ember-source': '2.3.0' });
  itShouldReplace('SUPPORTS_SET_OWNER', false, { 'ember-source': '2.0.0' });

  itShouldReplace('SUPPORTS_NEW_COMPUTED', true, { 'ember-source': '1.12.0' });
  itShouldReplace('SUPPORTS_NEW_COMPUTED', false, { 'ember-source': '1.11.0' });

  itShouldReplace('SUPPORTS_INVERSE_BLOCK', true, { 'ember-source': '1.13.0' });
  itShouldReplace('SUPPORTS_INVERSE_BLOCK', false, { 'ember-source': '1.11.0' });

  itShouldReplace('SUPPORTS_CLOSURE_ACTIONS', true, { 'ember-source': '1.13.0' });
  itShouldReplace('SUPPORTS_CLOSURE_ACTIONS', false, { 'ember-source': '1.11.0' });

  itShouldReplace('SUPPORTS_UNIQ_BY_COMPUTED', true, { 'ember-source': '2.7.0' });
  itShouldReplace('SUPPORTS_UNIQ_BY_COMPUTED', false, { 'ember-source': '2.6.0' });

  // Release
  itShouldReplace('IS_EMBER_2', true, { 'ember-source': '2.14.1-null+fb70cae3' });

  // Beta
  itShouldReplace('IS_EMBER_2', true, { 'ember-source': '2.15.0-beta.2' });

  // Canary
  itShouldReplace('IS_EMBER_2', true, { 'ember-source': '2.16.0-alpha.1-null+c7c04952' });
});
