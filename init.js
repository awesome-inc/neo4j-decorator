module.exports = (app) => {
  var config = require('./routes/config')
  var graph = require('./routes/graph');
  var docs = require('./routes/docs');

  docs.registerRoutes(app);
  graph.registerRoutes(app);
  config.registerRoutes(app);
};
