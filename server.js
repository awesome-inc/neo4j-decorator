const express = require('express');
const app = express();

var bodyParser = require('body-parser');
var cors = require('cors');

app.use(bodyParser.json()); // for parsing application/json
app.use(cors());

// Add server routes
require('./init')(app);

app.listen(3000, '0.0.0.0', () => console.log('Server listening on port 3000'));
