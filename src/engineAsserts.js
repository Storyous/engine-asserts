/**
 * Created by vojtechmalek on 22/02/16.
 */

'use strict';
/* eslint no-console: 0 */

const mongodb = require('mongodb');
const Q = require('q');
const path = require('path');
const fs = require('fs');
const semver = require('semver');

const Logger = require('./logger');

class EngineAsserts {

    constructor (disableConsole) {

        this.SUCCESS_CODE = 30;
        this.WARN_TRUE_ERROR_CODE = 40;
        this.WARN_FALSE_ERROR_CODE = 50;
        this.nodeVersion = null;
        this.dbVersion = null;

        this._log = new Logger(disableConsole);

        this._fillVersions();

    }


    _fillVersions (dirPath) {
        if (!dirPath) {
            dirPath = process.cwd();
        }

        let packageJson;
        let nvmrc;

        const packageJsonPath = path.join(dirPath, 'package.json');
        const nvmrcPath = path.join(dirPath, '.nvmrc');

        try {
            nvmrc = fs.readFileSync(nvmrcPath, 'utf8').trim();
        } catch (err) {
            // error suppressed
        }

        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        } catch (err) {
            this._log.error('Neither Package.json nor nvmrc files are missing!');
            return;
        }

        if (nvmrc && semver.valid(nvmrc)) {
            this.nodeVersion = nvmrc;
            this._log.info('Version of Node loaded from .nvmrc');

        } else if (packageJson.engines && packageJson.engines.node && semver.valid(packageJson.engines.node)) {
            this.nodeVersion = packageJson.engines.node;
            this._log.info('Version of Node loaded from Package.json');

        } else {
            this._log.info('Version of Node loaded from Package.json');
            return;
        }

        if (packageJson.engines && packageJson.engines.mongodb && semver.valid(packageJson.engines.mongodb)) {
            this.dbVersion = packageJson.engines.mongodb;
            this._log.info('Version of Mongodb loaded from Package.json');
        }
    }

    /**
     *
     * @param {Boolean} justWarn
     */
    checkNodeVersion (justWarn) {

        const envVersion = this._getEnvironmentNodeVersion();
        const packVersion = this.nodeVersion;

        if (semver.satisfies(envVersion, packVersion)) {
            return true;
        }

        const versionErrorMessage = this._errorMessage('Node', envVersion, packVersion);

        if (!justWarn) {
            this._log.error(versionErrorMessage);
            process.exit(this.WARN_FALSE_ERROR_CODE);
        }

        this._log.warn(versionErrorMessage);
        return false;

    }


    /**
     * @param {mongodb.Db} db
     * @param {Boolean} justWarn
     * @returns {Q.Promise.<String>}
     */
    checkMongoVersion (db, justWarn) {

        const dbPromise = Q.defer();

        if (!this.dbVersion) {
            dbPromise.reject('dbVersion is missing! Please declare it in "engines.mongodb" in package.json!');
        }

        if (!db instanceof mongodb.Db) {
            dbPromise.reject('db is not instance of Mongodb.Db');
        }

        this._getEnvironmentMongoVersion(db)
            .then((info) => {
                const envVersion = info.version;
                const packVersion = this.dbVersion;


                if (semver.satisfies(envVersion, packVersion)) {
                    dbPromise.resolve(this.SUCCESS_CODE);
                    return;
                }

                const versionErrorMessage = this._errorMessage('DB', envVersion, packVersion);

                if (!justWarn) {
                    this._log.error(versionErrorMessage);
                    process.exit(this.WARN_FALSE_ERROR_CODE);
                }

                this._log.warn(versionErrorMessage);
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
        return semver.clean(process.version);
    }


    /**
     *
     * @param {String} type
     * @param {String} envVersion
     * @param {String} packageJsonVersion
     * @private
     */
    _errorMessage (type, envVersion, packageJsonVersion) {

        return '\n' +
               '\n' + type + ' Versions Don\'t Match ' +
               '\n==================================' +
               '\n Package.json Version:   ' + packageJsonVersion +
               '\n Enviroment Version:     ' + envVersion +
               '\n==================================';
    }


}

module.exports = EngineAsserts;
