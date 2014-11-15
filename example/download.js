#!/usr/bin/env node

var argv = require('yargs').argv,
	path = require('path'),
	request = require(path.join(__dirname, '..')),
	fs = require('vinyl-fs');

// Take all the URLs provided on the command line and download them to
// a specific folder.
// ./download --dest=./out http://xyz.com/x.jpg http://pbs.org/y.jpg

request.src(argv._, { buffer: argv.buffer })
	.pipe(fs.dest(argv.dest));
