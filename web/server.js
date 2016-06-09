'use strict'

const path = require('path');
const express = require('express');
const serveStatic = require('serve-static');
const app = express();

function run(port) {
  port = port || 8080;
  app.use(serveStatic(path.join(__dirname, 'public')));

  app.get('/status', (req, res) => {
    res.json(require(__dirname + '/../lib/downloader').getStatus());
  });

  app.listen(port);
}

module.exports.run = run;