#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

const src = path.join(__dirname, 'frontend', 'dist');
const dest = path.join(__dirname, 'public');

if (fs.existsSync(src)) {
  copyDir(src, dest);
  console.log('Copied frontend/dist to public/');
} else {
  console.log('frontend/dist not found');
}
