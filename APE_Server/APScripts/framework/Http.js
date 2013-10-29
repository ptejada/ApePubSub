/* Copyright (C) 2009 Weelya & Gasquez Florian <f.gasquez@weelya.com> */

/*
Exemple 1:
	// URL to call
	var request = new Http('http://www.google.fr/');
	request.getContent(function(result) {
		Ape.log(result);
	});

Example 2:
	var request = new Http('http://www.google.fr/');
	request.set('method', 'POST');
	
	// GET or POST data
	request.writeData('pomme', 'Rouge!');
	
	// HTTP Auth
	request.set('auth', 'malou:1987kangoo');
	
	request.getContent(function (result) {
		Ape.log(result);
	});
	
Example 3:
	// URL to call
	var request = new Http('http://www.google.fr/');
	request.finish(function(result) {
		//Return: {status:Integer, headers:Array, body:String}
		Ape.log("Status: " + result.status);
		Ape.log("Headers: " + result.headers);
	});
*/

function Http(url, port) {
	
	//Defaults vars
	this.method = 'GET';
	this.headers = {};
	this.body = new Array();
	this.query = this.host = this.auth = this.body = "";
	this.socket;

	//Init
	this.url 			= url;
	this.port			= port || 80;	
	this.parseURL();	
}

Http.prototype.parseURL = function() {
	var result  = this.url.match("^.*?://(.*?)(:([0-9]+))?((/.*)|)$");
	this.host   = result[1];
	this.port   = result[3] || 80;
	this.query  = result[4];
}

Http.prototype.set = function(key, value) {
	if (key == 'auth') {
		this.auth	= 'Basic ' +  Ape.base64.encode(value);
		this.setHeader('Authorization', this.auth);
	} else {
		this[key] = value;
	}
}

Http.prototype.setHeader = function(key, value) {
	this.headers[key] = value;
}

Http.prototype.setHeaders = function (object) {
	this.headers = object;
}

Http.prototype.write = function(data) {
	
	//Test if the body already exist
	if (!this.body) {
		this.body = new Array();
	} 
	
	this.body.push(data);
}

Http.prototype.writeData = function (key, value) {
	var tmpData = {};
	tmpData[key] = value;
	this.writeObject(tmpData);
}

Http.prototype.writeObject = function (data) {
	//this.write(Hash.toQueryString(data)); //TODO
	var temp = this.serialize(data);
	this.write(temp);
}

Http.prototype.serialize = function(obj, prefix) {
	var str = [];
    for(var p in obj) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v == "object" ? 
            serialize(v, k) :
            encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
    return str.join("&");
}

Http.prototype.getContentSize = function() {
	return this.response.length-this.responseHeadersLength-4;
}

Http.prototype.connect = function() {
	
	if (this.method == 'POST') {
		this.setHeader('Content-length', this.body.join('&').length);
		this.setHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
	
	this.setHeader('User-Agent', 'APE JS Client');
	this.setHeader('Accept', '*/*');

	this.socket = new Ape.sockClient(this.port, this.host, { flushlf: false });
	
	this.sockConnect();
	this.sockRead();
}

Http.prototype.sockConnect = function() {
	this.socket.onConnect = function() {
	
		if (this.body.length !== 0 && this.method == 'GET') {	
			if (this.query.indexOf("?") !== -1) {
				this.query = this.query + "&" + this.body.join('&');
			} else {
				this.query = this.query + '?' + this.body.join('&');
			}
		}
	
		var toWrite = this.method + " " + this.query + " HTTP/1.0\r\nHost: " + this.host + "\r\n";
		
		for (var i in this.headers) {
			if (this.headers.hasOwnProperty(i)) {
				toWrite += i + ': ' + this.headers[i] + "\r\n";
			}
		}
	
		this.socket.write(toWrite + "\r\n");
		
		if (this.body.length !== 0) {
			this.socket.write(this.body.join('&'));
		}
	}.bind(this);
}

Http.prototype.sockRead = function() {
	this.response = '';
	this.socket.onRead = function(data) { 
		this.response += data;
		//if (this.response.contains("\r\n\r\n")) {
		if (this.response.indexOf("\r\n\r\n") !== -1) {
			if (!(this.responseHeaders)) {
				var tmp						= this.response.split("\r\n\r\n");
				this.responseHeadersLength 	= tmp[0].length;
				tmp 						= tmp[0].split("\r\n");
				this.responseHeaders 		= {};
				this.responseCode			= tmp[0].split(" ");
				//this.responseCode			= this.responseCode[1].toInt();
				this.responseCode			= parseInt(this.responseCode[1]);
				
				for (var i = 1; i < tmp.length; i++) {
					var tmpHeaders = tmp[i].split(": ");
					this.responseHeaders[tmpHeaders[0]] = tmpHeaders[1];
				}
			}
			if ((this.responseHeaders['Content-Length']) && this.getContentSize() >= this.responseHeaders['Content-Length']) {
				this.socket.close();
			} 
			if ((this.responseHeaders['Location'])) {
				socket.close();
			}
		}				
	}.bind(this);
}

Http.prototype.read = function(callback) {
	this.socket.onDisconnect = function(callback) {
		this.response	  	 = this.response.split("\r\n\r\n");
		this.response.shift();
		this.response	  	 = this.response.join();
		this.httpResponse 	 = {status:this.responseCode, headers:this.responseHeaders, body:this.response};
		
		if ((this.responseHeaders)) {
			if ((this.responseHeaders['Location'])) {
				var newRequest   = new Http(this.responseHeaders['Location']);
				newRequest.setHeaders(this.headers);
				newRequest.set('method', this.method);
				newRequest.write(this.body.join('&'));
				newRequest.finish(callback);
			} else {
				callback(this.httpResponse);
			}
		}
	}.bind(this, callback);
}

Http.prototype.finish = function(callback) {
	this.connect();
	this.read(callback);
}

Http.prototype.getContent = function (callback) {
	this.connect();
	this.read(function(result) {
		callback(result['body']);
	});
}