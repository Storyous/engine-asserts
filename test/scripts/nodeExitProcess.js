
'use strict';


const EngineAsserts = require('../../src/engineAsserts');

const engineAsserts = new EngineAsserts({ consoleDisabled: true });
engineAsserts._isTest = true;
engineAsserts.nodeVersion = '1.0.0';
engineAsserts._getEnvironmentNodeVersion = () => {
    return '2.0.0';
};

engineAsserts.checkNodeVersion(false);
