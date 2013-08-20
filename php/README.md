## [PHP] APS class API

APS() constructor takes two parameters, the first parameter is the APE server domain
```
$aps = new APS("ape.ptejada.com");
```
On the object construction by default the indexe `cmd` in the global `$_REQUEST` array is automatically parsed to gather event information. If you are using the eventPush feature on the APS javascript client you should not worried about this, since this data is automatically sent by the framework. Otherwise you can disable this behavior by passing **false** in the second paramater of the constructor.

#### Properties
The following properties are mostly available on the object if automatic event parsing is enabled which is the default behavior.

- **event**: the name of the parsed event
- **eventData**: the data to be sent with the event. Could be a string or object/StdClass
- **server**: the domain name of the sever
- **debug**: enable and disables some features in the class, like not closing the connection on `respond()` when **true**
- **secured**: a boolean to choose wheather to use the http or https protocol
- **cmd**: the full event in json encoded form
- **data**: the full event in a complex object/StdClass form

All this properties are editables and will take effect if updated prior to calling the `respond()` method.

#### Methods

- **respond()**: pushes the event to the server, outputs the APE server response and closes the connection. If the `error()` method is called prior to this function the event wont be pushed to the server and the error would be the output. Note that even after the connection closes you can perform other tasks, any ouput would just be ignored thus never reaching the client request response.

- **error( _code_ , _message_ )**: defines the error to be sent to client request response. Calling this function will cause the parsed event to never be sent to the server. Avoid using the following error codes unless you know what you are doing: 001 through 007, 250

- **sendCmd( _cmdName_ , _data_ )**: sends a command to the server. Can be use as an inlinepush alternative. _**data**_ can be a string or array. Note that when using this method you should implement your own security in your APE server custom command. Also if you want to use the response from the APE server you should chain it with the `respond()` command like `->sendCmd($cmdName,$data)->respond();`

### Examples

For a live example check the live [eventPush demo](http://ptejada.com/script/ApePubSub/demo/eventPush/), you can take a closer look in the [source code](https://github.com/ptejada/ApePubSub/blob/master/demo/eventPush/). The more complex demo [PHPapp](http://ptejada.com/script/ApePubSub/demo/PHPapp/) uses this class as well for eventPush, [source code](https://github.com/ptejada/ApePubSub/blob/master/demo/PHPapp/).

Below is a simple script that would only route the events if the user signed in according to your user authetication system

```php
<?php
	include("lib/APS.php");
	
	$aps = new APS("ape.ptejada.com");
	
	if(!isUserAuthenticated()) $aps->error("302", "You must login first");
	
	$aps->respond();
?>

```
