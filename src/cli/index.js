#!/usr/bin/env node

/**
 * CLI entry point for magik-server
 * @module magik-server/cli
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { barva } from 'barva';
import opener from 'opener';
import portfinder from 'portfinder';
import figlet from 'figlet';
import { createServer } from '../server/index.js';
import { config } from '../server/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Display a splash screen in the terminal
 * @param {Object} config - Server configuration
 */
function displaySplashScreen(config) {
  const divider = '-'.repeat(process.stdout.columns || 80);
  
  figlet('magikServer', { font: 'Doom' }, (err, data) => {
    if (err) {
      console.log(barva.magenta('    magikServer'));
      return;
    }
    
    console.clear();
    console.log(barva.magenta(data));
    console.log(barva.green(`(v.${config.version})`));
    console.log(barva.grey(divider));
    
    if (config.portChanged) {
      console.log(barva.red(`WARNING port ${config.portChanged} in use, changed to ${config.port}`));
    }
    
    console.log(barva.green(`started magik-server on http://${config.address}:${config.port}`));
    console.log(barva.green('Hit CTRL-C to stop (waiting for requests)'));
    console.log(barva.grey(divider));
  });
}

/**
 * Handler for SIGINT signal (Ctrl+C)
 * @param {Object} server - HTTP server instance
 * @param {Object} config - Server configuration
 */
function onSignalInterrupt(server, config) {
  const divider = '-'.repeat(process.stdout.columns || 80);
  
  figlet('magikServer', { font: 'Doom' }, (err, data) => {
    console.clear();
    console.log(barva.red(err ? '    magikServer' : data));
    console.log(barva.red(`(v.${config.version})`));
    console.log(barva.grey(divider));
    console.log(barva.red('magik-server shutting down'));
    
    // Gracefully shut down the server and exit
    server.close(() => {
      process.exit(0);
    });
  });
}

/**
 * Callback executed just before the program exits
 */
function onExit() {
  const divider = '-'.repeat(process.stdout.columns || 80);
  console.log(barva.red('magik-server stopped'));
  console.log(barva.grey(divider));
}

/**
 * Start a new magikServer instance
 * @param {Object} config - Server configuration
 */
function startServer(config) {
  const server = createServer(config);
  
  server.listen(config.port, config.address, () => {
    if (config.open) {
      opener(`${config.protocol}://${config.address}:${config.port}`);
    }
    
    displaySplashScreen(config);
  });
  
  // Handle SIGINT (CTRL+C)
  if (process.platform !== 'win32') {
    process.on('SIGINT', () => {
      try {
        onSignalInterrupt(server, config);
      } catch (e) {
        console.log(barva.red('Hold on...'));
        process.exit(1);
      }
    });
    
    // Restore cursor on exit
    process.on('exit', onExit);
  }
}

// Get package info and extend config
const packagePath = path.resolve(__dirname, '../../package.json');
const packageInfo = await import(packagePath);

// Enrich config object
config.pkg = packageInfo.default;
config.protocol = 'http';
config.version = packageInfo.default.version;
config.versionInfo = `(v.${packageInfo.default.version})`;

// Check if port and address are available
try {
  portfinder.basePort = config.port;
  
  portfinder.getPort({ host: config.address }, (error, port) => {
    if (error) {
      if (error.code === 'EADDRNOTAVAIL') {
        console.log(barva.red(`ERROR: Server address not available: ${config.address}`));
      } else if (error.code === 'EADDRINUSE') {
        console.log(barva.red(`ERROR: no suitable port found (${config.port}). Is the server already running?`));
      } else {
        console.log(barva.red('ERROR: starting server failed'));
      }
      process.exit(1);
    } else {
      config.portChanged = config.port !== port && config.port !== 8080 ? config.port : false;
      config.port = port;
      startServer(config);
    }
  });
} catch (e) {
  console.error(barva.red('Error starting server:'), e);
  process.exit(1);
}
