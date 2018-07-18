'use strict';

const semver = require('semver');

function comparisonPlugin(babel) {
  const t = babel.types;

  const trueIdentifier = t.identifier('true');
  const falseIdentifier = t.identifier('false');

  return {
    name: "ember-compatibility-helpers",
    visitor: {
      ImportSpecifier(path, state) {
        if (path.parent.source.value === 'ember-compatibility-helpers') {
          let importedName = path.node.imported.name;
          if (importedName === 'gte') {
            state.gteImportId = state.gteImportId || path.scope.generateUidIdentifierBasedOnNode(path.node.id);
            path.scope.rename(path.node.local.name, state.gteImportId.name);
            path.remove();
          }

          if (importedName === 'lte') {
            state.lteImportId = state.lteImportId || path.scope.generateUidIdentifierBasedOnNode(path.node.id);
            path.scope.rename(path.node.local.name, state.lteImportId.name);
            path.remove();
          }
        }
      },

      CallExpression(path, state) {
        if (state.gteImportId && path.node.callee.name === state.gteImportId.name) {
          let argument = path.node.arguments[0];
          let replacementIdentifier = semver.gte(state.opts.emberVersion, argument.value) ? trueIdentifier : falseIdentifier;

          path.replaceWith(replacementIdentifier);
        } else if (state.lteImportId && path.node.callee.name === state.lteImportId.name) {
          let argument = path.node.arguments[0];
          let replacementIdentifier = semver.lte(state.opts.emberVersion, argument.value) ? trueIdentifier : falseIdentifier;

          path.replaceWith(replacementIdentifier);
        }
      }
    }
  };
}

comparisonPlugin.baseDir = () => __dirname;

module.exports = comparisonPlugin;
