const loadYaml = require('../loadYaml');
const pathToConfig = process.env.DECORATOR_CONFIG || './config';
const docsPattern = `${pathToConfig}/docs.d/**/*.yml`;

function register(app) {
  app.get('/docs/:key', (req, res) => res.send(_loadDoc(req.params.key)));
};

function _loadDoc(key) {
  return loadYaml(docsPattern)[key];
}

module.exports = {
  register,
  _loadDoc
};
