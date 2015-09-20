var Docker      = require('dockerode');


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
        log('found ' + containers.length + ' abandoned ts3mb containers');
        containers.forEach(function (containerInfo) {
            if (containerInfo.Labels.mb) {
                var niceId = containerInfo.Id.substr(0, 10);
                log('killing bot container:', niceId);
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
