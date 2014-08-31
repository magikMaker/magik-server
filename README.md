# magik-server

> a simple HTTP server with some nice magik.


## Getting Started

Install the package (globally) and start the server:

```sh
$ npm install -g magik-server
$ magik-server
```

![magikServer](http://s22.postimg.org/kde5c9mcx/magik_Server.png)

# About
magik-server is a small webserver that is intended for use during the development
of front-end web applications and websites. There are quite a few configuration options
that can be set using command line switches, see below.

# Documentation

To display all command line options use the `-h` or `--help` switch

```sh
$ magik-server --help
```

# Command line options

## `-a` `--address`
#### IP Address
Set the IP address the server is bound to. Default: localhost

```sh
$ magik-server -a 10.1.1.10
```

### `--cors`
#### CORS Headers
Enable sending of CORS headers.

```sh
$ magik-server --cors
```

### `-D` `--no-dirs`
#### no directory listing
Disable directory listing. By default, when no suitable file is found to serve, a directory listing will be displayed.

```sh
$ magik-server -D
```

## `-e` `--extensions`
#### extension for the default index
Adds one or more extensions to use to look up the default index page. By default magikServer looks for: `html, htm, js`.

```sh
# add one extension
$ magik-server -e coffee

# add more than one extension
$ magik-server -e coffee, jade, styl
```

## `-h` `--help`
Displays a list of all available command line options

## `-H` `--hidden` show hidden files
Enables the display of hidden files. By default, files starting with a dot are
hidden in directory listings, use this switch to show them.

## `-i` `--index` index file(s)
Adds one or more files that will be used as an index page. By default magikServer
looks for files with these names in the document root, `index, default, main, app`.
More files can be added as a comma delimeted list:

```shell
$ magik-server -i my-index, my-app, my-other-index
```

## `-n` `--not-found` custom 404 page
Adds the path to a custom 404 page. This path is relative to the document root.

```sh
$ magik-server -n error-pages/404.html
```

## `-o` `--open` open browser
Automagically open the standard system web browser, after the server has started.

## `-p` `--port` port number
Sets the port number you wish to use for this server instance. If the port
number is already in use, the next available port will be automagically selectd.
Default port is 8080

```shell
$ magik-server -p 8090
```

## `-r` `--root` document root
Sets the document root. Files from this folder will be served as if they are on /
in the browser.

```shell
$ magik-server -r app
```

## <a name="switch-s"></a>`-s` `--statusCode` HTTP response status code
Sets the HTTP response code globally. Every response will have this status code. You may
also force response codes by using a [query string parameter](#query-string-parameters).
The default query string parameter is magik-status, but you can also change this
to any URL save string.

```sh
$ magik-server -s 201
$ magik-server -s my-status-param
```

## <a name="switch-t"></a>`-t` `--time` response time
Sets the response time globally in milliseconds. Every reponse will take (at least)
this amount of time. You may also force response times by using a
[query string parameter](#query-string-parameters). The default query string
parameter is magik-time, but you can also change this to any URL save string.

```sh
$ magik-server -t 3000
$ magik-server -t my-time-param
```

## `-u` `--encoding` character encoding
Sets the default character encoding of the files served. This defaults to UTF-8
and usually doesn't have to be changed.

```sh
$ magik-server -u cp-1252
```

## `-v` `--version` version information
Displays version information of magik-server

```sh
$ magik-server -v
```

# <a name="query-string-parameters"></a> Query String Parameters
magikServer allows you to use query string parameters to change certain behaviours.
At this moment you can use these:

## `magik-status`
Sets the HTTP response status code for this request. That means, the response
is certain to have the supplied status code. You can also change the name of the
parameter during startup, using the `-s` switch. See also [`-s`](#switch-s)

## `magik-time`
Sets the response time for this request. That means that the response will wait
at least the supplied amount of milliseconds before it is send. You can also
change the name of the parameter during startup, using the `-t` switch.
See also [`-t`](#switch-t).

# Examples
Below you find a couple of commonly used ways to start up magik-server.

Start the server on localhost on port 8080

```shell
$ magik-server
```

Show help info:

```shell
$ magik-server -h

# or

$ magik-server --help
```

Start the server on port 8090, set the document root to the app folder and set index to my-app.html

```shell
$ magik-server -p 8090 -r app -i my-app.html

# or

$ magik-server --port 8090 --root app --index my-app.html
```

Set the [response time query string parameter](#query-string-parameters) to a
custom value, so you can make requests that will honour the set time value (in ms),
like this one:
`http://localhost:8080/slow-server-response.html?wait=3000`

```shell
$ magik-server -t wait
```

Set a custom HTTP response code [query string parameter](#query-string-parameters)
so it can be used in requests like this one:
`http://localhost:8080/rest-service.json?status=201`

```shell
$ magik-server -s status
```

You can also set a global response status code that will always be returned

```shell
magik-server -s 202
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 Bjørn Wikkeling <bjorn@wikkeling.com>
[bjorn.wikkeling.com](http://bjorn.wikkeling.com/)

Licensed under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                                  _  _     _____
                                 (_)| |   /  ___|
         _ __ ___    __ _   __ _  _ | | __\ `--.   ___  _ __ __   __  ___  _ __
        | '_ ` _ \  / _` | / _` || || |/ / `--. \ / _ \| '__|\ \ / / / _ \| '__|
        | | | | | || (_| || (_| || ||   < /\__/ /|  __/| |    \ V / |  __/| |
        |_| |_| |_| \__,_| \__, ||_||_|\_\\____/  \___||_|     \_/   \___||_|
                            __/ |
                           |___/

    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -