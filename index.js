var express     = require('express'),
    fs          = require('fs'),
    mongoose    = require('mongoose'),
    bodyParser  = require('body-parser'),
    config      = require('./src/configLoader.js'),
    ts3mb       = require('./src/ts3mb'),
    api         = require('./src/api'),
    routes      = require('./src/routes'),
    musicqueue  = require('./src/musicqueue'),
    socketio    = require('socket.io'),
    http        = require('http');

config.init(function() {
    mongoose.connect(config.get('mongo'));


    var app = express();
    var httpServer = http.Server(app);
    var io = socketio(httpServer);

    app.use(bodyParser.json());
    app.use(express.static('static'));

    app.use('/api/', api);
    app.use('/', routes);

    var server = httpServer.listen(config.get('port'), function() {
        var addr = server.address();

        console.log('Gigavoid Sway running on %s:%s', addr.address, addr.port);
    });

    musicqueue.start(io);

    // cleanup any eventual leftover containers that was running when the server exited
    ts3mb.cleanup();
});

