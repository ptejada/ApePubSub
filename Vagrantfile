VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ape-lucid"
  config.vm.box_url = "http://files.ptejada.com/ape-lucid.box"

  config.vm.network "forwarded_port", guest: 6969, host: 6969
end
