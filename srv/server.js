"use strict"

var fs = require('fs-extra')
var path = require('path')
var express = require('express')
var async = require('async')
var blacksmith = require('blacksmith/lib/blacksmith')

var config = {
	'admin_host':  '::',
	'admin_port':  3001,
	'public_host': '::',
	'public_port': 3002,
	'file_path':   './files/',
	'debug':       true,
}

var app = express()
var pub = express()
app.enable('trust proxy')

function getFile(req, res, f) {
	res.set('Content-Type', 'text/plain')
	res.sendfile(f)
}

function getDirectory(req, res, f) {
	fs.readdir(f, function(err, files) {
		if(err) {
			res.status(500).json({status: 'error', msg: 'readdir fail'})
			return
		}
		async.map(files, function(file, cb) {
			fs.stat(f + '/' + file, function(err, stat) {
				if(err) {
					cb(err)
					return
				}
				var type = stat.isFile() ? 'f' : (stat.isDirectory() ? 'd' : 'i')
				if(type == 'i') {
					cb('invalid')
					return
				}
				cb(err, {name: file, type: type})
			})
		}, function (err, results) {
			if(err) {
				res.status(500).json({status: 'error', msg: 'dirlist failed'})
				return
			}
			res.json(results)
		})
	})
}

function get(req, res, f) {
	fs.stat(f, function(err, stats) {
		if(err) {
			res.status(404).json({status: 'error', msg: 'file not found'})
			return
		}
		if(stats.isFile()) {
			getFile(req, res, f)
		} else if(stats.isDirectory()) {
			getDirectory(req, res, f)
		} else {
			res.status(500).json({status: 'error', msg: 'not a file or directory'})
		}
	})
}

function post(req, res, f) {
	req.on('end', function() {res.json({status: 'success'})})
	req.pipe(fs.createWriteStream(f))
}

function put(req, res, f) {
	fs.mkdirs(f, function(err) {
		if(err) {
			res.status(500).json({status: 'error', msg: err})
			return
		}
		res.json({status: 'success'})
	})
}

function rm(req, res, f) {
	fs.remove(f, function(err) {
		if(err) {
			res.status(500).json({status: 'error'})
		}
		res.json({status: 'succcess'})
	})
	
}

function restfs(req, res, file_path) {
	var f = file_path + path.normalize(decodeURI(req.url))
	
	if(!req.secure && !config.debug) {
		res.status(500).json({status: 'error', msg: 'https required'})
	}
	
	switch(req.method) {
		case 'GET': get(req, res, f); break
		case 'PUT': put(req, res, f); break
		case 'POST': post(req, res, f); break
		case 'DELETE': rm(req, res, f); break
	}
	console.log(req.method, req.url)
}

app.use('/api/pages', function(req, res) {
	restfs(req, res, config.file_path + '/content/pages/')
})

app.use('/api/metadata', function(req, res) {
	restfs(req, res, config.file_path + '/metadata/')
})


app.use('/api/publish', function(req, res) {
	blacksmith({
		dir: config.file_path
	}, function(err) {
		if(err) {
			console.dir(err)
			res.status(500).json({status: 'error', msg: err.message})
			return
		}
		res.json({status: 'succcess'})
	})
})

app.use(express.static(__dirname + '/../admin'))
pub.use(express.static(config.file_path + '/public/'))

app.listen(config.admin_port,  config.admin_host)
pub.listen(config.public_port, config.public_host)
console.log('Admin Listening on http://' + config.admin_host  + ':' + config.admin_port)
console.log('Public Site on http://' +     config.public_host + ':' + config.public_port)