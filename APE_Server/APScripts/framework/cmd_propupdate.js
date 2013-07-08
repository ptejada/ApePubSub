Ape.registerCmd("userPropUpdate", true, function(params, info){
	info.user.prop(params);

	for(var name in info.user.channels){
		var channel = info.user.channels[name];
		channel.pipe.sendRaw("UPDATE", {
			pipe: info.user.pipe.toObject()
		});
	}

	return 1;
});