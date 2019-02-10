'use strict';

const fs = require('fs');
const path = require('path');
const types = require('./types');

fs.writeFileSync(path.resolve(__dirname, '../index.d.ts'), types);
