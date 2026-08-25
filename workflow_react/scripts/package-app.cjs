const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 [AntiGravity Desktop] Starting Desktop Application Packaging...\n');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const electronDir = path.join(projectRoot, 'electron');
const releaseDir = path.join(projectRoot, 'release');
const outputAppDir = path.join(releaseDir, 'AntiGravity-Workflow-win32-x64');
const resourcesAppDir = path.join(outputAppDir, 'resources', 'app');

// 1. Vite & TypeScript Build
console.log('📦 Step 1: Building React Web Application (Vite Production Bundle)...');
execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

// 2. Locate Installed Electron Runtime Binary
console.log('\n🔍 Step 2: Locating Electron Runtime Dist...');
let electronDist = path.join(projectRoot, 'node_modules', 'electron', 'dist');
if (!fs.existsSync(electronDist)) {
  const electronPath = require('electron');
  electronDist = path.dirname(electronPath);
}

if (!fs.existsSync(electronDist)) {
  console.error('❌ Error: Electron runtime directory not found at', electronDist);
  process.exit(1);
}
console.log('✔ Found Electron runtime at:', electronDist);

// 3. Prepare Release Directory
console.log('\n📁 Step 3: Preparing Release Directory:', outputAppDir);
if (fs.existsSync(outputAppDir)) {
  fs.rmSync(outputAppDir, { recursive: true, force: true });
}
fs.mkdirSync(outputAppDir, { recursive: true });

// 4. Copy Electron Runtime Files
console.log('📋 Step 4: Copying Electron Runtime Binaries and Resources...');
function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}
copyFolderSync(electronDist, outputAppDir);

// Remove default_app.asar from copied electron runtime so it doesn't conflict with our app
const defaultAppAsar = path.join(outputAppDir, 'resources', 'default_app.asar');
if (fs.existsSync(defaultAppAsar)) {
  fs.unlinkSync(defaultAppAsar);
  console.log('✔ Removed dummy default_app.asar from runtime.');
}

// 5. Rename Executable to AntiGravity-Workflow.exe
const defaultExe = path.join(outputAppDir, 'electron.exe');
const targetExe = path.join(outputAppDir, 'AntiGravity-Workflow.exe');
if (fs.existsSync(defaultExe)) {
  fs.renameSync(defaultExe, targetExe);
  console.log('✔ Created executable: AntiGravity-Workflow.exe');
}

// 6. Bundle Application Files into resources/app
console.log('\n📦 Step 5: Bundling Web Application into resources/app...');
fs.mkdirSync(resourcesAppDir, { recursive: true });

// Copy dist/
copyFolderSync(distDir, path.join(resourcesAppDir, 'dist'));

// Copy electron/
copyFolderSync(electronDir, path.join(resourcesAppDir, 'electron'));

// Create lightweight app package.json
const rootPkg = require('../package.json');
const appPkg = {
  name: 'antigravity-workflow-desktop',
  version: rootPkg.version || '2.5.0',
  main: 'electron/main.cjs',
};
fs.writeFileSync(path.join(resourcesAppDir, 'package.json'), JSON.stringify(appPkg, null, 2), 'utf-8');

// 7. Create Portable Zip Distribution Package
console.log('\n🗜️ Step 6: Creating Portable Distribution Archive (ZIP)...');
const zipFileName = `AntiGravity-Workflow-v${appPkg.version}-win-x64.zip`;
const zipOutputPath = path.join(releaseDir, zipFileName);

if (fs.existsSync(zipOutputPath)) {
  fs.unlinkSync(zipOutputPath);
}

try {
  execSync(`powershell -Command "Compress-Archive -Path '${outputAppDir}\\*' -DestinationPath '${zipOutputPath}' -Force"`, {
    cwd: releaseDir,
    stdio: 'inherit',
  });
  console.log(`✔ Created distribution package: ${zipFileName}`);
} catch (err) {
  console.warn('⚠️ Warning: Failed to create zip package with PowerShell Compress-Archive:', err.message);
}

// 8. Create Windows NSIS Setup Installer (.exe)
console.log('\n💿 Step 7: Building Windows NSIS Setup Installer (.exe)...');
const installerName = `AntiGravity Workflow-${appPkg.version}-x64.exe`;
const installerPath = path.join(releaseDir, installerName);

try {
  execSync(`npx electron-builder --win nsis --x64 --prepackaged "${outputAppDir}"`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  console.log(`✔ Created Windows Setup Installer: ${installerName}`);
} catch (err) {
  console.warn('⚠️ Warning: Failed to build NSIS Installer:', err.message);
}

console.log('\n==================================================');
console.log('✨ [SUCCESS] AntiGravity Workflow Desktop Application Built!');
console.log(`📁 Application Path: ${outputAppDir}`);
console.log(`🚀 Executable File: ${targetExe}`);
if (fs.existsSync(installerPath)) {
  console.log(`💿 Windows Setup Installer: ${installerPath}`);
}
if (fs.existsSync(zipOutputPath)) {
  console.log(`📦 Distribution Package: ${zipOutputPath}`);
}
console.log('==================================================\n');
