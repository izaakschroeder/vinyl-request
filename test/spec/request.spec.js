
'use strict';

var request = require('../../lib/request');

describe('request', function() {
	it('should export src', function() {
		expect(request).to.have.property('src');
	});
	it('should export dest', function() {
		expect(request).to.have.property('dest');
	});
});
