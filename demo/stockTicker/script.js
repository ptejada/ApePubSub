/**
 * @author Pablo
 */
 


 
$(document).ready(function(){
	//Instantiate APE Client
	window.client = new APS("ape.ptejada.com:45138", null, {
		//transport: "lp",
		debug: true
	});
	
	client.identifier = "ST";
	
	var stock = {
		//Variables
		tray: $("#stock-list"),		//Element for stock list
		tpl: $("#stock-list").find(".stock:first").clone(),	//Stock stream Template
		addInput: $("#add-stock"),	//Element - Button to add new Stock
		visual: [],					//Store Graph values
		
		update: function(value, direction, change, chanName){
			chanName = chanName.substring(1);
			var obj = $("#"+chanName);
			if(obj.length == 0){
				//Creates a new stock stream element for the DOM
				obj = stock.tpl.clone();
				obj.attr('id', chanName);
				obj.find(".stock-name").html(chanName);
				//Inject the element to the DOM
				obj.prependTo(stock.tray);
				
				//Creates visual entry for the stock stream
				stock.visual[chanName] = [];
			}
			
			//Convert Values from string to integers	
			value = parseFloat(value).toFixed(2);
			change = parseFloat(change).toFixed(2);
			
			//Update stock visual array
			stock.visual[chanName].push(value);
			
			//Limit stock visual array to 30 entries
			if(stock.visual[chanName].length > 30) stock.visual[chanName].splice(0,1);
			
			//Generates stock line graph
			obj.find(".stock-visual").sparkline(stock.visual[chanName], {
				height: 72, 
				width: stock.visual[chanName].length * 0.7 +"em" 
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
		},
		
		//Add a new stock stream
		add: function(){
			var count = Object.keys(client.channels).length;
			if(count > 4){
				stock.addInput.prop("disabled", true)
			}else{
				client.sub("*stock"+randomString(5));
			}
		}
		
	}//END of stock Object
	/////////////////////////////////////
	
	
	//Connect/Restore
	client.connect();
	
	//APS events
	client.on({
		rawStockUpdate: stock.update,
		ready: function(){
			if(stock.tray.lenght > 4)
				stock.addInput.prop("disabled", false);
		}
	})
	
	//Clear the stock Template
	stock.tray.empty();
	
	//Bind Add stock button input
	stock.addInput.click(stock.add.bind(stock));
	
});