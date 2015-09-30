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

document.querySelector('#playpause').addEventListener('click', function() { togglePause(); });
document.querySelector('#skip').addEventListener('click', function() { skipSong(); });

document.querySelector('#addSong').addEventListener('submit', function (e) {
    e.preventDefault();

    var song = document.querySelector('#linkbox').value;
    
    var res = /\?v=([a-zA-Z0-9_-]*)/.exec(song);
    
    if (!res || res.length != 2) {
        return alert('Could not parse url');
    }

    var songId = res[1];
    queueSong(songId, owner, function() {
        document.querySelector('#linkbox').value = '';
    });
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
