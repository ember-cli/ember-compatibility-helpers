/* eslint-env node */
'use strict';

const co = require('co');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const CoreObject = require('core-object');
const BroccoliTestHelper = require('broccoli-test-helper');
const createBuilder = BroccoliTestHelper.createBuilder;
const createTempDir = BroccoliTestHelper.createTempDir;

const AddonMixin = require('../../index');
const EmberBabelMixin = require('ember-cli-babel');
const defaultLibs = {
  'ember-source': '3.5.0',
  'ember-data': '3.5.0'
};

let Addon = CoreObject.extend(AddonMixin);
let EmberBabelAddon = CoreObject.extend(EmberBabelMixin);

function itTransforms(options) {
  let libs = {};
  Object.assign(libs, defaultLibs, options.libraries);

  return it(options.description, co.wrap(function* () {
    const root = yield createTempDir();

    let rootContents = {
      'node_modules': {
        'ember-cli-babel': {
          'package.json': JSON.stringify({
            name: 'ember-cli-babel',
            version: '7.1.1',
          }),
        },
        'fake-addon': { }
      },
    };

    for (let lib in libs) {
      rootContents.node_modules[lib] = {
        'package.json': JSON.stringify({
          name: lib,
          version: libs[lib],
        })
      };
    }

    root.write(rootContents);

    const ui = new MockUI();
    const project = {
      name() { return 'my-project-name' },
      root: root.path(),
      ui,
      dependencies() { return {} },
      addons: [{
        name: 'ember-cli-babel',
        pkg: {},
      }],
      isEmberCLIProject() { }
    };

    const app = {
      project,

      // ember-cli-babel will attempt to check the ember-cli version unless we include
      // this option, and since that function doesn't exist it will break tests
      options: {
        'ember-cli-babel': {
          compileModules: true
        }
      }
    };

    const babelAddon = new EmberBabelAddon({
      project,
      parent: project,
      app
    });

    const addon = new Addon({
      root: root.path('node_modules/fake-addon'),
      project,
      parent: project,
      app
    });

    const input = yield createTempDir();

    input.write({
      'foo.js': options.input
    });

    addon.included(app);

    const subject = babelAddon.transpileTree(input.path());
    const output = createBuilder(subject);

    yield output.build();

    const finalOutput = output.read();

    expect(
      finalOutput
    ).to.deep.equal({
      'foo.js': options.expectedOutput
    });

    yield root.dispose();
    yield input.dispose();
    yield output.dispose();
  }));
}

function itErrorsOnTransform(options) {
  let libs = {};
  Object.assign(libs, defaultLibs, options.libraries);

  return it(options.description, co.wrap(function* () {
    const root = yield createTempDir();

    let rootContents = {
      'node_modules': {
        'ember-cli-babel': {
          'package.json': JSON.stringify({
            name: 'ember-cli-babel',
            version: '7.1.1',
          }),
        },
        'fake-addon': { }
      },
    };

    for (let lib in libs) {
      rootContents.node_modules[lib] = {
        'package.json': JSON.stringify({
          name: lib,
          version: libs[lib],
        })
      };
    }

    root.write(rootContents);

    const ui = new MockUI();
    const project = {
      name() { return 'my-project-name' },
      root: root.path(),
      ui,
      dependencies() { return {} },
      addons: [{
        name: 'ember-cli-babel',
        pkg: {},
      }],
      isEmberCLIProject() { }
    };

    const app = {
      project,

      // ember-cli-babel will attempt to check the ember-cli version unless we include
      // this option, and since that function doesn't exist it will break tests
      options: {
        'ember-cli-babel': {
          compileModules: true
        }
      }
    };

    const babelAddon = new EmberBabelAddon({
      project,
      parent: project,
      app
    });

    const addon = new Addon({
      root: root.path('node_modules/fake-addon'),
      project,
      parent: project,
      app
    });

    const input = yield createTempDir();

    input.write({
      'foo.js': options.input
    });

    addon.included(app);

    const subject = babelAddon.transpileTree(input.path());
    const output = createBuilder(subject);

    try {
      yield output.build();
      expect(false).to.equal(true);
    } catch (e) {
      let message = e.message.split("\n")[0];
      expect(message).to.equal(`foo.js: ${options.expectedOutput}`);
    }

    yield root.dispose();
    yield input.dispose();
    yield output.dispose();
  }));
}

function itShouldReplace(flagName, value, libs) {
  itTransforms({
    description: `should replace ${flagName} correctly`,
    input: `import { ${flagName} } from 'ember-compatibility-helpers'; if (${flagName}) { console.log('hello, world!'); }`,
    expectedOutput: `define("foo", [], function () {\n  "use strict";\n\n  if (${String(value)}\n  /* ${flagName} */\n  ) {\n    console.log('hello, world!');\n  }\n});`,
    libraries: libs
  });
}

function itShouldReplaceFunction(importName, invocation, expectedValue, libs) {
  itTransforms({
    description: `should replace ${importName} when used as \`if(${invocation}) {}\` correctly`,
    input: `import { ${importName} } from 'ember-compatibility-helpers'; if (${invocation}) { console.log('hello, world!'); }`,
    expectedOutput: `define("foo", [], function () {\n  "use strict";\n\n  if (${String(expectedValue)}) {\n    console.log('hello, world!');\n  }\n});`,
    libraries: libs
  });

  itTransforms({
    description: `should replace ${importName} when used as \`const HAS_BLAH=${invocation}\` correctly`,
    input: `import { ${importName} } from 'ember-compatibility-helpers'; var HAS_BLAH = ${invocation}; if (HAS_BLAH) { console.log('hello, world!'); }`,
    expectedOutput: `define("foo", [], function () {\n  "use strict";\n\n  var HAS_BLAH = ${String(expectedValue)};\n\n  if (HAS_BLAH) {\n    console.log('hello, world!');\n  }\n});`,
    libraries: libs
  });
}

function itShouldErrorOnFunction(importName, invocation, expectedValue, libs) {
  itErrorsOnTransform({
    description: `should error for a missing import ${importName} when used as \`if(${invocation}) {}\` correctly`,
    input: `import { ${importName} } from 'ember-compatibility-helpers'; if (${invocation}) { console.log('hello, world!'); }`,
    expectedOutput: expectedValue,
    libraries: libs
  });

  itErrorsOnTransform({
    description: `should error for a missing import ${importName} when used as \`const HAS_BLAH=${invocation}\` correctly`,
    input: `import { ${importName} } from 'ember-compatibility-helpers'; var HAS_BLAH = ${invocation}; if (HAS_BLAH) { console.log('hello, world!'); }`,
    expectedOutput: expectedValue,
    libraries: libs
  });
}

describe('ember-compatibility-helpers', function() {
  this.timeout(0);
  const root = process.cwd();

  afterEach(function() {
    process.chdir(root);
  });

  describe('feature detection', function() {
    itShouldReplace('HAS_UNDERSCORE_ACTIONS', true, { 'ember-source': '1.10.0' });
    itShouldReplace('HAS_UNDERSCORE_ACTIONS', false, { 'ember-source': '2.0.0' });
    itShouldReplace('HAS_UNDERSCORE_ACTIONS', false, { 'ember-source': '2.2.0-beta.3' });

    itShouldReplace('HAS_MODERN_FACTORY_INJECTIONS', true, { 'ember-source': '2.13.0' });
    itShouldReplace('HAS_MODERN_FACTORY_INJECTIONS', false, { 'ember-source': '2.12.0' });

    itShouldReplace('HAS_DESCRIPTOR_TRAP', false, { 'ember-source': '3.1.0' });
    itShouldReplace('HAS_DESCRIPTOR_TRAP', true, { 'ember-source': '3.0.2' });
    itShouldReplace('HAS_DESCRIPTOR_TRAP', false, { 'ember-source': '2.18.0' });

    itShouldReplace('HAS_NATIVE_COMPUTED_GETTERS', true, { 'ember-source': '3.1.4' });
    itShouldReplace('HAS_NATIVE_COMPUTED_GETTERS', true, { 'ember-source': '3.1.0-beta.1' });
    itShouldReplace('HAS_NATIVE_COMPUTED_GETTERS', false, { 'ember-source': '3.0.9' });

    itShouldReplace('IS_GLIMMER_2', true, { 'ember-source': '2.10.0' });
    itShouldReplace('IS_GLIMMER_2', false, { 'ember-source': '2.9.0' });

    itShouldReplace('IS_RECORD_DATA', false, { 'ember-data': null });
    itShouldReplace('IS_RECORD_DATA', false, { 'ember-data': '3.4.2' });
    itShouldReplace('IS_RECORD_DATA', false, { 'ember-data': '3.4.3' });
    itShouldReplace('IS_RECORD_DATA', false, { 'ember-data': '3.5.0-beta.1' });
    itShouldReplace('IS_RECORD_DATA', true, { 'ember-data': '3.5.0' });
    itShouldReplace('IS_RECORD_DATA', true, { 'ember-data': '3.6.0-beta.1' });
    itShouldReplace('IS_RECORD_DATA', true, { 'ember-data': '3.6.0' });

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
    itShouldReplace('SUPPORTS_SET_OWNER', true, { 'ember-source': '2.14.1-null+fb70cae3' });

    // Beta
    itShouldReplace('SUPPORTS_GET_OWNER', true, { 'ember-source': '2.15.0-beta.2' });

    // Canary
    itShouldReplace('SUPPORTS_UNIQ_BY_COMPUTED', true, { 'ember-source': '2.16.0-alpha.1-null+c7c04952' });
  });

  describe('function replacement', function() {
    itShouldReplaceFunction('gte', 'gte("3.0.0")', false, { 'ember-source': '2.13.0' });
    itShouldReplaceFunction('lte', 'lte("3.0.0")', true, { 'ember-source': '2.13.0' });

    // beta pre-release
    itShouldReplaceFunction('gte', 'gte("3.0.0")', false, { 'ember-source': '3.0.0-beta.1' });

    // canary pre-release
    itShouldReplaceFunction('gte', 'gte("3.0.0")', false, { 'ember-source': '3.0.0-alpha.1-null+c7c04952' });

    itShouldReplaceFunction('gte', 'gte("ember-source", "3.0.0")', false, { 'ember-source': '2.13.0' });
    itShouldReplaceFunction('lte', 'lte("ember-source", "3.0.0")', true, { 'ember-source': '2.13.0' });

    itShouldErrorOnFunction('gte', 'gte("ember-data", "3.4.0")', 'Expected "my-project-name" to have "ember-data" as a dependency, but it was not found.', { 'ember-data': null });

    itShouldReplaceFunction('gte', 'gte("ember-data", "3.4.0")', true, { 'ember-data': '3.4.0' });
    itShouldReplaceFunction('lte', 'lte("ember-data", "3.4.0")', true, { 'ember-data': '3.4.0' });
    itShouldReplaceFunction('gte', 'gte("ember-data", "3.4.0")', true, { 'ember-data': '3.5.0' });
    itShouldReplaceFunction('lte', 'lte("ember-data", "3.4.0")', true, { 'ember-data': '3.3.0' });
    itShouldReplaceFunction('gte', 'gte("ember-data", "3.4.0")', false, { 'ember-data': '3.3.0' });
    itShouldReplaceFunction('lte', 'lte("ember-data", "3.4.0")', false, { 'ember-data': '3.5.0' });
  });
});
