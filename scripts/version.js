#!/usr/bin/env node

/**
 * Version management script
 *
 * Usage:
 *   - `node scripts/version.js` - Removes beta suffix
 *   - `node scripts/version.js --beta` - Adds or increments beta suffix
 */

import {readFile, writeFile} from 'fs/promises';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {green, red, yellow} from "barva";

// Get the current script's directory and resolve to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const packagePath = resolve(projectRoot, 'package.json');

async function main() {
  try {
    // Read package.json
    const packageJsonContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    const currentVersion = packageJson.version;

    // Check if --beta flag is present
    const isBetaMode = process.argv.includes('--beta');
    let newVersion;

    if (isBetaMode) {
      // Handle beta versioning
      const betaRegex = /^(.*)-beta\.(\d+)$/;
      const betaMatch = currentVersion.match(betaRegex);

      if (betaMatch) {
        // Increment existing beta version
        const [, baseVersion, betaNum] = betaMatch;
        const nextBetaNum = parseInt(betaNum, 10) + 1;
        newVersion = `${baseVersion}-beta.${nextBetaNum}`;
      } else {
        // Add new beta suffix
        newVersion = `${currentVersion}-beta.1`;
      }
    } else {
      // Remove beta suffix if it exists
      const betaRegex = /^(.*)-beta\.\d+$/;
      const betaMatch = currentVersion.match(betaRegex);

      if (betaMatch) {
        // Remove beta suffix
        const [, baseVersion] = betaMatch;
        newVersion = baseVersion;
      } else {
        // No beta suffix to remove
        newVersion = currentVersion;
      }
    }

    // Update package.json only if the version changed
    if (newVersion !== currentVersion) {
      packageJson.version = newVersion;
      await writeFile(
        packagePath,
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf-8'
      );
      console.log(green`✓ Version updated: ${currentVersion} → ${newVersion}\n`);
    } else {
      console.log(yellow`⊙ Version unchanged: ${currentVersion}\n`);
    }
  } catch (error) {
    console.error(red`✗ Error updating version: ${error}\n`);
    process.exit(1);
  }
}

main();
