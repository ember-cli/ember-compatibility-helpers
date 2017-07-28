const fs = require('fs');
const path = require('path');

module.exports = {
  mock(packageName, version) {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName);
    const filePath = path.join(packagePath, 'package.json');

    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath);
    }

    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, `${filePath}.tmp`);
    }

    fs.writeFileSync(filePath, JSON.stringify({ version }));
  },

  unmock(packageName) {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName);
    const filePath = path.join(packagePath, 'package.json');

    fs.unlinkSync(filePath);

    if (fs.existsSync(`${filePath}.tmp`)) {
      fs.renameSync(`${filePath}.tmp`, filePath);
    }
  }
}
