var account = new Account('http://accounts-api.gigavoid.com');

account.ready = function() {
    account.isLoggedIn(function (loggedIn) {
        if (!loggedIn) {
            window.location = 'http://accounts.gigavoid.com/';
            return;
        }
        account.verify(function (loggedIn) {
            if (!loggedIn) {
                window.location = 'http://accounts.gigavoid.com/';
                return;
            }
            postLoggedIn();
        });
    });
}

/**
 * Called when it's verified that the user is connected properly
 */
function postLoggedIn() {
    var server = 'ts.ineentho.com';
    createBot(server);
}

function createBot(server) {
    account.getKey(function(key) {
        post('/api/createBot', {
            server: server,
            key: key
        }, function (success, resp) {
            if (success) {
                window.location = '/bot/' + resp.botId
            } else {
                alert(JSON.stringify(resp));
            }
        });
    });
}
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
