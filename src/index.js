
'use strict';

const EngineAsserts = require('./engineAsserts');

const newEngineAsserts = function (cfg) {
    return new EngineAsserts(cfg);
};

module.exports = newEngineAsserts;

