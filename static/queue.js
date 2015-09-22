var account = new Account('http://accounts-api.gigavoid.com');

account.ready = function() {
    account.verify(function (loggedIn) {
        alert(loggedIn);
    });
}
