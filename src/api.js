var Promise     = require('bluebird'),
    express     = require('express'),
    Bot         = require('./models/bot'),
    MongoError  = require('mongoose/lib/error'),
    spawn       = require('child_process').spawn,
    request     = require('request-promise'),
    ts3mb       = require('./ts3mb'),
    _           = require('lodash');

function PostError(field, message) {
    this.field = field;
    this.message = message;
}
PostError.prototype = new Error();

var api = module.exports = new express.Router();

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
        ts3mb.run(req.body.server, user.username + '\'s%20bot', function(bot) {
            console.log('bot reated', bot);
        });
     })
    .catch(PostError, postErrorHandler(res))
    .catch(genericErrorHandler(res));
});

