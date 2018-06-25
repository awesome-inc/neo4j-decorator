module.exports = (app) => {
  var graph = require('./routes/graph.js');
  var docs = require('./routes/docs.js');

  docs.registerRoutes(app);
  graph.registerRoutes(app);
};
