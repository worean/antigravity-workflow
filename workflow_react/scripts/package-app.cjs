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
const appPkg = {
  name: 'antigravity-workflow-desktop',
  version: '2.4.0',
  main: 'electron/main.cjs',
  type: 'module',
};
fs.writeFileSync(path.join(resourcesAppDir, 'package.json'), JSON.stringify(appPkg, null, 2), 'utf-8');

console.log('\n==================================================');
console.log('✨ [SUCCESS] AntiGravity Workflow Desktop Application Built!');
console.log(`📁 Application Path: ${outputAppDir}`);
console.log(`🚀 Executable File: ${targetExe}`);
console.log('==================================================\n');
