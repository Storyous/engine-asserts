
'use strict';


const engineAsserts = require('../../src');

engineAsserts.nodeVersion = '1.0.0';
engineAsserts._getEnvironmentNodeVersion = () => {
    return '2.0.0';
};
engineAsserts.checkNodeVersion(false);
