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

/**
 * Returns a file from the magik-server lib
 * @param file
 * @returns {*}
 */
function magikRequire(name) {
    // return magikServer[name] = require(path.resolve(__filename, 'magik-server', file+'.js'));
    return require(path.resolve(__dirname, 'magik-server', name+'.js'));
}

var config = magikRequire('config');

//var colors = magikRequire('colors'),
//    mime = magikRequire('mime');



// restore on CTRL+C
process.on('SIGINT', function () {
    arciiArt.font(' magikServer', 'Doom', 'red+bold', function(rendered){
        console.log('\u001B[2J\u001B[0;0f');
        console.log(rendered);
        console.log(pad('-', 80, '-').grey);
        console.log('magik-server stopped'.red);
        console.log(pad('-', 80, '-').grey);
        process.exit(0);
    });
});

// restore the cursor back to normal on exit
process.on('exit', function () {
    cursor.reset();
    cursor.show();
});

/**
 * TODO move to list.js >> files.js
 * @param path
 * @link http://nodejs.org/api/fs.html#fs_fs_readdirsync_path
 */
function readDirectory(path){
    var files = fs.readdirSync();
}

var server = http.createServer(function(request, response) {

    var startTime = new Date();
    var fileName;
    var basePath = process.env.PWD;
    var documentRoot = path.normalize(basePath + path.sep + config.root);
    var parsedUrl = url.parse(request.url, true);
    var pathName = parsedUrl.pathname;
    var responseTime = undefined !== parsedUrl.query[config.timeoutParam] ? parsedUrl.query[config.timeoutParam] : config.timeout;
    var httpStatusCode = undefined !== parsedUrl.query[config.statusCodeParam] ? parsedUrl.query[config.statusCodeParam] : 200;
    httpStatusCode = config.statusCode ? config.statusCode : httpStatusCode;

    // is this an existing file or directory?
    var filePath = path.normalize(documentRoot + pathName);

    // TODO refactor to Object
    if(fs.existsSync(filePath)){

        var fileStats = fs.statSync(filePath);

        if(fileStats.isDirectory()){
            fileName = pathName;
            filePath = path.normalize(__dirname + path.sep + 'magik-server' + path.sep + 'listing.html');
            readFile(filePath);

            //// ends in slash?
            //if(filePath.lastIndexOf('/') !== filePath.length){
            //    filePath += '/'
            //}
            //
            //// read directory contents (files)
            //if(config.index){
            //    // fileContents = readDirectory(filePath);
            //
            //    // remove hidden files
            //    if(!config.dot){
            //
            //    }
            //
            //
            //} else {
            //    // show 404
            //}

        } else if (fileStats.isFile()){
            fileName = pathName.substring(pathName.lastIndexOf('/') - 1);
            var extension = path.extname(fileName).substring(1);
            // TODO compile sass files

            readFile(filePath);
        }
    } else {
        // file not found, show 404 unless status code had been overridden
        httpStatusCode = httpStatusCode === 200 ? 404 : httpStatusCode;
        // TODO set filename from fetched 404 file
        fileName = '';

        // TODO fetch the custom 404 page or else create our own
        filePath = path.normalize(__dirname + path.sep + 'magik-server' + path.sep + '404.html');
        readFile(filePath);
    }

    /**
     * Reads in a file
     * @param filePath
     */
    function readFile(filePath){
        var wait = responseTime - ((new Date()).getTime() - startTime.getTime());
        wait = wait < 0 ? 0 : wait;

        fs.readFile(filePath, function(error, data) {
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
            'X-Server': 'magik server' //  TODO add version info
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
});

server.listen(config.port, config.ip);

arciiArt.font(' magikServer', 'Doom', 'magenta', function(rendered){
    console.log('\u001B[2J\u001B[0;0f');
    console.log(rendered);
    console.log(pad('-', 80, '-').grey);
    console.log(('started magik-server on http://'+config.ip +':'+ config.port).green);
    console.log('Hit CTRL-C to stop (waiting for requests)'.green);
    console.log(pad('-', 80, '-').grey);
    cursor.hide();
});
