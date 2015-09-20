var express     = require('express'),
    fs          = require('fs'),
    mongoose    = require('mongoose'),
    bodyParser  = require('body-parser'),
    config      = require('./src/configLoader.js'),
    exec        = require('child_process').exec,
    api         = require('./src/api.js');

// kill of old, abandoned tsmb processes
//docker ps -qf label=mb=true
console.log('Cleaning up old music bots...');
var child = exec('docker rm -f $(docker ps -qf label=mb=true)', [
], function (error, stdout, stderr) {      // one easy function to capture data/errors
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

config.init(function() {
    mongoose.connect(config.get('mongo'));

    var app = express();
    app.use(bodyParser.json());

    app.use(express.static('static'));

    app.use('/api/', api);

    var server = app.listen(config.get('port'), function() {
        var addr = server.address();

        console.log('Gigavoid Sway running on %s:%s', addr.address, addr.port);
    });
});

