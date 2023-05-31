/**
 * 小程序默认开发环境
 */
class DevelopmentConfig {
  options = {}
  constructor () {
    let { execPath, env, argv, cwd } = process
    this.options = {
      NODE_ENV: 'development',

      CE_ENV: 'development',

      APP_ENV: 'dev',
      APP_HOME_DIR: env.CE_APP_DIR,
      APP_RESOURCES_DIR: env.CE_APP_DIR,
      APP_FILE_DIR: env.CE_FILE_DIR
    }
    let keys = Object.getOwnPropertyNames(this.options)
    for (let key of keys) {
      env[key] = this.options[key]
    }
  }

  /* 获取配置 */
  getOptions () {
    return this.options
  }
}


module.exports = DevelopmentConfig