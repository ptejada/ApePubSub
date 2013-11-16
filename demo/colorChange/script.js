$(document).ready(function(){

	/*
	 * Add event to the controls
	 */
	var colorPreview = $('#myColor'),
		colorValue = $('#colorValue'),
		colorPicker = $('#colorPicker');

	colorPicker.on('click', function(){
		colorValue.val(getRandomColor()).change();
	})

	colorValue.on('keyup change', function(){
		colorPreview.css({
			background: colorValue.val()
		})
	}).on('change', function(){
			client.user.update('color', colorValue.val());
		}).CanvasColorPicker({
			width: 125,
			height: 100,
			onColorChange: function(rgb){
				colorValue.change();
			}
		});

	var client = new APS(ServerDomain);
	
	//Makes the client object global for debugging
	if(EnableDebug)
		window.client = client;
	
	client.option.debug = EnableDebug;
	client.option.session = EnableSession;
	
	client.user = {
		name: "User_"+randomString(4)
	}
	
	/*
	 * Add global events which will apply to all channels 
	 * including existing and future ones
	 */
	client.on({
		join: function(user, channel){
			newUser(user)
		},
		
		left: function(user, channel){
			$("#u-" + user.name).parent().fadeOut("fast", function(){
				$(this).remove();
			})
		},
		userColorUpdate: function( newColor, user){
			$("#u-"+user.name).css({
				background: newColor
			});
			$('#othersColor').parent().css({
				background: newColor
			});
		}
	});
	
	var newUser = function(user, cont){
		var container = cont || $("#othersColor");
		var box = $("<div class='user panel panel-default'>");
		
		box.prop("id", "u-" + user.name);

		$('<div>').addClass('panel-body userColor')
			.appendTo(box);

		$('<div>').addClass('panel-heading hidden-xs').append(
				$("<h4>").addClass('panel-title text-center').html(user.name)
			).appendTo(box);

		container.append(
			$('<div>').addClass('col-lg-2 col-md-3 col-sm-4 col-xs-4').append(box)
		);

		/*
		 * Trigger the change of color event to update the color when entering
		 * the channel with an existing color,
		 */
		client.trigger('userColorUpdate',[user.color, user]);
	};
	
	client.sub("colorChange", null, function(){
		$(".myName").html(client.user.name);
		for(var id in this.users){
			//skip current user
			if(client.user.pubid != id){
				newUser(this.users[id]);				
			}
		}
		client.user.on('userColorUpdate', function(newColor){
			colorValue.val(newColor);
			colorPreview.css({background: newColor})
		})

		if ( ! ('color' in client.user) )
		{
			client.user.update('color', getRandomColor());
		}
		else
		{
			/*
			 * Trigger the change of color event to update the color when entering
			 * the channel with an existing color,
			 */
			client.user.trigger('userColorUpdate',[client.user.color, client.user]);
		}
	})
})

function getRandomColor()
{
	return '#'+randomString(6,'0123456789ABCDEF');
}