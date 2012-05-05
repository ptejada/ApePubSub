/**
 * @author Pablo Tejada
 * Built on 2012-05-05 @ 06:33
 */

Ape.registerCmd('frame', false, function(params, cmd) {
	var script = ' function getTransport() {\n	if ("XMLHttpRequest" in window) return XMLHttpRequest;\n    if ("ActiveXObject" in window) {\n        var names = [\n            "Msxml2.XMLHTTP.6.0",\n            "Msxml2.XMLHTTP.3.0",\n            "Msxml2.XMLHTTP",\n            "Microsoft.XMLHTTP"\n        ];\n        for(var i in names)\n        {\n            try{ return ActiveXObject(names[i]); }\n            catch(e){}\n        }\n    }\n    return false; // non supporté\n}\nfunction onMessage(ev) {\n	request = new transport();\n	request.onreadystatechange = onreadystatechange;\n	request.open("POST", "http://" + server + "/0/?", true);\n	request.send(ev.data);\n}\nfunction onreadystatechange() {\n	if (request.readyState == 4) postMessage(request.responseText);\n}\nfunction postMessage(str) {\n	window.parent.postMessage(str, "*");\n}\n\n\nwindow.request=null;\nvar server = window.location.host;\nvar transport = getTransport();\nif (!transport) throw "No transport supported; Sorry."\n\nvar settings;\nvar tmp = window.location.hash.substr(1).split("&");\n\ndelete tmp;\n\nif ("addEventListener" in window) {\n	window.addEventListener("message", onMessage, 0);\n} else {\n	window.attachEvent("onmessage", onMessage);\n}\n\n';
	var body = '<html><head><script type="text/javascript">' + script + '</script></head><body></body></html>';
	cmd.client.write('HTTP/1.1 200 OK\r\nPragma: no-cache\r\nCache-Control: no-cache, must-revalidate\r\nAccess-Control-Allow-Origin: '+params.origin+'\r\nExpires: Thu, 27 Dec 1986 07:30:00 GMT\r\nContent-Type: text/html\r\nContent-Length:' + body.length + '\n\n' + body);
	cmd.client.close();
});

//This is frame JS code in multiline 
/*
function getTransport() {
	if ('XMLHttpRequest' in window) return XMLHttpRequest;
    if ('ActiveXObject' in window) {
        var names = [
            "Msxml2.XMLHTTP.6.0",
            "Msxml2.XMLHTTP.3.0",
            "Msxml2.XMLHTTP",
            "Microsoft.XMLHTTP"
        ];
        for(var i in names)
        {
            try{ return ActiveXObject(names[i]); }
            catch(e){}
        }
    }
    return false; // non supporté
}
function onMessage(ev) {
	request = new transport();
	request.onreadystatechange = onreadystatechange;
	request.open('POST', 'http://' + server + '/0/?', true);
	request.send(ev.data);
}
function onreadystatechange() {
	if (request.readyState == 4) postMessage(request.responseText);
}
function postMessage(str) {
	window.parent.postMessage(str, '*');
}


var request;
var server = window.location.host;
var transport = getTransport();
if (!transport) throw "No transport supported; Sorry."

if ('addEventListener' in window) {
	window.addEventListener('message', onMessage, 0);
} else {
	window.attachEvent('onmessage', onMessage);
}
*/


//Pub Command
Ape.registerCmd("PUB", false, function(params, info) {
	if($defined(params.pipe) && $defined(params.data)) {
	
		var chan = Ape.getChannelByPubid(params.pipe);
		//Ape.log(chan.pipe.toSource());
		if (!$defined(chan.pipe)) return ["401", "UNKNOWN_CHANNEL"];
		
		var user = info.user;
		//Ape.log(user.toSource());
		if (!$defined(user.pipe) || !user.pipe) return ["401", "UNKNOWN_USER"];
		
		var raw = {};
		raw.content = params.data;
		raw.type = typeof(params.data) == "string" ? "message" : "data";
		
		//Send Data to channel
		chan.pipe.sendRaw("PUBDATA", raw, {from: user.pipe});
		
		return 1;
	}else{
		return 0;
	};
});

//Pushpub Command
Ape.registerCmd("inlinepub", false, function(params, info) {
	//Global password
	if (params.password == password) {
		
		if ($defined(params.to) && $defined(params.raw) && $defined(params.data)){
			
			if(params.toType == "multi"){
				var to = Ape.getChannelByPubid(params.to);
			}else{
				var to = Ape.getUserByPubid(params.to);
				Ape.log("User to User");
			}
			
			if (!$defined(to.pipe)) return ["401", "UNKNOWN_CHANNEL"];
			
			//User Source From
			var user = Ape.getUserByPubid(params.from);
			if (!$defined(user.pipe) || !user.pipe) return ["401", "UNKNOWN_USER"];
			
			//Send Data to channel
			to.pipe.sendRaw(params.raw, params.data, {"from": user.pipe});	
			
			return {"name":"pushed","data":{"status":"ok"}}
		} else {
			return 0;
		}
	} else {
		return ["400", "BAD_PASSWORD"];
	}
});

Ape.registerHookCmd("connect", function(params, cmd){
	//Ape.log(cmd.toSource());

	if(!$defined(params)) return 1;
	
	if($defined(params.user)){
		
		if (params.user.name.length > 16 || params.user.name.test('[^_a-zA-Z0-9]', 'i')) return ["006", "BAD_NICK"];
		
		for(var index in params.user){
			cmd.user.setProperty(index, params.user[index]);
		}
	}
	
	//parse options
	if($defined(params.options)){
		
	}
	
	return 1;
});

var userlist = new $H;

//Global server wide users list
Ape.addEvent('adduser', function(user) {
	if(typeof user.getProperty('name') != "undefined"){
		userlist.set(user.getProperty('name').toLowerCase(), true);
	}
});

Ape.addEvent('deluser', function(user) {
	if(typeof user.getProperty('name') != "undefined"){
		userlist.erase(user.getProperty('name').toLowerCase());
	}
});

//Global server wide channel's users counter
Ape.addEvent("mkchan", function(channel) {
	channel.userCount = 0;
	channel.setProperty("userCount", channel.userCount);
});

Ape.addEvent("beforeJoin", function(user, channel) {
	channel.userCount++;
	channel.setProperty("userCount", channel.userCount);
	//Ape.log(channel.userCount +" users In channel "+ channel.getProperty("name"));
});

Ape.addEvent("left", function(user, channel) {
	channel.userCount--;
	channel.setProperty("userCount", channel.userCount);
	//Ape.log(channel.userCount +" users In channel "+ channel.getProperty("name"));
});

