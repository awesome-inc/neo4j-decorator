const loadYaml = require('../loadYaml');
const nunjucks = require('nunjucks');

const pathToConfig = process.env.DECORATOR_CONFIG || './config';
let config = _loadConfig();

function register(app) {
  app.get('/config', (_req, res) => res.send(config));
};

function _loadConfig() {
  const context = {
    env: process.env
  };
  console.debug(`Path to config: ${pathToConfig}`);

  let cfg = loadYaml(`${pathToConfig}/{config.yml,conf.d/**/*.yml}`)

  // TODO: this is a hack, should be changed
  // Interpolate all URLs
  Object.keys(cfg)
    .filter(key => key.endsWith('_url'))
    .forEach(url => cfg[url] = nunjucks.renderString(cfg[url], context));

  return cfg;
}

module.exports = {
  register,
  _loadConfig,
  _getConfig: () => config,
  _setConfig: value => config = value
};
