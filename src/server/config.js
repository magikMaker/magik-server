/**
 * Configuration options for magik-server
 * @module magik-server/server/config
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const defaults = {
  extensions: 'html, htm, js',
  index: 'index, default, main, app',
  statusCode: null,
  statusCodeParam: 'magik-status',
  time: 0,
  timeParam: 'magik-time'
};

/**
 * Validate command line arguments
 * @param {Object} args - Command line arguments
 * @returns {boolean} Validation result
 */
function validate(args) {
  // Show directories?
  if (args.D === true) {
    args.dirs = false;
  }

  // Extensions
  if (args.extensions !== defaults.extensions) {
    args.extensions = args.extensions + ',' + defaults.extensions;
  }

  args.e = args.extensions = args.extensions.split(',').map(value => {
    return value.trim();
  });

  // Index files
  if (args.index !== false) {
    if (args.index !== defaults.index) {
      args.index = args.index + ',' + defaults.index;
    }

    args.i = args.index = args.index.split(',').map(value => {
      return value.trim();
    });
  }

  // Port number validation
  args.p = args.port = parseInt(args.p, 10);

  if (args.p < 1 || args.p > 65535) {
    args.p = args.port = 8080;
  }

  // Status code / parameter handling
  if ((args.statusCode - parseFloat(args.statusCode) + 1) >= 0) {
    args.statusCodeParam = defaults.statusCodeParam;
  } else if (args.statusCode !== defaults.statusCodeParam && typeof args.statusCode === 'string') {
    args.statusCodeParam = args.statusCode;
    args.s = args.statusCode = null;
  } else {
    args.statusCodeParam = defaults.statusCodeParam;
    args.s = args.statusCode = null;
  }

  // Response time / parameter handling
  if ((args.time - parseFloat(args.time) + 1) >= 0) {
    args.timeParam = defaults.timeParam;
  } else if (args.time !== defaults.timeParam && typeof args.time === 'string') {
    args.timeParam = args.time;
    args.t = args.time = 0;
  } else {
    args.timeParam = defaults.timeParam;
    args.t = args.time = 0;
  }

  return true;
}

export const config = yargs(hideBin(process.argv))
  .alias({
    a: 'address',
    c: 'config',
    D: 'no-dirs',
    e: 'extensions',
    h: 'help',
    H: 'hidden',
    i: 'index',
    n: 'not-found',
    o: 'open',
    p: 'port',
    r: 'root',
    s: 'statusCode',
    t: 'time',
    u: 'encoding',
    v: 'version'
  })
  .describe({
    a: 'IP address the server is bound to',
    cors: 'enable CORS headers in the response',
    dirs: 'show directory listing',
    D: 'Do not show directory listings',
    e: 'extensions for default index',
    h: 'display this help information',
    H: 'show .dot (hidden) files',
    i: 'index file(s)',
    n: 'custom 404 page',
    'no-hidden': 'don\'t show hidden files',
    o: 'open the default browser after the server starts',
    p: 'port number',
    r: 'document root',
    s: 'status code query string parameter or the global status (String|Number)',
    t: 'response time query string parameter or the global response time in milliseconds',
    u: 'file encoding',
    v: 'display version information'
  })
  .default({
    'address': 'localhost',
    'cors': false,
    'dirs': true,
    'encoding': 'utf8',
    'extensions': 'html, htm, js',
    'hidden': false,
    'index': 'index, default, main, app',
    'not-found': '404',
    'no-dirs': false,
    'no-hidden': true,
    'open': false,
    'port': 8080,
    'root': '/',
    'statusCode': 'magik-status',
    'time': 'magik-time'
  })
  .boolean([
    'cors',
    'hidden',
    'no-dirs',
  ])
  .string([
    'address',
    'config',
    'encoding',
    'extensions',
    'index',
    'not-found',
    'open',
    'root',
    'statusCode'
  ])
  .config('c')
  .check(validate)
  .wrap(80)
  .strict()
  .usage('\nUsage:\n  $0 [options]\n')
  .version()
  .help('h', 'display this help information')
  .showHelpOnFail(false, 'Specify --help for available options')
  .example('magik-server -p 8090', 'start the server on port 8090')
  .example('magik-server -r app -i my-app.html', 'set the document root and index page')
  .example('magik-server --ip 192.168.0.15', 'set the IP address of the server')
  .example('magik-server --listing false', 'boolean option')
  .example('magik-server --no-listing', 'Or negate boolean option')
  .requiresArg([
    'encoding',
    'extensions',
    'ip',
    'not-found',
    'port',
    'root',
    'statusCode',
    'time'
  ])
  .parse();
