//Pub Command
Ape.registerCmd("RECONNECT", true, function(params, info) {
	var user = info.user;
	
	if(user && user.pipe){
		Ape.log(Object.getOwnPropertyNames(user).sort());
				
		restoreUser.bind(info)(user, params.sid);
		return 1;
	}

	//this.sendResponse("NOSESSION", "failed");
	//info.sendResponse("RECONNECT", {value: "failed"});
	//return JSON.stringify({name: "NOSESSION", data: {value: "failed"}});
	return {name: "NOSESSION", data: {value: "failed"}};

});

function restoreUser(user,sid){
	
	var res = [];
	
	res.push({
		name: "LOGIN",
		data: {
			sessid: sid
		}
	})
	
	res.push({
		name: "IDENT",
		data: {
			user: {
				casttype: 		"uni",
				properties: 	user.prop(),
				pubid: 			user.prop("pubid")
			}
		}
	});
	
	function buildUsers(users){
		var output = [];
		for( var id in users){
			var user = users[id];
			output.push({
				casttype: 		"uni",
				level: 			user.prop("level"),
				properties: 	user.prop(),
				pubid: 			id
			});
		}
		
		return output;
	}
	
	var chans = user.channels;
	
	if(typeof chans == "object"){
		for(var name in chans){
			var chan = chans[name];
			Ape.log("Building "+name+" channel...");
			if(chan){
				res.push({
					name: "CHANNEL",
					data: {
						pipe: {
							casttype: "multi",
							properties: chan.prop(),
							pubid: chan.prop("pubid")
						},
						users: buildUsers(chan.users)
					}
				})
			}else{
				Ape.log("No "+chan+" channel to build!")
			}
		}
	}
	
	Ape.log(res.toSource());
	
	for(var i in res){
		this.sendResponse(res[i].name, res[i].data);
		//user.pipe.sendRaw(res[i].name, res[i].data);
	}
	
	return true;
}

Ape.registerCmd("saveSESSION", true, function(params, info) {
	var pubid = info.user.prop("pubid");
	
	sessions[pubid] = params;
	
	return 1;
})



// Official bind polyfill at developer.mozilla.org
if(!Function.prototype.bind){
	Function.prototype.bind = function(oThis){
	if(typeof this !== "function"){
		// closest thing possible to the ECMAScript 5 internal IsCallable function
		throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	}

	var aArgs = Array.prototype.slice.call(arguments, 1), 
		fToBind = this, 
		fNOP = function(){},
		fBound = function(){
			return fToBind.apply(this instanceof fNOP
								 ? this
								 : oThis || window,
								 aArgs.concat(Array.prototype.slice.call(arguments)));
		};

	fNOP.prototype = this.prototype;
	fBound.prototype = new fNOP();

	return fBound;
	};
}