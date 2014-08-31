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
    sass = require('node-sass'),
    LiveReloadServer = require('tiny-lr');

var magikServer = function(config) {

    if(!config) {
        throw 'ERROR: magikServer needs a configuration!'.red;
    }

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

        var parsers = {
            directoryListing: function(data){
                // TODO create dir listing
                var listing = 'this is the dir listing';
                return parsers.parseFooter(data).toString().replace(/##LISTING##/, listing);
            },
            fileNotFound: function(data) {
                return parsers.parseFooter(data)
            },
            parseCoffee: function(data){
                config.headers['Content-Type'] = 'application/javascript';
                return data;
            },
            parseJade: function(data){
                config.headers['Content-Type'] = 'text/html';
                return data;
            },
            parseLess: function(data){
                config.headers['Content-Type'] = 'text/css';
                return data;
            },
            parseSass: function(data){
                config.headers['Content-Type'] = 'text/css';
                var stats = {};
                data = sass.renderSync({
                    data: data,
                    outputStyle: 'compressed',
                    stats: stats
                });
                console.log(data, stats);
                return data;
            },
            parseStylus: function(data){
                config.headers['Content-Type'] = 'text/css';
                return data;
            },
            parseFooter: function(data){
                return data.toString()
                    .replace(/##URL##/, parsedUrl.pathname)
                    .replace(/##VERSION##/, config.version)
                    .replace(/##LINK##/, config.pkg.homepage);
            }
        };

        /**
         * TODO move to list.js or files.js or something
         * @param path
         * @link http://nodejs.org/api/fs.html#fs_fs_readdirsync_path
         */
        function createDirectoryListing(path) {
            var fileList = fs.readdirSync(path),
                exclude = config.hidden ? {} : {exclude: /^\./};

            //dir.readFiles(
            //    path,
            //    exclude,
            //    function(err, content, next) {
            //        // TODO what to do upon error?
            //        if(err) {
            //            console.log('error', err);
            //        }
            //        //console.log('content:', content);
            //        next();
            //    },
            //    function(err, files) {
            //        // TODO what to do upon error?
            //        if(err) {
            //            console.log('error', err);
            //        }
            //        fileList = files;
            //        console.log('finished reading files:', files);
            //    });

            console.log('files', path, fileList, exclude);
        }

        /**
         * creates a 404 page or retrieves the custom 404 page and sends
         */
        function sendFileNotFound() {
            var notFoundPath;
            config.headers['Content-Type'] = 'text/html';

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

            readFile(filePath, parsers.fileNotFound);
        }

        /**
         * Handles a request for a directory:
         * - tries to find a suitable index page
         * - if directory listing is enabled displays directory listing
         * - sends 404 if all of the above failed
         */
        function handleDirectoryRequest(filePath){
            var index,
                indexFilePath,
                listing,
                extension;

            // try to find an index and serve that
            if(config.index){
                indexLoop:
                    for(var i = 0, l = config.index.length; i < l; ++i) {

                        for(var j = 0, k = config.extensions.length; j < k + 1; ++j) {

                            extension = config.extensions[j] ? '.' + config.extensions[j] : '';
                            index = path.normalize(filePath + path.sep + config.index[i] + extension);

                            if(fs.existsSync(index) && fs.statSync(index).isFile()) {
                                indexFilePath = index;
                                fileName = path.normalize(path.sep + config.index[i] + extension);
                                break indexLoop;
                            }
                        }
                    }
            }

            if(!indexFilePath && true === config.dirs) {
                config.headers['Content-Type'] = 'text/html';
                fileName = pathName;
                listing = path.normalize(__dirname + path.sep + 'listing.html');
                createDirectoryListing(filePath);
                readFile(listing, parsers.directoryListing);
            } else if(!indexFilePath && false === config.dirs) {
console.log('dir 2', pathName);
                sendFileNotFound()
            } else{
console.log('dir 3', indexFilePath);
                // index found
                config.headers['Content-Type'] = mime.lookup(indexFilePath);
                readFile(indexFilePath);
            }
        }

        /**
         * TODO test for files without extension
         * Handles a request for a file
         * - if it's a hidden file, see if it can be displayed
         * - if it's a parsable file, preprocess it
         * - otherwise just send the file to the client
         * @param filePath the file path
         */
        function handleFileRequest(filePath){
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

        // is this an existing file or directory?
        filePath = path.normalize(documentRoot + pathName);

        if(fs.existsSync(filePath)) {

            var fileStats = fs.statSync(filePath);

            if(fileStats.isDirectory()) {
                handleDirectoryRequest(filePath);
            } else if(fileStats.isFile()) {
                handleFileRequest(filePath);
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

                if(parser) {
                    data = parser(data);
                }

                sendFile(data, error);
            });
        }

        /**
         * Send the file to the user agent
         */
        function sendFile(data, error) {
            var wait,
                currentTime;

            /**
             * Send the file to the client
             */
            function send(data){
                response.writeHead(httpStatusCode, config.headers);
                response.end(data);

                var responseString = pad('response: ', 15) + pad(httpStatusCode.toString(), 7) + ' ' + fileName,
                    responseTime = currentTime - startTime,
                    fileSizeString = bytes(data.length || 0);

                // log the response to the console
                console.log(responseString.grey);
                console.log((pad('response time: ', 15) + responseTime + 'ms').grey);
                console.log((pad('file size: ', 15) + fileSizeString).grey);
                console.log(pad('-', config.windowSize[0], '-').grey);
            }

            //if(!data instanceof Buffer && false){
            //    data = new Buffer(data);
            //}

            // TODO remove this if statement, make sure data is always filled
            if(data){
                config.headers['Content-Length'] = data.toString().length; //Buffer.byteLength(data);
            }
//console.log('data', data, fileName, filePath);
            currentTime = new Date();
            wait = responseTime - (currentTime - startTime);
            wait = wait < 0 ? 0 : wait;

            setTimeout(function() {
                send(data);
            }, wait);
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
