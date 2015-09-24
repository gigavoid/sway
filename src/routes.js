var express     = require('express'),
    path        = require('path');

var routes = module.exports = new express.Router();

routes.get('/:username', function (req, res) {
    return res.sendFile(path.resolve('./static/queue.html'));
});

routes.get('/player/:owner/:key', function (req, res) {
    return res.sendFile(path.resolve('./static/player.html'));
});

