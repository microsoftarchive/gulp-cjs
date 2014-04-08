'use strict';

var st = require('st');
var http = require('http');
var path = require('path');

function server (gulp, options) {

  var port = parseInt(process.env.PORT || options.port, 10);
  var baseDir = path.resolve(options.baseDir || path.resolve('.'));
  var indexPage = options.indexPage || '/tests/index.html';

  var staticServer = st({
    'path': baseDir,
    'url': '/',
    'passthrough': true,
    'index': false,
    'cache': false
  });

  function handleRequest (req, resp) {
    staticServer(req, resp, function () {
      if (req.url === '/') {
        resp.writeHead(301, {
          'Location': indexPage
        });
        resp.end();
      }
    });
  }

  return function () {
    var httpServer = http.createServer(handleRequest);
    httpServer.on('listening', function () {
      console.info('server started on http://%s:%s/',
                   'localhost', port);
    });
    httpServer.listen(port);
  };
}

module.exports = server;