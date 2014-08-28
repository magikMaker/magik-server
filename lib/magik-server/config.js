// http://blog.nodejitsu.com/npmawesome-parsing-command-line-options-with-yargs/
// https://github.com/chevex/yargs

/**
 * -d --dot         Show .dot files (hidden files)
 * -h --help        show help text
 * -i --index       the index file to use, default searches for index.html,
 *                  index.htm, index.js, default.html, default.html, default.js,
 *                 app.html, app, htm, app.js] can be true, false or string.
 *                 When false, no directory index/listing is shown when no suitable
 *                 file is found
 * -p --port        specify port number, defaults to 8080
 * -r --root        supply the document root, defaults to project root
 * -v --version     show version number
 * -t --timeout     Set the timeout query string parameter, defaults to magik-timeout
 */
var config = module.exports = function(config){

    var argv = require('yargs')
        .usage('Start the magik-server.\nUsage: $0')
        .example('$0 -p 8090', 'Start magik-server on port 8090 (default: 8080)')
        .alias({
            d: 'dot',
            h: 'help',
            i: 'index',
            p: 'port',
            r: 'root',
            v: 'version',
            t: 'timeout'
        })
        .describe({
            d: 'Show .dot files (hidden files)',
            h: 'display help information',
            i: 'the index file to use, defaults to index.html, can be true, false or string',
            p: 'specify port number, defaults to 8080',
            r: 'supply the document root, defaults to project root',
            v: 'display version information',
            t: 'Set the timeout query string parameter, defaults to magik-timeout'
        })
        .argv;
};