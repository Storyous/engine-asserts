/**
 * Created by vojtechmalek on 22/2/16.
 */

'use strict';

const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const assert = require('assert');
const before = mocha.before;
const MongoClient = require('mongodb').MongoClient;
const EngineAsserts = require('../src/engineAsserts');
const engineAsserts = require('../src')({ consoleDisabled: true });
const childProcess = require('child_process');
const Q = require('q');
const path = require('path');
/**
 *
 * @param {String} [envVersion]
 * @param {String} [packVersion]
 * @returns {EngineAsserts}
 */
const forceMongoVersions = (envVersion, packVersion) => {

    const newEngineAsserts = new EngineAsserts({ consoleDisabled: true });

    newEngineAsserts.dbVersion = packVersion;
    newEngineAsserts._getEnvironmentMongoVersion = () => {
        return Q.when({ version: envVersion });
    };

    return newEngineAsserts;

};


/**
 *
 * @param {String} [envVersion]
 * @param {String} [packVersion]
 * @returns {EngineAsserts}
 */
const forceNodeVersions = (envVersion, packVersion) => {

    const newEngineAsserts = new EngineAsserts({ consoleDisabled: true });

    newEngineAsserts.nodeVersion = packVersion;
    newEngineAsserts._getEnvironmentNodeVersion = () => {
        return envVersion;
    };

    return newEngineAsserts;
};

describe('engine asserts', () => {

    let db;


    before(function (done) {
        MongoClient.connect('mongodb://127.0.0.1:27017/exampleDb', function (err, _db) {
            if (err) {
                throw new Error(err);
            }

            db = _db;
            done();
        });
    });


    describe('Check version filler', () => {

        it('Should get node version from .nvmrc and mongo verion from package.json', () => {

            const defProcess = Q.defer();
            const filepath = path.join(process.cwd(), 'test/scripts/filler1.js');

            childProcess.execFile(process.execPath, [filepath], function (error, stdout) {
                defProcess.resolve(stdout);
            });

            return defProcess.promise
                .then(function (stdout) {
                    assert.ok(
                        stdout.indexOf(engineAsserts.SUCCESS_MONGO_LOADED_MSG) >= 0 &&
                        stdout.indexOf(engineAsserts.SUCCESS_NVMRC_NODE_LOADED_MSG) >= 0
                    );
                });

        });

        it('Should return error message that .nvmrc and package.json is missing', () => {

            const defProcess = Q.defer();
            const filepath = path.join(process.cwd(), 'test/scripts/filler2.js');

            childProcess.execFile(process.execPath, [filepath], function (error, stdout, stderr) {
                defProcess.resolve(stderr);
            });

            return defProcess.promise
                .then(function (stderr) {
                    assert.ok(stderr.indexOf(engineAsserts.ERROR_PACKAGE_NVMRC_MISSING_MSG) >= 0);
                });

        });

        it('Should return message that node and mongo is loaded form package.json', () => {

            const defProcess = Q.defer();
            const filepath = path.join(process.cwd(), 'test/scripts/filler3.js');

            childProcess.execFile(process.execPath, [filepath], function (error, stdout) {
                defProcess.resolve(stdout);
            });

            return defProcess.promise
                .then(function (stdout) {
                    assert.ok(
                        stdout.indexOf(engineAsserts.SUCCESS_PACKAGE_NODE_LOADED_MSG) >= 0 &&
                        stdout.indexOf(engineAsserts.SUCCESS_MONGO_LOADED_MSG) >= 0
                    );
                });

        });

        it('Should return error message that node version is not loaded', () => {

            const defProcess = Q.defer();
            const filepath = path.join(process.cwd(), 'test/scripts/filler4.js');

            childProcess.execFile(process.execPath, [filepath], function (error, stdout, stderr) {
                defProcess.resolve(stderr);
            });

            return defProcess.promise
                .then(function (stderr) {
                    assert.ok(stderr.indexOf(engineAsserts.ERROR_NODE_LOADED_MSG) >= 0);
                });

        });

    });


    describe('Check semantic version comparison', () => {

        it('Version 1.2.3 should matches  1.x || >=2.5.0 || 5.0.0 - 7.2.3', () => {
            const newEngineAsserts = forceNodeVersions('1.2.3', '1.x || >=2.5.0 || 5.0.0 - 7.2.3');
            assert.equal(newEngineAsserts.checkNodeVersion(true), true);
        });

        it('Version 2.3.0 should not matches  1.x || >=2.5.0 || 5.0.0 - 7.2.3', () => {
            const newEngineAsserts = forceNodeVersions('2.3.0', '1.x || >=2.5.0 || 5.0.0 - 7.2.3');
            assert.equal(newEngineAsserts.checkNodeVersion(true), false);
        });
    });

    describe('Check Node version', () => {

        it('Should return true. Version matches. [ justWarn === true ]', () => {
            const newEngineAsserts = forceNodeVersions('1.0.0', '1.0.0');
            assert.equal(newEngineAsserts.checkNodeVersion(true), true);
        });

        it('Should return true. Version matches. [ justWarn === false ]', () => {
            const newEngineAsserts = forceNodeVersions('1.0.0', '1.0.0');
            assert.equal(newEngineAsserts.checkNodeVersion(false), true);
        });

        it('Should return true. Version does not match [ justWarn === true ]', () => {
            const newEngineAsserts = forceNodeVersions('1.0.0', '2.0.0');
            assert.equal(newEngineAsserts.checkNodeVersion(true), false);
        });


        it('Should return code: ' + engineAsserts.WARN_FALSE_ERROR_CODE + '. Version does not match [ justWarn === false ]', () => {

            const defProcess = Q.defer();
            const filepath = path.join(process.cwd(), 'test/scripts/nodeExitProcess.js');

            childProcess.execFile(process.execPath, [filepath], function (error) {

                if (error) {
                    return defProcess.resolve(error);
                }

                defProcess.reject('Process must exits with code > 0');
            });

            return defProcess.promise
                .then(function (err) {

                    if (err.code) {
                        return assert.equal(err.code, engineAsserts.WARN_FALSE_ERROR_CODE, 'Wrong Exit code!');
                    }

                    throw new Error(err);
                })
                .catch(function (err) {
                    assert(false, err);
                });

        });
    });


    describe('Check Mongo versions', () => {

        it('Should return code: ' + engineAsserts.SUCCESS_CODE + '. Version matches [ justWarn === true ]', () => {
            const newEngineAsserts = forceMongoVersions('1.0.0', '1.0.0');
            return newEngineAsserts.checkMongoVersion(db, true)
                .then(function (code) {
                    assert.equal(code, newEngineAsserts.SUCCESS_CODE);
                });
        });

        it('Should return code: ' + engineAsserts.SUCCESS_CODE + '. Version matches [ justWarn === false ]', () => {
            const newEngineAsserts = forceMongoVersions('1.0.0', '1.0.0');
            return newEngineAsserts.checkMongoVersion(db, false)
                .then(function (code) {
                    assert.equal(code, newEngineAsserts.SUCCESS_CODE);
                });
        });


        it('Should return code: ' + engineAsserts.WARN_FALSE_ERROR_CODE + '. Version does not match [ justWarn === false ]', () => {

            const defProcess = Q.defer();
            const filePath = path.join(process.cwd(), 'test/scripts/mongoExitProcess.js');

            childProcess.execFile(process.execPath, [filePath], function (error) {

                if (error) {
                    return defProcess.resolve(error);
                }

                defProcess.reject('Process must exits with code > 0');
            });

            return defProcess.promise
                .then(function (err) {
                    if (err.code) {
                        return assert.equal(err.code, engineAsserts.WARN_FALSE_ERROR_CODE, 'Wrong Exit code!');
                    }

                    throw new Error(err);
                })
                .catch(function (err) {
                    assert(false, err);
                });

        });


        it('Should return code ' + engineAsserts.WARN_TRUE_ERROR_CODE + '. Version does not match [ justWarn === true ]', () => {

            const newEngineAsserts = forceMongoVersions('1.0.0', '2.0.0');

            return newEngineAsserts.checkMongoVersion(db, true)
                .then(function (res) {
                    assert.ok(res, 'should return exception!');
                })
                .catch(function (code) {
                    assert.ok(code);
                    assert.equal(code, newEngineAsserts.WARN_TRUE_ERROR_CODE, 'Wrong exit code!');
                });

        });

    });

});
