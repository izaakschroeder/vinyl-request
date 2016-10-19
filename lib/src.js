
'use strict';

var _ = require('lodash'),
	File = require('vinyl'),
	Stream = require('stream'),
	path = require('path'),
	url = require('url'),
	util = require('util');


// So would love to use the `request` module but it doesn't support
// streams2+ soooo... ¯\_(ツ)_/¯

var handlers = {
	'http:': require('http'),
	'https:': require('https')
};


/**
 *
 * @constructor
 * @param {Array} urls List of urls to read
 * @param {Object} opts Options for the URLs
 * @param {Object} streamOpts Options for the stream constructor
 */
function ReadStream(urls, opts, streamOpts) {
	if (this instanceof ReadStream === false) {
		return new ReadStream(urls, opts, streamOpts);
	}

	Stream.Readable.call(this, _.assign({ }, streamOpts, { objectMode: true }));

	// Basic type safety
	if (!_.isObject(urls) && !_.isString(urls)) {
		throw new TypeError();
	}

	this.urls = _.isArray(urls) ? urls : [ urls ];
	this.pending = 0;

	// Defaults
	this.options = _.assign({
		buffer: true,
		read: true,
		cwd: process.cwd(),
		base: ''
	}, opts);

	if (!_.has(this.options, 'method')) {
		this.options.method = this.options.read ? 'GET' : 'HEAD';
	}
}
util.inherits(ReadStream, Stream.Readable);


/**
 * Like `request` but with streams2.
 *
 * @param {Object} options Parameters.
 * @param {Function} callback Called when done.
 * @returns {Object} Request object generated.
 *
 * @see https://github.com/request/request/issues/1242
 */
ReadStream.request = function request(options, callback) {
	var parts = url.parse(options.url);

	if (!_.has(handlers, parts.protocol)) {
		callback(new TypeError());
		return null;
	}

	var req = handlers[parts.protocol].request({
		method: options.method,
		hostname: parts.hostname,
		port: parts.port,
		path: parts.path,
		auth: parts.auth
	});

	req.on('response', function responded(res) {
		if (options.buffer) {
			var result = [ ];
			res.on('readable', function readable() {
				var chunk;
				while ((chunk = this.read()) !== null) {
					result.push(chunk);
				}
			}).on('end', function end() {
				callback(null, req, res, Buffer.concat(result));
			}).on('error', function error(err) {
				callback(err);
			});
		} else {
			callback(null, req, res, res);
		}
	}).on('error', function error(err){
		callback(err);
	});

	req.end();

	return req;
};

/**
 * Fetch the URL and emit it as vinyl.
 * @param {String|Object} url URL to process.
 * @returns {void}
 */
ReadStream.prototype.processUrl = function processUrl(url) {
	var self = this;

	function done(err, req, res, body) {
		// Request is done!
		--self.pending;

		// Check for errors
		if (err) {
			self.emit('error', err);
			return;
		}

		if (res.statusCode < 200 || res.statusCode >= 300) {
			self.emit('error', { error: 'NON_OK_STATUS_CODE' });
			return;
		}

		// TODO:
		// Support for Content-Disposition filename parameter
		// e.g. Content-Disposition: attachment; filename=foo.jpg

		// Turn the result into vinyl
		var file = new File({
			contents: self.options.read ? body : null,
			path: req.path,
			pwd: self.options.cwd,
			base: path.dirname(req.path)
		});

		// Output the vinyl
		self.push(file);

		// If we're done then push null as per the stream spec
		if (self.pending === 0 && self.urls.length === 0) {
			self.push(null);
		}
	}

	var options = _.assign({ url: url }, self.options);
	++self.pending;

	ReadStream.request(options, done);
};

/**
 * @param {Number} amount How many urls to fetch.
 * @returns {void}
 *
 * @see Stream.Readable._read
 */
ReadStream.prototype._read = function _read( amount ) {
	while (--amount && this.urls.length > 0) {
		this.processUrl(this.urls.pop());
	}
};

module.exports = ReadStream;
