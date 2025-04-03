/**
 * CLI entry point for magik-server
 * @module magik-server/cli
 */

import path from 'path';
import {fileURLToPath} from 'url';
import {magenta, green, grey, yellow, red} from 'barva';
import portfinder from 'portfinder';
import {createServer} from '../server/index.js';
import {config} from '../server/config.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * magik-server logo as ascii art
 *
 * @type {string}
 */
const logo = `
                       _ _    _____
                      (_) |  /  ___|
 _ __ ___   __ _  __ _ _| | _\\ \`--.  ___ _ ____   _____ _ __
| '_ \` _ \\ / _\` |/ _\` | | |/ /\`--. \\/ _ \\ '__\\ \\ / / _ \\ '__|
| | | | | | (_| | (_| | |   </\\__/ /  __/ |   \\ V /  __/ |
|_| |_| |_|\\__,_|\\__, |_|_|\\_\\____/ \\___|_|    \\_/ \\___|_|
                  __/ |
                 |___/
`;

/**
 * Simple cross-platform URL opener
 */
function openUrl(url) {
  const {platform} = process;
  let command;

  switch (platform) {
  case 'darwin':
    command = `open "${url}"`;
    break;
  case 'win32':
    command = `start "" "${url}"`;
    break;
  default:
    command = `xdg-open "${url}"`;
    break;
  }

  try {
    import('child_process').then(cp => {
      cp.exec(command);
    });
  } catch (e) {
    console.log(yellow`Could not open browser at ${url}`);
  }
}

/**
 * Display a splash screen in the terminal
 * @param {Object} config - Server configuration
 */
function displaySplashScreen(config) {
  const divider = '-'.repeat(process.stdout.columns || 80);

  console.clear();
  console.log(magenta`${logo}`);
  console.log(green`(v.${config.version})`);
  console.log(grey`${divider}`);

  if (config.portChanged) {
    console.log(red`WARNING port ${config.portChanged} in use, changed to ${config.port}`);
  }

  console.log(green`started magik-server on http://${config.address}:${config.port}`);
  console.log(green`Hit CTRL-C to stop (waiting for requests)`);
  console.log(grey`${divider}`);
}

/**
 * Handler for SIGINT signal (Ctrl+C)
 * @param {Object} server - HTTP server instance
 * @param {Object} config - Server configuration
 */
function onSignalInterrupt(server, config) {
  const divider = '-'.repeat(process.stdout.columns || 80);

  console.clear();
  console.log(red`${logo}`);
  console.log(red`(v.${config.version})`);
  console.log(grey`${divider}`);
  console.log(red`magik-server shutting down`);

  // Gracefully shut down the server and exit
  server.close(() => {
    process.exit(0);
  });
}

/**
 * Callback executed just before the program exits
 */
function onExit() {
  const divider = '-'.repeat(process.stdout.columns || 80);
  console.log(red`magik-server stopped`);
  console.log(grey`${divider}`);
}

/**
 * Start a new magikServer instance
 * @param {Object} config - Server configuration
 */
function startServer(config) {
  const server = createServer(config);

  server.listen(config.port, config.address, () => {
    if (config.open) {
      openUrl(`${config.protocol}://${config.address}:${config.port}`);
    }

    displaySplashScreen(config);
  });

  // Handle SIGINT (CTRL+C)
  if (process.platform !== 'win32') {
    process.on('SIGINT', () => {
      try {
        onSignalInterrupt(server, config);
      } catch (e) {
        console.log(red`Hold on...`);
        process.exit(1);
      }
    });

    // Restore cursor on exit
    process.on('exit', onExit);
  }
}

// Get package info and extend config
const packagePath = path.resolve(__dirname, '../../package.json');
const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Enrich config object
config.pkg = packageInfo;
config.protocol = 'http';
config.version = packageInfo.version;
config.versionInfo = `(v.${packageInfo.version})`;

// Check if port and address are available
try {
  portfinder.basePort = config.port;

  portfinder.getPort({host: config.address}, (error, port) => {
    if (error) {
      if (error.code === 'EADDRNOTAVAIL') {
        console.log(red`ERROR: Server address not available: ${config.address}`);
      } else if (error.code === 'EADDRINUSE') {
        console.log(red`ERROR: no suitable port found (${config.port}). Is the server already running?`);
      } else {
        console.log(red`ERROR: starting server failed`);
      }
      process.exit(1);
    } else {
      config.portChanged = config.port !== port && config.port !== 8080 ? config.port : false;
      config.port = port;
      startServer(config);
    }
  });
} catch (e) {
  console.error(red`Error starting server:`, e);
  process.exit(1);
}
