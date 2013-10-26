/**
 * Constructor to make a HTTP request on the server
 *
 * @param {string} method - GET or POST
 * @param {string} url
 * @constructor
 */
function Request(method, url){

	// Parses the URL
	var result  = url.match(/^.*?:\/\/(.*?)(:([0-9]+))?((\/.*)|)$/);

	this.url = url;
	this.host   = result[1];
	this.port   = result[3] || 80;
	this.query  = result[4] || '/';
	this.method = method || 'GET';

	this.headers = {};
	this.body = [];
	this.responseHeaders = null;

	/**
	 * Get the response of the request
	 *
	 * @param {Function} callback - Three parameter are passed to the callback
	 *                              responseBody, responseStatusCode, responseHeaders
	 */
	this.getResponse = function(callback)
	{
		this.connect();
		this.read(callback);
	}

	/**
	 * Set a request header
	 *
	 * @param {string} key - The header name
	 * @param {string|Number} value - The header value
	 */
	this.setHeader = function(key, value)
	{
		this.headers[key] = value;
	}

	/**
	 * Set all request headers
	 * Note: this method overwrite any existing headers
	 *
	 * @param {Object} object - Key pair of headers
	 */
	this.setHeaders = function(object)
	{
		this.headers = object;
	}

	/**
	 * Assign parameter to send with the request
	 *
	 * @param {Object|String} dataORkey - A key pair object of parameters
	 * @param {*} value - The value of the parameter
	 */
	this.addParam = function(dataORkey, value)
	{
		if (typeof dataORkey == "object")
		{
			this.write(this.serialize(dataORkey));
		}
		else
		{
			var tmp = {};
			tmp[dataORkey] = value;
			this.write(this.serialize(tmp));
		}
	}

	/**
	 * Serializes a JS object
	 *
	 * @param {Object} obj - Object to serialize
	 * @param {String} [prefix]
	 */
	this.serialize = function(obj, prefix) {
		var str = [];
		for(var p in obj) {
			if (obj.hasOwnProperty(p))
			{
				var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
				str.push(typeof v == "object" ?
					this.serialize(v, k) :
					encodeURIComponent(k) + "=" + encodeURIComponent(v));
			}
		}
		return str.join("&");
	}

	this.write = function(data)
	{
		this.body.push(data);
	}

	this.connect = function()
	{
		if (this.method == 'POST')
		{
			this.setHeader('Content-length', this.body.join('&').length);
			this.setHeader('Content-Type', 'application/x-www-form-urlencoded');
		}

		this.setHeader('User-Agent', 'APE JS Client');
		this.setHeader('Accept', '*/*');

		this.socket = new Ape.sockClient(this.port, this.host, { flushlf: false });

		this.sockConnect();
		this.sockRead();
	}

	this.sockConnect = function()
	{
		this.socket.onConnect = function() {
			var toWrite = this.method + " " + this.query + " HTTP/1.0\r\nHost: " + this.host + "\r\n";

			for (var i in this.headers) {
				if (this.headers.hasOwnProperty(i)) {
					toWrite += i + ': ' + this.headers[i] + "\r\n";
				}
			}

			this.socket.write(toWrite + "\r\n");
			this.socket.write(this.body.join('&'));
		}.bind(this);
	}

	this.sockRead = function()
	{
		this.response = '';
		this.socket.onRead = function(data) {
			/*
			 * Check if headers need to be read
			 */
			if (data.indexOf("\r\n\r\n") != -1 && ! this.responseHeaders)
			{
				var tmp = data.split("\r\n\r\n");

				var headers = tmp[0];
				var body = tmp.slice(1).join();

				headers = headers.split("\r\n");

				this.responseHeaders = {};

				/*
				 * Get the response code
				 */
				this.responseCode = headers.shift().split(" ");
				this.responseCode = parseInt(this.responseCode[1]);

				/*
				 * Get all headers into a object
				 */
				for (var i = 0; i < headers.length; i++)
				{
					var tmpHeaders = headers[i].split(": ");
					this.responseHeaders[tmpHeaders[0]] = tmpHeaders[1];
				}

				/*
				 * Add the body
				 */
				this.response = body;

				if ( !! this.responseHeaders['Content-Length'] && body.length >= this.responseHeaders['Content-Length'])
				{
					this.socket.close();
				}
				if ( !! this.responseHeaders['Location'] )
				{
					this.socket.close();
				}
			}
			else
			{
				/*
				 * Incrementally keep adding the request body
				 */
				this.response += data;
			}
		}.bind(this);
	}

	this.read = function(callback)
	{
		this.socket.onDisconnect = function(callback) {
			if ( !! this.responseHeaders )
			{
				if ( !! this.responseHeaders['Location'] )
				{
					var newRequest = new Request(this.responseHeaders['Location']);
					newRequest.setHeaders(this.headers);
					newRequest.set('method', this.method);
					newRequest.write(this.body.join('&'));
					newRequest.getResponse(callback);
				}
				else
				{
					callback.apply(this, [this.response, this.responseCode, this.responseHeaders]);
				}
			}
			else
			{
				Ape.log('Request Failed: ' + this.url);
			}
		}.bind(this, callback);
	}
}

/**
 * Constructor to make a GET HTTP request on the server
 * @param {string} url - The request url
 * @constructor
 */
var GetRequest = Request.bind('GET');

/**
 * Constructor to make a POST HTTP request
 * @param {string} url - The request url
 * @constructor
 */
var PostRequest = Request.bind('POST');