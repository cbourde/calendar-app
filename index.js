const express = require('express');
const app = express();
const PORT = 80;

app.use(express.static('static'));

app.listen(PORT);