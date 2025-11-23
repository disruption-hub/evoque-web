const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const mainJsPath = path.join(distPath, 'src', 'main.js');

if (fs.existsSync(mainJsPath)) {
  let content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Fix @generated/prisma imports
  content = content.replace(
    /require\(['"]@generated\/prisma['"]\)/g,
    "require('../../generated/prisma')"
  );
  
  content = content.replace(
    /require\(['"]@generated\/prisma\/([^'"]+)['"]\)/g,
    "require('../../generated/prisma/$1')"
  );
  
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('Fixed path imports in main.js');
} else {
  console.warn('main.js not found, skipping path fixes');
}

