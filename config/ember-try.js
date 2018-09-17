'use strict';

module.exports = function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-babel-6',
        command: 'ember test',
        npm: {}
      },
      {
        name: 'node-babel-6',
        command: 'mocha node-tests/addon-test.js',
        npm: {}
      }
    ]
  };
};
