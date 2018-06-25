const express = require('express');
const app = express();

var bodyParser = require('body-parser');
var cors = require('cors');

app.use(bodyParser.json()); // for parsing application/json
app.use(cors());

// Add server routes
const init = require('./init');
init(app)
module.exports = app;
