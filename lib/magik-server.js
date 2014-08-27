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
var http = require('http'),
    fs = require('fs'),
    color = require('colors'),
    path = require('path'),
    bytes = require('bytes'),
    pad = require('pad');


// config stuff, move
var config = {
    index: true, // false|true|string
    port: 8080,
    root: '/',
};


var server = http.createServer(function (request, response) {

    var startTime = new Date();

    var fileName;
    var basePath = process.env.PWD;
    var documentRoot = config.root ? config.root + path.sep : basePath + path.sep;

    // TODO FIXME check if request.url ENDS with a slash
    if(true === config.index){
        fileName = request.url == '/' ? '/index.html' : request.url;
    } else if(false === config.index){
        fileName = request.url == '/' ? '/' : request.url;
    } else {
        fileName = request.url == '/' ? config.index : request.url;
    }

    // var filePath = path.dirname(require.main.filename) + path.sep;
    var code = 200;
    var filePath = path.normalize(documentRoot + fileName);
    var stats = fs.statSync(filePath);
    var fileSizeInBytes = stats['size'];

    // TODO get mime type from file

    // TODO compile sass files

    fs.readFile(filePath, function(err, data) {

        // TODO send correct http headers
        //res.setHeader('content-length', size);
        //res.setHeader('content-type', mimeType);


        // TODO get file size

        response.writeHead(code, {"Content-Type": "text/html"});
        response.end(data);

        var responseString = pad('Response: ', 10) + pad(code.toString(), 7) + ' ' + fileName;
        console.log(responseString.grey);

        var responseTime = (new Date()).getMilliseconds() - startTime.getMilliseconds();
        var fileSizeString = bytes(fileSizeInBytes);
        console.log(pad(responseTime+'ms ', responseString.length, '-').gWrey);

    });

    var method = request.method;
    var requestString = pad('Request: ', 10) + pad(method, 7) + ' ' + request.url;
    console.log(requestString.grey);

});

server.listen(config.port, 'localhost');

var starting = 'Starting up magik-server on port: ' + config.port,
    stopping = 'Hit CTRL-C to stop';

console.log(starting.green);
console.log(stopping.yellow);
