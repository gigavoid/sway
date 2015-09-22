var express     = require('express'),
    path        = require('path');

var api = module.exports = new express.Router();

api.get('/:username', function (req, res) {
    return res.sendFile(path.resolve('./static/queue.html'));
});
