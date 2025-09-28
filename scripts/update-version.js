#!/usr/bin/env node

/**
 * Script to update version across all necessary files
 * Called by semantic-release during the prepare phase
 */

const fs = require('fs');
const path = require('path');

function updateVersion(filePath, version, updater) {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = updater(content, version);
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✅ Updated version in ${filePath} to ${version}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error.message);
  }
}

function updatePackageJson(content, version) {
  const pkg = JSON.parse(content);
  pkg.version = version;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function updateTauriConfig(content, version) {
  const config = JSON.parse(content);
  config.version = version;
  return JSON.stringify(config, null, 2) + '\n';
}

function updateCargoToml(content, version) {
  // Convert semantic version to Cargo compatible (remove pre-release tags if any)
  const cargoVersion = version.split('-')[0];
  return content.replace(
    /^version = ".*"/m,
    `version = "${cargoVersion}"`
  );
}

function main() {
  const version = process.argv[2];
  
  if (!version) {
    console.error('❌ Version not provided');
    console.log('Usage: node update-version.js <version>');
    process.exit(1);
  }

  console.log(`\n🚀 Updating project version to ${version}\n`);

  // Update root package.json
  updateVersion('package.json', version, updatePackageJson);

  // Update desktop app package.json
  updateVersion('apps/desktop/package.json', version, updatePackageJson);

  // Update Tauri config
  updateVersion('apps/desktop/src-tauri/tauri.conf.json', version, updateTauriConfig);

  // Update Cargo.toml
  updateVersion('apps/desktop/src-tauri/Cargo.toml', version, updateCargoToml);

  // Update all package versions
  const packages = [
    'packages/core-sim/package.json',
    'packages/db/package.json',
    'packages/content/package.json',
    'packages/ui/package.json'
  ];

  packages.forEach(pkg => {
    updateVersion(pkg, version, updatePackageJson);
  });

  console.log('\n✨ Version update complete!\n');
}

if (require.main === module) {
  main();
}