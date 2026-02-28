const fs = require("fs");
const path = require("path");

const srcElectronDir = path.join(__dirname, "..", "src", "electron");
const srcIconsDir = path.join(__dirname, "..", "public", "icons");
const destDir = path.join(__dirname, "..", "dist-electron", "electron");

const electronFiles = ["splash.html", "splash.css"];

const iconFiles = ["suri_primary_emblem_transparent.png"];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
for (const file of electronFiles) {
  const srcPath = path.join(srcElectronDir, file);
  const destPath = path.join(destDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.warn(`Not found: ${srcPath}`);
  }
}

for (const file of iconFiles) {
  const srcPath = path.join(srcIconsDir, file);
  const destPath = path.join(destDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.warn(`Icon not found: ${srcPath}`);
  }
}
