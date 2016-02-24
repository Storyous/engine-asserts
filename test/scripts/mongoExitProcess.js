
'use strict';


const MongoClient = require('mongodb').MongoClient;
const Q = require('q');

const EngineAsserts = require('../../src/engineAsserts');


MongoClient.connect('mongodb://127.0.0.1:27017/exampleDb2', function (err, _db) {
    if (err) {
        throw new Error(err);
    }
    const engineAsserts = new EngineAsserts({ consoleDisabled: true });
    engineAsserts.dbVersion = '1.0.0';
    engineAsserts._getEnvironmentMongoVersion = () => {
        return Q.when({ version: '2.0.0' });
    };


    engineAsserts.checkMongoVersion(_db, false);

});
