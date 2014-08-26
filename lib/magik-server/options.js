// http://blog.nodejitsu.com/npmawesome-parsing-command-line-options-with-yargs/
// https://github.com/chevex/yargs

/*
 * -h --help        show help text
 * -v --version     show version number
 * -p               specify port number, defaults to 8080
 * -r --root        supply the document root, defaults to project root
 * -i --index       the index file to use, defaults to index.html, can be true, false or string
 */
var options = module.exports = function(){

    var defaults = {
        'port': 8080
    };

    var argv = require('yargs')
        .usage('Start the magik-server.\nUsage: $0')
        .example('$0 -p 8090', 'Start magik-server on port 8090 (default: 8080)')
        .alias({
            h: 'help',
            i: 'index',
            p: 'port',
            r: 'root',
            v: 'version'
        })
        .describe({
            h: 'display help information',
            i: 'the index file to use, defaults to index.html, can be true, false or string',
            p: 'specify port number, defaults to 8080',
            r: 'supply the document root, defaults to project root',
            v: 'display version information'
        })
        .argv;
};