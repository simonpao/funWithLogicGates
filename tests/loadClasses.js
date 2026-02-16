// This module loads all class files and exposes them globally
const fs = require('fs');
const path = require('path');

// Read hooks/load-order
const loadOrderPath = path.join(__dirname, '../hooks/load-order');
const loadOrder = fs.readFileSync(loadOrderPath, 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'));

// Load each class in order
loadOrder.forEach(filePath => {
  const fullPath = path.join(__dirname, '../', filePath.trim());
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    const classMatch = code.match(/class\s+(\w+)/);
    if (classMatch) {
      const className = classMatch[1];
      // Create a wrapped version that exports the class
      const wrapped = `${code}\nmodule.exports = ${className};`;
      const tempPath = path.join(__dirname, `_${className}.js`);
      
      // Only write if file doesn't exist or content changed (handles parallel test runs)
      let needsWrite = true;
      if (fs.existsSync(tempPath)) {
        const existingContent = fs.readFileSync(tempPath, 'utf8');
        if (existingContent === wrapped) {
          needsWrite = false;
        }
      }
      
      if (needsWrite) {
        fs.writeFileSync(tempPath, wrapped);
      }
      
      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(tempPath)];
      global[className] = require(tempPath);
    }
  }
});

// Alias Storage to avoid jsdom conflict
global.FWLGStorage = global.Storage;
