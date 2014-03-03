/**
 * Created by Pablo on 3/2/14.
 */
// Backup the original connect method
APS.prototype.originalConnect = APS.prototype.connect;

// Overwrite the connect method to augment the localhost with a local IP
APS.prototype.connect = function(args){
    var server = this.option.server;

    // Only convert into local IP if the domain is localhost
    if (server.indexOf('localhost') === 0) {
        // Disable adding frequency feature
        this.option.addFrequency = false;
        var frequency, subnet;

        // The string to append the local IP with
        var postFixIndex = server.indexOf(':'),
            postFix = '';

        // Use the port as postFix if present
        if (postFixIndex > -1 ) {
            postFix = server.substr(postFixIndex);
        }

        if (this.session.restore()) {
            subnet = this.session.store.get('subnet');
            frequency = this.session.getFreq();

            // In case the subnet is null set it to 0
            if (subnet === null) {
                subnet = 0;
                this.session.store.set('subnet', subnet);
            }
        }
        else
        {
            // Initially set the subnet as 0
            subnet = 0;
            this.session.store.set('subnet', subnet);

            // Reset the current frequency to one
            frequency = 1;
            this.session.store.set('freq', 2);
        }

        // If the frequency is greater than 245 increase the subnet
        if (frequency > 245) {
            frequency = 1;
            this.session.store.set('subnet', ++subnet);
            this.session.store.set('freq', frequency);
        }

        // Update the server name with built one specially for the local host
        this.option.server = '127.0.'+subnet+'.'+frequency+postFix;
    }

    // Execute the original connect method
    return this.originalConnect(args);
}