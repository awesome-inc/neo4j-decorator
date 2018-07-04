const Client = require('node-rest-client').Client;
const client = new Client;
const nunjucks = require('nunjucks');
const CONF = require('./config');

const _myRoute = '/graph';

function register(app) {
  const path = '/graph*';
  app.get(path, (req, res) => {
    const url = _originalUrl(req);
    client.get(url, (body, _response) => {
        console.debug(req);
        res.send(_decorateBody(req, body));
      })
      .on('error', err => {
        console.error('something went wrong on the request', err.request.options);
        res.send(err);
      });
  });

  app.post(path, (req, res) => {
    const url = _originalUrl(req);
    const args = {
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    client.post(url, args, (body, _response) => {
        res.send(_decorateBody(req, body));
      })
      .on('error', err => {
        console.error('something went wrong on the request', err.request.options);
        res.send(err);
      });
  });

  const config = CONF._getConfig();
  ['server_url', 'neo4j_url'].forEach(key => console.info(`${key}: ${config[key]}`));
};

function _decorateBody(req, json) {
  var src = _serverUrl(req);
  var dst = _decoratedUrl(req);
  _replaceUrls(json, src, dst);
  json = _decorateDocument(json);
  return json;
}

function _replaceUrls(json, src, dst) {
  _recursiveReplace(json, (input) => {
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
  var decorations = _getDecorations(type, json, hashMapName);
  if (decorations) {
    _deepCombine(json, decorations);
  }
}

function _deepCombine(a, b) {
  for (var key in b) {
    if (a[key]) {
      if (Array.isArray(a[key]) && Array.isArray(b[key])) {
        a[key] = a[key].concat(b[key]);
      } else if (typeof (b[key]) == "string") {
        // Overwrite a value with b value
        a[key] = b[key];
      } else {
        _deepCombine(a[key], b[key]);
      }
    } else {
      a[key] = b[key];
    }
  }
}

function _recursiveReplace(iterable, callback) {
  for (var idx in iterable) {
    if (typeof (iterable[idx]) == "string") {
      iterable[idx] = callback(iterable[idx]);
    } else if (typeof (iterable) == "object" || Array.isArray(iterable)) {
      _recursiveReplace(iterable[idx], callback);
    }
  }
}

function _getDecorations(type, doc, hashMapName) {
  hashMapName = hashMapName || "decorate";
  var hashMap = CONF._getConfig()[hashMapName];
  var js = hashMap[type]
  if (js && doc) {
    var cp = JSON.parse(JSON.stringify(js));
    var context = {
      config: CONF._getConfig(),
      doc: doc,
      env: process.env
    };
    _recursiveReplace(cp, (input) => {
      return nunjucks.renderString(input, context);
    });
  }
  return cp;
}

function _serverUrl(req) {
  return CONF._getConfig().neo4j_url || _getServerUrl(req);
}

function _decoratedUrl(req) {
  return CONF._getConfig().server_url || _getDecoratedUrl(req);
}

function _getDecoratedUrl(req) {
  var s = req.server.info;
  return s.uri + _myRoute;
}

function _getServerUrl(req) {
  var s = req.server.info;
  return s.protocol + '://' + s.host + ':7474/db/data';
}

function _originalUrl(req) {
  return _serverUrl(req) + req.path.replace(_myRoute, '');
}

module.exports = {
  register,
  _decorateBody,
  _decorateDocument,
  _deepCombine
};
