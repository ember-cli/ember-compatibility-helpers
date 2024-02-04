[![Build Status](https://travis-ci.org/pzuraq/ember-compatibility-helpers.svg?branch=master)](https://travis-ci.org/pzuraq/ember-compatibility-helpers) [![npm version](https://badge.fury.io/js/ember-compatibility-helpers.svg)](https://badge.fury.io/js/ember-compatibility-helpers)

# ember-compatibility-helpers

Provides flags for features in Ember, allowing you to write code that will work
with whatever version the consuming application is on. This addon is intended
to help V1 addon authors write backwards/forwards compatibility code.

The flags are replaced at build time with boolean literals (`true` or `false`)
by a Babel transform. When ran through a minifier (with dead code elimination) the entire section will be stripped, meaning that the section of code which is not used
will not be added to production builds - zero cost compatibility!

### Note for V2 Addons

This package should not be used within [V2 Addons](https://rfcs.emberjs.com/id/0507-embroider-v2-package-format/). Instead, please use [`@embroider/macros`](https://github.com/embroider-build/embroider/tree/main/packages/macros), which provides a very similar API to `ember-compatibility-helpers`.

## Installation

```
ember install ember-compatibility-helpers
```

## Available Flags

```js
import {
  // General functions for checking against Ember version
  gte,
  lte,

  // Flags for specific Ember functionality
  HAS_UNDERSCORE_ACTIONS,
  HAS_MODERN_FACTORY_INJECTIONS,

  IS_GLIMMER_2,
  IS_RECORD_DATA,

  SUPPORTS_FACTORY_FOR,
  SUPPORTS_GET_OWNER,
  SUPPORTS_SET_OWNER,
  SUPPORTS_NEW_COMPUTED,
  SUPPORTS_INVERSE_BLOCK,
  SUPPORTS_CLOSURE_ACTIONS,
  SUPPORTS_UNIQ_BY_COMPUTED
} from 'ember-compatibility-helpers';
```

More welcome, open an issue or a PR!

## Version Identifiers

Version strings passed to version checker functions, such as `gte` or `lte`, must be fully qualified versions. Version ranges or shorthands are not supported.

```
// Do this:
lte('3.13.0-beta.1')

// Not this:
lte('3.12'); // won't work!
lte('^3.12.0'); // won't work!
```

## Example Usage for testing ember-source versions

```js
import Component from '@glimmer/component';
import { get } from '@ember/object';

import { gte } from 'ember-compatibility-helpers';

export default class MyComponent extends Component {
  get aProp() {
    if (gte('4.0.0')) {
      return this.args.aProxy.name;
    } else {
      return get(this.args.aProxy, 'name');
    }
  }  
}
```

## Example Usage for testing other addon package versions

```js
import Component from '@glimmer/component';
import { get } from '@ember/object';

import { gte } from 'ember-compatibility-helpers';

export default class MyComponent extends Component {
  get aProp() {
    if (gte('my-ember-addon', '1.2.3')) {
      return this.args.newProp;
    } else {
      return this.args.oldProp;
    }
  }  
}
```

## Example Flag usage:

```javascript
import Component from '@ember/component';
import { computed } from '@ember/object';

import { SUPPORTS_NEW_COMPUTED } from 'ember-compatibility-helpers';

function fooMacro() {
  if (SUPPORTS_NEW_COMPUTED) {
    return computed({
      get() {
        return this.get('foo');
      },

      set(key, value) {
        this.set('foo', value);
        return value
      }
    });
  } else {
    return computed(function(key, value) {
      if (arguments.length === 2) {
        this.set('foo', value);
        return value;
      }

      return this.get('foo');
    })
  }
}

export default Component.extend({
  bar: fooMacro()
});
```

## Development

* `git clone <repository-url>` this repository
* `cd ember-compatibility-helpers`
* `yarn`

## Running Tests

* `npm test`
