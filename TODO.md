# ToDo

- [x] document root, if not provided should be start of executions
- [ ] redirect when no `/` in pathName? (create-server.js::handleDirectoryRequest())
- [ ] double check all command line switches
- [ ] add icons to directory listing
- [ ] add parsers again (see older version 0.0.17)
- [ ] large files 1000MB break the code (ERR_STRING_TOO_LONG)
```shell
    node:buffer:836
      return this.utf8Slice(0, this.length);
                  ^

    Error: Cannot create a string longer than 0x1fffffe8 characters
    at Buffer.toString (node:buffer:836:17)
    at Timeout._onTimeout (file:///xxx/magik-server/dist/cli/index.js:5530:66)
    at listOnTimeout (node:internal/timers:594:17)
    at process.processTimers (node:internal/timers:529:7) {
    code: 'ERR_STRING_TOO_LONG'
    }
```
