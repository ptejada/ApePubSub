/**
 * Bind StockContainer to channel
 */
Ape.onChannel("StockTicker", {
	/**
	 * Initializes the StockContainer object in the channel
	 * object when the channel is first created
	 * @param channel
	 */
	create: function(channel){
		channel.stocks = new StockContainer( channel );
	},
	/**
	 * Clears all concurrent loops from the memory
	 * when the channel is deleted
	 *
	 * @param channel
	 */
	destroy: function(channel){
		channel.stocks.destroyAll();
	},
	/**
	 * Handles request to add a new stock stream to the
	 * channel
	 *
	 * @param params
	 * @param user
	 * @param channel
	 */
	add: function(params, user, channel){
		channel.stocks.new(params.data.name);
	},

	/**
	 * Sends the history of the current stock streams to
	 * new subscribers
	 *
	 * @param user
	 * @param channel
	 */
	join: function(user, channel){
		if(channel.stocks.count > 0){
			user.sendEvent("StockHistory", {
				history: channel.stocks.historyPayload(),
				count: channel.stocks.count
			})
		}
	}
});

/**
 * The container to hold stock streams instances
 *
 * @param channel
 * @constructor
 */
var StockContainer = function(channel){
	var self = this;

	this.list = {};
	this.count = 0;
	this.rate = 1000;
	this.limit = 10;
	this.channel = channel;

	this.new = function(name, rate){
		if(self.count > self.limit) return;

		rate = typeof rate == "undefined" ? self.rate : rate;

		if(!(name in self.list)){
			self.list[name] = new StockStream(name, rate, self);
			self.count++;
			Ape.log("New Stock [" + name + "] running on timer {" + self.list[name].timer + "}");
		}else{
			Ape.log("Stock Stream exists");
		}
	}

	this.destroyAll = function(){
		for(var name in self.list){
			self.list[name].destroy();
		}
	}

	this.historyPayload = function(){
		var history = {};
		for(var name in self.list){
			history[name] = self.list[name].history;
		}
		return history;
	}
}

/**
 * The stock stream constructor
 *
 * @param name
 * @param rate
 * @param container
 * @constructor
 */
var StockStream = function(name, rate, container){
	var self = this;

	this.history = [];
	this.timer = 0;
	this.rate = rate;
	this.name = name;
	this.value = Math.random()*101;

	this.update = function( data ){
		//Send the update to client
		container.channel.sendEvent("update", data);
		self.history.push(data.value);

		if(self.history.length > 30){
			self.history.splice(0, 1);
		}
	}

	this.destroy = function(){
		clearInterval(self.timer);
		Ape.log("Stock [" + self.name + "] on timer {" + self.timer + "} removed" );
	}

	this.timer = setInterval(function(){
		var value = self.value;

		//Generate a number between 0 and 1 with two decimal places (0.34)
		var direction = Math.random();
		var change = direction;

		//Find real direction
		direction = (/[13579]$/).test(direction) ? "up" : "down";

		//Figure new value
		value = direction == "up" ? value+change : value-change;

		value = Math.round(value*100)/100;
		change = Math.round(change*100)/100;

		//Update new value in object
		self.value = value;

		//Send the update to client
		self.update({
			"name": self.name,
			"value": value,
			"direction": direction,
			"change": change
		});

	}, this.rate);
}
