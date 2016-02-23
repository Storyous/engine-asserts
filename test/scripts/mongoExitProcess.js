
'use strict';


const MongoClient = require('mongodb').MongoClient;
const Q = require('q');

const EngineAsserts = require('../../src');


MongoClient.connect('mongodb://127.0.0.1:27017/exampleDb2', function (err, _db) {
    if (err) {
        throw new Error(err);
    }

    EngineAsserts.dbVersion = 1;
    EngineAsserts._getEnvironmentMongoVersion = () => {
        return Q.when({ version: 2 });
    };

    EngineAsserts.checkMongoVersion(_db, false);

});
