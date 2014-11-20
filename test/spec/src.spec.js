
'use strict';

var src = require('src'),
	http = require('http'),
	through2 = require('through2');



describe('src', function() {

	function pair(opts) {
		var req = through2(),
			res = through2();
		req.path = opts.path;
		req.on('finish', function() {
			res.statusCode = opts.statusCode;
			req.emit('response', res);
			if (opts.error) {
				res.emit('error', opts.error);
			} else {
				res.end(opts.data || new Buffer(1024));
			}
		});

		return req;
	}

	beforeEach(function() {
		this.sandbox = sinon.sandbox.create();
		this.sandbox.stub(http, 'request');
	});

	afterEach(function() {
		this.sandbox.restore();
	});

	it('should fail with no urls', function() {
		expect(src).to.throw(TypeError);
	});

	it('should work with single url string', function() {
		src('http://www.google.com');
	});

	it('should work with array of strings', function() {
		src(['http://www.google.com', 'http://www.google.ca']);
	});

	it('should emit error with a non-ok http status code', function(done) {
		http.request.returns(pair({ statusCode: 400, path: '/test' }));
		src('http://www.google.com').once('error', function(err) {
			expect(err).to.deep.equal({ error: 'NON_OK_STATUS_CODE' });
			done();
		}).read();
	});

	it('should default to HEAD if `read` is false', function() {
		http.request.returns(pair({ statusCode: 200, path: '/test' }));
		src('http://www.google.com', { read: false }).read();
		expect(http.request).to.be.calledWithMatch({ method: 'HEAD' });
	});

	it('should buffer data if `buffer` is true', function(done) {
		http.request.returns(pair({ statusCode: 200, path: '/test' }));
		src('http://www.google.com', { buffer: true })
			.once('readable', function() {
				var file = this.read();
				expect(file.isBuffer()).to.be.true;
				done();
			})
			.read(0);
	});

	it('should stream data if `buffer` is false', function(done) {
		http.request.returns(pair({ statusCode: 200, path: '/test' }));
		src('http://www.google.com', { buffer: false })
			.once('readable', function() {
				var file = this.read();
				expect(file.isStream()).to.be.true;
				done();
			})
			.read(0);
	});

	it('should end after last url', function(done) {
		http.request
			.onFirstCall().returns(pair({ statusCode: 200, path: '/foo' }))
			.onSecondCall().returns(pair({ statusCode: 200, path: '/bar' }));

		src(['http://www.google.com', 'http://www.google.com'])
			.on('readable', function() {
				this.read();
			})
			.once('end', done)
			.read(0);
	});

	it('should fail for urls without handlers', function(done) {
		src('foo://bar').once('error', function(err) {
			expect(err).to.be.an.instanceof(TypeError);
			done();
		}).read();
	});

	it('should obey explicit http method', function() {
		http.request.returns(pair({ statusCode: 200, path: '/test' }));
		src('http://www.google.com', { method: 'POST' }).read();
		expect(http.request).to.be.calledWithMatch({
			method: 'POST'
		});
	});

	it('should pass up request errors', function(done) {
		var req = pair({ statusCode: 200, path: '/test' });
		http.request.returns(req);
		src('http://www.google.com')
			.once('error', function(err) {
				expect(err).to.equal('lol');
				done();
			})
			.read();
		req.emit('error', 'lol');
	});

	it('should pass up response errors', function(done) {
		http.request.returns(pair({
			statusCode: 200, path: '/test', error: 'lol'
		}));
		src('http://www.google.com', { method: 'POST' })
			.once('error', function(err) {
				expect(err).to.equal('lol');
				done();
			})
			.read();
	});
});
