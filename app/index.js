const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(cors());

// Add server routes
['config', 'graph', 'docs'].forEach(route => {
  console.info(`Register '/${route}'...`);
  require(`./routes/${route}`).register(app);
});

module.exports = app;
