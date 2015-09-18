var express     = require('express'),
    fs          = require('fs'),
    mongoose    = require('mongoose'),
    bodyParser  = require('body-parser'),
    config      = require('./src/configLoader.js'),
    api         = require('./src/api.js');


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

