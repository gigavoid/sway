var google = require('googleapis');
var randomElement = require('./util/random.js').randomElement;

var youtube = google.youtube({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY
})

var queue = module.exports = {};

var io, queues = {};

var initialSongs = [{
    weight: 1,
    song: {
        song: 'Ip7QZPw04Ks',
        service: 'youtube'
    }
}, {
    weight: 1,
    song: {
        song: 'MPWruWso93A',
        service: 'youtube'
    }
}];

function getRelated(videoId, cb) {
    youtube.search.list({
        part: 'snippet',
        relatedToVideoId: videoId,
        maxResults: 1,
        type: 'video'
    }, function (err, data) {
        if (err) { return cb (err); }

        cb(null, data.items[0].id.videoId)
    })
}

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

        socket.on('ts-player', function (obj) {
            if (queues[obj.name] && queues[obj.name].key === obj.key) {
                log('player authenticated for', obj.name);
                queues[obj.name].player = socket;
            } else {
                log('authentication failed for', obj.name);
            }
        });
    });
};

queue.skip = function (botName) {
    if (queues[botName] && queues[botName].player) {
        queues[botName].player.emit('skip');
    }
}

queue.pauseToggle = function (botName) {
    if (queues[botName] && queues[botName].player) {
        queues[botName].player.emit('pause-toggle');
    }
}

queue.createBot = function (botName, key) {
    log('queue created:', botName);
    queues[botName] = {
        songs: [],
        clients: [],
        player: null,
        key: key,
        log: []
    };

    randomElement(initialSongs);

    queues[botName].songs.push(randomElement(initialSongs).song);
};

queue.removeBot = function (botName) {
    log('queue removed:', botName);
    delete queues[botName];
}

queue.queueSong = function (botName, song) {
    if (!queues[botName]) return false;
    queues[botName].songs.push(song);

    addLog(botName  , {type: 'added-queue', song});

    sendSongs(botName);
    return true;
}

queue.popSong = function (playerId, playerKey, cb) {
    var q = queues[playerId];
    if (!q) return log('tried to pop song from invalid player id', playerId);
    if (q.key !== playerKey) return log('tried to pop song from invalid key', q.key);


    var popped = q.songs.shift();
    console.log('popped song', popped);

    if (popped) {
        q.currentSong = popped;
        sendSongs(playerId);
        cb(popped);
        addLog(playerId, {type: 'playing-song', popped});

        return;
    }

    if (q.autoPlay && q.currentSong) {
        console.log('Autoplaying');
        
        getRelated(q.currentSong.song, function (err, id) {
            var song = {
                song: id,
                service: 'youtube'
            };
            q.songs.push(song);

            addLog(playerId, {type: 'added-youtube-autoplay', song, from: q.currentSong});

            return queue.popSong(playerId, playerKey, cb);
        });
    }
}

queue.setAutoplay = function (botName, enabled) {
    console.log('setAutoplay', botName);
    if (queues[botName]) {
        queues[botName].autoPlay = enabled;
        sendStatus(botName);
        sendSongs(botName);
    }
}

function addLog (botName, obj) {
    var q = queues[botName];

    if (q) {
        q.log.push(obj);

        sendStatus(botName);
    }
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

queue.getStatus = function (botName) {
    console.log('getstatus', botName)
    var queue = queues[botName];

    return {
        autoPlay: queue.autoPlay,
        log: queue.log
    };
}

function sendStatus(botName) {
    var q = queues[botName];

    var clients = q.clients;

    var settings = queue.getStatus(botName);

    clients.forEach(function (client) {
        client.emit('status-update', settings);
    });
}

function log() {
    var message = [].slice.call(arguments);
    message.unshift('[queue]');
    console.log.apply(this, message);
}


