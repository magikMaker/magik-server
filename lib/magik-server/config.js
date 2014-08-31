/**
 * configuration options, prompts the user for settings
 */
var path = require('path'),
    pkg = require(path.resolve(__dirname, '../../package.json')),
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

    // show directories?
    if(args.D === true){
        args.dirs = false
    }

    // extensions
    if(args.extensions !== defaults.extensions){
        args.extensions = args.extensions + ',' + defaults.extensions;
    }

    args.e = args.extensions = args.extensions.split(',').map(function(value){
       return value.trim();
    });

    // index files
    if(false !== args.index){

        if(args.index !== defaults.index){
            args.index = args.index + ',' + defaults.index;
        }

        args.i = args.index = args.index.split(',').map(function(value){
            return value.trim();
        });
    }

    // make sure port number is an integer and between 1 and 65535 (included)
    args.p = args.port = parseInt(args.p, 10);

    if(args.p < 1 || args.p > 65535){
        args.p = args.port = 8080;
    }

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

    // response time - respone timeParameter
    if((args.time - parseFloat(args.time) + 1) >= 0){
        args.timeParam = defaults.timeParam;
    } else if(args.time !== defaults.timeParam && typeof args.time === 'string'){
        args.timeParam = args.time;
        args.t = args.time = 0;
    } else {
        args.timeParam = defaults.timeParam;
        args.t = args.time = 0;
    }

    return true;
}

var config = require('yargs')
    .alias({
        a: 'address',
        c: 'config',
        //C: 'no-coffee',
        D: 'no-dirs',
        e: 'extensions',
        h: 'help',
        H: 'hidden',
        i: 'index',
        //J: 'no-jade',
        //l: 'log'
        //L: 'no-less',
        n: 'notFound',
        o: 'open',
        p: 'port',
        r: 'root',
        s: 'statusCode',
        //S: 'no-sass',
        t: 'time',
        u: 'encoding',
        v: 'version'
        //w: 'wizzard'
        //Y: 'no-stylus'
    })
    .describe({
        a: 'IP address the server is bound to',
        // auth: 'basic http authentication <user:password>',
        //c: 'path to a configuration JSON file',
        cors: 'enable CORS headers in the response',
        dirs: 'show directory listing',
        D: 'Do not show directory listings',
        e: 'extensions for default index',
        h: 'display this help information',
        H: 'show .dot (hidden) files',
        i: 'index file(s)',
        //L: 'parse LESS files, default: true, use --no-parse-less to disable',
        //livereload: 'add livereload js code to index pages',
        n: 'custom 404 page',
        'no-hidden': 'don\'t show hidden files',
        //'no-index': 'do not show the index page',
        o: 'open the default browser after the server starts',
        p: 'port number',
        r: 'document root',
        s: 'status code query string parameter or the global status (String|Number)',
        //S: 'do not parse SASS files',
        t: 'response time query string parameter or the global response time in milliseconds',
        u: 'file encoding',
        v: 'display version information'
        //w: 'use startup wizzard'
    })
    .defaults({
        'address': 'localhost',
        //'auth': '',
        'cors': false,
        'dirs': true,
        'encoding': 'utf8',
        'extensions': 'html, htm, js',
        //'config': '',
        'hidden': false,
        'index': 'index, default, main, app',
        //'livereload': false,
        //'no-less': true,
        //'no-sass': true,
        'notFound': '404',
        'no-dirs': false,
        'no-hidden': true,
        'open': false,
        'port': 8080,
        'root': '/',
        'statusCode': 'magik-status',
        'time': 'magik-time'
        //'wizzard': false
    })
    .boolean([
        'cors',
        //'livereload',
        //'no-coffee',
        'hidden',
        'no-dirs',
        //'no-index',
        //'no-jade',
        //'no-less',
        //'no-sass',
        //'no-stylus',
        //'wizzard'
    ])
    .string([
        'address',
        'config',
        'encoding',
        'extensions',
        'index',
        'notFound',
        'open',
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
        'encoding',
        'extensions',
        //'index',
        'ip',
        'notFound',
        'port',
        'root',
        'statusCode',
        'time'
    ])
    .argv;

module.exports = config;
