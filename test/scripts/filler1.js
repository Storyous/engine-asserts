
'use strict';
const path = require('path');
const EngineAsserts = require('../../src/engineAsserts');

new EngineAsserts({ rootPath: path.join(path.resolve(__dirname, '../'), 'assets/1') });
