module.exports = function (app) {
  var graph = require('./routes/graph.js');
  graph.registerRoutes(app);
};
