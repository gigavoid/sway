
function post(url, body, callback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) {
            if (xmlhttp.status === 200) {
                callback(true, JSON.parse(xmlhttp.responseText));
            } else {
                callback(false, JSON.parse(xmlhttp.responseText));
            }
        }
    };
    
    xmlhttp.open('POST', url, true);
    xmlhttp.setRequestHeader("Content-type", "application/json")
    xmlhttp.send(JSON.stringify(body));
}

function hasBot(cb) {
    account.getKey(function (key) {
        post('/api/hasBot', {
            key: key
        }, function (success, resp) {
            if (!success) return alert('Could not check if bot already was created');
            cb(resp.hasBot && resp.botId);
        });
    });
}

function stopBot(cb) {
    account.getKey(function (key) {
        post('/api/stopBot', {
            key: key
        }, function (success, resp) {
            if (!success) return alert('Could not stop the bot');
            cb(true);
        });
    });
}

function createBot(server) {
    account.getKey(function(key) {
        post('/api/createBot', {
            server: server,
            key: key
        }, function (success, resp) {
            if (success) {
                window.location = '/' + resp.botId
            } else {
                alert(JSON.stringify(resp));
            }
        });
    });
}

function queueSong(song, cb) {
    post('/api/queueSong', song, function (success, resp) {
        if (success) {
            cb();
        } else {
            alert(JSON.stringify(resp));
        }
    });
}

function togglePause(cb) {
    account.getKey(function(key) {
        post('/api/togglePause', {
            key: key
        }, function (success, resp) {
            if (success) {
                cb && cb();
            } else {
                alert(JSON.stringify(resp));
            }
        });
    });
}

function skipSong(cb) {
    account.getKey(function(key) {
        post('/api/skipSong', {
            key: key
        }, function (success, resp) {
            if (success) {
                cb && cb();
            } else {
                alert(JSON.stringify(resp));
            }
        });
    });
}

function popSong(id, playerKey, cb) {
    post('/api/popSong', {
        playerId: id,
        playerKey: playerKey
    }, function (success, resp) {
        cb(resp);
        console.log(success, resp);
    });
}

function setAutoplay(owner, enabled, cb) {
    post('/api/setAutoplay', {
        owner: owner,
        enabled: enabled
    }, function (success, resp) {
        if (success) {
            cb && cb();
        } else {
            alert(JSON.stringify(resp));
        }
    });
}

function setAutoplaylist(owner, enabled, cb) {
    post('/api/setAutoplaylist', {
        owner: owner,
        enabled: enabled
    }, function (success, resp) {
        if (success) {
            cb && cb();
        } else {
            alert(JSON.stringify(resp));
        }
    });
}

function getStatus(owner, cb) {
    post('/api/getStatus', {
        owner: owner
    }, function (success, resp) {
        cb(resp);
    })
}
