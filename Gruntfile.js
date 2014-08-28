module.exports = function(grunt) {

    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            scripts: {
                files: 'lib/**/*.js',
                tasks: ['jshint'],
                options: {
                    interrupt: true,
                }
            }
        },
        jasmine_node: {
            coverage: {},
            options: {
                forceExit: true,
                match: '.',
                matchall: false,
                extensions: 'js',
                specNameMatcher: 'spec',
                jUnit: {
                    report: true,
                    savePath : "./build/reports/jasmine/",
                    useDotNotation: true,
                    consolidate: true
                }
            },
            all: ['test/spec/**/*.spec.js']
        }
    });

    // Default task(s).
    //grunt.registerTask('default', ['watch']);
    //grunt.task.registerTask('default', ['clean', 'jshint']);

    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-jasmine-node-coverage');
    grunt.registerTask('default', ['jasmine_node']);
};


