
'use strict';


const engineAsserts = require('../../src');

const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/exampleDb2', function (err, _db) {
    if (err) {
        throw new Error(err);
    }

    // engineAsserts._dbVersion = 1;

    engineAsserts.checkMongoVersion(_db, false);

});
