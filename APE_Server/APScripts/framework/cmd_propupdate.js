Ape.registerCmd("propUpdate", true, function(params, info){
	info.user.prop(params);
	info.user.pipe.sendRaw("SELFUPDATE", {
		user: info.user.prop()
	})
	return 1;
});