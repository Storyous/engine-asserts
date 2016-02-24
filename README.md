# Engine Asserts

Simple nodejs module that allow you to verify if enviroment version of node/mongodb matches version specified in your package.json/.nvmrc

### Installation
As expected, you can install via npm:
```bash
$ npm install engine-asserts
```

### Example Usage
insert following code in your package.json  .nvmrc

```js

//package.json
...
{
  "engines": {
    "node": "1.0.0",
    "mongodb": "3.2.1"
  }
}
...

// or .nvmrc
5.5.0

```
You can then use in your Node apps:
```js
//your app.js

/**
 *
 * @param {Object} [cfg]
 * @param {Boolean} [cfg.consoleDisabled]       disable console output (default: false)
 * @param {String} [cfg.rootPath]               path to package.jsn & .nvmrc directory (default: process.cwd())
 */
var engineAsserts = require('engine-asserts')(cfg);


/**
 *
 * @param {Boolean} justWarn            true - displays error output in console
 *										false - displays error output in console and  * @returns {Boolean}
 */
engineAsserts.checkNodeVersion(justWarn);


/**
 *
 * @param {Boolean} justWarn            true - displays error output in console ,
 *										false - displays error output in console and exits process
 * @returns {Q.Promise}
 */
engineAsserts.checkMongoVersion(justWarn);



```

### You can run tests:

```bash
$ npm run test
```


