var google = require('googleapis');
var randomElement = require('./util/random.js').randomElement;
var _ = require('lodash');

var youtube = google.youtube({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY
})

var queue = module.exports = {};

var io, queues = {};

var initialSongs = [{
    weight: 10,
    song: {
        song: 'Ip7QZPw04Ks',
        service: 'youtube'
    }
}, {
    weight: 10,
    song: {
        song: 'MPWruWso93A',
        service: 'youtube'
    }
}, {
    weight: 2,
    song: {
        song: 'q6EoRBvdVPQ',
        service: 'youtube'
    }
}, {
    weight: 1,
    song: {
        song: '_zSx7BtKzSo',
        service: 'youtube'
    }
}];

var extraSongs = [{
    weight: 5,
    song: {
        song: 'a1uizfay7VM',
        service: 'youtube'
    }
}, {
    weight: 5,
    song: {
        song: 'HBuWNsSi8G8',
        service: 'youtube'
    }
}, {
    weight: 5,
    song: {
        song: 'AfIOBLr1NDU',
        service: 'youtube'
    }
}, {
    weight: 5,
    song: {
        song: 'sIlNIVXpIns',
        service: 'youtube'
    }
}, {
    weight: 1,
    song: {
        song: 'no3Znlbw6p0',
        service: 'youtube'
    }
}, {
    weight: 5,
    song: {
        song: 'DrLlbJzG4ws',
        service: 'youtube'
    }
}];

function downloadPlaylist(ytPlaylist) {
    return new Promise((resolve, reject) => {
        const songs = [];
        function getPage(pageToken) {
            youtube.playlistItems.list({
                playlistId: ytPlaylist,
                part: 'contentDetails',
                pageToken: pageToken
            }, function (err, data) {
                if (err) {
                    return reject(err);
                }

                data.items.forEach(function (item) {
                    var videoId = item.contentDetails.videoId;
                    var song = {
                        song: videoId,
                        service: 'youtube'
                    };
                    songs.push(song);
                });

                if (data.nextPageToken) {
                    getPage(data.nextPageToken);
                } else {
                    resolve(songs);
                }
            });
        }

        getPage();
    });
}


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

    queues[botName].songs.push(randomElement(initialSongs).song);

    if (Math.random() < .1) {
        queues[botName].songs.push(randomElement(extraSongs).song);
    }
};

queue.removeBot = function (botName) {
    log('queue removed:', botName);
    delete queues[botName];
}

queue.addPlaylistSongs = function (botName, ytPlaylist) {
    function getPage(pageToken) {
        youtube.playlistItems.list({
            playlistId: ytPlaylist,
            part: 'contentDetails',
            pageToken: pageToken
        }, function (err, data) {
            if (err) {
                return;
            }

            data.items.forEach(function (item) {
                var videoId = item.contentDetails.videoId;
                var song = {
                    song: videoId,
                    service: 'youtube'
                };
                queues[botName].songs.push(song);
                addLog(botName, {type: 'added-queue', song});
                sendSongs(botName);
            });

            if (data.nextPageToken) {
                getPage(data.nextPageToken);
            }
        });
    }

    getPage();
}

queue.queueSong = function (botName, song) {
    if (!queues[botName]) return false;
    if (song.service === 'youtube') {
        queues[botName].songs.push(song);
        addLog(botName, {type: 'added-queue', song});
        sendSongs(botName);
    } else if (song.service === 'youtube:playlist') {
        queue.addPlaylistSongs(botName, song.song);
    }

    return true;
}

function playNextAutoplaylist(q, playerId, playerKey, cb) {
    let prepare;
    if (!q.autoPlaylistCache || q.autoPlaylistCache.length === 0) {
        addLog(playerId, {type: 'autoplaylist-downloading'});
        prepare = downloadPlaylist('PL0GRra_mB_faMeUsOWltGjtaHsPlT06jW').then(songs => {
            q.autoPlaylistCache = _.shuffle(songs);
            addLog(playerId, {type: 'autoplaylist-downloaded', numberOfSongs: songs.length});
        });

    }

    Promise.resolve(prepare).then(() => {
        const song = q.autoPlaylistCache.pop();
        q.songs.push(song);
        addLog(playerId, {type: 'autoplaylist-added', song});
        return queue.popSong(playerId, playerKey, cb);
    });

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

    if (q.autoPlaylist) {
        console.log('Autoplaylisting');

        return playNextAutoplaylist(q, playerId, playerKey, cb);
    }

    if (q.autoPlay && q.currentSong) {
        console.log('Autoplaying');
        
        return getRelated(q.currentSong.song, function (err, id) {
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

queue.setAutoplaylist = function (botName, enabled) {
    console.log('setAutoplaylist', botName);
    if (queues[botName]) {
        queues[botName].autoPlaylist = enabled;
        queues[botName].autoPlaylistCache = [];
        sendStatus(botName);
        sendSongs(botName);
    }
}

function addLog (botName, obj) {
    var q = queues[botName];

    if (q) {
        q.log.push(obj);

        if (q.log.length > 100) {
            q.log.shift();
        }

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

    if (!queue) {
        return {};
    }

    return {
        autoPlay: queue.autoPlay,
        autoPlaylist: queue.autoPlaylist,
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


