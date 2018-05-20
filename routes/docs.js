var fs = require('fs');
var os = require('os');
var path = require('path');

var yaml = require('js-yaml');
var Client = require('node-rest-client').Client;

var client = new Client();

function loadDocument(doc) {
  let document;
  const fileName = path.resolve(`${__dirname}/docs/${toYmlFilename(doc)}`);
  document = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
  console.log("Loaded document from '%s'.", fileName);
  return document;
}

function saveDocument(doc, docName) {
  const fileName = path.resolve(`${__dirname}/docs/${toYmlFilename(docName)}`);
  fs.writeFileSync(fileName, yaml.dump(doc), 'utf8');
  console.log("Wrote document to '%s'.", fileName);
}

function toYmlFilename(fileName) {
  return fileName.endsWith('.yml') ? fileName : `${fileName}.yml`;
}

function registerRoutes(app, path) {

  var documentsRoute = '/docs';
  app.get(`${documentsRoute}/:doc`, function(req, res) {
    const doc = req.params.doc;
    res.send(loadDocument(toYmlFilename(doc)));
  });

  app.put(`${documentsRoute}/:doc`, function(req, res) {
    const doc = req.params.doc;
    const document = req.body;
    saveDocument(document, toYmlFilename(doc));
    res.send('ok');
  });

  console.log("Registered route '%s'.", documentsRoute);
};

module.exports = {
  registerRoutes: registerRoutes
}
