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
        console.log(songs);
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
