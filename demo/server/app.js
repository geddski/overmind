var express = require('express'); 
var app = express();
var path = require('path');

app.use('/client', express.static(path.resolve(__dirname + '/../client')));

app.get('/*', function(req, res){
  res.sendfile(path.resolve(__dirname + '/../client/index.html'));
});

app.listen('9191');