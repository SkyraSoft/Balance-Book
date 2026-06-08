const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js');

if (!fs.existsSync(target)) {
  console.warn('externals.js not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf8');

const oldSnippet = "const shimDir = _path.default.join(projectRoot, METRO_EXTERNALS_FOLDER, moduleId);";
const newSnippet = "// Strip any leading \"node:\" prefix to ensure folder names are Windows-safe\n        const safeModuleId = moduleId.replace(/^node:/, \"\");\n        const shimDir = _path.default.join(projectRoot, METRO_EXTERNALS_FOLDER, safeModuleId);";

if (content.includes(oldSnippet) && !content.includes('safeModuleId')) {
  content = content.replace(oldSnippet, newSnippet);
  fs.writeFileSync(target, content, 'utf8');
  console.log('Patched externals.js to use Windows-safe shim directories.');
} else {
  console.log('Patch already applied or pattern not found.');
}
