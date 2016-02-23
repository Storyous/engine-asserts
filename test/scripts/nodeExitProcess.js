
'use strict';


const EngineAsserts = require('../../src/engineAsserts');

const engineAsserts = new EngineAsserts(true);
engineAsserts.nodeVersion = '1';
engineAsserts._getEnvironmentNodeVersion = () => {
    return '2';
};
engineAsserts.checkNodeVersion(false);
