[![Build Status](https://travis-ci.org/pzuraq/ember-compatibility-helpers.svg?branch=master)](https://travis-ci.org/pzuraq/ember-compatibility-helpers)

# ember-compatibility-helpers

Provides flags for features in Ember, allowing you to write code that will work
with whatever version the consuming application is on. This addon is intended
to help addon authors write backwards/forwards compatibility code.

The flags are replaced at build time with boolean literals (`true` or `false`)
by a Babel transform. When ran through a minifier (with dead code elimination) the entire section will be stripped, meaning that the section of code which is not used
will not be added to production builds - zero cost compatibility!

## Available Flags

```js
import {
  HAS_UNDERSCORE_ACTIONS,
  HAS_MODERN_FACTORY_INJECTIONS,

  GTE_EMBER_1_13,
  IS_EMBER_2,
  IS_GLIMMER_2,

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

## Example Usage

```javascript
import Ember from 'ember';
import {
  SUPPORTS_NEW_COMPUTED
} from 'ember-compatibility-helpers';

const { computed, Component } = Ember

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

## Installation

* `git clone <repository-url>` this repository
* `cd ember-compatibility-helpers`
* `yarn`

## Running Tests

* `npm test`
