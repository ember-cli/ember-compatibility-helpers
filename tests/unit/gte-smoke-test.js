import { module, test } from 'qunit';
import { gte } from 'ember-compatibility-helpers';

module('gte-smoke-test', function() {
  test('gte generally functions, and avoids an import error', function(assert) {
    assert.ok(gte('0.0.0'));
  });
});
