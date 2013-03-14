"use strict"

var fs = require('fs-extra')
var path = require('path')
var express = require('express')
var async = require('async')

var config = {
	'host': 'localhost',
	'port': 3001,
	'file_path': './files/',
	'debug': true,
}

var app = express()
app.enable('trust proxy')

function get(req, res, f) {
	fs.stat(f, function(err, stats) {
		if(err) {
			res.status(404).json({status: 'error', msg: 'file not found'})
			return
		}
		if(stats.isFile()) {
			res.set('Content-Type', 'text/plain');
			res.sendfile(f)
		} else if(stats.isDirectory()) {
			fs.readdir(f, function(err, files) {
				if(err) {
					res.status(500).json({status: 'error', msg: 'readdir fail'})
					return
				}
				async.map(files, function(file, cb) {
					fs.stat(f + '/' + file, function(err, stat) {
						if(err) {
							console.log(err)
							cb(err)
							return
						}
						var type
						if(stat.isFile()) {
							type = 'f'
						} else if(stat.isDirectory()) {
							type = 'd'
						} else {
							cb('invalid')
							return
						}
						cb(err, {name: file,type: type})
					})
				}, function (err, results) {
					if(err) {
						res.status(500).json({status: 'error', msg: 'dirlist failed'})
						return
					}
					res.json(results)
				});
				
			})
		} else {
			res.status(500).json({status: 'error', msg: 'not a file or directory'})
		}
	})
}

function put(req, res, f) {
	req.on('end', function() {res.json({status: 'success'})})
	req.pipe(fs.createWriteStream(f))
}

function rm(req, res, f) {
	fs.remove(f, function(err) {
		if(err) {
			res.status(500).json({status: 'error'})
		}
		res.json({status: 'succcess'})
	})
	
}

app.use('/api', function(req, res) {	
	var f = config.file_path + path.normalize(req.url)
	
	if(!req.secure && !config.debug) {
		res.status(500).json({status: 'error', msg: 'https required'})
	}
	
	switch(req.method) {
		case 'GET': get(req, res, f); break
		case 'PUT': put(req, res, f); break
		case 'POST': put(req, res, f); break
		case 'DELETE': rm(req, res, f); break
	}
	console.log(req.method, req.url)
})

app.use(express.static(__dirname + '/../admin'));


app.listen(config.port);
console.log('Listening on http://' + config.host + ':' + config.port);
