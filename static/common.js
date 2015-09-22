
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
