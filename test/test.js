/**
 * Created by vojtechmalek on 22/2/16.
 */

'use strict';

const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const assert = require('assert');
const before = mocha.before;
const after = mocha.after;
const MongoClient = require('mongodb').MongoClient;
const engineAsserts = require('../src');
const EngineAsserts = require('../src/engineAsserts');
const childProcess = require('child_process');
const Q = require('q');
const path = require('path');

/**
 *
 * @param {Boolean} areSame
 * @returns {EngineAsserts}
 */
const forceMongoVersions = (areSame) => {
    const packageVersion = '1';
    const envVersion = areSame ? '1' : '2';
    const newEngineAsserts = new EngineAsserts(true);

    newEngineAsserts.dbVersion = packageVersion;
    newEngineAsserts._getEnvironmentMongoVersion = () => {
        return Q.when({ version: envVersion });
    };

    return newEngineAsserts;

};

/**
 *
 * @param {Boolean} areSame
 * @returns {EngineAsserts}
 */
const forceNodeVersions = (areSame) => {
    const packageVersion = '1';
    const envVersion = areSame ? '1' : '2';
    const newEngineAsserts = new EngineAsserts(true);

    newEngineAsserts.nodeVersion = packageVersion;
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

    describe('Check Node version', () => {

        it('Should return true. Version matches. [ justWarn === true ]', () => {
            const newEngineAsserts = forceNodeVersions(true);
            assert.equal(newEngineAsserts.checkNodeVersion(true), true);
        });

        it('Should return true. Version matches. [ justWarn === false ]', () => {
            const newEngineAsserts = forceNodeVersions(true);
            assert.equal(newEngineAsserts.checkNodeVersion(false), true);
        });

        it('Should return true. Version does not match [ justWarn === true ]', () => {
            const newEngineAsserts = forceNodeVersions(false);
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
            const newEngineAsserts = forceMongoVersions(true);
            return newEngineAsserts.checkMongoVersion(db, true)
                .then(function (code) {
                    assert.equal(code, newEngineAsserts.SUCCESS_CODE);
                });
        });

        it('Should return code: ' + engineAsserts.SUCCESS_CODE + '. Version matches [ justWarn === false ]', () => {
            const newEngineAsserts = forceMongoVersions(true);
            return newEngineAsserts.checkMongoVersion(db, false)
                .then(function (code) {
                    assert.equal(code, newEngineAsserts.SUCCESS_CODE);
                });
        });


        it('Should return code: ' + engineAsserts.WARN_FALSE_ERROR_CODE + '. Version does not match [ justWarn === false ]', () => {

            const defProcess = Q.defer();
            const filepath = path.join(process.cwd(), 'test/scripts/mongoExitProcess.js');

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


        it('Should return code ' + engineAsserts.WARN_TRUE_ERROR_CODE + '. Version does not match [ justWarn === true ]', () => {

            const newEngineAsserts = new EngineAsserts(true);
            newEngineAsserts.dbVersion = '1.0.0';
            newEngineAsserts._getEnvironmentMongoVersion = () => {
                return Q.when({ version: '2.0.0' });
            };

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
