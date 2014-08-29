#!/usr/bin/env node

/*jshint node: true */

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
    bytes = require('bytes'),
    colors = require('colors'),
    cursor = require('ansi')(process.stdout),
    fs = require('fs'),
    http = require('http'),
    mmmagic = require('mmmagic'),
    pad = require('pad'),
    path = require('path'),
    url = require('url');

// The module to be exported.
var magikServer = module.exports = {};

var path = require('path'),
    pkg = require(path.resolve(__dirname, '../package.json')),
    config = magikRequire('config'),
    versionInfo = '(v.'+pkg.version+')';

//var colors = magikRequire('colors'),
//    mime = magikRequire('mime');

/**
 * Returns a file from the magik-server lib
 * @param file
 * @returns {*}
 */
function magikRequire(name) {
    return require(path.resolve(__dirname, 'magik-server', name+'.js'));
}

/**
 * when the user sends Signal Interrupt (CTRL+C)
 */
function onSignalInterrupt(){
    arciiArt.font('    magikServer', 'Doom', 'red+bold', function(rendered){
        console.log('\u001B[2J\u001B[0;0f');
        console.log(rendered);
        console.log(pad(80, versionInfo, ' ').red);
        console.log(pad('-', 80, '-').grey);
        console.log('magik-server stopped'.red);
        console.log(pad('-', 80, '-').grey);
        process.exit(0);
    });
}

/**
 * Gets called just before the program exits
 */
function onExit(){
    cursor.reset();
    cursor.show();
}

/**
 * TODO move to list.js >> files.js
 * @param path
 * @link http://nodejs.org/api/fs.html#fs_fs_readdirsync_path
 */
function readDirectory(path){
    var files = fs.readdirSync();
}

/**
 * Clear the screen and display the start splash screen
 */
function displaySplashScreen(){
    arciiArt.font('    magikServer', 'Doom', 'magenta', function(rendered){
        console.log('\u001B[2J\u001B[0;0f');
        console.log(rendered);
        console.log(pad(80, versionInfo, ' ').green);
        console.log(pad('-', 80, '-').grey);
        console.log(('started magik-server on http://'+config.ip +':'+ config.port).green);
        console.log('Hit CTRL-C to stop (waiting for requests)'.green);
        console.log(pad('-', 80, '-').grey);
        cursor.hide();
    });
}

/**
 *
 * @link http://nodejs.org/api/http.html#http_http_createserver_requestlistener
 * @param request
 * @param response
 */
function requestListener(request, response){
    var startTime = new Date();
    var fileName;
    var basePath = process.env.PWD;
    var documentRoot = path.normalize(basePath + path.sep + config.root + path.sep);
    var parsedUrl = url.parse(request.url, true);
    var pathName = parsedUrl.pathname;
    var responseTime = undefined !== parsedUrl.query[config.timeoutParam] ? parsedUrl.query[config.timeoutParam] : config.timeout;
    var httpStatusCode = undefined !== parsedUrl.query[config.statusCodeParam] ? parsedUrl.query[config.statusCodeParam] : 200;
    httpStatusCode = config.statusCode ? config.statusCode : httpStatusCode;

    // is this an existing file or directory?
    var filePath = path.normalize(documentRoot + pathName);

    /**
     * creates a 404 page or retrieves the custom 404 page and sends
     */
    function sendFileNotFound(){

        var notFoundPath;

        function parseNotFoundHtml(data){
            return data.toString()
                .replace(/##URL##/, parsedUrl.pathname)
                .replace(/##VERSION##/, versionInfo)
                .replace(/##LINK##/, pkg.homepage);
        };


        // file not found, set 404 code unless status code has been overridden
        httpStatusCode = httpStatusCode === 200 ? 404 : httpStatusCode;
        fileName = '';

        for(var i = 0, l = config.extensions.length; i < l + 1; ++i){

            extension = config.extensions[i] ? '.' + config.extensions[i] : '';
            notFoundPath = path.normalize(documentRoot + path.sep + config.notFound + extension);

            if(fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()){
                filePath = notFoundPath;
                fileName = path.normalize(path.sep + config.notFound + extension);
                break;
            }
        }

        if(!fileName){
            filePath = path.normalize(__dirname + path.sep + 'magik-server' + path.sep + '404.html');
        }

        readFile(filePath, parseNotFoundHtml);
    }

    // TODO refactor to Object
    if(fs.existsSync(filePath)){

        var fileStats = fs.statSync(filePath);

        if(fileStats.isDirectory()){

            var indexFilePath,
                extension;

            // try to find an index and serve that
            indexLoop:
            for(var i = 0, l = config.index.length; i < l; ++i){

                for(var j = 0, k = config.extensions.length; j < k + 1; ++j){

                    extension = config.extensions[j] ? '.'+config.extensions[j] : '';
                    indexFilePath = path.normalize(documentRoot+path.sep+config.index[i]+extension);

                    if(fs.existsSync(indexFilePath) && fs.statSync(indexFilePath).isFile()){
                        filePath = indexFilePath;
                        fileName = path.normalize(path.sep + config.index[i] + extension);
                        break indexLoop;
                    }
                }
            }

            if(!filePath){
                // TODO create directory listing
                fileName = pathName;
                filePath = path.normalize(__dirname + path.sep + 'magik-server' + path.sep + 'listing.html');
            }

            readFile(filePath);

        } else if (fileStats.isFile()){

            fileName = pathName.substring(pathName.lastIndexOf('/') - 1);
            var extension = path.extname(fileName).substring(1);

            console.log('extension', extension);
            // TODO compile sass files
            if(extension === 'sass'){

            }

            readFile(filePath);
        }
    } else {
        sendFileNotFound();
    }

    /**
     * Reads in a file
     * @param filePath
     */
    function readFile(filePath, parser){

        fs.readFile(filePath, function(error, data) {
            var wait;

            if(parser){
                data = parser(data);
            }

            wait = responseTime - ((new Date()).getTime() - startTime.getTime());
            wait = wait < 0 ? 0 : wait;

            setTimeout(function(){
                sendFile(error, data);
            }, wait);
        });
    }

    /**
     * Send the file to the user agent
     */
    function sendFile(error, data){

        // TODO send correct http headers (mime-type)
        response.writeHead(httpStatusCode, {
            'Content-Type': 'text/html',
            'Content-Length': data.length,
            'X-PoweredBy': pkg.name+' '+versionInfo
        });

        response.end(data);

        var responseString = pad('response: ', 15) + pad(httpStatusCode.toString(), 7) + ' ' + fileName,
            responseTime = (new Date()).getTime() - startTime.getTime(),
            fileSizeString = bytes(data.length);

        // log the response to the console
        console.log(responseString.grey);
        console.log((pad('timeout: ', 15, ' ') + responseTime+'ms').grey);
        console.log((pad('file size: ', 15, ' ') + fileSizeString).grey);
        console.log(pad('-', 80, '-').grey);
    }

    // log the request to the console
    console.log((pad('request: ', 15) + pad(request.method, 7) + ' ' + request.url).grey);
}

// restore on CTRL+C
process.on('SIGINT', onSignalInterrupt);

// restore the cursor back to normal on exit
process.on('exit', onExit);

// create the httpServer
var httpServer = http.createServer(requestListener);
httpServer.listen(config.port, config.ip);

// show the splash screen
displaySplashScreen();