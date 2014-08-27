# magik-server

> a simple HTTP server that supports all request methods.


## Getting Started

Install the module with: `npm install -g magik-server`

```sh
$ npm install -g magik-server
$ magik-server --version
$ magik-server --help
```


## Documentation

Command line options:

+ `-d --dot       `Show .dot files (hidden files) in directory listings, defaults to false
+ `-h --help       `show help text
+ `-i --index      `The index file(s) to use, default searches for index.html,
                   index.htm, index.js, default.html, default.html, default.js,
                   app.html, app.htm, app.js. One file or a comma delimited list
+ `   --ip         `specify the IP address the server is bound to
+ `-l --listing    `Show directory listing when no suitable file is found, default: true
+ `-n --not-found  `custom 404 page, defaults to 404.html (.htm, .js) in document root
+ `-p --port       `specify port number, defaults to 8080
+ `-r --root       `supply the document root, defaults to project root
+ `-v --version    `show version number
+ `-t --timeout    `Set the timeout query string parameter, defaults to magik-timeout


## Examples

Show help info:
```shell
magik-server -h
```

Show help info for a specific command
```sh
magik-server -d -h

magik-server -dh

magik-server --dot --help
```

Start the server on port 8080 of localhost
```sh
magik-server
```

Start the server on port 8090, set the document root to the app folder and set index to my-app.html
```sh
magik-server -p 8090 -r app -i my-app.html
```

Set the timeout query string parameter to a custom value:
```sh
magik-server -t my-timeout-value
```
Now you can make requests that will honour your timeout value (in ms):
http://localhost:8080/slow-server-response.html?my-timeout-value=3000

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 Bjørn Wikkeling http://bjorn.wikkeling.com/
Licensed under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
