/**
 * StockBridge is constructor that serves as
 * link between the view and the data relieved from APE
 *
 * Skip to end of the file to see APS event bindings
 * @author Pablo Tejada
 */
var StockBridge = function() {
	var self = this;

	//Variables
	this.tray = $("#stock-list"),		//Element for stock list
	this.tpl = $("#stock-list").find(".stock:first").clone(),	//Stock stream Template
	this.adder = $("#stockAdder"),	//Element - Button to add new Stock
	this.newName = $("#newStockName"),
	this.visual = {},					//Store Graph values
	this.maxStream = 5,

	this.update = function(data){
		var name = data.name;
		var value = data.value;
		var direction = data.direction;
		var change = data.change;

		var obj = $("#stock-"+name);
		if(obj.length == 0){
			//Creates a new stock stream element for the DOM
			obj = self.tpl.clone();
			obj.attr('id', "stock-"+name);
			obj.find(".stock-name").html(name);
			//Inject the element to the DOM
			obj.prependTo(self.tray);

			//Creates visual entry for the stock stream
			if(!(name in self.visual))
				self.visual[name] = [];
		}

		//Update stock visual array
		self.visual[name].push(value);

		//Limit stock visual array to 30 entries
		if(self.visual[name].length > 30) self.visual[name].splice(0,1);

		//Generates stock line graph
		obj.find(".stock-visual").sparkline(self.visual[name], {
			height: 72,
			width: self.visual[name].length * 0.7 +"em"
		});

		//Update the document with new data
		obj.find(".stock-value").html(value);
		obj.find(".stock-change").html(change);

		//Handles the stock value color, red OR green
		if(value < 0){
			obj.find(".stock-value:not('.red')").addClass('red');
		}else{
			obj.find(".stock-value.red").removeClass('red');
		}

		//Handles the stock direction(arrow) up(green)/down(red)
		if(direction == "up"){
			obj.find(".stock-direction-down").attr("class","stock-direction-up").html("▲");
		}else{
			obj.find(".stock-direction-up").attr("class","stock-direction-down").html("▼");
		}
	}

	//Add a new stock stream
	this.add = function(e){
		e.preventDefault();

		var count = Object.keys(self.visual).length;
		if(count >= self.maxStream){
			self.adder.find("input, button").prop("disabled", true);
			self.adder.append("<small class='red'>Max stream count</small>");
		}else{
			try{
				client.getChannel("StockTicker")
					.send("add",{
						name: self.newName.val()
					});
			} catch (e){
				console.log(e);
				//window.location.reload();
			}
			self.newName.val(randomString(5))
		}

	}
		
}//END of stock Object/////////////////////////////////////


/*
 * Start of objects initializations and event bindings
 */
$(document).ready(function(){
	//Instantiate APE Client
	var client = new APS(ServerDomain, null, {
		//transport: "lp",
		debug: EnableDebug,
		session: EnableSession
	});

	client.identifier = "ST";

	if(EnableDebug)
		window.client = client;

	var stock = new StockBridge();

	//Connect/Restore
	client.sub("StockTicker",{
		update: function(data, user, channel){
			stock.update(data);
		},
		joined: function(){
			client.user.on("StockHistory", function(data){
				for(var name in data.history){
					var value = data.history[name].pop();
					stock.visual[name] = data.history[name];
					stock.update({
						name: name,
						direction: "up",
						change: Math.random().toFixed(2),
						value: value
					})
				}
			})
		}
	})

	//Clear the stock Template
	stock.tray.empty();

	stock.newName.val(randomString(5))

	//Bind Add stock form
	stock.adder.on("submit", stock.add.bind(stock));

	//Activate buttons
	stock.adder.find("input, button").prop("disabled", false);
})
	
