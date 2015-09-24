var Promise     = require('bluebird'),
    express     = require('express'),
    Bot         = require('./models/bot'),
    MongoError  = require('mongoose/lib/error'),
    spawn       = require('child_process').spawn,
    request     = require('request-promise'),
    ts3mb       = require('./ts3mb'),
    queue       = require('./musicqueue'),
    _           = require('lodash');

function PostError(field, message) {
    this.field = field;
    this.message = message;
}
PostError.prototype = new Error();

var api = module.exports = new express.Router();

var bots = {};
var botKeys = {};

function setBot(name, value) {
    bots[name] = value;

    if (typeof(value) !== 'string') {
        // it is a real bot, not just "loading" or something along those lines
        queue.createBot(name, botKeys[name]);
    }
}

function removeBot(name) {
    var bot = getBot(name);
    if (typeof(bot) !== 'string') {
        // it was a real bot
        bot.stop();
        queue.removeBot(name);
    }
    delete bots[name];
}

function getBot(name) {
    return bots[name];
}

function auth(key, cb) {
    return request({
        url: 'http://accounts-api.gigavoid.com/verify',
        method: 'POST',
        json: true,
        headers: {
            'content-type': 'application/json'
        },
        body:{
            key: key
        }
    }).then(function (body) {
        return body;
    });
}

function getDeviceInfo(req) {
    var agent = useragent.lookup(req.headers['user-agent']);
    return {
        deviceType: 'Web Browser', // no support for anything other than web browsers for now
        deviceName: agent.family,
        ipAddress: req.ip
    }
}

function postErrorHandler(res) {
    return function (err) {
        var errors = {};
        errors[err.field] = {
            message: err.message
        };

        res.status(400).send({
            error: 'Invalid form data',
            errors: errors
        });
    }
}

function genericErrorHandler(res) {
    return function (err) {
        res.status(400).send({
            error: 'Unknown error'
        });
        console.error(err.stack);
    }
}

function validationErrorHandler(res) {
    return function (err) {
        var errors = {}; 
        _.forOwn(err.errors, function(error, key) {
            errors[key] = error.properties
        });
        res.status(400).send({
            error: 'Invalid form data',
            errors: errors
        });
    };
}

/**
 * HTTP POST /api/createBot
 * {
 *      server: String,
 *      key: String
 * }
 *
 * Response:
 * {
 *     botId: String
 * }
 */
api.post('/createBot', function (req, res) {
    auth(req.body.key).then(function (user) {
        if (!user.displayName) {
            throw new PostError('key', 'You haven\'t set a display name yet. Visit accounts.gigavoid.com.');
        }
        if (getBot(user.displayName)) {
            return res.status(400).send({
                message: 'You already have a music bot'
            });
        }
        setBot(user.displayName, 'loading');
        botKeys[user.displayName] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        console.log(botKeys[user.displayName]);
        var url = 'http://172.17.42.1:8000/player/' + user.displayName + '/' + botKeys[user.displayName];
        ts3mb.run('ts3server://' + req.body.server, user.displayName + '\'s%20bot', url, function(err, bot) {
            if (err) {
                res.status(400).send({
                    message: 'Could not create bot'
                });
                removeBot(user.displayName);
                return console.log('could not create bot', err);
            }
            setBot(user.displayName, bot);
            res.send({
                message: 'Bot created',
                botId: user.displayName
            });
        });
     })
    .catch(PostError, postErrorHandler(res))
    .catch(genericErrorHandler(res));
});


/**
 * HTTP POST /api/hasBot
 * {
 *      key: String
 * }
 *
 * Response:
 * {
 *      hasBot: Boolean,
 *      botId: String
 * }
 */
api.post('/hasBot', function (req, res) {
    auth(req.body.key).then(function (user) {
        if (!user.displayName) {
            throw new PostError('key', 'You haven\'t set a display name yet. Visit accounts.gigavoid.com.');
        }
        res.send({
            hasBot: !!getBot(user.displayName),
            botId: user.displayName
        });
    })
    .catch(PostError, postErrorHandler(res))
    .catch(genericErrorHandler(res));
});

/**
 * HTTP POST /api/stopBot
 * {
 *      key: String
 * }
 *
 */
api.post('/stopBot', function (req, res) {
    auth(req.body.key).then(function (user) {
        if (!user.displayName) {
            throw new PostError('key', 'You haven\'t set a display name yet. Visit accounts.gigavoid.com.');
        }
        var bot = getBot(user.displayName)
        if (bot && bot !== 'loading') {
            removeBot(user.displayName);
            return res.send({
                message: 'Bot stopped'
            });
        }
        return res.status(400).send({
            message: 'No bot running'
        });
    })
    .catch(PostError, postErrorHandler(res))
    .catch(genericErrorHandler(res));
});

/**
 * HTTP POST /api/queueSong
 * {
 *      song: String,
 *      service: String,
 *      key: String
 * }
 *
 */
api.post('/queueSong', function (req, res) {
    auth(req.body.key).then(function (user) {
        if (!user.displayName) {
            throw new PostError('key', 'You haven\'t set a display name yet. Visit accounts.gigavoid.com.');
        }
        if(queue.queueSong(user.displayName, {service: req.body.service, song: req.body.song})) {
            return res.send({
                message: 'Song queued'
            });
        }
        return res.status(400).send({
            message: 'Could not queue song'
        });
    })
    .catch(PostError, postErrorHandler(res))
    .catch(genericErrorHandler(res));
});

/**
 * HTTP POST /api/popSong
 * {
 *      playerId: String,
 *      playerKey: String,
 * }
 *
 */
api.post('/popSong', function (req, res) {
    res.send({
        success: queue.popSong(req.body.playerId, req.body.playerKey)
    });
});
