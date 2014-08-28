// var basePath = process.env.PWD;

/*jshint node: true */
var path = require('path'),
    root = process.env.PWD;

module.exports = {
    main: {
        options:{
            jshintrc: path.resolve(root, '.jshintrc'),
            reporter: require('jshint-stylish')
        },
        src: ['<%= cfg.srcFolder%>/**/*.js']
    },
    test: {
        options: {
            globals: {
                define: true,
                module: true,
                angular: true,
                describe: false,
                expect: false,
                it: false,
                before: false,
                beforeEach: false,
                inject: false,
                spyOn: false,
                after: false,
                afterEach: false
            }
        },
        src: ['test']
    }
};
