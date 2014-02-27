/*
 * Dont allow QUnit reorder the test
 * They must execute in order
 */
QUnit.config.reorder = false;


function testEssential(description, options){
	var client1 = new APS(ServerDomain, null, options);
	client1.identifier = "client" + randomString(5,"123456789");

	var client2 = new APS(ServerDomain, null, options);
	client2.identifier = "client" + randomString(5,"123456789");

	var client3 = new APS(ServerDomain, null, options);
	client3.identifier = "client" + randomString(5,"123456789");

	var channelName = "UT_" + randomString(6);

	module(description);
	asyncTest("Subscribing to a channel", 4, function(){
		client1.on({
			ready: function(){
				strictEqual(this.state, 1, "Successfully connected to the server");
			}
		});

		// Join a channel
		client1.sub(channelName, null, function(user, channel){
			ok(user instanceof APS.CUser, 'Correct current user object type');
			ok(channel instanceof APS.Channel, 'Correct channel object type');
			deepEqual(this,channel, 'Channel correctly bound to event callback');

			/*
			 * Start test
			 */
			start();
		});
	});

	asyncTest("Channel event handling", 22, function(){
		var fixedMessage = randomString(32,"qwertyuippASDFGHJKLZxCvbnm12468(&^%$!~'");
		var fixedData = {string: "test", number: 1234, array: [1,"&", {test: "ok"}]};

		// Join a channel
		client1.getChannel(channelName).on({
			join: function(user, channel){
				ok(true, "Received a user [join] event on the channel");

				equal(client2.user.pubid, user.pubid, "The user that joins the channel checks");
				ok(user instanceof APS.User, 'Correct public user object type');
				ok(channel instanceof APS.Channel, 'Correct channel object type');
				deepEqual(this,channel, 'Channel correctly bound to the event callback');

				// Send event
				setTimeout(function(){
					client2.getChannel(channelName).pub(fixedMessage);
				},500);
			},
			message: function(message, user, channel){
				ok(true, "Received a [message] event on the channel");

				equal(client2.user.pubid, user.pubid, "The sender user checks");
				ok(message, "A string was received in the [message] event");
				equal(message, fixedMessage, "The message matches the sent message");

				// Send Event
				client2.getChannel(channelName).pub(fixedData);
			},
			data: function(data, user, channel){
				ok(true, "Received a [data] event on the channel");

				equal(client2.user.pubid, user.pubid, "The sender checks");
				ok(data,"An object was received in the [data] event");
				deepEqual(data, fixedData, "The data object received matches the data sent");

				// Send Event
				client2.getChannel(channelName).send('custom', {data: fixedData, message: fixedMessage});
			},

			custom: function( info, user, channel){
				ok(true, "Received a [custom] event on the channel");

				equal(client2.user.pubid, user.pubid, "The sender checks");
				ok(info,"An object was received in the [custom] event");
				deepEqual(info.data, fixedData, "The data object received matches the data sent");
				equal(info.message, fixedMessage, "The message matches the sent message");

				// Makes the second user leave the channel
				client2.unSub(channelName);
			},
			left: function(user, channel){
				ok(true, "Received a user [left] event on the channel");

				ok(user instanceof APS.User, 'Correct public user object type');
				ok(channel instanceof APS.Channel, 'Correct channel object type');
				deepEqual(this,channel, 'Channel correctly bound to the event callback');

				/*
				 * Start the test
				 */
				start();

				/*
				 * Clear channel events
				 */
				channel._events = {};
			}
		});
		client2.sub(channelName);
	})

	asyncTest("User to user event handling",13, function(){
		var fixedMessage = randomString(32,"qwertyuippASDFGHJKLZxCvbnm12468(&^%$!~'");
		var fixedData = {string: "test", number: 1234, array: [1,"&", {test: "ok"}]};

		client1.user.on({
			message: function(message, user){
				ok(true, "Received a [message] event on the current user object");

				equal(client2.user.pubid, user.pubid, "The sender user checks");
				ok(message, "A string was received in the [message] event");
				equal(message, fixedMessage, "The message matches the sent message");

				// Send Event
				client2.getPipe(client1.user.pubid).pub(fixedData);
			},
			data: function(data, user){
				ok(true, "Received a [data] event on the current user object");

				equal(client2.user.pubid, user.pubid, "The sender checks");
				ok(data,"An object was received in the [data] event");
				deepEqual(data, fixedData, "The data object received matches the data sent");

				// Send Event
				client2.getPipe(client1.user.pubid).send('custom',{data: fixedData, message: fixedMessage});
			},

			custom: function( info, user){
				ok(true, "Received a [custom] event on the current user object");

				equal(client2.user.pubid, user.pubid, "The sender checks");
				ok(info,"An object was received in the [custom] event");
				deepEqual(info.data, fixedData, "The data object received matches the data sent");
				equal(info.message, fixedMessage, "The message matches the sent message");

				start();
			}
		});

		// Sends the first user to user message
		client2.getPipe(client1.user.pubid).pub(fixedMessage);
	});

	asyncTest("User property updates events",18, function(){
		var properties = {
			status: 'online',
			position: {
				x: 654,
				y: 354
			}
		}

		client1.on('userUpdate', function( propertyName, newValue, user){
			if ( propertyName != '_rev')
			{
				ok(propertyName in client1.getPipe(user.pubid), "Received a user update event for property ["+propertyName+"]");
				deepEqual(newValue, client1.getPipe(user.pubid)[propertyName], "The new property value is a match");
				equal(user.pubid, client2.user.pubid, "User whose property were updated checks" );
			}
		});

		client1.on('userStatusUpdate', function( newValue, user){
			ok('status' in client1.getPipe(user.pubid), "Received a [status] property specific user update event");
			deepEqual(newValue, client1.getPipe(user.pubid).status, "The new property value is a match");
			equal(user.pubid, client2.user.pubid, "User whose property were updated checks" );
		})

		// Join the channel
		client2.sub(channelName);
		// Set a user property
		client2.user.update(properties);
		properties.status = 'offline';
		client2.user.update(properties);

		/*
		 * Start the test in 500 milliseconds
		 */
		setTimeout(start.bind(start), 500);
	})

	/*
	 * If session is enabled then queue the session storage test
	 */
	if ( options.session )
	{
		asyncTest("Checking server side session storage", 3, function(){
			// Set session values for client2
			var value1 ={t: 4543, saf: '123@$1'};
			client2.session.set('value1', value1);

			deepEqual(client2.session.get('value1'), value1, 'Session storage content is valid within the session');

			// Cache the client identifier
			var identifierCache = client2.identifier;

			// Closes the client2 transport while the user is logged in in server
			client2.transport.close();
			equal(client2.state, 0, 'Current session disconnected from the remote server');

			// Destroys the client2 object
			client2 = null;

			//Re-initializes the client2 with the cache identifier
			client2 = new APS(ServerDomain, null, options);
			client2.identifier = identifierCache;

			client2.on('ready', function(){
				deepEqual(client2.session.get('value1'), value1, 'Session restored, session storage is still valid');
				start();
			});

			client2.connect();
		});
	}

	/*
	 * Test users dynamically created from an event
	 */
	asyncTest("Dynamically creating a user from an event", 2, function(){
		client3.on({
			ready: function(){
				// Client3 was connected
				equal(1, this.state, 'Client3 user is connected to the server')

				var run = function()
				{
					// From client2 send message/event to the client3 user
					// Note: client2 and client3 have no channel in common
					client2.send(client3.user.pubid, 'ping', 1);
					client3.check(); // Forces a check on long polling since it might get stuck when not in a channel
				}

				if(client2.state == 1)
				{
					run()
				}
				else
				{
					client2.on('ready', run);
				}
			},
			ping: function(data, user){
				// Confirms the user was created
				equal(client2.user.pubid, client3.getPipe(user.pubid).pubid, 'A user user was dynamically created from an event.')
				start();
			}
		});

		// Connects client3 to the server
		client3.connect();
		//client2.quit();
		client2.connect();
	});
}

testEssential("Long Polling with sessions disabled", {session: false, debug: false, transport: 'lp'});
testEssential("Websocket with sessions disabled", {session: false, debug: false, transport: 'ws'});

testEssential("Long Polling with sessions enabled", {session: true, debug: false, transport: 'lp'});
testEssential("Websocket with sessions enabled", {session: true, debug: false, transport: 'ws'});

// Add any other test suites using testEssential() with different APS client configuration