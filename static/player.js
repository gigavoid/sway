
var split = window.location.pathname.split('/');

var owner = split[2];
var key = split[3];



var socket = io();

socket.on('connect', function() {
    console.log('Connected');
    socket.emit('subscribe', owner);
    songs = [];

    socket.emit('ts-player', {
        name: owner,
        key: parseInt(key)
    });
});

socket.on('pause-toggle', pauseToggle);
socket.on('skip', skip);

var paused = false;

function pauseToggle() {
    paused = !paused;

    if (paused) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function skip() {
    player.stopVideo();
    playNext();
}

socket.on('new-song', function(_songs) {
    songs = _songs;
    console.log('new-song', songs);


    if (!playing && ready) {
        playNext();
    }
});

function getNextSong() {
    return songs[0];
}

function popNextSong() {
    popSong(owner, parseInt(key));
}

function playNext() {
    var song = getNextSong();
    if (song) {
        popNextSong();
        play(song);
    } else {
        console.log('OUT OF SONGS');
    }
}

var playing = false

function play(id) {

    playing = true;
    console.log('PLAYING: TRUE', id.song);
    if (player) {
        player.loadVideoById(id.song);
    } else {
        player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: id.song,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
}


// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
var ready = false;
function onYouTubeIframeAPIReady() {
    console.log('youtube iframe ready');
    ready = true;
    playNext();
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    console.log('player ready');
    event.target.playVideo();
    player.setVolume(20);
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        playing = false;
        console.log('PLAYING: FALSE');
        playNext();
    }
}

