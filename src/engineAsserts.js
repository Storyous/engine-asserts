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

    /**
     *
     * @param {Object} [cfg]
     * @param {Boolean} [cfg.consoleDisabled]       disable console output (default: false)
     * @param {String} [cfg.rootPath]               path to package.jsn & .nvmrc directory (default: process.cwd())
     */
    constructor (cfg) {

        const logCfg = cfg && cfg.consoleDisabled ? cfg.consoleDisabled : null;
        const rootPath = cfg && cfg.rootPath ? cfg.rootPath : null;

        this.SUCCESS_MONGO_LOADED_MSG = 'Version of Mongodb loaded from Package.json';
        this.SUCCESS_PACKAGE_NODE_LOADED_MSG = 'Version of Node loaded from Package.json';
        this.SUCCESS_NVMRC_NODE_LOADED_MSG = 'Version of Node loaded from .nvmrc';
        this.ERROR_NODE_LOADED_MSG = 'Version of Node not loaded! Please declare it in "engines.node" in package.json or in .nvmrc';
        this.ERROR_PACKAGE_NVMRC_MISSING_MSG = 'Neither Package.json nor nvmrc files are missing or there is not node version specified!';

        this.SUCCESS_CODE = 30;
        this.WARN_TRUE_ERROR_CODE = 40;
        this.WARN_FALSE_ERROR_CODE = 50;
        this.nodeVersion = null;
        this.dbVersion = null;
        this._log = new Logger(logCfg);
        this._isTest = false;

        this._fillVersions(rootPath);

    }

    _isValidVersion (v) {
        return semver.valid(v) || semver.validRange(v);
    }

    /**
     *
     * @param {String} [rootPath]
     * @private
     */
    _fillVersions (rootPath) {

        if (!rootPath) {
            rootPath = process.cwd();
        }

        let packageJson;
        let nvmrc;

        const packageJsonPath = path.join(rootPath, 'package.json');
        const nvmrcPath = path.join(rootPath, '.nvmrc');

        try {
            nvmrc = fs.readFileSync(nvmrcPath, 'utf8').trim();
        } catch (err) {
            // error suppressed
        }

        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        } catch (err) {
            this._log.error(this.ERROR_PACKAGE_NVMRC_MISSING_MSG);
            return;
        }

        if (nvmrc && this._isValidVersion(nvmrc)) {
            this.nodeVersion = nvmrc;
            this._log.info(this.SUCCESS_NVMRC_NODE_LOADED_MSG);

        } else if (packageJson.engines && packageJson.engines.node && this._isValidVersion(packageJson.engines.node)) {
            this.nodeVersion = packageJson.engines.node;
            this._log.info(this.SUCCESS_PACKAGE_NODE_LOADED_MSG);

        } else {
            this._log.error(this.ERROR_NODE_LOADED_MSG);
            return;
        }

        if (packageJson.engines && packageJson.engines.mongodb  && this._isValidVersion(packageJson.engines.mongodb)) {
            this.dbVersion = packageJson.engines.mongodb;
            this._log.info(this.SUCCESS_MONGO_LOADED_MSG);
        }
    }

    /**
     *
     * @param {Boolean} justWarn
     * @returns {boolean}
     */
    checkNodeVersion (justWarn) {

        const envVersion = this._getEnvironmentNodeVersion();
        const packVersion = this.nodeVersion;

        if (semver.satisfies(envVersion, packVersion)) {
            return true;
        }

        const versionErrorMessage = this._errorMessage('Node', envVersion, packVersion);

        if (!justWarn) {
            if (!this._isTest) console.error(versionErrorMessage);
            process.exit(this.WARN_FALSE_ERROR_CODE);
        }

        if (!this._isTest) console.warn(versionErrorMessage);
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
                    if (!this._isTest) console.error(versionErrorMessage);
                    process.exit(this.WARN_FALSE_ERROR_CODE);
                }

                if (!this._isTest) console.warn(versionErrorMessage);
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
