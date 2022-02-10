'use strict';

const tmp = require('tmp');
const path = require('path');
const fixturify = require('fixturify');
const expect = require('chai').expect;

const {
  getCacheKeyForProject,
} = require('../../utils/get-cache-key-for-project');

tmp.setGracefulCleanup();

describe('getCacheKeyForProject', () => {
  let tmpDir;

  beforeEach(() => {
    ({ name: tmpDir } = tmp.dirSync());

    fixturify.writeSync(tmpDir, {
      'project-a': {
        'yarn.lock': 'a',
      },

      'project-b': {
        'yarn.lock': 'b',
      },
    });
  });

  it('should returns stable cache keys for the same project', () => {
    const projectAPath = path.join(tmpDir, 'project-a');

    expect(getCacheKeyForProject(projectAPath)).to.equal(
      getCacheKeyForProject(projectAPath)
    );
  });

  it('should return different cache keys for projects with differing lockfiles', () => {
    const projectAPath = path.join(tmpDir, 'project-a');
    const projectBPath = path.join(tmpDir, 'project-b');

    expect(getCacheKeyForProject(projectAPath)).to.not.equal(
      getCacheKeyForProject(projectBPath)
    );
  });
});
