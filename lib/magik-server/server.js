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

        var ResponseObject = function(config, request, response){
            this.data = {};
            this.config = config;
            this.request = request;
            this.response = response;
            this.host = config.protocol + '://' + config.address + ':' + config.port;
            // set the HTTP headers
            this.headers =  {};
            this.headers['X-PoweredBy'] = config.pkg.name + ' ' + config.versionInfo;

            if(config.cors){
                this.headers['Access-Control-Allow-Origin'] = '*';
                this.headers['Access-Control-Allow-Credentials'] = 'true';
                this.headers['Access-Control-Allow-Methods'] ='GET,PUT,POST,DELETE,OPTIONS,HEAD';
                this.headers['Access-Control-Allow-Headers'] ='Content-Type, Authorization, Content-Length, X-Requested-With, Accept, x-csrf-token, origin';
            }
        };

        var responseObject = new ResponseObject(config, request, response);

        responseObject.startTime = new Date(),
        responseObject.basePath = process.env.PWD,
        responseObject.documentRoot = path.normalize(responseObject.basePath + path.sep + responseObject.config.root + path.sep),
        responseObject.parsedUrl = url.parse(responseObject.host + responseObject.request.url, true),
        responseObject.pathName = responseObject.parsedUrl.pathname,
        responseObject.responseTime = responseObject.parsedUrl.query[responseObject.config.timeParam] ? responseObject.parsedUrl.query[responseObject.config.timeParam] : responseObject.config.time;
        responseObject.httpStatusCode = responseObject.config.statusCode ? responseObject.config.statusCode : 200;
        responseObject.httpStatusCode = responseObject.parsedUrl.query[responseObject.config.statusCodeParam] ? responseObject.parsedUrl.query[responseObject.config.statusCodeParam] : responseObject.httpStatusCode;
        responseObject.filePath = path.normalize(responseObject.documentRoot + responseObject.pathName);
        responseObject.config.windowSize = process.stdout.getWindowSize();

        var parsers = {
            directoryListing: function(responseObject, listingHtml){
                responseObject.data = parsers.parseFooter(responseObject).data.toString().replace(/##LISTING##/, listingHtml);
                return responseObject;
            },
            fileNotFound: function(responseObject) {
                return parsers.parseFooter(responseObject);
            },
            parseCoffee: function(responseObject){
                responseObject.headers['Content-Type'] = 'application/javascript';
                return responseObject;
            },
            parseJade: function(responseObject){
                responseObject.headers['Content-Type'] = 'text/html';
                return responseObject;
            },
            parseLess: function(responseObject){
                responseObject.headers['Content-Type'] = 'text/css';
                return responseObject;
            },
            parseScss: function(responseObject){
                return parsers.parseSass(responseObject);
            },
            parseSass: function(responseObject){
                responseObject.headers['Content-Type'] = 'text/css';
                var stats = {};
                responseObject.data = sass.renderSync({
                    data: responseObject.data,
                    outputStyle: 'compressed',
                    stats: stats
                });
                return responseObject;
            },
            parseStyl: function(responseObject){
                return parsers.parseStylus(responseObject);
            },
            parseStylus: function(responseObject){
                responseObject.headers['Content-Type'] = 'text/css';
                return responseObject;
            },
            parseFooter: function(responseObject){
                if(responseObject.data){
                    responseObject.data = responseObject.data.toString()
                        .replace(/##URL##/, responseObject.parsedUrl.pathname)
                        .replace(/##VERSION##/, responseObject.config.version)
                        .replace(/##LINK##/, responseObject.config.pkg.homepage);
                }

                return responseObject;
            }
        };
        
		/**
		 * this starts handling the request
		 */
        function router(responseObject) {

            // is this an existing file or directory?
            if(fs.existsSync(responseObject.filePath)) {

                responseObject.fileStats = fs.statSync(responseObject.filePath);

                if(responseObject.fileStats.isDirectory()) {
                    handleDirectoryRequest(responseObject);
                } else if(responseObject.fileStats.isFile()) {
                    handleFileRequest(responseObject);
                }

            } else {
                sendFileNotFound(responseObject);
            }
        }

        /**
         * creates a 404 page or retrieves the custom 404 page and sends
         */
        function sendFileNotFound(responseObject) {
            var extension,
                notFoundPath;

            // if request was for a favicon, send the magik favicon
            if(responseObject.parsedUrl.pathname === '/favicon.ico'){
                sendFavicon(responseObject);
            } else {
                // file not found, set 404 code unless status code has been overridden
                responseObject.httpStatusCode = responseObject.httpStatusCode === 200 ? 404 : responseObject.httpStatusCode;
                responseObject.headers['Content-Type'] = 'text/html';
                responseObject.fileName = '';

                for(var i = 0, l = responseObject.config.extensions.length; i < l + 1; ++i) {

                    extension = responseObject.config.extensions[i] ? '.' + responseObject.config.extensions[i] : '';
                    notFoundPath = path.normalize(responseObject.documentRoot + path.sep + responseObject.config['not-found'] + extension);

                    if(fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()) {
                        responseObject.filePath = notFoundPath;
                        responseObject.fileName = path.normalize('/' + responseObject.config['not-found'] + extension);
                        break;
                    }
                }

                if(!responseObject.fileName) {
                    responseObject.filePath = path.normalize(__dirname + path.sep + '404.html');
                }

                readFile(responseObject, parsers.fileNotFound);
            }
        }

        /**
         * Sends a 301 redirect to the user
         *
         * TODO merge with sending file so it will also output log lines
         * @param responseObject
         */
        function sendRedirect(responseObject){
            responseObject.httpStatusCode = 301;
            responseObject.response.writeHead(responseObject.httpStatusCode, responseObject.headers);
            responseObject.response.end();
        }

        /**
         * Sends the magik favicon, when a favicon was requested but not found.
         * @param responseObject
         */
        function sendFavicon(responseObject){
            responseObject.headers['Content-Type'] = 'image/x-icon';
            responseObject.filePath = path.normalize(__dirname + path.sep + 'favicon.ico');
            readFile(responseObject);
        }

        /**
         * Handles a request for a directory:
         * - tries to find a suitable index page
         * - if directory listing is enabled displays directory listing
         * - sends 404 if all of the above failed
         */
        function handleDirectoryRequest(responseObject){
            var location = '';

            function directoryRequest(responseObject){
                var index,
                    indexFilePath,
                    extension;

                // try to find an index and serve that
                if(responseObject.config.index){
                    indexLoop:
                        for(var i = 0, l = responseObject.config.index.length; i < l; ++i) {
                            for(var j = 0, k = responseObject.config.extensions.length; j < k + 1; ++j) {
                                extension = responseObject.config.extensions[j] ? '.' + responseObject.config.extensions[j] : '';
                                index = path.normalize(responseObject.filePath + path.sep + responseObject.config.index[i] + extension);
                                if(fs.existsSync(index) && fs.statSync(index).isFile()) {
                                    indexFilePath = index;
                                    responseObject.fileName = path.normalize(path.sep + responseObject.config.index[i] + extension);
                                    break indexLoop;
                                }
                            }
                        }
                }

                if(!indexFilePath && true === responseObject.config.dirs) {
                    responseObject.headers['Content-Type'] = 'text/html';
                    responseObject.fileName = responseObject.pathName;
                    responseObject.filePath = path.normalize(__dirname + path.sep + 'listing.html');

                    var createDirectoryListing = require('./directorylisting');
                    createDirectoryListing(responseObject, function(listingHtml){
                        readFile(responseObject, function(responseObject){
                            return parsers.directoryListing(responseObject, listingHtml);
                        });
                    });

                } else if(!indexFilePath && false === responseObject.config.dirs) {
                    sendFileNotFound(responseObject);
                } else{
                    // index found
                    responseObject.headers['Content-Type'] = mime.lookup(indexFilePath);
                    responseObject.filePath = indexFilePath;
                    readFile(responseObject);
                }
            }

            // if the directory/request does not end with a slash send a redirect
            if(!/\/$/.test(responseObject.parsedUrl.pathname)){
                location = responseObject.host + responseObject.parsedUrl.pathname + '/';

                // keep search query for redirects
                if(responseObject.parsedUrl.search){
                    location += responseObject.parsedUrl.search;
                }

                responseObject.headers['Location'] = location;
                sendRedirect(responseObject);
            } else {
                directoryRequest(responseObject);
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
        function handleFileRequest(responseObject){
            responseObject.fileName = responseObject.pathName.substring(responseObject.pathName.lastIndexOf('/') + 1);
            var extension = path.extname(responseObject.fileName).substring(1);

            if(responseObject.fileName.charAt(0) === '.' && responseObject.config.hidden === false){
                sendFileNotFound(responseObject);
            } else if(['coffee', 'jade', 'less', 'sass', 'scss', 'styl', 'stylus'].indexOf(extension) >= 0) {
                readFile(responseObject, parsers['parse' + extension.toUpperCase()]);
            } else {
                responseObject.headers['Content-Type'] = mime.lookup(responseObject.filePath);
                readFile(responseObject);
            }
        }

        /**
         * TODO sync file read for now, change to async
         * Reads in a file
         * @param filePath
         */
        function readFile(responseObject, parser) {
            //var error = null;
            //responseObject.headers['Content-Type'] = responseObject.headers['Content-Type'] ? responseObject.headers['Content-Type'] : mime.lookup(path.normalize(responseObject.documentRoot + path.sep + responseObject.request.url));
            //responseObject.data = fs.readFileSync(responseObject.filePath);
            //if(parser) {
            //    responseObject = parser(responseObject);
            //}
            //
            //sendFile(error, responseObject);

            fs.readFile(responseObject.filePath, function(error, data){
                responseObject.headers['Content-Type'] = responseObject.headers['Content-Type'] ? responseObject.headers['Content-Type'] : mime.lookup(path.normalize(responseObject.documentRoot + path.sep + responseObject.request.url));
                responseObject.data = data;

                if(error){
                    console.log('ERROR', error);
                }

                if(parser) {
                    responseObject = parser(responseObject);
                }

                sendFile(error, responseObject);
            });
        }

        /**
         * TODO create logResponse() method
         * Send the file to the user agent
         */
        function sendFile(error, responseObject) {
            var wait;

            /**
             * Send the file to the client
             */
            function send(responseObject){
                // TODO add modified header
                responseObject.response.writeHead(responseObject.httpStatusCode, responseObject.headers);
                responseObject.response.end(responseObject.data);

                var col1 = 15,
                    col2 = 10,
                    responseString = pad('response: ', col1) + pad(responseObject.httpStatusCode.toString(), col2) + ' ' + responseObject.fileName,
                    realResponseTime = (new Date()).getTime() - responseObject.startTime,
                    fileSizeString = bytes(responseObject.data.length || 0);

                console.log((pad('request: ', col1) + pad(responseObject.request.method, col2) + ' ' + responseObject.request.url).grey);
                console.log(responseString.grey);
                console.log((pad('response time: ', col1) + pad(realResponseTime + 'ms', col2)).grey);
                console.log((pad('file size: ', col1) + fileSizeString).grey);

                // console.log('responseObject', bytes(responseObject.headers['Content-Length']), responseObject.filePath, responseObject.headers['Content-Type']);
                //console.log('Res', responseObject);
                console.log(pad('-', responseObject.config.windowSize[0], '-').grey);
            }

            if(error){
                console.log('ERROR:: '.red, error);
            }

            //if(!data instanceof Buffer && false){
            //    data = new Buffer(data);
            //}

            // TODO remove this if statement, make sure data is always filled
            if(responseObject.data){
                responseObject.headers['Content-Length'] = responseObject.data.toString().length; //Buffer.byteLength(data);
            }

            wait = responseObject.responseTime - ((new Date()) - responseObject.startTime);
            wait = wait < 0 ? 0 : wait;

            setTimeout(function() {
                send(responseObject);
            }, wait);
        }

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

