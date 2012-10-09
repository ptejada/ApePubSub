//Stock Ticker Global
var Stock = {};
//Stock Refresh rate
var Stock_rate = 1000; //Milliseconds

//When making a channel
Ape.addEvent('mkchan', function(chan){
	var chanName = chan.prop('name');
	
	//Stock Ticker
	if(!chanName.match(/^\*stock/)) return;
	
	Stock[chanName] = {
		value: Math.random()*101,
		pipe: chan.pipe
	}
	
	//Stocks value Generator
	Stock[chanName].timer = setInterval(function(){
		var value = Stock[chanName].value;
		var direction = Math.random();
		//Generate a number between 0 and 1 with two decimal places (0.34) 
		var change = direction;
		//Find real direction
		direction = (/[13579]$/).test(direction) ? "up" : "down";
		//Figure new value
		value = direction == "up" ? value+change : value-change;
		
		//Ape.log(change+" "+direction+" to " +value);
		
		//Upate new value to the global space
		Stock[chanName].value = value;
		
		//Send the update to client
		chan.pipe.sendRaw("STOCKUPDATE",{
			"value": ""+value+"",
			"direction": direction,
			"change": ""+change+"",
			"channel": chanName
		});
		
		//Ape.log("Updating stock "+ chanName + "to " + Stock[chanName].value);
	},Stock_rate);
	
	Ape.log("Channel Created. Timer: "+Stock[chanName].timer);
}); 

Ape.addEvent('rmChan', function(chan){
	var chanName = chan.prop('name');
	
	//Stock Ticker
	if(!chanName.match(/^\*stock/)) return;
	//Remove the stock timer interval
	clearInterval(Stock[chanName].timer);
	//Log
	Ape.log("Channel Removed. Timer: "+Stock[chanName].timer);
	//Remove the stock from global
	delete Stock[chanName];
});



Ape.registerCmd("getStocks",true, function(opt, info){ //opt are paramenters
	info.user.pipe.sendRaw("allStocks",Stock);
})