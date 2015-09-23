var Docker      = require('dockerode'),
    util        = require('util'),
    EventEmitter= require('events').EventEmitter,
    fs          = require('fs');


var docker = new Docker();




function log() {
    var message = [].slice.call(arguments);
    message.unshift('[ts3mb]');
    console.log.apply(this, message);
}

var ts3mb = module.exports = {};
/**
 * Kills all running ts3mb containers
 */
ts3mb.cleanup = function() {
    docker.listContainers(function (err, containers) {
        if (err) return console.log('Could not connect to the docker daemon');
        log('found ' + containers.length + ' docker container(s)');
        containers.forEach(function (containerInfo) {
            if (containerInfo.Labels && containerInfo.Labels.mb) {
                var niceId = containerInfo.Id.substr(0, 10);
                log('found abandoned bot:', niceId);
                var container = docker.getContainer(containerInfo.Id);
                container.remove({force: true}, function (err, data) {
                    if (err)
                        return log('could not kill bot container', niceId, ':', err);
                    log('killed bot container:', niceId);
                });
            }
        });
    });
};

/**
 * Start a new TeamSpeak Bot.
 * Callback signature: (err, ts3mb)
 */
ts3mb.run = function(server, name, cb) {
    var wstream = fs.createWriteStream('debug.txt');
    var bot;

    var hub = docker.run('ineentho/ts3mb', ['./run'], wstream, {
        Env: [
            'SERVER=' + server,
            'NAME=' + name
        ],
        Labels: {
            'mb': 'true'
        }
    }, function (err, data, container) {
        if (err) return cb(err);
        log('bot stopped', bot.niceId);
        bot.stopped();
    });

    hub.on('container', function(container) {
        bot = new Ts3mb(container);
        log('bot created:', bot.niceId);
        cb(null, bot);
    });
};


function Ts3mb(container) {
    EventEmitter.call(this);
    this.container = container;
    this.niceId = container.id.substr(0, 10);
}

util.inherits(Ts3mb, EventEmitter);

Ts3mb.prototype.stop = function() {
    var self = this;
    this.container.remove({force: true}, function (err, data) {
        if (err)
            return log('could not kill bot container', self.niceId, ':', err);
    });
}

Ts3mb.prototype.stopped = function() {
    this.emit('stop');
}
