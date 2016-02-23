/**
* Created by vojtechmalek on 23/02/16.
*/

'use strict';

/* eslint no-console: 0 */

class Logger {

    constructor (disableConsole) {
        if (disableConsole) {
            this.info = () => {};
            this.error = () => {};
            this.warn = () => {};
            return this;
        }

        const PREFIX = '[Engine-Asserts]';
        this.info = console.log.bind(console, PREFIX, 'info:');
        this.error = console.error.bind(console, PREFIX, 'error:');
        this.warn = console.error.bind(console, PREFIX, 'warning:');
        return this;
    }

}
module.exports = Logger;
