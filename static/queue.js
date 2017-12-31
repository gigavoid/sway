var account = new Account('http://accounts-api.gigavoid.com');

var owner = window.location.pathname.substring(1);
document.title = owner + '\'s SwayBot Queue';
var isOwner;

var songs = [];

account.ready = function() {
    account.verify(function (loggedIn, acc) {
        isOwner = owner === acc.displayName;

        if (isOwner) {
            document.querySelector('#adminControls').style.display = 'block';
        }

        songList.isAdmin = isOwner;
        scope.$apply();
    });


    var socket = io();

    socket.on('connect', function() {
        socket.emit('subscribe', owner);
        songs = [];
    });

    socket.on('no-bot', function() {
        window.location = '/';
    });

    socket.on('new-song', function(_songs) {
        songs = _songs;
        songList.list = songs;
        scope.$apply();
    });

    socket.on('status-update', function (status) {
        onStatusUpdate(status);
    })
};

document.querySelector('#botStop').addEventListener('click', function (e) {
    stopBot(function () {
        window.location = '/';
    });
});

document.querySelector('#botRestart').addEventListener('click', function (e) {
    stopBot(function () {
        createBot('ts.ineentho.com');
    });
});

document.querySelector('#autoplayToggle').addEventListener('click', function (e) {
    var enabled = this.checked;

    setAutoplay(owner, enabled);
});

document.querySelector('#autoplaylistToggle').addEventListener('click', function (e) {
    var enabled = this.checked;

    setAutoplaylist(owner, enabled);
});

function onStatusUpdate (status) {
    document.querySelector('#autoplayToggle').checked = status.autoPlay;
    document.querySelector('#autoplaylistToggle').checked = status.autoPlaylist;
    document.querySelector('#actionLog').innerHTML = status.log.reverse().map(function (item) {
        return JSON.stringify(item);
    }).join('<br>');
}

getStatus(owner, function (status) {
    onStatusUpdate(status);
})

document.querySelector('#playpause').addEventListener('click', function() { togglePause(); });
document.querySelector('#skip').addEventListener('click', function() { skipSong(); });

function getYoutubeVideo(url) {
    var res = /\?v=([a-zA-Z0-9_-]*)/.exec(url);
    
    if (!res || res.length != 2) {
        return;
    }

    return res[1];
}

function getYoutubePlaylist(url) {
    var res = /[?&]list=([a-zA-Z0-9_-]*)/.exec(url);
    
    if (!res || res.length != 2) {
        return;
    }

    return res[1];
}

let bulkVisible = false;

function toggleBulkAdd() {
    bulkVisible = !bulkVisible;
    document.querySelector('#bulkAddContainer').style.display = bulkVisible ? 'block' : 'none';
}

document.querySelector('#bulkAdd').addEventListener('click', function (e) {
    e.preventDefault();
    toggleBulkAdd();
});

document.querySelector('#bulkAddButton').addEventListener('click', function (e) {
    e.preventDefault();
    toggleBulkAdd();

    var text = document.querySelector('#bulkAddTextarea').value;
    document.querySelector('#bulkAddTextarea').value = '';

    var videos = text.split('\n').reduce(function (res, line) {
        var ytVideo = getYoutubeVideo(line);

        // Try to find a ?v=XXX 
        if (ytVideo) {
            res.push(ytVideo);
            return res;
        }

        // If not, take the first thing that could be an id
        var regexRes = /([a-zA-Z0-9_-]+)/.exec(line);
        if (regexRes) {
            res.push(regexRes[1]);
        }

        return res;
    }, []);

    videos.forEach(function (ytVideo) {
        var song = {
            song: ytVideo,
            service: 'youtube',
            channel: owner
        };
        queueSong(song, function() {});
    });
});

document.querySelector('#addSong').addEventListener('submit', function (e) {
    e.preventDefault();

    var url = document.querySelector('#linkbox').value;

    var ytPlaylist = getYoutubePlaylist(url);

    if (ytPlaylist) {
        var song = {
            song: ytPlaylist,
            service: 'youtube:playlist',
            channel: owner
        };
        queueSong(song, function() {
            document.querySelector('#linkbox').value = '';
        });
        return;
    }

    var ytVideo = getYoutubeVideo(url);

    if (ytVideo) {
        var song = {
            song: ytVideo,
            service: 'youtube',
            channel: owner
        };
        queueSong(song, function() {
            document.querySelector('#linkbox').value = '';
        });
        return;
    }

    alert('Not a valid url youtube playlist or song');


});

var songList;
var scope;


angular.module('songList', [])
    .controller('SongListController', function($scope) {
        scope = $scope;
        songList = this;
        songList.isAdmin = false;
        songList.list = songs;
    });
