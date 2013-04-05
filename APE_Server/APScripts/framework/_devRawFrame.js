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
	request.onreadystatechange = function(){
		//Respond to parent frame
		if(request.readyState == 4)
			postMessage(this.responseText);
	};
	request.open("POST", "http://" + server + "/0/?", true);
	request.send(ev.data);
}

function postMessage(str){
	partial = "";
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