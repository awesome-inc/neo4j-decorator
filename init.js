module.exports = function (server) {

  var graph = require('./routes/graph.js');
  graph.registerRoutes(server);
};
