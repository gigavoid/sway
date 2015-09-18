var Promise     = require('bluebird'),
    express     = require('express'),
    Bot         = require('./models/bot'),
    MongoError  = require('mongoose/lib/error'),
    _           = require('lodash');

function PostError(field, message) {
    this.field = field;
    this.message = message;
}
PostError.prototype = new Error();

var api = module.exports = new express.Router();

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
 * HTTP POST /register
 * {
 *      username: String,
 *      password: String
 * }
 *
 * Response:
 * {
 *      key: String
 * }
 */
api.post('/register', function (req, res) {
    Promise.try(function() {
        if (!req.body.username) throw new PostError('username', 'No username specified');
        if (!req.body.password) throw new PostError('password', 'No password specified');

    }).then(function() {
        // step1: Create a new account object
        return Account.register(req.body.username, req.body.password)
    }).then(function (account) {
        // step2: Authenticate right away in order to save a roundtrip to the server
        return [account, account.auth(req.body.password, getDeviceInfo(req))];
    }).spread(function (account, auth) {
        // step3: Save the collection. Throws an exception if the data is invalid
        return [account.trySave(), auth];
    }).spread(function (account, auth) {
        // step4: If the data was correct, send response
        return res.send({
            key: auth.key
        });
    })
    .catch(MongoError.ValidationError, validationErrorHandler(res))
    .catch(PostError, postErrorHandler(res))
    .catch(genericErrorHandler(res));
});

/**
 * HTTP POST /login
 * {
 *      username: String,
 *      password: String
 * }
 *
 * Response: {
 *      key: String
 * }
 */
api.post('/login', function (req, res) {
    Account.findOne({username: req.body.username}).then(function(account) {
        return [account, account.auth(req.body.password, getDeviceInfo(req))];
    }).spread(function (account, auth) {
        return [account.trySave(), auth];
    }).spread(function (account, auth) {
        return res.send({
            key: auth.key
        });
    })
    .catch(MongoError.ValidationError, validationErrorHandler(res))
    .catch(genericErrorHandler(res));
});

/**
 * HTTP POST /verify
 * {
 *      key: String
 * }
 *
 * Response: {
 *      username: String
 * }
 */
api.post('/verify', function (req, res) {
    Account.findOne({'devices.key': req.body.key}).then(function (account) {
        return res.send({
            username: account.username
        });
    })
    .catch(MongoError.ValidationError, validationErrorHandler(res))
    .catch(genericErrorHandler(res));
});


/**
 * HTTP POST /emailtaken
 * {
 *      email: String
 * }
 */
api.post('/emailtaken', function (req, res) {
    Account.findOne({username: req.body.email}).then(function (account) {
        return res.send({
            taken: (!!account)
        });
    })
    .catch(MongoError.ValidationError, validationErrorHandler(res))
    .catch(genericErrorHandler(res));
});
