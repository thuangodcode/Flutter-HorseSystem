const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION
// ==========================================
const rootDir = __dirname;
const outputFile = path.join(rootDir, 'ai-project-context.txt');

// Folders to completely ignore
const ignoreDirs = [
  'node_modules', 
  '.git', 
  'dist', 
  'build', 
  'public', 
  'assets', 
  'ios', 
  'android', 
  '.expo'
];

// File extensions to include
const includeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md'];

// Specific files to ignore to keep the file size reasonable
const ignoreFiles = [
  'package-lock.json', 
  'yarn.lock', 
  'swagger-ui-init.js', 
  'swagger2.json', 
  'tsc_errors.txt',
  outputFile // Ignore the output file itself
];

// Max file size to include (e.g., 100KB)
const MAX_FILE_SIZE = 100 * 1024;

let contextContent = '# Project Context for AI\n\n';
contextContent += 'This document contains the directory structure and source code of the project. It can be used to help AI understand the project architecture, UI flows, and API integrations.\n\n';

// Helper to check if file should be included
function shouldIncludeFile(fileName) {
  if (ignoreFiles.includes(fileName) || fileName.endsWith('-lock.json')) return false;
  const ext = path.extname(fileName).toLowerCase();
  return includeExtensions.includes(ext);
}

// Function to generate folder tree
function generateTree(dir, prefix = '') {
  let treeString = '';
  try {
    const files = fs.readdirSync(dir);
    
    // Sort directories first, then files
    files.sort((a, b) => {
      const aPath = path.join(dir, a);
      const bPath = path.join(dir, b);
      let aIsDir = false, bIsDir = false;
      try { aIsDir = fs.statSync(aPath).isDirectory(); } catch (e) {}
      try { bIsDir = fs.statSync(bPath).isDirectory(); } catch (e) {}
      
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (ignoreDirs.includes(file)) continue;

      const fullPath = path.join(dir, file);
      let isDir = false;
      try { isDir = fs.statSync(fullPath).isDirectory(); } catch (e) { continue; }

      const isLast = i === files.length - 1;
      
      treeString += `${prefix}${isLast ? '└── ' : '├── '}${file}\n`;

      if (isDir) {
        treeString += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
      }
    }
  } catch (err) {
    treeString += `${prefix}└── [Error reading directory]\n`;
  }
  return treeString;
}

// Function to collect file contents
function collectFileContents(dir, basePath = '') {
  let contentString = '';
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (ignoreDirs.includes(file)) continue;
      
      const fullPath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      let stat;
      try { stat = fs.statSync(fullPath); } catch (e) { continue; }

      if (stat.isDirectory()) {
        contentString += collectFileContents(fullPath, relativePath);
      } else if (shouldIncludeFile(file)) {
        if (stat.size > MAX_FILE_SIZE) {
          contentString += `\n================================================================\n`;
          contentString += `File: ${relativePath.replace(/\\/g, '/')}\n`;
          contentString += `================================================================\n`;
          contentString += `[File size exceeds ${MAX_FILE_SIZE / 1024}KB, content omitted to save context length]\n\n`;
          continue;
        }
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          contentString += `\n================================================================\n`;
          contentString += `File: ${relativePath.replace(/\\/g, '/')}\n`;
          contentString += `================================================================\n\n`;
          contentString += `\`\`\`${path.extname(file).replace('.', '')}\n`;
          contentString += content;
          contentString += `\n\`\`\`\n\n`;
        } catch (err) {
          contentString += `\n[Error reading file content for ${relativePath}]\n\n`;
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return contentString;
}

console.log('Generating project context for AI...');

// 1. Generate Directory Structure
console.log('Building directory tree...');
contextContent += '## 1. Project Directory Structure\n\n```text\n';
contextContent += 'HorseManagementSystem_FE\n';
contextContent += generateTree(rootDir);
contextContent += '```\n\n';

// 2. Collect File Contents
console.log('Collecting file contents...');
contextContent += '## 2. Source Code Files\n\n';
contextContent += collectFileContents(rootDir);

// 3. Write to Output File
console.log(`Writing output to ${outputFile}...`);
fs.writeFileSync(outputFile, contextContent, 'utf8');

console.log('\n=============================================');
console.log('✅ DONE! AI project context generated successfully at:');
console.log(outputFile);
console.log('=============================================');
console.log('You can now copy the contents of this file or upload it directly to any AI to provide full context about your project\'s structure, UI components, API integrations, and routing flows.');
