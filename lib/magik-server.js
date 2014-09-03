#!/usr/bin/env node

/*
 *
 * https://github.com/magikMaker/magik-server
 *
 * Copyright (c) 2014 Bjørn Wikkeling
 * Licensed under the MIT license.
 */

'use strict';

// NodeJS / NPM stuff we need
var arciiArt = require('ascii-art'),
    colors = require('colors'),
    cursor = require('ansi')(process.stdout),
    opener = require('opener'),
    pad = require('pad'),
    path = require('path'),
    portfinder = require('portfinder');

/**
 * Returns a file from the magik-server lib folder
 *
 * @param file
 * @returns {*}
 */
var magikRequire = exports.magikRequire = function(name) {
    return require(path.resolve(__dirname, 'magik-server', name + '.js'));
};

/**
 * when the user sends Signal Interrupt (CTRL+C)
 */
function onSignalInterrupt(server) {

    config.windowSize = process.stdout.getWindowSize();
    arciiArt.font('    magikServer', 'Doom', 'red+bold', function(rendered) {
        console.log('\u001B[2J\u001B[0;0f');
        console.log(rendered);
        console.log(pad(config.windowSize[0], config.versionInfo).red);
        console.log(pad('-', config.windowSize[0], '-').grey);
        console.log('magik-server shutting down'.red);

        // gracefully shut down the server and exit the process
        server.close(function() {
            process.exit(0);
        });
    });
}

/**
 * Gets called just before the program exits, displays info in the console
 */
function onExit() {
    console.log('magik-server stopped'.red);
    console.log(pad('-', config.windowSize[0], '-').grey);
    cursor.reset();
    cursor.show();
}

/**
 * Clear the screen and display the start splash screen
 */
function displaySplashScreen() {
    config.windowSize = process.stdout.getWindowSize();

    arciiArt.font('    magikServer', 'Doom', 'magenta', function(rendered) {
        console.log('\u001B[2J\u001B[0;0f');
        console.log(rendered);
        console.log(pad(config.windowSize[0], config.versionInfo).green);
        console.log(pad('-', config.windowSize[0], '-').grey);

        if(config.portChanged) {
            console.log('WARNING port %s in use, changed to %s'.red, config.portChanged, config.port);
        }
        console.log(('started magik-server on http://' + config.address + ':' + config.port).green);
        console.log('Hit CTRL-C to stop (waiting for requests)'.green);
        console.log(pad('-', config.windowSize[0], '-').grey);
        cursor.hide();
    });
}

/**
 * Start a new magikServer instance
 * @param config the configuration object
 */
function startServer(config) {
    var server = magikServer.createServer(config);
    server.listen(config.port, config.address, function() {

        if(config.open) {
            opener(config.protocol+'://'+config.address + ':' + config.port.toString());
        }

        displaySplashScreen();
    });

    // apparently this doesn't work on windows
    if(process.platform !== 'win32') {

        // restore on CTRL+C
        process.on('SIGINT', function() {
            try {
                onSignalInterrupt(server);
            } catch(e) {
                console.log('Hold on...'.red);
                process.exit(1);
            }
        });

        // restore the cursor back to normal on exit
        process.on('exit', onExit);
    }
}

// get the stuff we need
var pkg = require(path.resolve(__dirname, '../package.json')),
    config = magikRequire('config'),
    magikServer = magikRequire('server');

// enrich config object
config.pkg = pkg;
config.protocol = 'http'; // maybe add https someday
config.version = pkg.version;
config.versionInfo = '(v.' + pkg.version + ')';
config.windowSize = process.stdout.getWindowSize();

// check if the port and host address are available,
// increase the port number if it is already taken
try {
    portfinder.basePort = config.port;
    portfinder.getPort({host: config.address}, function(error, port) {

        if(error) {
            if(error.code === 'EADDRNOTAVAIL') {
                console.log('ERROR: Server address not available: %s'.red, config.address);
            } else if(error.code === 'EADDRINUSE') {
                console.log('ERROR: no suitable port found (%s). Is the server already running? --- '.red, config.port);
            } else {
                console.log('ERROR: starting server failed'.red);
            }
            process.exit(1);
        } else {
            config.portChanged = config.port !== port && config.port != 8080 ? config.port : false;
            config.port = port;
            startServer(config);
        }
    });
} catch(e) {}
