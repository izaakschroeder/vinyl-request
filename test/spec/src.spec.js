
'use strict';

var src = require('src');

describe('src', function() {
	it('should fail with no urls', function() {
		expect(src).to.throw(TypeError);
	});
});
