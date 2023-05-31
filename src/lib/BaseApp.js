

const AppLoader = require('./Application');

const CeCore = require('../core/lib/ce')
const CE_LOADER = Symbol.for('ce#loader');


class BaseApp extends CeCore {
  constructor () {
    super()
  }

  get [CE_LOADER] () {
    return AppLoader;
  }

  config () {

  }

  /**
 * core app have been loaded
 */
  async ready () {
    // do some things
  }
}

module.exports = BaseApp