function extraHeaders(){
	//Ape.log(this.http.toSource());
	this.client.write("HTTP/1.1 200 OK\r\n");
	this.client.write("Access-Control-Allow-Origin: "+this.http.origin+"\r\n");
	this.client.write("Access-Control-Allow-Methods: POST, GET\r\n");
	this.client.write("Access-Control-Allow-Credentials: true\r\n");
}
/*
Ape.registerHookCmd("connect", extraHeaders);
Ape.registerHookCmd("check", extraHeaders);
Ape.registerHookCmd("send", extraHeaders);
Ape.registerHookCmd("quit", extraHeaders);
Ape.registerHookCmd("join", extraHeaders);
Ape.registerHookCmd("left", extraHeaders);
Ape.registerHookCmd("session", extraHeaders);
*/