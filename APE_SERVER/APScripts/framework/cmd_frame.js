Ape.registerCmd('frame', false, function(params, cmd) {
	var script = ' function getTransport() {\n	if ("XMLHttpRequest" in window) return XMLHttpRequest;\n    if ("ActiveXObject" in window) {\n        var names = [\n            "Msxml2.XMLHTTP.6.0",\n            "Msxml2.XMLHTTP.3.0",\n            "Msxml2.XMLHTTP",\n            "Microsoft.XMLHTTP"\n        ];\n        for(var i in names)\n        {\n            try{ return ActiveXObject(names[i]); }\n            catch(e){}\n        }\n    }\n    return false; // non supporté\n}\nfunction onMessage(ev) {\n	request = new transport();\n	request.onreadystatechange = onreadystatechange;\n	request.open("POST", "http://" + server + "/0/?", true);\n	request.send(ev.data);\n}\nfunction onreadystatechange() {\n	if (request.readyState == 4) postMessage(request.responseText);\n}\nfunction postMessage(str) {\n	window.parent.postMessage(str, "' + params.origin + '");\n}\n\n\nwindow.request=null;\nvar server = window.location.host;\nvar transport = getTransport();\nif (!transport) throw "No transport supported; Sorry."\n\nvar settings;\nvar tmp = window.location.hash.substr(1).split("&");\n\ndelete tmp;\n\nif ("addEventListener" in window) {\n	window.addEventListener("message", onMessage, 0);\n} else {\n	window.attachEvent("onmessage", onMessage);\n}\n\n';
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
