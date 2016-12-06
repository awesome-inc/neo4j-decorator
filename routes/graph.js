var fs   = require('fs');
var os = require('os'); 
var path = require('path');

var yaml = require('js-yaml');
var Client = require('node-rest-client').Client;
var interpolate = require('interpolate');

var config = loadConfig();
var client = new Client();
var _myRoute = '';

function loadConfig() {
  var cfg;
  var fileName = path.resolve(__dirname + '/config.yml');
  cfg = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
  console.log("Loaded config from '%s'.", fileName);
  return cfg;
}

function saveConfig() {
  var fileName = path.resolve(__dirname + '/config.yml');
  fs.writeFileSync(fileName, yaml.dump(config), 'utf8');
  console.log("Wrote config to '%s'.", fileName);
}

function registerRoutes(server, path) {
  // node does not support default parameters
  path = path || '/api/ai/{graph*}';

  server.route({
    path: path,
    method: 'GET',
    handler(req, reply) {
      var url = originalUrl(req);
      client.get(url, function (body, response) {
        body = _decorateBody(req, body);
        reply(body);
      })
      .on('error', function (err) {
        reply(err);
        console.log('something went wrong on the request', err.request.options);
      });
    }
  });

  server.route({
    path: path,
    method: 'POST',
    handler(req, reply) {
      var url = originalUrl(req);
      var args = { data: req.payload, headers: { 'Content-Type': 'application/json' } };
      client.post(url, args, function (body, response) {
        body = _decorateBody(req, body);
        reply(body);
      });
    }
  });

  _myRoute = path.replace(new RegExp('[{*}]', 'gi'), '');

  if (config.server_url == null) {
    console.log("'config.server_url' not configured! Deriving from Hapi / os.hostname() ...");
    var hostName = os.hostname();
    var serverUri = server.info.uri.replace('0.0.0.0', hostName);
    config.server_url = serverUri + _myRoute;
  }
  console.log("server_url: '%s'", config.server_url);
  console.log("neo4j_url: '%s'", config.neo4j_url);

  console.log("Registered route '%s'.", _myRoute);

  var configRoute = '/api/ai/.config';
  server.route({
    path: configRoute,
    method: 'GET',
    handler(req, reply) {
      reply(config);
    }
  });

  server.route({
    path: configRoute,
    method: 'PUT',
    handler(req, reply) {
      // TODO: parse/validate
      config = req.payload;
      saveConfig();
      reply('ok');
    }
  });

  console.log("Registered route '%s'.", configRoute);
};

function _decorateBody(req, json) {
  var src = serverUrl(req);
  var dst = decoratedUrl(req);
  json = replaceUrls(json, src, dst);
  json = _decorateDocument(json);
  return json;
}

function replaceUrls(json, src, dst) {
  for (var x in json) { // eslint-disable-line guard-for-in
    var v = json[x];
    if (typeof v === 'string') {
      json[x] = v.replace(src, dst);
    } else if (Array.isArray(v) || typeof v === 'object') {
      json[x] = replaceUrls(v, src, dst);
    }
  }
  return json;
}

function _decorateDocument(json) {
  
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

  // single node or edge
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
        _decorateDocumentFor(m.labels[i], json);
      }
    }
  }

  if (json.data && json.data.type) {
    _decorateDocumentFor(json.data.type, json);
  }

  return json;
}

function _decorateDocumentFor(type, json) {
  var decorations = getDecorations(type, json);
  if (decorations) {
    deepCombine(json, decorations);
  }
}

function deepCombine(a, b) {
  for (var key in b) {
    if (a[key]) {
      if (Array.isArray(a[key]) && Array.isArray(b[key])) {
        a[key] = a[key].concat(b[key]);
      }
      else {
        deepCombine(a[key], b[key]);
      }
    }
    else {
      a[key] = b[key];
    }
  }
}

function recursive_replace_on_type(iterable, typestr, callback) {
  try {
    for(var idx in iterable) {
      if(typeof(iterable[idx]) == typestr) {
        iterable[idx] = callback(iterable[idx]);
      }
      else {
        recursive_replace_on_type(iterable[idx], typestr, callback);
      }
    }
  } catch(e) {
    // To be expected...
  }
}

function getDecorations(type, doc) {
  var js = config.decorate[type]
  if (js && doc) {
    var cp = JSON.parse(JSON.stringify(js));
    var data = { doc: doc, config: config};
    recursive_replace_on_type(cp, "string", (input) => {      
      return interpolate(input, data, {delimiter: '{{}}'});
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
  _getConfig: function() { return config; },
  _setConfig: function(value) { config = value; },
  _decorateBody: _decorateBody,
  _decorateDocument: _decorateDocument
}