var memoryStore = require('./memory-store');

var queue = module.exports = {};

var io, queues = {};

queue.start = function (_io) {
    io = _io;
    io.on('connection', function (socket) {

        log('client connected');
        socket.on('subscribe', function (channel) {
            if (!queues[channel]) {
                return socket.emit('no-bot');
            }
            queues[channel].clients.push(socket);
            socket.emit('new-song', queues[channel].songs);
        });
    });
};

queue.createBot = function (botName) {
    log('queue created:', botName);
    queues[botName] = {
        songs: [],
        clients: []
    };

    setInterval(function() {
        queue.queueSong(botName, {
            service: 'youtube',
            id: 'mTzbax2daKs'
        });
    }, 2000);
};

queue.removeBot = function (botName) {
    log('queue removed:', botName);
    delete queues[botName];
}

queue.queueSong = function (botName, song) {
    if (!queues[botName]) return false;
    queues[botName].songs.push(song);

    sendSongs(botName);
    return true;
}

function sendSongs(botName) {
    var clients = queues[botName].clients;
    var songs = queues[botName].songs;

    for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        client.emit('new-song', songs);
    }
}

function log() {
    var message = [].slice.call(arguments);
    message.unshift('[queue]');
    console.log.apply(this, message);
}


