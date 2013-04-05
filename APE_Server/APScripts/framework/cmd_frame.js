Ape.registerCmd('frame', false, function(params, cmd) {
	var script = "function getTransport(){if(\"XMLHttpRequest\"in window)return XMLHttpRequest;if(\"ActiveXObject\"in window){var names=[\"Msxml2.XMLHTTP.6.0\",\"Msxml2.XMLHTTP.3.0\",\"Msxml2.XMLHTTP\",\"Microsoft.XMLHTTP\"];for(var i in names){try{return ActiveXObject(names[i])}catch(e){}}}return false}function onMessage(ev){var request=new transport();request.onreadystatechange=function(){if(request.readyState==4)postMessage(this.responseText)};request.open(\"POST\",\"http://\"+server+\"/0/?\",true);request.send(ev.data)}function postMessage(str){partial=\"\";window.parent.postMessage(str,\"" + params.origin + "\")}var server=window.location.host;var transport=getTransport();if(!transport)throw\"No transport supported Sorry.\";if(\"addEventListener\"in window){window.addEventListener(\"message\",onMessage,0)}else{window.attachEvent(\"onmessage\",onMessage)}";
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
	window.parent.postMessage(str, '*'); //Uses APE 'frame' command's params.origin instead of '*'
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
