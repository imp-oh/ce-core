const CE_LOADER = Symbol.for('ce#loader');
const assert = require('assert');

class CeCore {
  constructor (options = {}) {
    options.type = options.type || 'application';

    const Loader = this[CE_LOADER];
    assert(Loader, 'Symbol.for(\'ee#loader\') is required');
    let loaderOptions = Object.assign({
      logger: this.console,
      app: this
    }, options);
    // this.loader = new Loader(loaderOptions);
  }
}

module.exports = CeCore