var Promise     = require('bluebird'),
    express     = require('express'),
    Bot         = require('./models/bot'),
    MongoError  = require('mongoose/lib/error'),
    spawn       = require('child_process').spawn,
    request     = require('request'),
    _           = require('lodash');

function PostError(field, message) {
    this.field = field;
    this.message = message;
}
PostError.prototype = new Error();

var api = module.exports = new express.Router();

function auth(key, cb) {
    request({
        url: 'http://accounts-api.gigavoid.com/verify',
        method: 'POST',
        json: true,
        headers: {
            'content-type': 'application/json'
        },
        body:{
            key: key
        }
    }, function (err, res) {
        console.log(res.body, res.status);
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
    auth(req.body.key, function() {
            
    });
    // docker run --rm -it -e SERVER=ts3server://ts.ineentho.com -e NAME=LaggigMusicBot -e WEBSITE="https://www.youtube.com/watch?v=sFukyIIM1XI" -p 5900:5900 ts3mb
    var child = spawn('docker', [
      'run', '--rm', '-i', '-e', 'SERVER=ts3server://' + req.body.server, '-l=mb=true', '-e', 'NAME=LaggigMusicBot', '-e', 'WEBSITE="https://www.youtube.com/watch?v=sFukyIIM1XI"',
        'ineentho/ts3mb'
    ]);
/*
    child.stdout.on('data', function(chunk) {
        console.log('d', chunk.toString());
    });

    child.stderr.on('data', function(chunk) {
        console.log('e', chunk.toString());
    });*/
});

