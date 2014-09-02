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
        var responseInfo = {},
            filePath,
            startTime = new Date(),
            basePath = process.env.PWD,
            documentRoot = path.normalize(basePath + path.sep + config.root + path.sep),
            parsedUrl = url.parse(request.url, true),
            pathName = parsedUrl.pathname,
            responseTime = parsedUrl.query[config.timeParam] ? parsedUrl.query[config.timeParam] : config.time;

        var ResponseObject = function(config){
            this.data = {};
            this.config = config;
        }

        var responseObject = new ResponseObject(config);

        responseInfo.httpStatusCode = config.statusCode ? config.statusCode : 200;
        responseInfo.httpStatusCode = parsedUrl.query[config.statusCodeParam] ? parsedUrl.query[config.statusCodeParam] : responseInfo.httpStatusCode;

        responseObject.httpStatusCode = config.statusCode ? config.statusCode : 200;
        responseObject.httpStatusCode = parsedUrl.query[config.statusCodeParam] ? parsedUrl.query[config.statusCodeParam] : responseInfo.httpStatusCode;

        // is this an existing file or directory?
        responseObject.filePath = path.normalize(documentRoot + pathName);

        config.windowSize = process.stdout.getWindowSize();
        config.documentRoot = documentRoot;

        var parsers = {
            directoryListing: function(data, listing){
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
            parseScss: function(data){
                return parsers.parseSass(data);
            },
            parseSass: function(data){
                config.headers['Content-Type'] = 'text/css';
                var stats = {};
                data = sass.renderSync({
                    data: data,
                    outputStyle: 'compressed',
                    stats: stats
                });
                // console.log(data, stats);
                return data;
            },
            parseStyl: function(data){
                return parsers.parseStylus(data);
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
		 * this starts handling the request
		 */
        function router(responseObject) {
//console.log('router', responseObject.filePath,fs.existsSync(responseObject.filePath));
            if(fs.existsSync(responseObject.filePath)) {

                var fileStats = fs.statSync(responseObject.filePath);

                if(fileStats.isDirectory()) {
                //console.log('dir request', responseObject.filePath);
                    handleDirectoryRequest(responseObject.filePath);
                } else if(fileStats.isFile()) {
                //console.log('file request', responseObject.filePath);
                    handleFileRequest(responseObject.filePath);
                }

            } else {
                sendFileNotFound();
            }
        }

        /**
         * creates a 404 page or retrieves the custom 404 page and sends
         */
        function sendFileNotFound() {
            var notFoundPath;
            config.headers['Content-Type'] = 'text/html';

            // file not found, set 404 code unless status code has been overridden
            responseInfo.httpStatusCode = responseInfo.httpStatusCode === 200 ? 404 : responseInfo.httpStatusCode;
            responseInfo.fileName = '';

            for(var i = 0, l = config.extensions.length; i < l + 1; ++i) {

                extension = config.extensions[i] ? '.' + config.extensions[i] : '';
                notFoundPath = path.normalize(documentRoot + path.sep + config.notFound + extension);

                if(fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()) {
                    filePath = notFoundPath;
                    responseInfo.fileName = path.normalize(path.sep + config.notFound + extension);
                    break;
                }
            }

            if(!responseInfo.fileName) {
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
                                responseInfo.fileName = path.normalize(path.sep + config.index[i] + extension);
                                break indexLoop;
                            }
                        }
                    }
            }

            if(!indexFilePath && true === config.dirs) {
                config.headers['Content-Type'] = 'text/html';
                responseInfo.fileName = pathName;
                listing = path.normalize(__dirname + path.sep + 'listing.html');

                var createDirectoryListing = require('./directorylisting');
                createDirectoryListing(filePath, config, function(listingHtml){
                    readFile(listing, function(data){
                        return parsers.directoryListing(data, listingHtml);
                    });
                });

            } else if(!indexFilePath && false === config.dirs) {
                sendFileNotFound()
            } else{
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
            responseInfo.fileName = pathName.substring(pathName.lastIndexOf('/') + 1);
            var extension = path.extname(responseInfo.fileName).substring(1);

            if(responseInfo.fileName.charAt(0) === '.' && config.hidden === false){
                sendFileNotFound();
            } else if(['coffee', 'jade', 'less', 'sass', 'scss', 'styl', 'stylus'].indexOf(extension) >= 0) {
                readFile(filePath, parsers['parse' + extension.toUpperCase()]);
            } else {
                config.headers['Content-Type'] = mime.lookup(filePath);
                readFile(filePath);
            }
        }

        /**
         * TODO sync file read for now, change to async
         * Reads in a file
         * @param filePath
         */
        function readFile(filePath, parser) {
            var headers = config.headers,
                error = {};
            //console.log('mime 1', headers);

            headers['Content-Type'] = headers['Content-Type'] ? headers['Content-Type'] : mime.lookup(path.normalize(documentRoot + path.sep + request.url));

            //console.log('mime 2', request.url, mime.lookup(path.normalize(documentRoot + path.sep + request.url)));

            var data = fs.readFileSync(filePath);

            if(parser) {
                data = parser(data);
            }

            sendFile(error, data, headers);

            //fs.readFile(filePath, function(error, data) {
            //
            //    if(parser) {
            //        data = parser(data);
            //    }
            //
            //    sendFile(error, data, headers);
            //});
        }

        /**
         * Send the file to the user agent
         */
        function sendFile(error, data, headers) {
            var wait;

            /**
             * Send the file to the client
             */
            function send(data){
                response.writeHead(responseInfo.httpStatusCode, headers);
                response.end(data);

                var col1 = 15,
                    col2 = 10,
                    responseString = pad('response: ', col1) + pad(responseInfo.httpStatusCode.toString(), col2) + ' ' + responseInfo.fileName,
                    realResponseTime = (new Date()).getTime() - startTime,
                    fileSizeString = bytes(data.length || 0);

                // log the request and response to the console
        //console.log(config.headers['Content-Type']);
        //console.log(mime.lookup(path.normalize(documentRoot + path.sep + request.url)));
        //console.log(request.url);
        //console.log(filePath);
//          console.log('CT::', headers);
                console.log((pad('request: ', col1) + pad(request.method, col2) + ' ' + request.url).grey);
                console.log(responseString.grey);
                console.log((pad('response time: ', col1) + pad(realResponseTime + 'ms', col2)).grey);
                console.log((pad('file size: ', col1) + fileSizeString).grey);
                console.log(pad('-', config.windowSize[0], '-').grey);
            }

            //if(!data instanceof Buffer && false){
            //    data = new Buffer(data);
            //}

            // TODO remove this if statement, make sure data is always filled
            if(data){
                //config.headers['Content-Length'] = data.toString().length; //Buffer.byteLength(data);
            }

            wait = responseTime - ((new Date()).getTime() - startTime.getTime());
            wait = wait < 0 ? 0 : wait;

            setTimeout(function() {
                send(data);
            }, wait);
        }

    
        
// console.log('DR', documentRoot, pathName);
		// start the request handling
        router(responseObject);
 
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