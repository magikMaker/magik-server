/*jshint node: true */

// NodeJS / NPM stuff we need
var bytes = require('bytes'),
    fs = require('fs'),
    http = require('http'),
    mime = require('mime'),
    pad = require('pad'),
    path = require('path'),
    url = require('url'),


    coffee = require('coffee-script'),
    jade = require('jade'),
    stylus = require('stylus'),
    less = require('less-middleware'),
    LiveReloadServer = require('tiny-lr');

var magikServer = function(config) {

    if(!config) {
        throw 'ERROR: magikServer needs a configuration!'.red;
    }

    /**
     * TODO move to list.js or files.js or something
     * @param path
     * @link http://nodejs.org/api/fs.html#fs_fs_readdirsync_path
     */
    //function readDirectory(path) {
    //    var files = fs.readdirSync();
    //}

    /**
     *
     * @link http://nodejs.org/api/http.html#http_http_createserver_requestlistener
     * @param request
     * @param response
     */
    function requestListener(request, response) {
        var fileName,
            filePath,
            startTime = new Date(),
            basePath = process.env.PWD,
            documentRoot = path.normalize(basePath + path.sep + config.root + path.sep),
            parsedUrl = url.parse(request.url, true),
            pathName = parsedUrl.pathname,
            responseTime = parsedUrl.query[config.timeParam] ? parsedUrl.query[config.timeParam] : config.time,
            httpStatusCode = parsedUrl.query[config.statusCodeParam] ? parsedUrl.query[config.statusCodeParam] : 200;

        httpStatusCode = config.statusCode ? config.statusCode : httpStatusCode;
        config.windowSize = process.stdout.getWindowSize();

        // is this an existing file or directory?
        filePath = path.normalize(documentRoot + pathName);

        /**
         * creates a 404 page or retrieves the custom 404 page and sends
         */
        function sendFileNotFound() {
            var notFoundPath;
            config.headers['Content-Type'] = 'text/html';

            function parseNotFoundHtml(data) {
                return data.toString()
                    .replace(/##URL##/, parsedUrl.pathname)
                    .replace(/##VERSION##/, config.versionInfo)
                    .replace(/##LINK##/, config.pkg.homepage);
            };

            // file not found, set 404 code unless status code has been overridden
            httpStatusCode = httpStatusCode === 200 ? 404 : httpStatusCode;
            fileName = '';

            for(var i = 0, l = config.extensions.length; i < l + 1; ++i) {

                extension = config.extensions[i] ? '.' + config.extensions[i] : '';
                notFoundPath = path.normalize(documentRoot + path.sep + config.notFound + extension);

                if(fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()) {
                    filePath = notFoundPath;
                    fileName = path.normalize(path.sep + config.notFound + extension);
                    break;
                }
            }

            if(!fileName) {
                filePath = path.normalize(__dirname + path.sep + '404.html');
            }

            readFile(filePath, parseNotFoundHtml);
        }

        /**
         * Handles a request for a directory:
         * - tries to find a suitable index page
         * - if directory listing is enabled displays directory listing
         * - sends 404 if all of the above failed
         */
        function handleDirectoryRequest(){
            var indexFilePath,
                extension;

            // try to find an index and serve that
            indexLoop:
                for(var i = 0, l = config.index.length; i < l; ++i) {

                    for(var j = 0, k = config.extensions.length; j < k + 1; ++j) {

                        extension = config.extensions[j] ? '.' + config.extensions[j] : '';
                        indexFilePath = path.normalize(documentRoot + path.sep + config.index[i] + extension);

                        if(fs.existsSync(indexFilePath) && fs.statSync(indexFilePath).isFile()) {
                            filePath = indexFilePath;
                            fileName = path.normalize(path.sep + config.index[i] + extension);
                            break indexLoop;
                        }
                    }
                }

            if(!filePath && true === config.dirs) {
                config.headers['Content-Type'] = 'text/html';
                // TODO create directory listing
                fileName = pathName;
                filePath = path.normalize(__dirname + path.sep + 'magik-server' + path.sep + 'listing.html');
                readFile(filePath);
            } else if(!filePath && false === config.dirs) {
                sendFileNotFound()
            } else{
                // index found
                config.headers['Content-Type'] = mime.lookup(filePath);
                readFile(filePath);
            }
        }

        /**
         * Handles a request for a file
         * - if it's a hidden file, see if they can be displayed
         * - if it's a parseble file, preprocess it
         * - otherwise just send the file to the client
         */
        function handleFileRequest(){
            fileName = pathName.substring(pathName.lastIndexOf('/') - 1);
            var extension = path.extname(fileName).substring(1);

            if(fileName.charAt(0) === '.' && config.hidden === false){
                sendFileNotFound();
            } else if(['coffee', 'jade', 'less', 'sass', 'stylus'].indexOf(extension) >= 0) {
                // TODO add parsers
                console.log('pre process file??', extension, fileName);
                //readFile(filePath, parsers['parse' + extension.toUpperCase()]);
            } else {
                config.headers['Content-Type'] = mime.lookup(filePath);
                readFile(filePath);
            }
        }

        // TODO refactor to Object
        if(fs.existsSync(filePath)) {

            var fileStats = fs.statSync(filePath);

            if(fileStats.isDirectory()) {
                handleDirectoryRequest();
            } else if(fileStats.isFile()) {
                handleFileRequest();
            }
        } else {
            sendFileNotFound();
        }

        /**
         * Reads in a file
         * @param filePath
         */
        function readFile(filePath, parser) {

            fs.readFile(filePath, function(error, data) {
                var wait;

                if(parser) {
                    data = parser(data);
                }

                wait = responseTime - ((new Date()).getTime() - startTime.getTime());
                wait = wait < 0 ? 0 : wait;

                setTimeout(function() {
                    sendFile(error, data);
                }, wait);
            });
        }

        /**
         * Send the file to the user agent
         */
        function sendFile(error, data) {
            //if(!data instanceof Buffer && false){
            //    data = new Buffer(data);
            //}

            // TODO send correct http headers (mime-type)
            config.headers['X-PoweredBy'] = config.pkg.name + ' ' + config.versionInfo;
            config.headers['Content-Length'] = data.toString().length; //Buffer.byteLength(data);

            if(config.cors){
                config.headers['Access-Control-Allow-Origin'] = '*';
                config.headers['Access-Control-Allow-Credentials'] = 'true';
                config.headers['Access-Control-Allow-Methods'] ='GET,PUT,POST,DELETE,OPTIONS';
                config.headers['Access-Control-Allow-Headers'] ='Content-Type, Authorization, Content-Length, X-Requested-With, Accept, x-csrf-token, origin';
            }

            response.writeHead(httpStatusCode, config.headers);
            response.end(data);

            var responseString = pad('response: ', 15) + pad(httpStatusCode.toString(), 7) + ' ' + fileName,
                responseTime = (new Date()).getTime() - startTime.getTime(),
                fileSizeString = bytes(data.length);

            // log the response to the console
            console.log(responseString.grey);
            console.log((pad('response time: ', 15) + responseTime + 'ms').grey);
            console.log((pad('file size: ', 15) + fileSizeString).grey);
            console.log(pad('-', config.windowSize[0], '-').grey);
        }

        // log the request to the console
        console.log((pad('request: ', 15) + pad(request.method, 7) + ' ' + request.url).grey);
    }

    // create the httpServer
    this.server = http.createServer(requestListener);
};

/**
 * listen to incomming requests on the supplied port and host
 */
magikServer.prototype.listen = function() {
    this.server.listen.apply(this.server, arguments);
};

/**
 * Closes the server gracefully. When all connections are closed, the close
 * event is emitted
 *
 * @link http://nodejs.org/api/net.html#net_server_close_callback
 * @param callback
 * @returns {*}
 */
magikServer.prototype.close = function(callback) {
    return this.server.close(callback);
};

/**
 * Creates a new magikServer object and returns it
 *
 * @param config
 * @returns {magikServer}
 */
exports.createServer = function(config) {
    return new magikServer(config);
};
