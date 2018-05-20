var fs = require('fs');
var os = require('os');
var path = require('path');

var yaml = require('js-yaml');
var Client = require('node-rest-client').Client;
var nunjucks = require('nunjucks');

var config = loadConfig();
var client = new Client();
var _myRoute = '';

function loadConfig() {
  var cfg;
  var fileName = path.resolve(__dirname + '/config.yml');
  cfg = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
  let context = { env: process.env };
  cfg.server_url = nunjucks.renderString(cfg.server_url, context);
  cfg.neo4j_url = nunjucks.renderString(cfg.neo4j_url, context);
  console.log("Loaded config from '%s'.", fileName);
  return cfg;
}

function saveConfig() {
  var fileName = path.resolve(__dirname + '/config.yml');
  fs.writeFileSync(fileName, yaml.dump(config), 'utf8');
  console.log("Wrote config to '%s'.", fileName);
}

function registerRoutes(app, path) {
  // node does not support default parameters
  path = path || '/graph*';

  app.get(path, function(req, res) {
    var url = originalUrl(req);
    client.get(url, function (body, response) {
        body = _decorateBody(req, body);
        res.send(body);
      })
      .on('error', function (err) {
        res.send(err);
        console.log('something went wrong on the request', err.request.options);
      });
  });

  app.post(path, function(req, res) {
    var url = originalUrl(req);
    var args = {
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    client.post(url, args, function (body, response) {
      body = _decorateBody(req, body);
      res.send(body);
    });
  });

  _myRoute = path.replace(new RegExp('[{*}]', 'gi'), '');

  console.log("server_url: '%s'", config.server_url);
  console.log("neo4j_url: '%s'", config.neo4j_url);

  console.log("Registered route '%s'.", _myRoute);

  var configRoute = '/config';
  app.get(configRoute, function(req, res) {
    res.send(config);
  });

  app.put(configRoute, function(req, res) {
    // TODO: parse/validate
    config = req.body;
    saveConfig();
    res.send('ok');
  });

  console.log("Registered route '%s'.", configRoute);
};

function _decorateBody(req, json) {
  var src = serverUrl(req);
  var dst = decoratedUrl(req);
  replaceUrls(json, src, dst);
  json = _decorateDocument(json);
  return json;
}

function replaceUrls(json, src, dst) {
  recursiveReplace(json, (input) => {
    return input.replace(src, dst);
  });
}

function _decorateDocument(json) {

  // transactional response
  if (json.results && Array.isArray(json.results)) {
    json.results = _decorateDocumentTransactional(json.results);
    return json;
  }

  // array of relationships
  if (Array.isArray(json)) {
    for (var x = 0; x < json.length; x++) {
      json[x] = _decorateDocument(json[x]);
    }
    return json;
  }

  // cypher result
  if (json.columns && json.data) {
    json.data = _decorateDocument(json.data);
    return json;
  }

  _decorateDocumentFor("_all", json);

  // single cypher node or edge
  if (json.metadata) {
    var m = json.metadata;

    var isEdge = (m.type != null);
    var isNode = !isEdge;

    if (isNode) {
      _decorateDocumentFor("_node", json);
    }

    if (isEdge) {
      _decorateDocumentFor("_edge", json);
      _decorateDocumentFor(m.type, json);
    }

    if (m.labels) {
      for (var i = 0; i < m.labels.length; i++) {
        var nodeType = m.labels[i]
        _decorateDocumentFor(nodeType, json);
      }
    }
  }

  return json;
}

function _decorateDocumentTransactional(json) {

  // array of results
  if (Array.isArray(json)) {
    for (var x = 0; x < json.length; x++) {
      json[x] = _decorateDocumentTransactional(json[x]);
    }
    return json;
  }

  if (json.data && Array.isArray(json.data)) {
    json.data = _decorateDocumentTransactional(json.data);
    return json;
  }

  if (json.graph) {
    json.graph = _decorateDocumentTransactional(json.graph)
    return json;
  }

  // TODO: decorate _all, _node, _edge

  if (json.nodes && Array.isArray(json.nodes)) {
    for (var x = 0; x < json.nodes.length; x++) {
      var edge = json.nodes[x];

      if (edge.labels) {
        for (var i = 0; i < edge.labels.length; i++) {
          var nodeType = edge.labels[i]
          _decorateDocumentFor(nodeType, edge, "decorate_transactional");
        }
      }
    }
  }

  if (json.relationships && Array.isArray(json.relationships)) {
    for (var x = 0; x < json.relationships.length; x++) {
      var edge = json.relationships[x];

      if (edge.type) {
        _decorateDocumentFor(edge.type, edge, "decorate_transactional");
      }
    }
  }


  return json;
}

function _decorateDocumentFor(type, json, hashMapName) {
  var decorations = getDecorations(type, json, hashMapName);
  if (decorations) {
    deepCombine(json, decorations);
  }
}

function deepCombine(a, b) {
  for (var key in b) {
    if (a[key]) {
      if (Array.isArray(a[key]) && Array.isArray(b[key])) {
        a[key] = a[key].concat(b[key]);
      } else if(typeof(b[key]) == "string") {
        // Overwrite a value with b value
        a[key] = b[key];
      }
      else {
        deepCombine(a[key], b[key]);
      }
    } else {
      a[key] = b[key];
    }
  }
}

function recursiveReplace(iterable, callback) {
  for (var idx in iterable) {
    if (typeof (iterable[idx]) == "string") {
      iterable[idx] = callback(iterable[idx]);
    } else if (typeof (iterable) == "object" || Array.isArray(iterable)) {
      recursiveReplace(iterable[idx], callback);
    }
  }
}

function getDecorations(type, doc, hashMapName) {
  hashMapName = hashMapName || "decorate";
  var hashMap = config[hashMapName];
  var js = hashMap[type]
  if (js && doc) {
    var cp = JSON.parse(JSON.stringify(js));
    var context = { config: config, doc: doc, env: process.env };
    recursiveReplace(cp, (input) => {
      return nunjucks.renderString(input, context);
    });
  }
  return cp;
}

function serverUrl(req) {
  return config.neo4j_url || getServerUrl(req);
}

function decoratedUrl(req) {
  return config.server_url || getDecoratedUrl(req);
}

function getDecoratedUrl(req) {
  var s = req.server.info;
  return s.uri + _myRoute;
}

function getServerUrl(req) {
  var s = req.server.info;
  return s.protocol + '://' + s.host + ':7474/db/data';
}

function originalUrl(req) {
  return serverUrl(req) + req.path.replace(_myRoute, '');
}

module.exports = {
  registerRoutes: registerRoutes,
  _getConfig: function () {
    return config;
  },
  _setConfig: function (value) {
    config = value;
  },
  _decorateBody: _decorateBody,
  _decorateDocument: _decorateDocument,
  _deepCombine: deepCombine
}
