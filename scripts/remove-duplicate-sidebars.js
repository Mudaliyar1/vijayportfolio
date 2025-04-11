const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Function to recursively get all .ejs files in a directory
async function getEjsFiles(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const ejsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const subDirFiles = await getEjsFiles(fullPath);
      ejsFiles.push(...subDirFiles);
    } else if (file.name.endsWith('.ejs')) {
      ejsFiles.push(fullPath);
    }
  }

  return ejsFiles;
}

// Function to remove sidebar includes from a file
async function removeSidebarIncludes(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    
    // Check if the file contains a sidebar include
    if (!content.includes('include') || !content.includes('sidebar')) {
      return false;
    }
    
    // Different patterns to match sidebar includes
    const patterns = [
      /<%[-\s]*include\(['"]\.\.\/partials\/sidebar['"],\s*\{\s*path:.*\}\s*\)[\s-]*%>/g,
      /<%[-\s]*include\(['"]\.\/partials\/sidebar['"],\s*\{\s*path:.*\}\s*\)[\s-]*%>/g,
      /<%[-\s]*include\(['"]\.\.\/admin\/partials\/sidebar['"],\s*\{\s*path:.*\}\s*\)[\s-]*%>/g
    ];
    
    let newContent = content;
    let hasChanged = false;
    
    for (const pattern of patterns) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, '');
        hasChanged = true;
      }
    }
    
    // Also remove any "Sidebar" comments
    if (newContent.includes('<!-- Sidebar -->')) {
      newContent = newContent.replace(/<!-- Sidebar -->\s*/g, '');
      hasChanged = true;
    }
    
    // Remove any "Main Content" comments
    if (newContent.includes('<!-- Main Content -->')) {
      newContent = newContent.replace(/<!-- Main Content -->\s*/g, '');
      hasChanged = true;
    }
    
    // Clean up any double line breaks created by the removals
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (hasChanged) {
      await writeFileAsync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    const adminDir = path.join(__dirname, '..', 'views', 'admin');
    const ejsFiles = await getEjsFiles(adminDir);
    
    console.log(`Found ${ejsFiles.length} .ejs files in the admin directory`);
    
    let modifiedCount = 0;
    
    for (const file of ejsFiles) {
      const wasModified = await removeSidebarIncludes(file);
      if (wasModified) {
        modifiedCount++;
        console.log(`Modified: ${file}`);
      }
    }
    
    console.log(`\nRemoved duplicate sidebar includes from ${modifiedCount} files`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
