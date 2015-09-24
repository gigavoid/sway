var queue = module.exports = {};

var io, queues = {};

queue.start = function (_io) {
    io = _io;
    io.on('connection', function (socket) {

        log('client connected');
        socket.on('subscribe', function (channel) {
            log('client subscribed');
            if (!queues[channel]) {
                return socket.emit('no-bot');
            }
            queues[channel].clients.push(socket);
            socket.emit('new-song', queues[channel].songs);
        });
    });
};

queue.createBot = function (botName, key) {
    log('queue created:', botName);
    queues[botName] = {
        songs: [],
        clients: [],
        key: key
    };

    queues[botName].songs.push({
        song: 'Ip7QZPw04Ks',
        service: 'youtube'
    });
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

queue.popSong = function (playerId, playerKey) {
    var q = queues[playerId];
    if (!q) return log('tried to pop song from invalid player id', playerId);
    if (q.key !== playerKey) return log('tried to pop song from invalid key', q.key);

    q.songs.shift();
    sendSongs(playerId);
}

function sendSongs(botName) {
    log('send songs', botName);
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


