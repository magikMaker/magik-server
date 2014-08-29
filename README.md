# magik-server

> a simple HTTP server with some nice magik.


## Getting Started

Install the module and start the server:

```sh
$ npm install -g magik-server
$ magik-server
```

![magikServer](http://s22.postimg.org/kde5c9mcx/magik_Server.png)

## Documentation
To display all comman line options use the `-h` or `--help` switch

```sh
$ magik-server --help
```

Command line options:

| shorthand | command         | description
| --------- | --------------- | -------------------------------------------------------------------------- |
| -d        | --dot           | Show .dot files (hidden files) in directory listings, defaults to false    |
| -e        | --extensions    | The extensions to use for the default index page, default: html, htm, js   |
| -h        | --help          | show help text                                                             |
| -i        | --index         | The index file(s) to use, default searches for index, default, main and app with the extensions html, htm and js. One file or a comma delimited list |
|           | --ip            | specify the IP address the server is bound to, default: localhost          |
| -l        | --listing       | Show directory listing when no suitable file is found, default: true       |
| -L        | --disable-less  | disable parsing of LESS files, default false                               |
| -n        | --not-found     | custom 404 page, defaults to 404.html (.htm, .js) in document root         |
| -p        | --port          | specify port number, defaults to 8080                                      |
| -r        | --root          | supply the document root, defaults to project root                         |
| -s        | --status-code   | Set the status code query string parameter or the global status code by supplying it , default: magik-status |
| -S        | --disable-sass  | disable parsing of SASS files, default: false                              |
| -t        | --timeout       | Set the timeout query string parameter or the global timeout in milliseconds, default: magik-timeout / 0 |
| -v        | --version       | show version number                                                        |
| -w        | --wizzard       | the startup wizzard will guide you through all available options           |


## Examples

Start the server on localhost on port 8080

```shell
magik-server
```
<!--
Start the server using a wizzard to set all available options:

```shell
magik-server -w

# or in long form

magik-server --wizzard
```
-->

Show help info:

```shell
magik-server -h

# or in long form

magik-server --help
```

Start the server on port 8090, set the document root to the app folder and set index to my-app.html

```shell
magik-server -p 8090 -r app -i my-app.html

# or in long form

magik-server --port 8090 --root app --index my-app.html
```

Set the response time query string parameter to a custom value, so you can make
requests that will honour your time value (in ms):
default: `magik-timout`
http://localhost:8080/slow-server-response.html?wait=3000

```shell
magik-server -t wait

# or in long form

magik-server --timeout wait
```

You can also set a global timeout for all requests by supplying an integer value

```shell
magik-server -t 2000

# or in long form

magik-server --timeout 2000
```

Set a custom HTTP response code query string parameter so it can be used in requests:
default: `magik-status`
http://localhost:8080/rest-service.json?status=201

```shell
magik-server -s status

# or in long form

magik-server --status status
```

You can also set a global response status code that will always be returned

```shell
magik-server -s 202

# or in long form

magik-server --status 202
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
