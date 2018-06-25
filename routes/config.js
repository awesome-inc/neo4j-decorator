var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var glob = require('glob');
var merge = require('deepmerge')
var nunjucks = require('nunjucks');

const pathToConfig = process.env.path_to_config || '.';
var config = loadConfig();

function loadConfig() {
  var cfg;
  const context = {
    env: process.env
  };
  console.log('Path to config:', pathToConfig);

  const fileName = path.resolve('./config.yml');
  cfg = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));

  // Interpolate all URLs
  Object.keys(cfg)
    .filter(key => key.endsWith('_url'))
    .forEach(url => cfg[url] = nunjucks.renderString(cfg[url], context));

  const fileNames = glob.sync(`${pathToConfig}/conf.d/**/*.yml`);
  const partials = fileNames.map(fileName => loadYaml(fileName));

  console.log("Loaded config from '%s'.", fileName);
  console.log(`Loaded additional configs: [${fileNames}]`);
  return merge.all([cfg, ...partials]);
}

function loadYaml(fileName) {
  const file = loadFile(fileName, 'utf8');
  return yaml.safeLoad(file);
}

function loadFile(fileName, fileFormat) {
  const format = fileFormat || 'utf8';
  return fs.readFileSync(`${fileName}`, format);
}

function saveConfig(newConfig) {
  var fileName = path.resolve('./config.yml');
  fs.writeFileSync(fileName, yaml.dump(newConfig), 'utf8');
  console.log(`Wrote config to '${fileName}'.`);
  config = loadConfig();
  console.log('Updated config');
}

function registerRoutes(app, _path) {
  const configRoute = '/config';
  app.get(configRoute, (_req, res) => {
    res.send(config);
  });

  app.put(configRoute, (req, res) => {
    // TODO: parse/validate
    saveConfig(req.body);
    res.send('ok');
  });

  console.log("Registered route '%s'.", configRoute);
};

module.exports = {
  registerRoutes: registerRoutes,
  _loadConfig: loadConfig,
  _getConfig: () => {
    return config;
  },
  _setConfig: (value) => {
    config = value;
  },
}
