## What is it? ##

ApePubSub is an alternative event driven pub/sub framework to the official [APE_JSF](https://github.com/APE-Project/APE_JSF) for the [APE Server](https://github.com/APE-Project/APE_Server). It is written in plain javascript.

The client framework is based on @paraboul's next generation [APE_JSF](https://github.com/paraboul/APE-Client-JavaScript/tree/31dd239394af8a574667c8228ed8c004d6866973) draft and the server framework is a compilation of custom commads, hooks and rewrites from the official [framework](https://github.com/APE-Project/APE_Server/scripts/), the actual server binary do not requires modification.

## Getting Started ##

[Read more about the project](https://github.com/ptejada/ApePubSub/wiki/Intro)

[Get Started](https://github.com/ptejada/ApePubSub/wiki/Getting-started)

See what is new in the [Changelog](https://github.com/ptejada/ApePubSub/wiki/Changelog)

Checkout the [live demos](http://ptejada.com/script/ApePubSub/demo/), the demo sources can be found [here](https://github.com/ptejada/ApePubSub/tree/master/demo)

[Code documentation](http://ptejada.com/script/ApePubSub/docs/)

[Public Documentation - wiki](https://github.com/ptejada/ApePubSub/wiki/API)

Simple program example:
```js

// Initialize the client object
var client = new APS('ape.ptejada.com');

// Subscribe to the channel and add some event listeners
client.sub('test', {
  // Event triggered when a user joins channel
  join: function(){
    alert('A user has joined the channel :)');
  },
  // Event triggered when a user leaves a channel
  left: function(){
    alert('A user has left the channel :(')
  }
});

```
Is that simple and pretty much self explanatory what the above will do.


### For more information check the [wiki](https://github.com/ptejada/ApePubSub/wiki)

**NOTE:** when updating the framework make sure that you update the server scripts as well, you can tell if the server scripts need updating if the the folder **APE_Server** has been changed in the commit or recently.

## Browser Support ##

The framework is tested and developed in the following modern browers:

 - Internet Explorer 9+
 - Google Chrome
 - Mozilla Firefox
 
It should also work in other webkit and mobile browsers such as Opera, Safari, Safari Mobile and the stock Android Browser.
Internet Explorer 8 and below is not supported.

## Setting up APE on Windows ##

To setup a test environment on windows a Vagrant box is bundled on this repo. To use the bundled box you must have [Vagrant](http://docs.vagrantup.com/v2/installation/index.html) and [VirtualBox](https://www.virtualbox.org/wiki/Downloads) install on your machine. Note that this setup might also on nay other environment when where Vagrant is supported.

To initialize the Vagrant box simply run this command from the root of the directory:

    vagrant up

The process might take some time as a file of about 500MB will be downloaded. Once installed and running, login in to the virtual machine running the following command

    vagrant ssh

Once you are ssh in the virtual machine a clone of [APS-deploy](https://github.com/ptejada/APS-Deploy) will be on the */home/vagrant/ape* directory with a pre-compiled version of the APE server. To run it execute this commands on the virtual machine:

    cd ape
    ./start

For more commands available for the APS-Deploy project refer to https://github.com/ptejada/APS-Deploy#commands

Once the APE server is running in the virtual machine it is accessible to the host machine via ` http://localhost:6969 `

**Note:** Subdomains might still need to setup om your local machine https://github.com/ptejada/ApePubSub/wiki/APE-Server-setup#wiki-using-session

**Note:** Since running the server locally, the [localhost-plugin](https://github.com/ptejada/ApePubSub/blob/master/js/localhost-plugin.js) script can be included in your application to avoid manually adding fake subdomains to the ` host ` file.

## Feedback? ##

For reporting issues use the github [issues system](https://github.com/ptejada/ApePubSub/issues?state=open), is really good and organized :)

For discussions, join the [Google Group](https://groups.google.com/forum/?fromgroups#!forum/apepubsub)
