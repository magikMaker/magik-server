/**
 * Main server implementation for magik-server
 * @module magik-server/server
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import bytes from 'bytes';
import mime from 'mime';
import { barva } from 'barva';

import { createDirectoryListing } from './directory-listing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Response object to handle HTTP responses
 * @class
 */
class ResponseObject {
  /**
   * Create a new response object
   * @param {Object} config - Server configuration
   * @param {Object} request - HTTP request object
   * @param {Object} response - HTTP response object
   */
  constructor(config, request, response) {
    this.data = {};
    this.config = config;
    this.request = request;
    this.response = response;
    this.host = `${config.protocol}://${config.address}:${config.port}`;
    
    // Set the HTTP headers
    this.headers = {};
    this.headers['X-PoweredBy'] = `${config.pkg.name} ${config.versionInfo}`;
    
    if (config.cors) {
      this.headers['Access-Control-Allow-Origin'] = '*';
      this.headers['Access-Control-Allow-Credentials'] = 'true';
      this.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,HEAD';
      this.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, x-csrf-token, origin';
    }
    
    this.startTime = new Date();
    this.basePath = process.cwd();
    this.documentRoot = path.normalize(`${this.basePath}${path.sep}${this.config.root}${path.sep}`);
    this.parsedUrl = url.parse(`${this.host}${this.request.url}`, true);
    this.pathName = this.parsedUrl.pathname;
    
    this.responseTime = this.parsedUrl.query[this.config.timeParam] 
      ? this.parsedUrl.query[this.config.timeParam] 
      : this.config.time;
    
    this.httpStatusCode = this.config.statusCode ? this.config.statusCode : 200;
    this.httpStatusCode = this.parsedUrl.query[this.config.statusCodeParam] 
      ? this.parsedUrl.query[this.config.statusCodeParam] 
      : this.httpStatusCode;
    
    this.filePath = path.normalize(`${this.documentRoot}${this.pathName}`);
  }
}

/**
 * Creates a magikServer instance
 * @class
 */
class MagikServer {
  /**
   * Create a new server instance
   * @param {Object} config - Server configuration
   */
  constructor(config) {
    if (!config) {
      throw new Error(barva.red('ERROR: magikServer needs a configuration!'));
    }
    
    this.config = config;
    this.server = http.createServer(this.requestListener.bind(this));
  }
  
  /**
   * Start listening for incoming requests
   * @param  {...any} args - Arguments for server.listen 
   */
  listen(...args) {
    this.server.listen(...args);
  }
  
  /**
   * Close the server gracefully
   * @param {Function} callback - Callback to execute after server is closed 
   * @returns {Object} Server instance
   */
  close(callback) {
    return this.server.close(callback);
  }
  
  /**
   * Request listener for HTTP server
   * @param {Object} request - HTTP request object 
   * @param {Object} response - HTTP response object
   */
  requestListener(request, response) {
    const responseObj = new ResponseObject(this.config, request, response);
    this.router(responseObj);
  }
  
  /**
   * Route the request to appropriate handlers
   * @param {ResponseObject} responseObj - Response object
   */
  router(responseObj) {
    // Check if the path exists
    fs.promises.access(responseObj.filePath)
      .then(() => {
        return fs.promises.stat(responseObj.filePath);
      })
      .then(stats => {
        responseObj.fileStats = stats;
        
        if (stats.isDirectory()) {
          this.handleDirectoryRequest(responseObj);
        } else if (stats.isFile()) {
          this.handleFileRequest(responseObj);
        }
      })
      .catch(() => {
        this.sendFileNotFound(responseObj);
      });
  }
  
  /**
   * Handle requests for directories
   * @param {ResponseObject} responseObj - Response object
   */
  handleDirectoryRequest(responseObj) {
    // If the directory/request does not end with a slash, send a redirect
    if (!/\/$/.test(responseObj.parsedUrl.pathname)) {
      let location = `${responseObj.host}${responseObj.parsedUrl.pathname}/`;
      
      // Keep search query for redirects
      if (responseObj.parsedUrl.search) {
        location += responseObj.parsedUrl.search;
      }
      
      responseObj.headers['Location'] = location;
      this.sendRedirect(responseObj);
    } else {
      this.processDirectoryRequest(responseObj);
    }
  }
  
  /**
   * Process directory request after redirect checks
   * @param {ResponseObject} responseObj - Response object
   */
  processDirectoryRequest(responseObj) {
    // Try to find an index and serve that
    if (responseObj.config.index) {
      const indexFound = this.findAndServeIndex(responseObj);
      if (indexFound) return;
    }
    
    // No index found, show directory listing if enabled
    if (responseObj.config.dirs === true) {
      responseObj.headers['Content-Type'] = 'text/html';
      responseObj.fileName = responseObj.pathName;
      responseObj.filePath = path.normalize(`${__dirname}/../assets/listing.html`);
      
      createDirectoryListing(responseObj, (listingHtml) => {
        this.readFile(responseObj, (resObj) => {
          resObj.data = resObj.data.toString()
            .replace(/##LISTING##/, listingHtml)
            .replace(/##URL##/, resObj.parsedUrl.pathname)
            .replace(/##VERSION##/, resObj.config.version)
            .replace(/##LINK##/, resObj.config.pkg.homepage);
          
          return resObj;
        });
      });
    } else {
      // Directory listing disabled
      this.sendFileNotFound(responseObj);
    }
  }
  
  /**
   * Find and serve an index file in a directory
   * @param {ResponseObject} responseObj - Response object
   * @returns {boolean} Whether an index was found and served
   */
  findAndServeIndex(responseObj) {
    for (let i = 0; i < responseObj.config.index.length; i++) {
      for (let j = 0; j <= responseObj.config.extensions.length; j++) {
        const extension = responseObj.config.extensions[j] ? `.${responseObj.config.extensions[j]}` : '';
        const indexPath = path.normalize(`${responseObj.filePath}${responseObj.config.index[i]}${extension}`);
        
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
          responseObj.headers['Content-Type'] = mime.getType(indexPath);
          responseObj.fileName = path.normalize(`/${responseObj.config.index[i]}${extension}`);
          responseObj.filePath = indexPath;
          this.readFile(responseObj);
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Handle requests for files
   * @param {ResponseObject} responseObj - Response object
   */
  handleFileRequest(responseObj) {
    responseObj.fileName = responseObj.pathName.substring(responseObj.pathName.lastIndexOf('/') + 1);
    
    // Handle hidden files
    if (responseObj.fileName.charAt(0) === '.' && responseObj.config.hidden === false) {
      this.sendFileNotFound(responseObj);
      return;
    }
    
    responseObj.headers['Content-Type'] = mime.getType(responseObj.filePath);
    this.readFile(responseObj);
  }
  
  /**
   * Send a 404 Not Found response
   * @param {ResponseObject} responseObj - Response object
   */
  sendFileNotFound(responseObj) {
    // If request was for a favicon, send the magik favicon
    if (responseObj.parsedUrl.pathname === '/favicon.ico') {
      this.sendFavicon(responseObj);
      return;
    }
    
    // File not found, set 404 code unless status code has been overridden
    responseObj.httpStatusCode = responseObj.httpStatusCode === 200 ? 404 : responseObj.httpStatusCode;
    responseObj.headers['Content-Type'] = 'text/html';
    responseObj.fileName = '';
    
    // Try to find custom 404 page
    for (let i = 0; i <= responseObj.config.extensions.length; i++) {
      const extension = responseObj.config.extensions[i] ? `.${responseObj.config.extensions[i]}` : '';
      const notFoundPath = path.normalize(`${responseObj.documentRoot}${responseObj.config['not-found']}${extension}`);
      
      if (fs.existsSync(notFoundPath) && fs.statSync(notFoundPath).isFile()) {
        responseObj.filePath = notFoundPath;
        responseObj.fileName = path.normalize(`/${responseObj.config['not-found']}${extension}`);
        break;
      }
    }
    
    // If no custom 404 page, use default
    if (!responseObj.fileName) {
      responseObj.filePath = path.normalize(`${__dirname}/../assets/404.html`);
    }
    
    this.readFile(responseObj, (resObj) => {
      resObj.data = resObj.data.toString()
        .replace(/##URL##/, resObj.parsedUrl.pathname)
        .replace(/##VERSION##/, resObj.config.version)
        .replace(/##LINK##/, resObj.config.pkg.homepage);
      
      return resObj;
    });
  }
  
  /**
   * Send a redirection response
   * @param {ResponseObject} responseObj - Response object 
   */
  sendRedirect(responseObj) {
    responseObj.httpStatusCode = 301;
    responseObj.response.writeHead(responseObj.httpStatusCode, responseObj.headers);
    responseObj.response.end();
    
    this.logResponse(responseObj);
  }
  
  /**
   * Send favicon.ico
   * @param {ResponseObject} responseObj - Response object
   */
  sendFavicon(responseObj) {
    responseObj.headers['Content-Type'] = 'image/x-icon';
    responseObj.filePath = path.normalize(`${__dirname}/../assets/favicon.ico`);
    this.readFile(responseObj);
  }
  
  /**
   * Read a file from disk
   * @param {ResponseObject} responseObj - Response object
   * @param {Function} parser - Optional parser function to process the file 
   */
  readFile(responseObj, parser) {
    fs.readFile(responseObj.filePath, (error, data) => {
      if (error) {
        console.log(barva.red('ERROR:'), error);
        this.sendFileNotFound(responseObj);
        return;
      }
      
      responseObj.data = data;
      
      if (parser) {
        responseObj = parser(responseObj);
      }
      
      this.sendFile(null, responseObj);
    });
  }
  
  /**
   * Send the file to the user agent
   * @param {Error} error - Error object if any 
   * @param {ResponseObject} responseObj - Response object
   */
  sendFile(error, responseObj) {
    const wait = Math.max(0, responseObj.responseTime - (new Date() - responseObj.startTime));
    
    setTimeout(() => {
      if (responseObj.data) {
        responseObj.headers['Content-Length'] = responseObj.data.toString().length;
      }
      
      responseObj.response.writeHead(responseObj.httpStatusCode, responseObj.headers);
      responseObj.response.write(responseObj.data);
      responseObj.response.end();
      
      this.logResponse(responseObj);
    }, wait);
  }
  
  /**
   * Log response information to console
   * @param {ResponseObject} responseObj - Response object
   */
  logResponse(responseObj) {
    const divider = '-'.repeat(process.stdout.columns || 80);
    const col1 = 15;
    const col2 = 10;
    
    const responseString = `response: ${responseObj.httpStatusCode} ${responseObj.fileName || ''}`;
    const realResponseTime = (new Date()).getTime() - responseObj.startTime;
    const fileSizeString = responseObj.data ? bytes(responseObj.data.length || 0) : '0B';
    
    console.log(barva.grey(`request: ${responseObj.request.method} ${responseObj.request.url}`));
    console.log(barva.grey(responseString));
    console.log(barva.grey(`response time: ${realResponseTime}ms`));
    console.log(barva.grey(`file size: ${fileSizeString}`));
    console.log(barva.grey(divider));
  }
}

/**
 * Create a new magikServer instance
 * @param {Object} config - Server configuration
 * @returns {MagikServer} Server instance
 */
export function createServer(config) {
  return new MagikServer(config);
}
