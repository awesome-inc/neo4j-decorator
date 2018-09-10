const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const TIMEOUT = parseInt(process.env.TIMEOUT) || 120000;

app.use(function (req, res, next) {
  res.setTimeout(TIMEOUT, function () {
    console.log(`Request has timed out. Timeout is set to ${TIMEOUT}`);
    res.send(408);
  });
  next();
});

app.use(bodyParser.json()); // for parsing application/json
app.use(cors());

// Add server routes
['config', 'graph', 'docs'].forEach(route => {
  console.info(`Register '/${route}'...`);
  require(`./routes/${route}`).register(app);
});

module.exports = app;
