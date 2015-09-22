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

document.querySelector('#createbot').addEventListener('submit', function (e) {
    createBot(document.querySelector('#teamspeak').value);
    e.preventDefault();
});

/**
 * Called when it's verified that the user is connected properly
 */
function postLoggedIn() {
    hasBot(function (botId) {
        if (botId) {
            window.location = '/' + botId;
        }
    });
}

