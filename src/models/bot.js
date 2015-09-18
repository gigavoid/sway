var Promise     = require('bluebird'),
    mongoose    = require('mongoose'),
    config      = require('../configLoader'),
    MongoError  = require('mongoose/lib/error');

var accountSchema = mongoose.Schema({
    // the username, should be an email address
    username: { type: String, unique: 'This email is already taken' },
    password: { type: String },
    dateCreated: { type: Date, default: Date.now },

    // every time a user signs in it's treated as a 'device',
    // making it possible to sign out a user from a single device.
    devices: [{
        // the secret key the client has
        key: { type: String },

        info: {
            // type of device (browser, mobile, etc)
            deviceType: { type: String },

            // detailed name (eg Chrome 41 or IE 11)
            deviceName: { type: String },

            ipAddress: { type: String }
        },

        loginDate: { type: Date, default: Date.now }
    }]
});

accountSchema.plugin(require('mongoose-beautiful-unique-validation'));


accountSchema.path('username').validate(function (val) {
    return val.indexOf('@') !== -1;
}, 'Username should be an email address');

/**
 * Creates an account with these details. The password is provided
 * in clear-text.
 */
accountSchema.statics.register = function(username, password) {
    return bcrypt.hashAsync(password, config.get('bcrypt-rounds')).then(function (hash) {
        return new Account({
            username: username,
            password: hash
        });
    });
}

/**
 * First verifies that the password is correct and then generates a new
 * 'device' that can be used for verifying identity
 */
accountSchema.methods.auth = function(password, deviceInfo) {
    var self = this;
    return bcrypt.compareAsync(password, this.password).then(function(same) {
        if (!same) {
            var error = new MongoError.ValidationError(self);
            error.errors.password = new MongoError.ValidatorError('password', 'Invalid password', 'notvalid');
            throw error;
        }

        var device = {
            key: genAuthKey(),
            info: deviceInfo,
        };
        self.devices.push(device);
        return device;
    });
};

function genAuthKey() {
    var alphabet = 'abcdefghijklmnopqrstuvxyz';
    var numbers = '0123456789';
    var possible = alphabet + alphabet.toUpperCase() + numbers;

    key = '';
    for (var i = 0; i < 128; i++) {
        key += possible[Math.floor(Math.random() * possible.length)];
    }
    return key;
}

var Account = module.exports = mongoose.model('Account', accountSchema);
