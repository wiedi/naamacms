# Na'ama CMS

simple cms based on blacksmith


## Installation

	git clone https://github.com/wiedi/naamacms.git
	cd naamacms
	git submodule init
	git submodule update
	cd srv
	npm install

## Running the server

	cd srv
	node server


## Layout and other configuration

<code>srv/files/</code> will be normal blacksmith [1] directory.
Configuration is stored in <code>.blacksmith</code>.
There is a default layout in <code>srv/files/layouts/default.html</code> with some CSS in <code>srv/files/public/css/main.css</code>.


[1] <https://github.com/flatiron/blacksmith>
