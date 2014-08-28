#!/usr/bin/env node

/*
 *
 * https://github.com/magikMaker/magik-server
 *
 * Copyright (c) 2014 Bjørn Wikkeling
 * Licensed under the MIT license.
 */

'use strict';

// The module to be exported.
var magikServer = module.exports = {};

function magikRequire(name) {
    return magik-server[name] = require('./magik-server/' + name);
}

//var colors = magikRequire('colors'),
//    mime = magikRequire('mime');

// npm stuff we nee:
var bytes = require('bytes'),
    colors = require('colors'),
    cursor = require('ansi')(process.stdout),
    fs = require('fs'),
    http = require('http'),
    mmmagic = require('mmmagic'),
    pad = require('pad'),
    path = require('path'),
    url = require('url');


// config stuff, move
var config = {
    disableLess: false,
    disableSass: false,
    httpStatusCodeParam: 'magik-status',
    ip: 'localhost',
    listing: true,
    notFound: ['404.html', '404.htm', '404.js'],
    port: 8080,
    responseTimeParam: 'magik-timeout',
    root: '',
    showIndex: true, // false|true
    showHidden: false
};

process.on('SIGINT', function () {
    console.log('\u001B[2J\u001B[0;0f');
    console.log('magik-server stopped'.red);
    console.log(pad('-', 80, '-').grey);
    process.exit(0);
});

process.on('exit', function () {
    cursor.reset();
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
    var responseTime = undefined !== parsedUrl.query[config.responseTimeParam] ? parsedUrl.query[config.responseTimeParam] : 0;
    var httpStatusCode = undefined !== parsedUrl.query[config.httpStatusCodeParam] ? parsedUrl.query[config.httpStatusCodeParam] : 200;

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
            //if(config.showIndex){
            //    // fileContents = readDirectory(filePath);
            //
            //    // remove hidden files
            //    if(!config.showHidden){
            //
            //    }
            //
            //
            //} else {
            //    // show 404
            //}

        } else if (fileStats.isFile()){
            fileName = pathName.substring(pathName.lastIndexOf('/') - 1);

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
            'X-Server': 'magik server'
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

// clear screen cls
console.log('\u001B[2J\u001B[0;0f');
console.log(('started magik-server on http://'+config.ip +':'+ config.port).green);
console.log('Hit CTRL-C to stop (waiting for requests)'.green);
console.log(pad('-', 80, '-').grey);
cursor.hide();
