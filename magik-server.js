/*
 *
 * https://github.com/magikMaker/magik-server
 *
 * Copyright (c) 2014 Bjørn Wikkeling
 * Licensed under the MIT license.
 */

'use strict';

    var http = require('http');
    var server = http.createServer(function(request, response) {
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("<!DOCTYPE html>");
        response.write("<html>");
        response.write("<head>");
        response.write("<title>Hello World Page</title>");
        response.write("</head>");
        response.write("<body>");
        response.write("Hello World!");
        response.write("</body>");
        response.write("</html>");
        response.end();
    });

    server.listen(8080);
    console.log("Server is listening");
