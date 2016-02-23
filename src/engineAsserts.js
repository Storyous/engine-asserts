/**
 * Created by vojtechmalek on 16/02/16.
 */

'use strict';
/* eslint no-console: 0 */

const mongodb = require('mongodb');
const Q = require('q');
const path = require('path');
const fs = require('fs');

class EngineAsserts {

    constructor () {

        let packagejson;
        const filePath = path.join(process.cwd(), 'package.json');

        try {
            packagejson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
            console.error('Package.json in your project is missing!');
            return;
        }

        if (!packagejson.engines) {
            console.error('engines property is not declared!');
            return;
        }

        if (!packagejson.engines.node) {
            console.error('"engines.node" is not declared in package.json!');
            return;
        }

        if (!packagejson.engines.mongodb) {
            console.error('"engines.mongodb" is not declared in package.json!');
            return;
        }

        this.SUCCESS_CODE = 30;
        this.WARN_TRUE_ERROR_CODE = 40;
        this.WARN_FALSE_ERROR_CODE = 50;

        this.nodeVersion = packagejson.engines.node;
        this.dbVersion = packagejson.engines.mongodb;

    }

    /**
     *
     * @param {Boolean} justWarn
     */
    checkNodeVersion (justWarn) {

        const req = /v/g;

        let version = this._getEnvironmentNodeVersion();
        let nodeVersion = this.nodeVersion;

        nodeVersion = nodeVersion.replace(req, '');
        version = version.replace(req, '');

        const versionMatches = version === nodeVersion;

        if (versionMatches) {
            return true;
        }

        const versionErrorMessage = '' +
            '\n==============================' +
            '\n Package.json Node Version:   ' + this.nodeVersion +
            '\n Enviroment Node Version:     ' + version +
            '\n==============================';

        if (!justWarn) {
            console.error(versionErrorMessage);
            process.exit(this.WARN_FALSE_ERROR_CODE);
            return false;
        }

        console.warn(versionErrorMessage);
        return false;

    }


    /**
     * @param {mongodb.Db} db
     * @param {Boolean} justWarn
     * @returns {Q.Promise.<String>}
     */
    checkMongoVersion (db, justWarn) {

        const dbPromise = Q.defer();

        if (!db instanceof mongodb.Db) {
            dbPromise.reject('db is not instance of Mongodb.Db');
        }

        this._getEnvironmentMongoVersion(db)
            .then((info) => {
                const version = info.version;
                const versionMatches = this.dbVersion === version;

                if (versionMatches) {
                    dbPromise.resolve(this.SUCCESS_CODE);
                    return;
                }

                const versionErrorMessage = '' +
                   '\n==============================' +
                   '\n Package.json DB Version:   ' + this.dbVersion +
                   '\n Enviroment DB Version:     ' + version +
                   '\n==============================';

                if (!justWarn) {
                    console.error(versionErrorMessage);
                    process.exit(this.WARN_FALSE_ERROR_CODE);
                    return;
                }

                console.warn(versionErrorMessage);
                dbPromise.reject(this.WARN_TRUE_ERROR_CODE);

            })
            .catch(function (err) {
                dbPromise.reject(err);
            });

        return dbPromise.promise;
    }

    /**
     *
     * @param {mongodb.Db} db
     * @returns {Q.Promise}
     * @private
     */
    _getEnvironmentMongoVersion (db) {

        const def = Q.defer();
        const admin = new mongodb.Admin(db);

        admin.serverStatus(def.makeNodeResolver());

        return def.promise;
    }

    /**
     *
     * @returns {String}
     * @private
     */
    _getEnvironmentNodeVersion () {
        return process.version;
    }


}

module.exports = EngineAsserts;
