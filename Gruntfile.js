/**
 * Created by vojtechmalek on 16/02/16.
 */

'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            server: {
                files: {
                    src: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
                },
                options: {
                    config: './.eslintrc'
                }
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    captureFile: 'coverage/testResults.txt', // Optionally capture the reporter output to a file
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['test/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-eslint');

};
