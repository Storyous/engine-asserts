# PAY.JS Node

Customer part of storyous, which:

- communicates with POS
- maintains Merchant's data (Items, Desks, Invoices)
- holds Stocks
- manages Orders & Bills

## Table of Contents

  1. [Application architecture - Quattro Stagioni](#application-architecture-quattro-stagioni)
  1. [First run](#first-run)
  2. [Configuration](#configuration)
  3. [Project Structure](#project-structure)
  4. [Middleware](#middleware)
  5. [Frontend services](#frontend-services)
  6. [Backend services](#backend-services)
  7. [Common backend libraries](#common-backend-libraries)
  8. [Service structure](#service-structure)
  9. [Security](#security)
  10. [Testing and Docs](#testing-and-docs)

## Application architecture - Quattro Stagioni

```      
      |------------------------------|
 -> [http]           |               |
      | » HTTP KOA › |     QUEUE     |
       ------------- R ---------------
 -> [sock]           |       ^       |
      | » SOCKET    <‡> KOA S. ROUTE |
      |------------------------------|
```

- Four independent modules, able to run separately
    + **HTTP KOA**: runs HTTP APIs and delivers templates & assets
    + **QUEUE**: runs background tasks
    + **SOCKET**: manages POS devices, passes requests & delivers messages
    + **KOA SOCKET ROUTER**: handles POS requests & updates sessions

## First run

Dont forget to check [Storyous javascript guide](https://github.com/Storyous/javascript) first
and remember, there is a [Wiki](https://github.com/Storyous/pay-js-router/wiki), where is
the project documentation

- [1.1](#1.1) <a name='1.1'></a> **Download sources**

  1. Fork the repository
  2. Clone your forked repository
  3. Init a new Webstorm project with existing sources
  4. Run the `npm install` command

- [1.2](#1.2) <a name='1.2'></a> **Run the project**

  1. Create a Run configuration, which runs `bin/www.js`
  2. Run the project
  3. Open the browser on `http://localhost:3000/`

- [1.3](#1.3) <a name='1.3'></a> **Publish your changes**

  1. **Run `grunt` default task before each commit**, which:
    + builds production js/css
    + runs tests
    + checks code with jshint
    + creates coverage report
    + **Never commit dirty code (jslint)**
    + **Never commit tests with `describe.only`**
    + **Never commit failing tests**
  2. Create a new branch for your feature in your fork
  3. Push changes to your new branch
  4. Make a pull request

- [1.4](#1.4) <a name='1.3'></a> **Load current state**

  - dont forget to `npm install`

**[⬆ back to top](#table-of-contents)**

## Configuration

    NODE_ENV = <development/production/beta..> || development


- [2.1](#2.1) <a name='2.1'></a> **Environments and debug mode**

  We are using theese environments:

  + `production` for trully production environment
  + `development` for localhost with single DB instance
  + `rsTest` for localhost with DB replica set
  + `staging` for QA purposes (before release)
  + `beta` for our testing environment

```javascript

var config = require('../app/config');

config.env; // contains environment (development/production/stage/beta...)
config.production; // is true on pure production environments (with SSL)
config.debugEnabled; // can be enabled to be able to debug JS on frontend e.t.c

```

**[⬆ back to top](#table-of-contents)**

## Project Structure

    /
    | - app
    |    | - config
    |    | - controllers
    |    |     | - api          // module with controllers
    |    |     | - front    
    |    |     ` - index.js     // returns a router
    |    | - views              // views are common for server/client code
    |    |     | - front        // front module templates
    |    |     | - layouts
    |    |          ` - default.handlebars
    |    | - models
    |    |     ` - module
    |    | - bootstrap.js       // tasks to run before app starts listening
    |    ` - engineAsserts.js             // returns express app
    | - bin
    |    `- www.js
    | - node_modules
    | - public
    |    | - less
    |    | - js                 // client js files
    |    |    | - is            // IS application
    |    |    |    | - controllers
    |    |    |    |     | - someBundle
    |    |    |    |     ` - someController.js
    |    |    |    |  - components
    |    |    |    |     | - someBundle
    |    |    |    |     ` - someComponent.js
    |    |    |    `  - models
    |    |    | - models
    |    |    ` - stealconfig.js
    |    | - images
    |    ` - dist               // exported / compiled data
    |         | - *.css
    |         | - *.js
    |         ` - templates
    |               | - cz
    |               ` - en
    ` - tests

**[⬆ back to top](#table-of-contents)**

## Middleware

- [4.1](#4.1) <a name='4.1'></a> **Authorizator middleware**

  Authorization middleware is able to autorize user with **Oauth2** authorization header or with session.

      - can be used after `session` middleware to fetch user from session

```javascript

var authorizator = require('../../../models/auth/authorizator');

router.use(authorizator.getMiddleware());

router.get('/', function(req, res) {

    if (authorizator.isAllowedRes(req, 'resource', 'privilege')) {
        // user is auhorized

        // when there is a user signed as merchant
        var merchantId = req.merchantId; // {string}
    }

});

```

  - **Authorization matrix**

There is a resource object: `var res = { resource: 'res', privilege: 'priv'}` and there is an ACL rule `{ res: { priv: [ 'a' ] } }`, this table shows access policy:

|  |  `{group:'a'}` | `{group:'a', merchantId:'b'}` | `{group:'a', merchantId:'b', placeId: 'c'}` |
|------------------------------------------|-----|-----|-----|
| `{res ..}`                               | YES |  -  |  -  |
| `{res .., merchantId: 'b'}`              | YES | YES |  -  |
| `{res .., merchantId:'b', placeId: 'c'}` | YES | YES | YES |

  - **Authorization to merchant limited resource**

```javascript

router.get('/', function(req, res) {

    var resource = authorizator.res('resource', 'privilege')
                      .setMerchantId(req.query.merchantId);

    if (authorizator.isAllowedRes(req, 'resource', 'privilege')) {
        // user is auhorized

        // when there is a user signed as merchant
        var merchantId = req.merchantId; // {string}

        // when there is a token
        var token = req.token;

        if (token.deviceId) {
            // token is made for POS device
        }

        // ! dont use
        if (token.groups.length !== 0) {
            // when groups is not array, access is granted
        }

        // better, but use `isAllowedRes` method
        if (token.groups.length > 0) {
            // works, but dont use it
        }

        req.person; // a person object from the session or token
    }
});
```

  - **Authorization to place limited resource**

```javascript

router.get('/', function(req, res) {

    var resource = authorizator.res('resource', 'privilege')
        // always use merchantId with place id
                      .setPlaceId(req.query.merchantId, req.query.placeId);

    if (authorizator.isAllowedRes(req, 'resource', 'privilege')) {
        // user is auhorized

    }
});
```

  - **Fetch list of all places, where user can access the resource**

```javascript

router.get('/', function(req, res) {

    var resource = authorizator.res('resource', 'privilege');

    var placeList;
    if (req.merchantId) {
        placeList = authorizator.getPlaceList(req, resource);
    } else {
        // ! Merchant ID should be specified
        placeList = authorizator.getPlaceList(req, resource, 'merchantId');
    }


    if (placeList === true) {
        // user has access to all places ({group: 'grp', merchantId: 'xy'})

    } else if (placelist.length > 0) {
        // list of places, where user can access a resource or privilege

    } else if (placelist.length === 0) {
        // user has no access to resource
    }

});
```

- [4.2](#4.2) <a name='4.2'></a> **Session middleware**

  Just a wrapper for [Express Session](https://github.com/expressjs/session) which stores data in Mongo database

```javascript

var session = require('../../models/utils/session');

router.use(session.getMiddleware());

router.get('/', function(req, res) {

    app.use(function(req, res, next) {
    var sess = req.session
    if (sess.views) {
        sess.views++
        res.setHeader('Content-Type', 'text/html')
        res.write('<p>views: ' + sess.views + '</p>')
        res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>')
        res.end()
    } else {
        sess.views = 1
        res.end('welcome to the session demo. refresh!')
    }
})

});

```

- [4.3](#4.3) <a name='4.3'></a> **Lang middleware**

    To make translated templates working, use the `lang` middlewate. It also detects right language for user.

      - can be used after `authorizator` middleware to match users language

```javascript

var lang = require('../../models/i18n/lang');

router.use(lang.getMiddleware());

router.get('/', function (req, res) {

    req.lang; // == 'cs' or config.defaultLanguage
    res.locals.lang; // the value passed to template
        // ! and used by templating engine

});

```

**[⬆ back to top](#table-of-contents)**

## Frontend services

- [5.1](#5.1) <a name='5.1'></a> **Auth Service**

  Can be used to assure access to resource:

```javascript

var auth = require('../utils/auth');

if (auth.isAllowed('resource', 'privilege')) {
    // access to the merchants resource
}

if (auth.isAllowed('resource', 'privilege', 'placeId')) {
    // access to place related resource
}

```

  Or can be used to get logged person (instance of can.Model)

```javascript

var auth = require('../utils/auth');

var personModel = auth.getMe();

```

- [5.2](#5.2) <a name='5.2'></a> **Template service**

  Returns lazy loaded templates with good language version of the requested template. There is just a `get` method.

```javascript

var templates = require('../../../utils/templates');
var auth = require('../../utils/auth');

can.Component({
    tag: 'nav',
    // get template
    template: templates.get('is/components/nav'),
    viewModel: {

        // the authorization for some block in the template
        allowSuperuser: auth.isAllowed('IS-superAdmin', 'view'),
    }
});

```

- [5.3](#5.3) <a name='5.3'></a> **Routing**

  There is a simple router utility, which is simple to use. And it's directly
  connected with the menu bar.

```javascript

var router = new Router('/some-base-path/');

router.addSection('inbox')
    .route('/inbox', require('controllers/inbox/defaultController'))

        // when the controller is same and route is changed,
        // the controller will not be started again
    .route('/inbox/:messageId', require('controllers/inbox/defaultController'))

        // when the true is specified, controller of this route will be
        // always reloaded on route change event (route must be different)
    .route('/inbox/:messageId', require('controllers/inbox/defaultController'), true);


```

  And at the file `controllers/inbox/defaultController.js` must exist a can.Component
  with tag `inbox-default-controller`. It just works. A router has also a **viewState** feature,
  which is actually just a encapsulated routers can.Map.

  - instance of router has a `getViewState()` method
  - **a current viewState is implicitly passed to Controllers viewModel as a viewState property**

  The Router has a **sections and groups** feature.

   - Groups are cascading (should be ended by `endGroup()` method).
   - Sections are at base level (when there are any groups, they will be ended). Actually,
     the section is a group on zero level.

```javascript

var section = router.currentSection();
    // can.Compute which returns a string with name of current section

var stack = router.currentStack();
    // can.Compute which returns an array of Controllers hierarchy of groups

section === stack[0]; // yes, it's always the same

```


**[⬆ back to top](#table-of-contents)**

## Backend services

- [6.1](#6.1) <a name='6.1'></a> **Translator**

  Translator service is used by templating engines and it's able to translate any word.

    - all translations are stored in `/app/translations/<lang>.po` files
    - theese files are updated on Non-production environments with enabled debugMode
    - there is a **.translate(word, language[, where])** method
    - translator uses `ISO 639-1`

```javascript

var translator = require('../models/i18n/translator');

var translation = translator.translate('Ahoj', 'cs');

```

- [6.2](#6.2) <a name='6.2'></a> **Database**

  The database is connected at boostrap procedure. We are using native nodejs driver.
  Also allows to create and manage indexes

    - documentation is here: [mongodb.github.io/node-mongodb-native](http://mongodb.github.io/node-mongodb-native/2.0/) and [the API is here](http://mongodb.github.io/node-mongodb-native/2.0/api/)

```javascript

var db = require('../models/db');

var collection = db.db.collection('someCollection');

// add index
db.ensureIndex(collection, {field: 1});

// remove index
db.forgetIndex(collection, {field: 2}};

```

- [6.3](#6.3) <a name='6.3'></a> **Log**

**[⬆ back to top](#table-of-contents)**

## Common backend libraries

- [7.1](#7.1) <a name='7.1'></a> **Filter**

  + `omitForbidden()` which removes attributes from updated objects from db
  + `normalize()` to make keys for translations
  + `escapeRegex()` for using inputs in regexps
  + `searchStringToChunks()` makes array of regexes from search string to query db
  + `stringToSearchArray()` prepares chunks to be searchable by regexes

- [7.2](#7.2) <a name='7.2'></a> **Request validator**

  Utility, which validates and filters input values.

- [7.3](#7.3) <a name='7.3'></a> **Request filler**

  Has methods, which fills the UpdateRequest and also it's `updatedFields` attribute at once.

- [7.4](#7.4) <a name='7.4'></a> **Request builder**

  Helps to buld fetch request `fields` object to include/exclude fields in DB query

- [7.5](#7.5) <a name='7.5'></a> **API formatter**

  Helps to format **Cursor** to the response in format `{data: [], nextPage: 0}`

- [7.6](#7.6) <a name='7.5'></a> **AppError**

  Utility to make nice responses

    - has `AppError.notFound()` method for 404's
    - has `AppError.badRequest()` method for bad inputs
    - has `AppError.unauthorized()` method for unauthorized requests

```javascript

  foo.bar.then(function () {
      // with custom error code
      throw AppError.badRequest('Missing something', 498);
  })
  .catch(function (err) {
      res.status(err.httpStatus || 500)
        .send(err); // returns http code 400 and nice json response
  });

```

**[⬆ back to top](#table-of-contents)**

## Service structure

  + `<service>.js` - general interface (service)
  + `<service>DbModel.js` - main database data model Class (write)
  + `<service>FetchRequest.js` - container Class for fetching collections
  + `<service>Fetcher.js` - factory Class, which is making DB requests
  + `<service>UpdateRequest.js` - container Class for updating collections
  + `<service>Updater.js` - an insert Class utility
  + `<service>Storage.js` - a storage facade
  + `<service>Formatter.js` - output formatter

- [8.1](#8.1) <a name='8.1'></a> **Full service architecture**

```
      <----- GET/GETall ---------- [ Formatter ]     (getWithRequest -> Cursor)
        --- [ FetchRequest ] --- >                --------> [ Fetcher ] <-- db
    [API]                          [ <service> ]                             |
        --- [ UpdateRequest ] -- >                --------> [ Updater ] --> db
      <----- POST/PUT ------------ [ Formatter ]     (update/createWithRequest)
```

- [8.2](#8.2) <a name='8.2'></a> **API**

  **Authorizes** user and is responsible for filling requests

- [8.3](#8.3) <a name='8.3'></a> **Fetch Request Class**

  Holds and validates request data and also holds default values.

  + has `validate()` method

- [8.4](#8.4) <a name='8.4'></a> **Service**

  Is a facade for all important methods

  + has `getById()` method which is used to hanldle GET req's
  + has `getWithRequest()` method which handles GETall requests
  + has `createWithRequest()` method which handles POSTs
  + has `updateWithRequest()` method which handles PUTs

- [8.5](#8.5) <a name='8.5'></a> **Update Request Class**

  Holds and validates requested values

  + has `updatedFields` attribute, which contains requested fields
  + has `validate()` method, which just solves validity of values
  + has `checkRequired()` method, which solves whether values are filled for insertion

- [8.6](#8.6) <a name='8.6'></a> **Updater**

  Utility, which updates the db with request


- [8.7](#8.7) <a name='8.7'></a> **Fetcher**

  Utility, which constructs the request to the db


- [8.8](#8.8) <a name='8.8'></a> **Formatter**

  Post-processor for database output. For cursors or for single object.

- [8.9](#8.9) <a name='8.9'></a> **DbModel**

  Keeps and shows stucture of object in the collection with a lot of comments.
  Can be used for inserts.

**[⬆ back to top](#table-of-contents)**

## Security

- [9.1](#9.1) <a name='9.1'></a> **Escape regexes**

  Every time you use RegExp with user input, please use `filter.escapeRegex()` method

```javascript

var regex = new RegExp('^'+filter.escapeRegex(req.query.search));

```

- [9.2](#9.2) <a name='9.2'></a> **Dont allow inputs to be keys without filtering:** Always escape dots and $ `.replace(/[^a-z0-9]+/, '')`

```javascript

var key = req.query.field;
// expected: some
// given: some.another

var query = {};

query[field] = 1;

db.findOne(query);

```

- [9.3](#9.3) <a name='9.3'></a> **Always authorize user!!!**

**[⬆ back to top](#table-of-contents)**

## Testing and Docs

- [10.1](#10.1) <a name='10.1'></a> **Testing API's**

  There is a utility in root of tests: `/tests/apiTestUtil` which has:

    - method `before(mocha)` which loads bootstrap (should be called in thebegining of test suite)
    - method `request()` which returns the request to use
    - full docs for used **Supertest** module is on [their Github](https://github.com/visionmedia/supertest)

```javascript

describe('Person API', function () {

    api.before(mocha);

    it('should be able to handle POST', function (done) {

          api.request()
              .post('/persons')
              .set('Authorization', api.bearer())
              .end(function () { //err, res
                  // asserts
                  done();
              });
      });

});


```

- [10.2](#10.2) <a name='10.2'></a> **Always use JS docs**

  IDE and you will appreciate this. Completion will be better (and also documentation). More at [usejsdoc.org](http://usejsdoc.org).

```javascript

Some.prototype = {

    /**
     * @type {string}
     */
    variable: null,

    /**
     * @type {Collection}
     */
    collection: null,

    /**
     * @type {{property: Array}}
     */
    someObject: null,

    /**
     * @type {boolean}
     * @private
     *
    _someParam: false,

    /**
     * This is doing something
     *
     * @param {string} a - mandatory parameter
     * @param {Array|null} b - another mandatory parameter
     * @param {SomeFetchRequest} [c] - optional parameter
     * @throws {Error} - when data are invalid
     * @returns {Promise}
     */
    someMethod: function (a, b, c) {
        var def = Q.defer();

        return def.promise;
    }

};

```

**[⬆ back to top](#table-of-contents)**
