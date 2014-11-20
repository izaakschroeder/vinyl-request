
'use strict';

var dest = require('dest');

describe('dest', function() {
	it('should fail with no urls', function() {
		expect(dest).to.throw(TypeError);
	});
});
