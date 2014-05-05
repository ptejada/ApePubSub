/*
 * Command to inline push ( Push to channel remotely)
 */

var inlinePushPassword = Ape.config("inlinepush.conf", "password");
var inlinePushAllowedIps = Ape.config("inlinepush.conf", "ips");

Ape.registerCmd("inlinepush", false, function(params, info) {

    if( inlinePushAllowedIps !== "" && inlinePushAllowedIps.indexOf(info.ip) < 0  )
       return ["402", "IP_BANNED"]; 

    if (params.password === inlinePushPassword) {
		var chan = Ape.getChannelByName(params.channel);    

		if (!chan) {
			return ["401", "UNKNOWN_CHANNEL"];
		}   

        //Make data optional
        if (!params.data) { params.data = Array(); }

        chan.sendEvent(params.raw, params.data);

        return {"name":"pushed","data":{"value":"ok"}};
    } else {
    	return ["400", "BAD_PASSWORD"];
    }

});