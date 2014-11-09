Ape.registerCmd('frame', false, function(params, cmd) {
	var script = "function getTransport(){if(\"XMLHttpRequest\"in window)return XMLHttpRequest;if(\"ActiveXObject\"in window){var names=[\"Msxml2.XMLHTTP.6.0\",\"Msxml2.XMLHTTP.3.0\",\"Msxml2.XMLHTTP\",\"Microsoft.XMLHTTP\"];for(var i in names){try{return ActiveXObject(names[i])}catch(e){}}}return false}function onMessage(ev){var request=new transport();request.addEventListener(\"load\",function(){postMessage(this.responseText)},false);request.open(\"POST\",window.location.protocol + \"//\"+server+\"/0/?\",true);request.send(ev.data)}function postMessage(str){partial=\"\";window.parent.postMessage(str,\"" + params.origin + "\")}var server=window.location.host;var transport=getTransport();if(!transport)throw\"No transport supported Sorry.\";if(\"addEventListener\"in window){window.addEventListener(\"message\",onMessage,0)}else{window.attachEvent(\"onmessage\",onMessage)}";
	var body = '<!DOCTYPE html><html><head><script type="text/javascript">' + script + '</script></head><body></body></html>';
	cmd.client.write('HTTP/1.1 200 OK\r\nPragma: no-cache\r\nCache-Control: no-cache, must-revalidate\r\nAccess-Control-Allow-Origin: '+params.origin+'\r\nExpires: Thu, 27 Dec 1986 07:30:00 GMT\r\nContent-Type: text/html\r\nContent-Length:' + body.length + '\n\n' + body);
	cmd.client.close();
});

//This is frame JS code in multiline 
/*
function getTransport(){
	if("XMLHttpRequest" in window) return XMLHttpRequest;
	if ("ActiveXObject" in window){
		var names = [
			"Msxml2.XMLHTTP.6.0",
			"Msxml2.XMLHTTP.3.0",
			"Msxml2.XMLHTTP",
			"Microsoft.XMLHTTP"
		];
		
		for(var i in names){
			try{ 
				return ActiveXObject(names[i]); 
			}catch(e){}
		}
	}
	return false; // non support
}

function onMessage(ev){
	var request = new transport();
	
	request.addEventListener("load", function(){
		postMessage(this.responseText);
	}, false);
	
	request.open("POST", window.location.protocol + "//" + server + "/0/?", true);
	request.send(ev.data);
}

function postMessage(str){
	partial = "";
	//window.parent.postMessage(str, "http://localhost/");
	window.parent.postMessage(str, "' + params.origin + '");
}

var server = window.location.host;
var transport = getTransport();

if (!transport) throw "No transport supported Sorry.";

if("addEventListener" in window){
	window.addEventListener("message", onMessage, 0);
}else{
	window.attachEvent("onmessage", onMessage);
}
*/
