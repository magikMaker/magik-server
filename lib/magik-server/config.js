// http://blog.nodejitsu.com/npmawesome-parsing-command-line-options-with-yargs/
// https://github.com/chevex/yargs

/*jshint node: true */

/*

 | shorthand | command         | description
 | --------- | --------------- | -------------------------------------------------------------------------- |
 | -c        | --config        | Optionally supply the path to a JSON file with all start options as you please |
 | -d        | --dot           | Show .dot files (hidden files) in directory listings, defaults to false    |
 | -e        | --extensions    | The extensions to use for the default index page, default: html, htm, js   |
 | -h        | --help          | show help text                                                             |
 | -i        | --index         | The index file(s) to use, default searches for index, default, main and app with the extensions html, htm and js. One file or a comma delimited list |
 |           | --ip            | specify the IP address the server is bound to, default: localhost          |
 | -l        | --listing       | Show directory listing when no suitable file is found, default: true       |
 | -n        | --notFound     | custom 404 page, defaults to 404.html (.htm, .js) in document root         |
// | -L        | --no-parse-sass | parse SASS files, default: true, use --no-parse-sass to disable            |
// | -S        | --no-parse-less    | parse LESS files, default: true, use --no-parse-less to disable            |
 | -p        | --port          | specify port number, defaults to 8080                                      |
 | -r        | --root          | supply the document root, defaults to project root                         |
 | -s        | --statusCode   | Set the status code query string parameter or the global status code by supplying it , default: magik-status |
 | -t        | --timeout       | Set the timeout query string parameter or the global timeout in milliseconds, default: magik-timeout / 0 |
 | -v        | --version       | show version number                                                        |
 | -w        | --wizzard       | the startup wizzard will guide you through all available options           |


*/


var path = require('path'),
    pkg = require(path.resolve(process.env.PWD, 'package.json')),
    versionString = pkg.name + ' v.'+pkg.version,
    defaults = {
        extensions: 'html, htm, js',
        index: 'index, default, main, app',
        statusCode: null,
        statusCodeParam: 'magik-status',
        timeout: 0,
        timeoutParam: 'magik-timeout'
    };

/**
 * TODO implement validation of command line options
 * @param args
 * @param opts
 * @returns {boolean}
 */
function validate(args){

    // extensions
    if(args.extensions !== defaults.extensions){
        args.extensions = args.extensions + ',' + defaults.extensions;
    }

    args.e = args.extensions = args.extensions.split(',');

    // index files
    if(args.index !== defaults.index){
        args.index = args.index + ',' + defaults.index;
    }

    args.i = args.index = args.index.split(',');

    // statusCode - statusCodeParameter
    if((args.statusCode - parseFloat(args.statusCode) + 1) >= 0){
        args.statusCodeParam = defaults.statusCodeParam;
    } else if(args.statusCode !== defaults.statusCodeParam && typeof args.statusCode === 'string'){
        args.statusCodeParam = args.statusCode;
        args.s = args.statusCode = null;
    } else {
        args.statusCodeParam = defaults.statusCodeParam;
        args.s = args.statusCode = null;
    }

    // timeout - timeoutParameter
    if((args.timeout - parseFloat(args.timeout) + 1) >= 0){
        args.timeoutParam = defaults.timeoutParam;
    } else if(args.timeout !== defaults.timeoutParam && typeof args.timeout === 'string'){
        args.timeoutParam = args.timeout;
        args.t = args.timeout = 0;
    } else {
        args.timeoutParam = defaults.timeoutParam;
        args.t = args.timeout = 0;
    }

    return true;
}

var config = require('yargs')
    .alias({
        c: 'config',
        d: 'dot',
        e: 'extensions',
        h: 'help',
        i: 'index',
        l: 'listing',
        //L: 'parse-less',
        n: 'notFound',
        p: 'port',
        r: 'root',
        s: 'statusCode',
        //S: 'parse-sass',
        t: 'timeout',
        v: 'version'
        //w: 'wizzard'
    })
    .describe({
        c: 'path to a configuration JSON file',
        d: 'show .dot (hidden) files',
        e: 'extensions for default index',
        h: 'display this help information',
        i: 'index file(s)',
        ip: 'IP address the server is bound to',
        l: 'show directory listings',
        //L: 'parse LESS files, default: true, use --no-parse-less to disable',
        n: 'custom 404 page',
        p: 'port number',
        r: 'document root',
        s: 'status code query string parameter or the global status (String|Number)',
        //S: 'parse SASS files',
        t: 'timeout query string parameter or the global timeout in milliseconds',
        v: 'display version information'
        //w: 'use startup wizzard'
    })
    .defaults({
        //'config': '',
        'dot': false,
        'extensions': 'html, htm, js',
        'index': 'index, default, main, app',
        'ip': 'localhost',
        'listing': true,
        //'parse-less': true,
        //'parse-sass': true,
        'notFound': '404',
        'port': 8080,
        'root': '/',
        'statusCode': 'magik-status',
        'timeout': 'magik-timeout'
        //'wizzard': false
    })
    .boolean([
        'dot',
        'listing'
        //'parse-less',
        //'parse-sass',
        //'wizzard'
    ])
    .string([
        'config',
        'extensions',
        'index',
        'ip',
        'notFound',
        'root',
        'statusCode'
    ])
    .config('c')
    .check(validate)
    .wrap(80)
    .strict()
    .usage('\nUsage:\n  $0 [options]\n')
    .version('', 'v')
    .help('h', 'display this help information')
    .showHelpOnFail(false, 'Specify --help for available options')
    .showHelp(function(){
        console.log(versionString);
    })
    .example('magik-server -p 8090', 'start the server on port 8090')
    .example('magik-server -r app -i my-app.html', 'set the document root and index page')
    .example('magik-server --ip 192.168.0.15', 'set the IP address of the server')
    .example('magik-server --listing false', 'boolean option')
    .example('magik-server --no-listing', 'Or negate boolean option')
    .requiresArg([
        'extensions',
        'index',
        'ip',
        'notFound',
        'port',
        'root',
        'statusCode',
        'timeout'
    ])
    .argv;

module.exports = config;


