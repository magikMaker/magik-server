#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import zlib from 'node:zlib';
import {execSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

/**
 * Formats a file size in bytes to a human-readable string with KB
 * @param {number} bytes The size in bytes
 * @returns {string} Formatted size string
 */
function formatSize(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

/**
 * Gets package version from a package.json file
 * @param {string} pkgPath Path to package.json
 * @returns {string} Package version or "unknown"
 */
function getPackageVersion(pkgPath) {
  try {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version || 'unknown';
    }
  } catch (err) {
    // Ignore errors
  }
  return 'unknown';
}

/**
 * Gets the minified and gzipped size of a file
 * @param {string} filePath Path to the file
 * @returns {Object} Object with minified and gzipped sizes
 */
function getFileSize(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { minified: 'not found', gzipped: 'not found' };
    }

    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);

    return {
      minified: formatSize(content.length),
      gzipped: formatSize(gzipped.length)
    };
  } catch (err) {
    console.error(`Error measuring ${filePath}: ${err.message}`);
    return { minified: 'error', gzipped: 'error' };
  }
}

/**
 * Returns the most likely minified file for a package
 *
 * @param {string} pkgName Package name
 * @returns {string|null} Path to minified file or null if not found
 */
function findMinifiedFile(pkgName) {
  try {
    // Special case for magik-server which is in the local project
    if (pkgName === 'magik-server') {
      // Check dist directory for minified files
      const distDir = path.join(rootDir, 'dist');

      // Try to find a minified ESM file first
      const esmFile = path.join(distDir, 'create-server.js');
      if (fs.existsSync(esmFile)) {
        return esmFile;
      }

      // Or a CJS file
      const cjsFile = path.join(distDir, 'index.cjs');
      if (fs.existsSync(cjsFile)) {
        return cjsFile;
      }

      return null;
    }

    // For installed packages, try to resolve their main entry point
    try {
      return require.resolve(pkgName);
    } catch {
      // If we can't resolve directly, look in node_modules
      const nodeModulesPath = path.join(rootDir, 'node_modules', pkgName);
      if (fs.existsSync(nodeModulesPath)) {
        const pkgJson = path.join(nodeModulesPath, 'package.json');
        if (fs.existsSync(pkgJson)) {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));

          // Try to find the minified file using package.json fields
          // First check for "exports" field (modern packages)
          if (pkg.exports) {
            const exports = pkg.exports;
            // Handle different export patterns
            let mainExport = null;

            if (typeof exports === 'string') {
              mainExport = exports;
            } else if (exports['.']) {
              // Check for exports['.'] pattern
              if (typeof exports['.'] === 'string') {
                mainExport = exports['.'];
              } else if (exports['.'].import) {
                mainExport = exports['.'].import;
              } else if (exports['.'].default) {
                mainExport = exports['.'].default;
              }
            }

            if (mainExport) {
              const exportPath = path.join(nodeModulesPath, mainExport);
              if (fs.existsSync(exportPath)) {
                return exportPath;
              }
            }
          }

          // Then check for "module" field (ESM)
          if (pkg.module) {
            const modulePath = path.join(nodeModulesPath, pkg.module);
            if (fs.existsSync(modulePath)) {
              return modulePath;
            }
          }

          // Then check for "main" field (CJS)
          if (pkg.main) {
            const mainPath = path.join(nodeModulesPath, pkg.main);
            if (fs.existsSync(mainPath)) {
              return mainPath;
            }
          }

          // Last resort: look for common patterns
          const commonPatterns = [
            'dist/create-server.js',
            'dist/index.mjs',
            'dist/index.cjs',
            'create-server.js',
          ];

          for (const pattern of commonPatterns) {
            const patternPath = path.join(nodeModulesPath, pattern);
            if (fs.existsSync(patternPath)) {
              return patternPath;
            }
          }
        }
      }
    }

    return null;
  } catch (err) {
    console.error(`Error finding file for ${pkgName}: ${err.message}`);
    return null;
  }
}

/**
 * Gets the version and size information for a package
 * @param {string} pkgName Package name
 * @returns {Object} Object with version and size information
 */
function getPackageInfo(pkgName) {
  let version = 'unknown';

  if (pkgName === 'magik-server') {
    version = getPackageVersion(path.join(rootDir, 'package.json'));
  } else {
    // Try to get the version directly from require'd package
    try {
      const pkgPath = require.resolve(`${pkgName}/package.json`);
      version = getPackageVersion(pkgPath);
    } catch (err) {
      // Fallback to node_modules path
      version = getPackageVersion(
        path.join(rootDir, 'node_modules', pkgName, 'package.json')
      );
    }

    // If still unknown, try to read from package-lock.json or yarn.lock
    if (version === 'unknown') {
      try {
        // Check if package is in dependencies or devDependencies
        const rootPkg = JSON.parse(
          fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
        );
        const deps = {
          ...(rootPkg.dependencies || {}),
          ...(rootPkg.devDependencies || {})
        };

        if (deps[pkgName]) {
          // Extract version from the dependency specifier
          version = deps[pkgName].replace(/^\^|~/, '');
        }
      } catch (err) {
        // Ignore errors
      }
    }
  }

  const filePath = findMinifiedFile(pkgName);
  if (!filePath) {
    return {
      version,
      minified: 'not found',
      gzipped: 'not found'
    };
  }

  const { minified, gzipped } = getFileSize(filePath);

  return {
    version,
    minified,
    gzipped,
    path: filePath,
  };
}

/**
 * Main function to install dependencies, calculate bundle sizes, and clean up
 */
async function main() {
  // TODO add other dev server packages here to compare bundle sizes
  const packages = [
  ];

  try {
    // Step 1: Build magik-server
    console.log('🔨 Building magik-server...');
    execSync('yarn build', { stdio: 'inherit' });

    // Step 2: Calculate and display sizes
    console.log('\n📦 BUNDLE SIZE');
    console.log('-------------------------------------------------------------------');
    console.log('Package              Version   Minified    Gzipped   File');
    console.log('-------------------------------------------------------------------');

    // Display magik-server first
    const magikServerInfo = getPackageInfo('magik-server');
    console.log(
      `${'magik-server'.padEnd(20)} ${String(magikServerInfo.version).padEnd(10)} ${
        magikServerInfo.minified.padStart(10)} ${magikServerInfo.gzipped.padStart(10)} ${
        path.basename(magikServerInfo.path || '')}`
    );

    // Display other packages
    for (const pkg of packages) {
      const info = getPackageInfo(pkg);
      console.log(
        `${pkg.padEnd(20)} ${String(info.version).padEnd(10)} ${
          info.minified.padStart(10)} ${info.gzipped.padStart(10)} ${
          path.basename(info.path || '')}`
      );
    }

    console.log('-------------------------------------------------------------------');
    console.log('Note: Sizes are for the entire bundled library file');
    console.log('      Actual impact on your app may be smaller with tree-shaking');

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
  } finally {
    // Step 3: Done
    console.log('\n✅ Bundle size calculation complete!');
  }
}

// Run the main function
main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
