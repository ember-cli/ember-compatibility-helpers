'use strict';

module.exports = function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-babel-6',
        command: 'ember test',
        npm: {
          devDependencies: {
            'ember-cli-babel': '^6.16.0',
            'testem': '~2.0.0'
          }
        }
      },
      {
        name: 'node-babel-6',
        command: 'mocha node-tests/babel-6/addon-test.js',
        npm: {
          devDependencies: {
            'ember-cli-babel': '^6.16.0',
            'testem': '~2.0.0'
          }
        }
      },
      {
        name: 'ember-babel-7',
        command: 'ember test',
        npm: {}
      },
      {
        name: 'node-babel-7',
        command: 'mocha node-tests/babel-7/addon-test.js',
        npm: {}
      }
    ]
  };
};
